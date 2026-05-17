const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_EXPIRE = process.env.JWT_EXPIRE || "30d";
const REFRESH_TOKEN_EXPIRE_DAYS = Number(
  process.env.REFRESH_TOKEN_EXPIRE_DAYS || 30,
);
const getCookieDomain = () => process.env.COOKIE_DOMAIN || undefined;

const generateAccessToken = (id, expiresIn = ACCESS_TOKEN_EXPIRE) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const getRefreshTokenExpiryDate = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRE_DAYS);
  return expiresAt;
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.COOKIE_SAME_SITE || "lax",
  path: "/api/auth",
  maxAge: REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 * 1000,
  ...(getCookieDomain() ? { domain: getCookieDomain() } : {}),
};

const setRefreshTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, refreshCookieOptions);
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie("refreshToken", refreshCookieOptions);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshTokenExpiryDate,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
};
