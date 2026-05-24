const express = require("express");
const router = express.Router();
const {
  getInventory,
  getTransactions,
  adjustStock,
  purchaseStock,
  getAlerts,
  getStats,
  deleteTransaction,
} = require("../controllers/inventoryController");
const { protect, admin } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  objectIdParam,
  inventoryQueryValidators,
  inventoryTransactionQueryValidators,
  inventoryAdjustValidators,
  inventoryPurchaseValidators,
} = require("../utils/routeValidators");

router.get(
  "/",
  [protect, admin, ...inventoryQueryValidators, validate],
  getInventory,
);
router.get(
  "/transactions",
  [protect, admin, ...inventoryTransactionQueryValidators, validate],
  getTransactions,
);
router.get("/alerts", protect, admin, getAlerts);
router.get("/stats", protect, admin, getStats);
router.post(
  "/adjust",
  [protect, admin, ...inventoryAdjustValidators, validate],
  adjustStock,
);
router.post(
  "/purchase",
  [protect, admin, ...inventoryPurchaseValidators, validate],
  purchaseStock,
);
router.delete(
  "/transactions/:id",
  [protect, admin, objectIdParam("id"), validate],
  deleteTransaction,
);

module.exports = router;
