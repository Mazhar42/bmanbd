const mongoose = require("mongoose");

const siteSettingsSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      default: "default",
      unique: true,
      immutable: true,
    },
    siteName: { type: String, default: "BMAN" },
    logo: { type: String, default: "" },
    banners: [
      {
        title: { type: String, trim: true },
        subtitle: { type: String, trim: true },
        imageUrl: { type: String, trim: true },
        ctaLabel: { type: String, trim: true },
        ctaUrl: { type: String, trim: true },
        isActive: { type: Boolean, default: true },
      },
    ],
    contactInfo: {
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      address: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
    },
    socialLinks: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      youtube: { type: String, default: "" },
      tiktok: { type: String, default: "" },
    },
    footerText: { type: String, default: "" },
    featuredSections: [
      {
        title: { type: String, trim: true },
        productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
      },
    ],
    promotionalContent: {
      announcement: { type: String, default: "" },
      discountBannerText: { type: String, default: "" },
      discountCode: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
