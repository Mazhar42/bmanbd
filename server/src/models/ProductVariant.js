const mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    size: { type: String, required: true },
    color: { type: String, required: true },
    colorHex: { type: String },
    sku: { type: String, required: true, unique: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    image: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productVariantSchema.virtual("isOnSale").get(function () {
  return this.discountPrice && this.discountPrice < this.price;
});

productVariantSchema.virtual("discountPercent").get(function () {
  if (!this.discountPrice || this.discountPrice >= this.price) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

productVariantSchema.virtual("effectivePrice").get(function () {
  return this.discountPrice && this.discountPrice < this.price
    ? this.discountPrice
    : this.price;
});

productVariantSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("ProductVariant", productVariantSchema);
