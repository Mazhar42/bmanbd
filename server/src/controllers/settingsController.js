const SiteSettings = require("../models/SiteSettings");

const getOrCreateSettings = async () => {
  let settings = await SiteSettings.findOne({ singletonKey: "default" });
  if (!settings) {
    settings = await SiteSettings.create({ singletonKey: "default" });
  }
  return settings;
};

const getPublicSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({
      success: true,
      settings: {
        siteName: settings.siteName,
        logo: settings.logo,
        banners: settings.banners.filter((banner) => banner.isActive),
        contactInfo: settings.contactInfo,
        socialLinks: settings.socialLinks,
        footerText: settings.footerText,
        promotionalContent: settings.promotionalContent,
        featuredSections: settings.featuredSections,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getAdminSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const allowedFields = [
      "siteName",
      "logo",
      "banners",
      "contactInfo",
      "socialLinks",
      "footerText",
      "featuredSections",
      "promotionalContent",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const settings = await SiteSettings.findOneAndUpdate(
      { singletonKey: "default" },
      { $set: updates, $setOnInsert: { singletonKey: "default" } },
      { new: true, upsert: true, runValidators: true },
    );

    res.json({ success: true, settings, message: "Site settings updated" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPublicSettings,
  getAdminSettings,
  updateSettings,
};
