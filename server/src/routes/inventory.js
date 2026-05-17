const express = require("express");
const router = express.Router();
const {
  getInventory,
  getTransactions,
  adjustStock,
  purchaseStock,
  getAlerts,
  getStats,
} = require("../controllers/inventoryController");
const { protect, admin } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
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

module.exports = router;
