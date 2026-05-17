const mongoose = require("mongoose");

const inventoryTransactionSchema = new mongoose.Schema(
  {
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },
    type: {
      type: String,
      enum: ["purchase", "sale", "adjustment", "return", "transfer"],
      required: true,
    },
    quantity: { type: Number, required: true },
    stockBefore: { type: Number, required: true },
    stockAfter: { type: Number, required: true },
    source: {
      type: String,
      enum: ["online", "pos", "admin", "system"],
      required: true,
    },
    reference: { type: mongoose.Schema.Types.ObjectId },
    referenceModel: { type: String, enum: ["Order", "Purchase"] },
    note: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "InventoryTransaction",
  inventoryTransactionSchema,
);
