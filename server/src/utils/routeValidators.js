const { body, param, query } = require("express-validator");

const objectIdParam = (name) =>
  param(name).isMongoId().withMessage(`${name} must be a valid id`);

const mongoBody = (name) =>
  body(name).isMongoId().withMessage(`${name} must be a valid id`);

const paginationQueryRules = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
];

const booleanQueryRule = (name) =>
  query(name)
    .optional()
    .isIn(["true", "false"])
    .withMessage(`${name} must be true or false`);

const productQueryValidators = [
  ...paginationQueryRules,
  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("minPrice must be >= 0"),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("maxPrice must be >= 0"),
  query("gender")
    .optional()
    .isIn(["men", "women", "unisex"])
    .withMessage("gender is invalid"),
  query("fit")
    .optional()
    .isIn(["slim", "regular", "relaxed", "oversized"])
    .withMessage("fit is invalid"),
  query("status")
    .optional()
    .isIn(["active", "draft", "archived", "all"])
    .withMessage("status is invalid"),
  booleanQueryRule("isFeatured"),
  booleanQueryRule("isNewArrival"),
  booleanQueryRule("isTrending"),
];

const productBodyValidators = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ max: 180 })
    .withMessage("Product name is too long"),
  mongoBody("category"),
  body("description").optional().isString().isLength({ max: 5000 }),
  body("brand").optional().isString().isLength({ max: 120 }),
  body("gender")
    .optional()
    .isIn(["men", "women", "unisex"])
    .withMessage("gender is invalid"),
  body("tags").optional().isArray().withMessage("tags must be an array"),
  body("images").optional().isArray().withMessage("images must be an array"),
  body("fabric").optional().isString().isLength({ max: 120 }),
  body("fit")
    .optional()
    .isIn(["slim", "regular", "relaxed", "oversized"])
    .withMessage("fit is invalid"),
  body("careInstructions")
    .optional()
    .isArray()
    .withMessage("careInstructions must be an array"),
  body("status")
    .optional()
    .isIn(["active", "draft", "archived"])
    .withMessage("status is invalid"),
  body("averageRating").optional().isFloat({ min: 0, max: 5 }),
  body("reviewCount").optional().isInt({ min: 0 }),
  body("isFeatured").optional().isBoolean(),
  body("isNewArrival").optional().isBoolean(),
  body("isTrending").optional().isBoolean(),
];

const productUpdateValidators = [
  objectIdParam("id"),
  body("name").optional().trim().notEmpty().isLength({ max: 180 }),
  body("category")
    .optional()
    .isMongoId()
    .withMessage("category must be a valid id"),
  body("description").optional().isString().isLength({ max: 5000 }),
  body("brand").optional().isString().isLength({ max: 120 }),
  body("gender").optional().isIn(["men", "women", "unisex"]),
  body("tags").optional().isArray(),
  body("images").optional().isArray(),
  body("fabric").optional().isString().isLength({ max: 120 }),
  body("fit").optional().isIn(["slim", "regular", "relaxed", "oversized"]),
  body("careInstructions").optional().isArray(),
  body("status").optional().isIn(["active", "draft", "archived"]),
  body("averageRating").optional().isFloat({ min: 0, max: 5 }),
  body("reviewCount").optional().isInt({ min: 0 }),
  body("isFeatured").optional().isBoolean(),
  body("isNewArrival").optional().isBoolean(),
  body("isTrending").optional().isBoolean(),
];

const variantBodyValidators = [
  body("size").trim().notEmpty().withMessage("size is required"),
  body("color").trim().notEmpty().withMessage("color is required"),
  body("colorHex").optional().isString().isLength({ max: 20 }),
  body("sku").trim().notEmpty().withMessage("sku is required"),
  body("price").isFloat({ min: 0 }).withMessage("price must be >= 0"),
  body("discountPrice").optional().isFloat({ min: 0 }),
  body("stock").optional().isInt({ min: 0 }),
  body("image").optional().isString().isLength({ max: 2000 }),
  body("isActive").optional().isBoolean(),
];

const variantUpdateValidators = [
  objectIdParam("id"),
  objectIdParam("variantId"),
  body("size").optional().trim().notEmpty(),
  body("color").optional().trim().notEmpty(),
  body("colorHex").optional().isString().isLength({ max: 20 }),
  body("sku").optional().trim().notEmpty(),
  body("price").optional().isFloat({ min: 0 }),
  body("discountPrice").optional().isFloat({ min: 0 }),
  body("stock").optional().isInt({ min: 0 }),
  body("image").optional().isString().isLength({ max: 2000 }),
  body("isActive").optional().isBoolean(),
];

const orderItemRules = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),
  body("items.*.variant").isMongoId().withMessage("item variant must be valid"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("item quantity must be >= 1"),
];

const orderCreateValidators = [
  ...orderItemRules,
  body("shippingAddress.fullName")
    .trim()
    .notEmpty()
    .withMessage("fullName is required"),
  body("shippingAddress.phone")
    .trim()
    .notEmpty()
    .withMessage("phone is required"),
  body("shippingAddress.street")
    .trim()
    .notEmpty()
    .withMessage("street is required"),
  body("shippingAddress.city")
    .trim()
    .notEmpty()
    .withMessage("city is required"),
  body("shippingAddress.state").optional().isString().isLength({ max: 120 }),
  body("shippingAddress.postalCode")
    .optional()
    .isString()
    .isLength({ max: 30 }),
  body("shippingAddress.country").optional().isString().isLength({ max: 120 }),
  body("paymentMethod")
    .optional()
    .isIn(["cash_on_delivery", "bkash", "nagad", "card", "cash_pos"]),
  body("notes").optional().isString().isLength({ max: 2000 }),
];

const posOrderValidators = [
  ...orderItemRules,
  body("paymentMethod")
    .optional()
    .isIn(["cash_on_delivery", "bkash", "nagad", "card", "cash_pos"]),
  body("discount").optional().isFloat({ min: 0 }),
  body("notes").optional().isString().isLength({ max: 2000 }),
  body("customerName").optional().isString().isLength({ max: 180 }),
  body("customerPhone").optional().isString().isLength({ max: 30 }),
];

const orderStatusValidators = [
  objectIdParam("id"),
  body("orderStatus")
    .optional()
    .isIn([
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
    ]),
  body("status")
    .optional()
    .isIn([
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
    ]),
  body("paymentStatus")
    .optional()
    .isIn(["pending", "paid", "failed", "refunded"]),
  body().custom((value) => {
    if (!value.orderStatus && !value.status && !value.paymentStatus) {
      throw new Error("At least one status field is required");
    }
    return true;
  }),
];

const orderQueryValidators = [
  ...paginationQueryRules,
  query("status")
    .optional()
    .isIn([
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
    ]),
  query("source").optional().isIn(["online", "pos"]),
  query("search").optional().isString().isLength({ max: 120 }),
];

const inventoryQueryValidators = [
  ...paginationQueryRules,
  query("lowStock").optional().isIn(["true", "false"]),
  query("category")
    .optional()
    .isMongoId()
    .withMessage("category must be a valid id"),
  query("search").optional().isString().isLength({ max: 120 }),
  query("minStock").optional().isInt({ min: 0 }),
  query("maxStock").optional().isInt({ min: 0 }),
];

const inventoryTransactionQueryValidators = [
  ...paginationQueryRules,
  query("variant")
    .optional()
    .isMongoId()
    .withMessage("variant must be a valid id"),
  query("type")
    .optional()
    .isIn(["purchase", "sale", "adjustment", "return", "transfer"]),
  query("source").optional().isIn(["online", "pos", "admin", "system"]),
];

const inventoryAdjustValidators = [
  mongoBody("variantId"),
  body("quantity")
    .isInt({ min: -100000, max: 100000 })
    .withMessage("quantity must be a whole number")
    .custom((value) => {
      if (Number(value) === 0) throw new Error("quantity cannot be zero");
      return true;
    }),
  body("type")
    .optional()
    .isIn(["purchase", "sale", "adjustment", "return", "transfer"]),
  body("note").optional().isString().isLength({ max: 1000 }),
];

const inventoryPurchaseValidators = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),
  body("items.*.variantId").isMongoId().withMessage("variantId must be valid"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("quantity must be >= 1"),
  body("note").optional().isString().isLength({ max: 1000 }),
];

const userQueryValidators = [
  ...paginationQueryRules,
  query("search").optional().isString().isLength({ max: 120 }),
];

const userUpdateValidators = [
  objectIdParam("id"),
  body("name").optional().trim().isLength({ min: 2, max: 120 }),
  body("email").optional().isEmail().withMessage("Valid email is required"),
  body("phone").optional().isString().isLength({ min: 7, max: 20 }),
  body("role").optional().isIn(["user", "admin", "staff"]),
  body("isActive").optional().isBoolean(),
];

module.exports = {
  objectIdParam,
  productQueryValidators,
  productBodyValidators,
  productUpdateValidators,
  variantBodyValidators,
  variantUpdateValidators,
  orderCreateValidators,
  posOrderValidators,
  orderStatusValidators,
  orderQueryValidators,
  inventoryQueryValidators,
  inventoryTransactionQueryValidators,
  inventoryAdjustValidators,
  inventoryPurchaseValidators,
  userQueryValidators,
  userUpdateValidators,
};
