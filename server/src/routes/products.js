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
} = require("../controllers/productController");
const { protect, admin } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  objectIdParam,
  productQueryValidators,
  productBodyValidators,
  productUpdateValidators,
  variantBodyValidators,
  variantUpdateValidators,
} = require("../utils/routeValidators");

router.get("/", [...productQueryValidators, validate], getProducts);
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
