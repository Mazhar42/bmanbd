const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { cloudinary, cloudinaryConfigured } = require("../config/cloudinary");

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Image file is required" });
    }

    const mediaStorage = process.env.MEDIA_STORAGE || "local";
    const shouldUseCloudinary =
      mediaStorage === "cloudinary" && cloudinaryConfigured;

    if (shouldUseCloudinary) {
      const uploaded = await cloudinary.uploader.upload(req.file.path, {
        folder: process.env.CLOUDINARY_FOLDER || "bman",
        resource_type: "image",
      });

      fs.unlink(req.file.path, () => {});

      return res.status(201).json({
        success: true,
        media: {
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          provider: "cloudinary",
        },
      });
    }

    const uploadsDir = path.dirname(req.file.path);
    const baseName = path.parse(req.file.filename).name;
    const optimizedName = `${baseName}.webp`;
    const optimizedPath = path.join(uploadsDir, optimizedName);

    await sharp(req.file.path)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toFile(optimizedPath);

    fs.unlink(req.file.path, () => {});

    const localUrl = `${req.protocol}://${req.get("host")}/uploads/${optimizedName}`;
    return res.status(201).json({
      success: true,
      media: {
        url: localUrl,
        provider: "local",
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadImage };
