const { CSRF_COOKIE_NAME, ensureCsrfToken } = require("../utils/csrf");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const attachCsrfToken = (req, res, next) => {
  res.locals.csrfToken = ensureCsrfToken(req, res);
  next();
};

const requireCsrf = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.get("x-csrf-token");

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      code: "csrf_invalid",
      message: "Invalid CSRF token",
    });
  }

  next();
};

module.exports = { attachCsrfToken, requireCsrf };
