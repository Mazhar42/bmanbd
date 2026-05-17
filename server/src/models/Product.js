const mongoose = require("mongoose");
const slugify = require("slugify");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: { type: String, default: "BMAN" },
    gender: { type: String, enum: ["men", "women", "unisex"], default: "men" },
    tags: [String],
    images: [String],
    fabric: { type: String },
    fit: { type: String, enum: ["slim", "regular", "relaxed", "oversized"] },
    careInstructions: [String],
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active",
    },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

productSchema.virtual("variants", {
  ref: "ProductVariant",
  localField: "_id",
  foreignField: "product",
});

productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug =
      slugify(this.name, { lower: true, strict: true }) + "-" + Date.now();
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
