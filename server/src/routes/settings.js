const express = require("express");
const router = express.Router();
const {
  getPublicSettings,
  getAdminSettings,
  updateSettings,
} = require("../controllers/settingsController");
const { protect, admin } = require("../middleware/auth");

router.get("/public", getPublicSettings);
router.get("/", protect, admin, getAdminSettings);
router.put("/", protect, admin, updateSettings);

module.exports = router;
