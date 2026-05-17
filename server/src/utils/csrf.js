const crypto = require("crypto");

const CSRF_COOKIE_NAME = "csrfToken";

const getCookieDomain = () => process.env.COOKIE_DOMAIN || undefined;

const getCsrfCookieOptions = () => ({
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  ...(getCookieDomain() ? { domain: getCookieDomain() } : {}),
});

const generateCsrfToken = () => crypto.randomBytes(32).toString("hex");

const ensureCsrfToken = (req, res) => {
  const existing = req.cookies?.[CSRF_COOKIE_NAME];
  if (existing) return existing;

  const token = generateCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, token, getCsrfCookieOptions());
  return token;
};

module.exports = {
  CSRF_COOKIE_NAME,
  getCsrfCookieOptions,
  generateCsrfToken,
  ensureCsrfToken,
};
