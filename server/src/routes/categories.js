const express = require("express");
const router = express.Router();
const {
  getCategoryTree,
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { protect, admin } = require("../middleware/auth");

router.get("/", getCategories);
router.get("/tree", getCategoryTree); // must be before /:slugOrId
router.get("/:slugOrId", getCategory);
router.post("/", protect, admin, createCategory);
router.put("/:id", protect, admin, updateCategory);
router.delete("/:id", protect, admin, deleteCategory);

module.exports = router;
