const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUser,
  updateUser,
  getDashboardStats,
} = require("../controllers/userController");
const { protect, admin, adminOnly } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  objectIdParam,
  userQueryValidators,
  userUpdateValidators,
} = require("../utils/routeValidators");

router.get("/dashboard-stats", protect, admin, getDashboardStats);
router.get(
  "/",
  [protect, adminOnly, ...userQueryValidators, validate],
  getAllUsers,
);
router.get("/:id", [protect, admin, objectIdParam("id"), validate], getUser);
router.put(
  "/:id",
  [protect, adminOnly, ...userUpdateValidators, validate],
  updateUser,
);

module.exports = router;
