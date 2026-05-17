const User = require("../models/User");
const crypto = require("crypto");
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshTokenExpiryDate,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require("../utils/tokenUtils");
const {
  createStatePayload,
  setOAuthStateCookie,
  readOAuthState,
  clearOAuthStateCookie,
  buildAuthUrl,
  exchangeCodeForProfile,
  buildFrontendRedirectUrl,
  ensureProviderConfigured,
} = require("../utils/oauth");

const issueTokens = async (res, user, expiresIn) => {
  const accessToken = generateAccessToken(user._id, expiresIn);
  const refreshToken = generateRefreshToken();

  user.refreshTokenHash = hashToken(refreshToken);
  user.refreshTokenExpiresAt = getRefreshTokenExpiryDate();
  await user.save();

  setRefreshTokenCookie(res, refreshToken);
  return accessToken;
};

const getProviderField = (provider) => `${provider}Id`;

const getCsrfToken = async (req, res) => {
  res.json({
    success: true,
    csrfToken: req.cookies?.csrfToken || res.locals.csrfToken,
  });
};

const normalizeEmail = (email) => email?.trim().toLowerCase();

const linkProviderToUser = async ({ user, provider, providerId }) => {
  const providerField = getProviderField(provider);
  const existingProviderOwner = await User.findOne({
    [providerField]: providerId,
  });

  if (
    existingProviderOwner &&
    existingProviderOwner._id.toString() !== user._id.toString()
  ) {
    throw new Error(`${provider} account is already linked to another user`);
  }

  user[providerField] = providerId;
  if (user.authProvider === "local") {
    user.authProvider = provider;
  }
  if (!user.oauthProviderId) {
    user.oauthProviderId = providerId;
  }
  await user.save();
  return user;
};

const resolveOauthUser = async ({ provider, providerId, email, name }) => {
  const providerField = getProviderField(provider);
  const normalizedEmail = normalizeEmail(email);

  let user = await User.findOne({ [providerField]: providerId }).select(
    "+refreshTokenHash +refreshTokenExpiresAt",
  );
  if (user) return user;

  if (!normalizedEmail) {
    throw new Error(`${provider} account did not provide an email address`);
  }

  user = await User.findOne({ email: normalizedEmail }).select(
    "+refreshTokenHash +refreshTokenExpiresAt",
  );

  if (user) {
    const conflictingId = user[providerField];
    if (conflictingId && conflictingId !== providerId) {
      throw new Error(
        `${provider} account is already linked to a different identity`,
      );
    }

    await linkProviderToUser({ user, provider, providerId });
    return user;
  }

  return User.create({
    name: name || normalizedEmail.split("@")[0],
    email: normalizedEmail,
    authProvider: provider,
    oauthProviderId: providerId,
    [providerField]: providerId,
  });
};

const buildOauthErrorRedirect = ({ provider, redirectPath, message }) => {
  return buildFrontendRedirectUrl({
    provider,
    redirectPath,
    status: "error",
    message,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    const user = await User.create({ name, email, password, phone });
    const token = await issueTokens(res, user);

    res.status(201).json({
      success: true,
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

const startOauth = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { redirectPath } = req.body;

    if (!ensureProviderConfigured(provider)) {
      return res.status(503).json({
        success: false,
        message: `${provider} OAuth is not configured on the server`,
      });
    }

    const payload = createStatePayload({
      provider,
      mode: "login",
      redirectPath,
    });
    const state = setOAuthStateCookie(res, payload);
    res.json({ success: true, url: buildAuthUrl(provider, state) });
  } catch (err) {
    next(err);
  }
};

const startOauthLink = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { redirectPath } = req.body;

    if (!ensureProviderConfigured(provider)) {
      return res.status(503).json({
        success: false,
        message: `${provider} OAuth is not configured on the server`,
      });
    }

    const payload = createStatePayload({
      provider,
      mode: "link",
      linkUserId: req.user._id.toString(),
      redirectPath,
    });

    const state = setOAuthStateCookie(res, payload);
    res.json({ success: true, url: buildAuthUrl(provider, state) });
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select(
      "+password +refreshTokenHash +refreshTokenExpiresAt",
    );

    if (
      !user ||
      !user.password ||
      user.authProvider !== "local" ||
      !(await user.matchPassword(password))
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res
        .status(401)
        .json({ success: false, message: "Account is deactivated" });
    }

    const token = await issueTokens(
      res,
      user,
      user.role === "admin" || user.role === "staff" ? "90d" : undefined,
    );

    res.json({
      success: true,
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Refresh access token (rotates refresh token)
// @route   POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token missing" });
    }

    const tokenHash = hashToken(refreshToken);
    const user = await User.findOne({
      refreshTokenHash: tokenHash,
      refreshTokenExpiresAt: { $gt: new Date() },
      isActive: true,
    }).select("+refreshTokenHash +refreshTokenExpiresAt");

    if (!user) {
      clearRefreshTokenCookie(res);
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }

    const token = await issueTokens(
      res,
      user,
      user.role === "admin" || user.role === "staff" ? "90d" : undefined,
    );

    res.json({
      success: true,
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

const oauthCallback = async (req, res, next) => {
  const { provider } = req.params;
  const stateData = readOAuthState(req, provider);

  const safeRedirect = (message) => {
    clearOAuthStateCookie(res, provider);
    const redirectUrl = buildOauthErrorRedirect({
      provider,
      redirectPath: stateData?.redirectPath,
      message,
    });
    return res.redirect(302, redirectUrl);
  };

  try {
    if (!stateData) {
      return safeRedirect("OAuth state is missing or expired");
    }

    if (req.query.error) {
      return safeRedirect(
        req.query.error_description || `${provider} authorization was denied`,
      );
    }

    if (
      !req.query.code ||
      !req.query.state ||
      req.query.state !== stateData.nonce
    ) {
      return safeRedirect("OAuth callback validation failed");
    }

    const profile = await exchangeCodeForProfile(provider, req.query.code);
    if (!profile.emailVerified || !profile.email) {
      return safeRedirect(
        `${provider} account must provide a verified email address`,
      );
    }

    let user;
    if (stateData.mode === "link") {
      user = await User.findById(stateData.linkUserId).select(
        "+refreshTokenHash +refreshTokenExpiresAt",
      );
      if (!user) {
        return safeRedirect("Account linking session is no longer valid");
      }

      const existingEmailOwner = await User.findOne({
        email: normalizeEmail(profile.email),
      });
      if (
        existingEmailOwner &&
        existingEmailOwner._id.toString() !== user._id.toString()
      ) {
        return safeRedirect("That email is already used by another account");
      }

      await linkProviderToUser({
        user,
        provider,
        providerId: profile.providerId,
      });
    } else {
      user = await resolveOauthUser({
        provider,
        providerId: profile.providerId,
        email: profile.email,
        name: profile.name,
      });
    }

    await issueTokens(
      res,
      user,
      user.role === "admin" || user.role === "staff" ? "90d" : undefined,
    );

    clearOAuthStateCookie(res, provider);
    const redirectUrl = buildFrontendRedirectUrl({
      user,
      redirectPath: stateData.redirectPath,
      status: "success",
      provider,
      message:
        stateData.mode === "link"
          ? `${provider} account linked successfully`
          : `${provider} sign-in completed`,
    });
    return res.redirect(302, redirectUrl);
  } catch (err) {
    return safeRedirect(err.message || `${provider} OAuth failed`);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await User.updateOne(
        { refreshTokenHash: tokenHash },
        { $unset: { refreshTokenHash: "", refreshTokenExpiresAt: "" } },
      );
    }

    clearRefreshTokenCookie(res);
    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @desc    Update profile
// @route   PUT /api/auth/me
const updateMe = async (req, res, next) => {
  try {
    const allowed = ["name", "phone", "address"];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (!user?.password || !(await user.matchPassword(currentPassword))) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
};

// @desc    Guest checkout — auto-create account with temp password
// @route   POST /api/auth/guest
async function guestRegister(req, res, next) {
  try {
    const { email, name, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
        emailExists: true,
      });
    }

    const tempPassword = crypto.randomBytes(24).toString("hex");
    const user = await User.create({
      name,
      email,
      phone,
      password: tempPassword,
      mustSetPassword: true,
    });

    const token = await issueTokens(res, user);

    res.status(201).json({
      success: true,
      token,
      user,
      mustSetPassword: true,
    });
  } catch (err) {
    next(err);
  }
}

// @desc    Set password (for guest accounts that haven't set one yet)
// @route   PUT /api/auth/set-password
async function setPassword(req, res, next) {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.password = newPassword;
    user.mustSetPassword = false;
    await user.save();

    res.json({ success: true, message: "Password set successfully", user });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getCsrfToken,
  startOauth,
  startOauthLink,
  oauthCallback,
  refresh,
  logout,
  getMe,
  updateMe,
  changePassword,
  guestRegister,
  setPassword,
};
