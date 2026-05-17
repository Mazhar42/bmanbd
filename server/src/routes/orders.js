const express = require("express");
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  createPOSOrder,
} = require("../controllers/orderController");
const { protect, admin } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  objectIdParam,
  orderCreateValidators,
  posOrderValidators,
  orderStatusValidators,
  orderQueryValidators,
} = require("../utils/routeValidators");

router.post("/", [protect, ...orderCreateValidators, validate], createOrder);
router.post(
  "/pos",
  [protect, admin, ...posOrderValidators, validate],
  createPOSOrder,
);
router.get("/my", protect, getMyOrders);
router.get(
  "/",
  [protect, admin, ...orderQueryValidators, validate],
  getAllOrders,
);
router.get("/:id", [protect, objectIdParam("id"), validate], getOrder);
router.put(
  "/:id/status",
  [protect, admin, ...orderStatusValidators, validate],
  updateOrderStatus,
);

module.exports = router;
