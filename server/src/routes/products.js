const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  getImportTemplate,
  importProducts,
} = require("../controllers/productController");
const { protect, admin } = require("../middleware/auth");
const validate = require("../middleware/validate");
const multer = require("multer");
const xlsxUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.endsWith(".xlsx") ||
      file.originalname.endsWith(".xls");
    ok ? cb(null, true) : cb(new Error("Only .xlsx / .xls files are allowed"));
  },
});
const {
  objectIdParam,
  productQueryValidators,
  productBodyValidators,
  productUpdateValidators,
  variantBodyValidators,
  variantUpdateValidators,
} = require("../utils/routeValidators");

router.get("/", [...productQueryValidators, validate], getProducts);

// Import routes — must be before /:slugOrId
router.get("/import/template", protect, admin, getImportTemplate);
router.post(
  "/import",
  protect,
  admin,
  xlsxUpload.single("file"),
  importProducts,
);

router.get("/:slugOrId", getProduct);
router.post(
  "/",
  [protect, admin, ...productBodyValidators, validate],
  createProduct,
);
router.put(
  "/:id",
  [protect, admin, ...productUpdateValidators, validate],
  updateProduct,
);
router.delete(
  "/:id",
  [protect, admin, objectIdParam("id"), validate],
  deleteProduct,
);

router.post(
  "/:id/variants",
  [protect, admin, objectIdParam("id"), ...variantBodyValidators, validate],
  createVariant,
);
router.put(
  "/:id/variants/:variantId",
  [protect, admin, ...variantUpdateValidators, validate],
  updateVariant,
);
router.delete(
  "/:id/variants/:variantId",
  [protect, admin, objectIdParam("id"), objectIdParam("variantId"), validate],
  deleteVariant,
);

module.exports = router;
