const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { cloudinary, cloudinaryConfigured } = require("../config/cloudinary");
const { imagekit, imagekitConfigured } = require("../config/imagekit");
const { firebaseStorage, firebaseConfigured } = require("../config/firebase");

const safeUnlink = (filePath) => {
  fs.unlink(filePath, () => {});
};

const resolveMediaFolder = (folderFromBody, fallbackFolder) => {
  const folder = (folderFromBody || fallbackFolder || "bman/products").trim();
  if (!folder) return "/bman/products";
  return folder.startsWith("/") ? folder : `/${folder}`;
};

const sanitizeImageKitName = (value, fallback = "bmanMedia") => {
  const normalized = String(value || "")
    .trim()
    .replace(/[\/\s]+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "");
  return normalized || fallback;
};

const resolveImageKitFolder = ({
  folderFromBody,
  folderKey,
  baseNamespace,
}) => {
  if (folderFromBody) {
    return sanitizeImageKitName(
      folderFromBody,
      sanitizeImageKitName(baseNamespace),
    );
  }

  const base = sanitizeImageKitName(baseNamespace, "bmanMedia");
  const key = sanitizeImageKitName(folderKey || "products", "products");
  return `${base}_${key}`;
};

const getOptimizationConfig = () => {
  const width = Number(
    process.env.MEDIA_IMAGE_MAX_WIDTH || process.env.IMAGEKIT_MAX_WIDTH || 1280,
  );
  const quality = Number(
    process.env.MEDIA_IMAGE_QUALITY || process.env.IMAGEKIT_QUALITY || 80,
  );

  return {
    width: Number.isFinite(width) ? width : 1280,
    quality: Number.isFinite(quality) ? quality : 80,
  };
};

const optimizeForUpload = async (sourcePath, originalName) => {
  const { width, quality } = getOptimizationConfig();
  const baseName = path.parse(originalName || "upload").name || "upload";

  const optimizedBuffer = await sharp(sourcePath)
    .rotate()
    .resize({
      width,
      height: width,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer();

  return {
    file: optimizedBuffer,
    fileName: `${baseName}.webp`,
    optimized: true,
  };
};

const normalizeFolder = (folder) => folder.replace(/^\/+|\/+$/g, "");

const buildFirebaseObjectPath = (folder, fileName) => {
  const safeFolder = normalizeFolder(folder || "bman/products");
  const safeName = (fileName || "upload.webp").replace(/\s+/g, "-");
  return `${safeFolder}/${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;
};

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Image file is required" });
    }

    const mediaStorage = process.env.MEDIA_STORAGE || "local";
    const shouldUseImageKit = mediaStorage === "imagekit" && imagekitConfigured;
    const shouldUseFirebase = mediaStorage === "firebase" && firebaseConfigured;
    const shouldUseCloudinary =
      mediaStorage === "cloudinary" && cloudinaryConfigured;

    if (shouldUseImageKit) {
      const folder = resolveImageKitFolder({
        folderFromBody: req.body?.folder,
        folderKey: req.body?.folderKey || req.body?.mediaType,
        baseNamespace: process.env.IMAGEKIT_FOLDER,
      });

      let filePayload = req.file.path;
      let fileName = req.file.originalname || req.file.filename;
      let optimized = false;

      try {
        const transformed = await optimizeForUpload(req.file.path, fileName);
        filePayload = transformed.file;
        fileName = transformed.fileName;
        optimized = transformed.optimized;
      } catch (_) {
        // Fallback to original file upload when sharp cannot transform the input.
      }

      const uploaded = await imagekit.upload({
        file: filePayload,
        fileName,
        folder,
        useUniqueFileName: true,
      });

      safeUnlink(req.file.path);

      return res.status(201).json({
        success: true,
        media: {
          url: uploaded.url,
          fileId: uploaded.fileId,
          provider: "imagekit",
          optimized,
        },
      });
    }

    if (shouldUseFirebase) {
      const folder = resolveMediaFolder(
        req.body?.folder,
        process.env.FIREBASE_FOLDER || process.env.IMAGEKIT_FOLDER,
      );

      let filePayload = await fs.promises.readFile(req.file.path);
      let fileName = req.file.originalname || req.file.filename;
      let contentType = req.file.mimetype || "application/octet-stream";
      let optimized = false;

      try {
        const transformed = await optimizeForUpload(req.file.path, fileName);
        filePayload = transformed.file;
        fileName = transformed.fileName;
        contentType = "image/webp";
        optimized = transformed.optimized;
      } catch (_) {
        // Fallback to original file upload when sharp cannot transform the input.
      }

      const bucket = firebaseStorage.bucket();
      const objectPath = buildFirebaseObjectPath(folder, fileName);
      const file = bucket.file(objectPath);

      await file.save(filePayload, {
        metadata: {
          contentType,
          cacheControl: "public, max-age=31536000, immutable",
        },
        resumable: false,
      });

      let url;
      const shouldMakePublic =
        (process.env.FIREBASE_MAKE_PUBLIC || "true").toLowerCase() !== "false";

      if (shouldMakePublic) {
        try {
          await file.makePublic();
          url = `https://storage.googleapis.com/${bucket.name}/${encodeURI(objectPath)}`;
        } catch (_) {
          const [signedUrl] = await file.getSignedUrl({
            action: "read",
            expires: "03-01-2500",
          });
          url = signedUrl;
        }
      } else {
        const [signedUrl] = await file.getSignedUrl({
          action: "read",
          expires: "03-01-2500",
        });
        url = signedUrl;
      }

      safeUnlink(req.file.path);

      return res.status(201).json({
        success: true,
        media: {
          url,
          objectPath,
          provider: "firebase",
          optimized,
        },
      });
    }

    if (shouldUseCloudinary) {
      const folder = resolveMediaFolder(
        req.body?.folder,
        process.env.CLOUDINARY_FOLDER,
      ).replace(/^\//, "");

      let uploadPath = req.file.path;
      let optimizedTempPath = null;
      let optimized = false;

      try {
        const transformed = await optimizeForUpload(
          req.file.path,
          req.file.originalname || req.file.filename,
        );
        optimizedTempPath = path.join(
          path.dirname(req.file.path),
          `${Date.now()}-${Math.round(Math.random() * 1e9)}-${transformed.fileName}`,
        );
        await fs.promises.writeFile(optimizedTempPath, transformed.file);
        uploadPath = optimizedTempPath;
        optimized = true;
      } catch (_) {
        // Fallback to original file upload when sharp cannot transform the input.
      }

      const uploaded = await cloudinary.uploader.upload(uploadPath, {
        folder,
        resource_type: "image",
      });

      if (optimizedTempPath) safeUnlink(optimizedTempPath);
      safeUnlink(req.file.path);

      return res.status(201).json({
        success: true,
        media: {
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          provider: "cloudinary",
          optimized,
        },
      });
    }

    const uploadsDir = path.dirname(req.file.path);
    // Always generate a fresh unique output name so that the output path can
    // never collide with the multer temp path (happens when the source file is
    // already .webp — sharp cannot read and write the same path simultaneously).
    const optimizedName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    const optimizedPath = path.join(uploadsDir, optimizedName);

    const { width, quality } = getOptimizationConfig();
    await sharp(req.file.path)
      .rotate()
      .resize({
        width,
        height: width,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toFile(optimizedPath);

    safeUnlink(req.file.path);

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
