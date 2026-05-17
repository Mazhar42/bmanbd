const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadImage } = require("../controllers/mediaController");

router.post("/upload", protect, admin, upload.single("image"), uploadImage);

module.exports = router;
