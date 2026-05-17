const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const OAUTH_COOKIE_PREFIX = "oauth_state_";
const OAUTH_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;
const OAUTH_API_VERSION = process.env.FACEBOOK_API_VERSION || "v22.0";

const getCookieDomain = () => process.env.COOKIE_DOMAIN || undefined;

const getOAuthStateCookieName = (provider) =>
  `${OAUTH_COOKIE_PREFIX}${provider}`;

const getOAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth/oauth",
  maxAge: OAUTH_COOKIE_MAX_AGE_MS,
  ...(getCookieDomain() ? { domain: getCookieDomain() } : {}),
});

const getServerPublicUrl = () => {
  const url = process.env.SERVER_PUBLIC_URL || "http://localhost:5000";
  return url.replace(/\/$/, "");
};

const getClientUrl = () => {
  const url = process.env.CLIENT_URL || "http://localhost:5173";
  return url.replace(/\/$/, "");
};

const getAdminUrl = () => {
  const url = process.env.ADMIN_URL || getClientUrl();
  return url.replace(/\/$/, "");
};

const getCallbackUrl = (provider) => {
  const configured = process.env[`${provider.toUpperCase()}_CALLBACK_URL`];
  return (
    configured || `${getServerPublicUrl()}/api/auth/oauth/${provider}/callback`
  );
};

const createStatePayload = ({
  provider,
  mode = "login",
  linkUserId,
  redirectPath,
}) => {
  const nonce = crypto.randomBytes(24).toString("hex");
  return {
    nonce,
    provider,
    mode,
    linkUserId,
    redirectPath: redirectPath || "/account/oauth/callback",
  };
};

const setOAuthStateCookie = (res, payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "10m" });
  res.cookie(
    getOAuthStateCookieName(payload.provider),
    token,
    getOAuthCookieOptions(),
  );
  return payload.nonce;
};

const readOAuthState = (req, provider) => {
  const token = req.cookies?.[getOAuthStateCookieName(provider)];
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

const clearOAuthStateCookie = (res, provider) => {
  res.clearCookie(getOAuthStateCookieName(provider), getOAuthCookieOptions());
};

const buildGoogleAuthUrl = (state) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: getCallbackUrl("google"),
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

const buildFacebookAuthUrl = (state) => {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID,
    redirect_uri: getCallbackUrl("facebook"),
    response_type: "code",
    scope: "email,public_profile",
    state,
  });

  return `https://www.facebook.com/${OAUTH_API_VERSION}/dialog/oauth?${params.toString()}`;
};

const exchangeGoogleCode = async (code) => {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: getCallbackUrl("google"),
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Failed to exchange Google OAuth code");
  }

  const tokenData = await tokenResponse.json();
  const profileResponse = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    },
  );

  if (!profileResponse.ok) {
    throw new Error("Failed to fetch Google profile");
  }

  const profile = await profileResponse.json();
  return {
    provider: "google",
    providerId: profile.sub,
    email: profile.email,
    emailVerified: profile.email_verified,
    name: profile.name,
    avatar: profile.picture,
  };
};

const exchangeFacebookCode = async (code) => {
  const tokenParams = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID,
    client_secret: process.env.FACEBOOK_APP_SECRET,
    redirect_uri: getCallbackUrl("facebook"),
    code,
  });

  const tokenResponse = await fetch(
    `https://graph.facebook.com/${OAUTH_API_VERSION}/oauth/access_token?${tokenParams.toString()}`,
  );

  if (!tokenResponse.ok) {
    throw new Error("Failed to exchange Facebook OAuth code");
  }

  const tokenData = await tokenResponse.json();
  const profileParams = new URLSearchParams({
    fields: "id,name,email,picture.type(large)",
    access_token: tokenData.access_token,
  });
  const profileResponse = await fetch(
    `https://graph.facebook.com/me?${profileParams.toString()}`,
  );

  if (!profileResponse.ok) {
    throw new Error("Failed to fetch Facebook profile");
  }

  const profile = await profileResponse.json();
  return {
    provider: "facebook",
    providerId: profile.id,
    email: profile.email,
    emailVerified: true,
    name: profile.name,
    avatar: profile.picture?.data?.url,
  };
};

const buildAuthUrl = (provider, state) => {
  if (provider === "google") return buildGoogleAuthUrl(state);
  if (provider === "facebook") return buildFacebookAuthUrl(state);
  throw new Error(`Unsupported OAuth provider: ${provider}`);
};

const exchangeCodeForProfile = async (provider, code) => {
  if (provider === "google") return exchangeGoogleCode(code);
  if (provider === "facebook") return exchangeFacebookCode(code);
  throw new Error(`Unsupported OAuth provider: ${provider}`);
};

const getRedirectBaseForUser = (user) => {
  if (user?.role === "admin" || user?.role === "staff") {
    return getAdminUrl();
  }
  return getClientUrl();
};

const buildFrontendRedirectUrl = ({
  user,
  redirectPath,
  status,
  provider,
  message,
}) => {
  const base = getRedirectBaseForUser(user);
  const path = redirectPath || "/account/oauth/callback";
  const url = new URL(path, `${base}/`);
  url.searchParams.set("status", status);
  if (provider) url.searchParams.set("provider", provider);
  if (message) url.searchParams.set("message", message);
  return url.toString();
};

const ensureProviderConfigured = (provider) => {
  if (provider === "google") {
    return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
  }

  if (provider === "facebook") {
    return !!process.env.FACEBOOK_APP_ID && !!process.env.FACEBOOK_APP_SECRET;
  }

  return false;
};

module.exports = {
  createStatePayload,
  setOAuthStateCookie,
  readOAuthState,
  clearOAuthStateCookie,
  buildAuthUrl,
  exchangeCodeForProfile,
  buildFrontendRedirectUrl,
  ensureProviderConfigured,
};
