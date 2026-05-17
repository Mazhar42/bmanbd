const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const {
  register,
  login,
  getCsrfToken,
  refresh,
  logout,
  getMe,
  updateMe,
  changePassword,
  guestRegister,
  setPassword,
  startOauth,
  startOauthLink,
  oauthCallback,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const emailRule = body("email")
  .isEmail()
  .withMessage("Valid email is required");
const passwordRule = body("password")
  .isLength({ min: 6 })
  .withMessage("Password must be at least 6 characters");

router.get("/csrf", getCsrfToken);
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    emailRule,
    passwordRule,
    validate,
  ],
  register,
);
router.post("/login", [emailRule, passwordRule, validate], login);
router.post(
  "/guest",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    emailRule,
    validate,
  ],
  guestRegister,
);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post(
  "/oauth/:provider/start",
  [
    param("provider")
      .isIn(["google", "facebook"])
      .withMessage("Provider must be google or facebook"),
    body("redirectPath")
      .optional()
      .isString()
      .matches(/^\//)
      .withMessage("redirectPath must start with /")
      .isLength({ max: 200 })
      .withMessage("redirectPath is too long"),
    validate,
  ],
  startOauth,
);
router.post(
  "/oauth/:provider/link",
  [
    protect,
    param("provider")
      .isIn(["google", "facebook"])
      .withMessage("Provider must be google or facebook"),
    body("redirectPath")
      .optional()
      .isString()
      .matches(/^\//)
      .withMessage("redirectPath must start with /")
      .isLength({ max: 200 })
      .withMessage("redirectPath is too long"),
    validate,
  ],
  startOauthLink,
);
router.get(
  "/oauth/:provider/callback",
  [
    param("provider")
      .isIn(["google", "facebook"])
      .withMessage("Provider must be google or facebook"),
    validate,
  ],
  oauthCallback,
);
router.get("/me", protect, getMe);
router.put(
  "/me",
  [
    protect,
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage("Name must be between 2 and 120 characters"),
    body("phone")
      .optional()
      .isLength({ min: 7, max: 20 })
      .withMessage("Phone length is invalid"),
    validate,
  ],
  updateMe,
);
router.put(
  "/change-password",
  [
    protect,
    body("currentPassword")
      .isLength({ min: 6 })
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
    validate,
  ],
  changePassword,
);
router.put(
  "/set-password",
  [
    protect,
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    validate,
  ],
  setPassword,
);

module.exports = router;
