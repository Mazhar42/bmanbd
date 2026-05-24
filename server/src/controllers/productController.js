const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");
const Category = require("../models/Category");
const XLSX = require("xlsx");

// @desc    Get all products (with filtering, sorting, pagination)
// @route   GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      size,
      color,
      fabric,
      fit,
      gender,
      isFeatured,
      isNewArrival,
      isTrending,
      status = "active",
      sort = "-createdAt",
      page = 1,
      limit = 12,
    } = req.query;

    // "all" or empty string means no status filter (used by admin panel)
    const filter = status && status !== "all" ? { status } : {};

    // Resolve category slug → ObjectId (and include ALL descendants)
    if (category) {
      const isObjectId = /^[a-f\d]{24}$/i.test(category);
      let rootCat;
      if (isObjectId) {
        rootCat = await Category.findById(category).lean();
      } else {
        rootCat = await Category.findOne({
          slug: category,
          isActive: true,
        }).lean();
      }
      if (!rootCat) {
        return res.json({
          success: true,
          products: [],
          total: 0,
          page: Number(page),
          pages: 0,
        });
      }
      // Get all categories once, then walk descendants in memory (handles arbitrary depth)
      const allCats = await Category.find({ isActive: true })
        .select("_id parent")
        .lean();
      const getDescendants = (parentId) => {
        const str = parentId.toString();
        const children = allCats.filter(
          (c) => c.parent && c.parent.toString() === str,
        );
        return children.reduce(
          (acc, child) => [...acc, child._id, ...getDescendants(child._id)],
          [],
        );
      };
      const categoryIds = [rootCat._id, ...getDescendants(rootCat._id)];
      filter.category = { $in: categoryIds };
    }
    if (gender) filter.gender = gender;
    if (fabric) filter.fabric = { $regex: fabric, $options: "i" };
    if (fit) filter.fit = fit;
    if (isFeatured === "true") filter.isFeatured = true;
    if (isNewArrival === "true") filter.isNewArrival = true;
    if (isTrending === "true") filter.isTrending = true;
    if (search) {
      const variantMatchIds = await ProductVariant.find({
        $or: [
          { sku: { $regex: search, $options: "i" } },
          { barcode: { $regex: search, $options: "i" } },
        ],
      }).distinct("product");

      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];

      if (variantMatchIds.length) {
        filter.$or.push({ _id: { $in: variantMatchIds } });
      }
    }

    // Pre-filter by variant attributes (price, size, color) BEFORE paginating
    // so that total count and pagination are accurate
    if (minPrice || maxPrice || size || color) {
      const variantMatch = { isActive: true };
      if (size) variantMatch.size = size;
      if (color) variantMatch.color = { $regex: `^${color}$`, $options: "i" };

      const pipeline = [
        { $match: variantMatch },
        {
          $project: {
            product: 1,
            effectivePrice: { $ifNull: ["$discountPrice", "$price"] },
          },
        },
      ];

      if (minPrice || maxPrice) {
        const priceMatch = {};
        if (minPrice) priceMatch.$gte = Number(minPrice);
        if (maxPrice) priceMatch.$lte = Number(maxPrice);
        pipeline.push({ $match: { effectivePrice: priceMatch } });
      }

      pipeline.push({ $group: { _id: "$product" } });

      const matchingVariants = await ProductVariant.aggregate(pipeline);
      const matchingIds = matchingVariants.map((m) => m._id);

      // Intersect with any existing _id filter (shouldn't be set yet, but safe)
      filter._id = { $in: matchingIds };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate("category", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Attach variants summary
    const productIds = products.map((p) => p._id);
    const allVariants = await ProductVariant.find({
      product: { $in: productIds },
      isActive: true,
    });

    const variantMap = {};
    allVariants.forEach((v) => {
      const pid = v.product.toString();
      if (!variantMap[pid]) variantMap[pid] = [];
      variantMap[pid].push(v);
    });

    const enriched = products.map((p) => {
      const variants = variantMap[p._id.toString()] || [];
      const prices = variants.map((v) => v.discountPrice || v.price);
      return {
        ...p.toJSON(),
        variants,
        minPrice: prices.length ? Math.min(...prices) : 0,
        maxPrice: prices.length ? Math.max(...prices) : 0,
        totalStock: variants.reduce((s, v) => s + v.stock, 0),
        colors: [...new Set(variants.map((v) => v.color))],
        sizes: [...new Set(variants.map((v) => v.size))],
        hasDiscount: variants.some(
          (v) => v.discountPrice && v.discountPrice < v.price,
        ),
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      products: enriched,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single product by slug or id
// @route   GET /api/products/:slugOrId
const getProduct = async (req, res, next) => {
  try {
    const { slugOrId } = req.params;
    const filter = slugOrId.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: slugOrId }
      : { slug: slugOrId };

    const product = await Product.findOne(filter).populate(
      "category",
      "name slug parent",
    );
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    const variants = await ProductVariant.find({
      product: product._id,
      isActive: true,
    });
    res.json({ success: true, product: { ...product.toJSON(), variants } });
  } catch (err) {
    next(err);
  }
};

// @desc    Create product
// @route   POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    await ProductVariant.deleteMany({ product: req.params.id });
    await product.deleteOne();
    res.json({ success: true, message: "Product permanently deleted" });
  } catch (err) {
    next(err);
  }
};

// @desc    Create product variant
// @route   POST /api/products/:id/variants
const createVariant = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    const variant = await ProductVariant.create({
      ...req.body,
      product: req.params.id,
    });
    res.status(201).json({ success: true, variant });
  } catch (err) {
    next(err);
  }
};

// @desc    Update product variant
// @route   PUT /api/products/:id/variants/:variantId
const updateVariant = async (req, res, next) => {
  try {
    const variant = await ProductVariant.findOneAndUpdate(
      { _id: req.params.variantId, product: req.params.id },
      req.body,
      { new: true, runValidators: true },
    );
    if (!variant)
      return res
        .status(404)
        .json({ success: false, message: "Variant not found" });
    res.json({ success: true, variant });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete product variant
// @route   DELETE /api/products/:id/variants/:variantId
const deleteVariant = async (req, res, next) => {
  try {
    await ProductVariant.findOneAndDelete({
      _id: req.params.variantId,
      product: req.params.id,
    });
    res.json({ success: true, message: "Variant deleted" });
  } catch (err) {
    next(err);
  }
};

// ─── XLSX Import ──────────────────────────────────────────────

// @desc    Download blank import template
// @route   GET /api/products/import/template
const getImportTemplate = (req, res) => {
  const headers = [
    "name",
    "description",
    "category",
    "brand",
    "gender",
    "tags",
    "fabric",
    "fit",
    "status",
    "featured",
    "new_arrival",
    "trending",
    "size",
    "color",
    "color_hex",
    "sku",
    "barcode",
    "price",
    "sale_price",
    "stock",
  ];
  const examples = [
    {
      name: "Classic Oxford Shirt",
      description: "Premium cotton oxford shirt",
      category: "Shirt_Formal",
      brand: "BMAN",
      gender: "men",
      tags: "oxford,formal,cotton",
      fabric: "100% Cotton",
      fit: "slim",
      status: "active",
      featured: "false",
      new_arrival: "true",
      trending: "false",
      size: "M",
      color: "White",
      color_hex: "#FFFFFF",
      sku: "",
      barcode: "",
      price: 1200,
      sale_price: "",
      stock: 50,
    },
    {
      name: "Classic Oxford Shirt",
      description: "Premium cotton oxford shirt",
      category: "Shirt_Formal",
      brand: "BMAN",
      gender: "men",
      tags: "oxford,formal,cotton",
      fabric: "100% Cotton",
      fit: "slim",
      status: "active",
      featured: "false",
      new_arrival: "true",
      trending: "false",
      size: "L",
      color: "White",
      color_hex: "#FFFFFF",
      sku: "",
      barcode: "",
      price: 1200,
      sale_price: "",
      stock: 30,
    },
    {
      name: "Basic T-Shirt",
      description: "Everyday cotton t-shirt",
      category: "T-Shirt_Regular",
      brand: "BMAN",
      gender: "men",
      tags: "tshirt,basic,cotton",
      fabric: "100% Cotton",
      fit: "regular",
      status: "active",
      featured: "false",
      new_arrival: "false",
      trending: "true",
      size: "L",
      color: "Black",
      color_hex: "#000000",
      sku: "",
      barcode: "",
      price: 650,
      sale_price: "",
      stock: 100,
    },
  ];
  const ws = XLSX.utils.json_to_sheet(examples, { header: headers });
  // Widen columns for readability
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 2, 14) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=bman-import-template.xlsx",
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.send(buffer);
};

// @desc    Bulk-import products from xlsx
// @route   POST /api/products/import
const importProducts = async (req, res, next) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });

    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    if (!rows.length)
      return res
        .status(400)
        .json({ success: false, message: "Excel file is empty" });

    const results = {
      productsCreated: 0,
      productsUpdated: 0,
      variantsCreated: 0,
      skipped: 0,
      errors: [],
    };
    const VALID_GENDERS = ["men", "women", "unisex"];
    const VALID_FITS = ["slim", "regular", "relaxed", "oversized"];
    const VALID_STATUSES = ["active", "draft", "archived"];

    // Group rows by product name so multiple rows = multiple variants
    const productGroups = {};
    for (const row of rows) {
      const name = String(row.name || row.Name || "").trim();
      if (!name) {
        results.errors.push("Skipped row: missing product name");
        results.skipped++;
        continue;
      }
      if (!productGroups[name]) productGroups[name] = [];
      productGroups[name].push(row);
    }

    for (const [productName, productRows] of Object.entries(productGroups)) {
      try {
        const firstRow = productRows[0];
        const rawCategory = String(
          firstRow.category || firstRow.Category || "",
        ).trim();
        if (!rawCategory) {
          results.errors.push(`"${productName}": no category — skipped`);
          results.skipped += productRows.length;
          continue;
        }

        // Category path: split on "_" to support parent_child_grandchild hierarchy.
        // e.g. "T-Shirt_Regular" → parent: T-Shirt, leaf: Regular
        const categorySegments = rawCategory
          .split("_")
          .map((s) => s.trim())
          .filter(Boolean);

        let category = null;
        let parentId = null;
        for (const segment of categorySegments) {
          const query = { name: new RegExp(`^${segment}$`, "i") };
          if (parentId) query.parent = parentId;
          let cat = await Category.findOne(query);
          if (!cat) {
            const data = { name: segment };
            if (parentId) data.parent = parentId;
            cat = await Category.create(data);
          }
          parentId = cat._id;
          category = cat;
        }

        // Find or create product
        let product = await Product.findOne({
          name: new RegExp(`^${productName}$`, "i"),
        });
        if (!product) {
          const tags = String(firstRow.tags || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
          product = await Product.create({
            name: productName,
            description: String(firstRow.description || "").trim(),
            category: category._id,
            brand: String(firstRow.brand || "BMAN").trim(),
            gender: VALID_GENDERS.includes(
              String(firstRow.gender).toLowerCase(),
            )
              ? String(firstRow.gender).toLowerCase()
              : "men",
            tags,
            fabric: String(firstRow.fabric || "").trim(),
            fit: VALID_FITS.includes(String(firstRow.fit).toLowerCase())
              ? String(firstRow.fit).toLowerCase()
              : undefined,
            isFeatured: String(firstRow.featured).toLowerCase() === "true",
            isNewArrival: String(firstRow.new_arrival).toLowerCase() === "true",
            isTrending: String(firstRow.trending).toLowerCase() === "true",
            status: VALID_STATUSES.includes(
              String(firstRow.status).toLowerCase(),
            )
              ? String(firstRow.status).toLowerCase()
              : "active",
          });
          results.productsCreated++;
        } else {
          results.productsUpdated++;
        }

        // Create variants for this product
        const base = productName
          .substring(0, 4)
          .toUpperCase()
          .replace(/\s/g, "");
        for (const row of productRows) {
          const size = String(row.size || row.Size || "M").trim();
          const color = String(row.color || row.Color || "").trim();
          const price = Number(row.price || row.Price);

          if (!color || !price) {
            results.errors.push(
              `"${productName}": row missing color or price — skipped`,
            );
            results.skipped++;
            continue;
          }

          const rawSku = String(row.sku || row.SKU || "").trim();
          const sku =
            rawSku ||
            `${base}-${color.substring(0, 3).toUpperCase()}-${size}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;

          const exists = await ProductVariant.findOne({ sku });
          if (exists) {
            results.errors.push(`SKU "${sku}" already exists — skipped`);
            results.skipped++;
            continue;
          }

          const salePrice = Number(row.sale_price || row.discountPrice);
          await ProductVariant.create({
            product: product._id,
            size,
            color,
            colorHex: String(row.color_hex || row.colorHex || "#000000").trim(),
            sku,
            barcode: String(row.barcode || "").trim() || undefined,
            price,
            ...(salePrice && salePrice < price
              ? { discountPrice: salePrice }
              : {}),
            stock: Number(row.stock || row.Stock) || 0,
          });
          results.variantsCreated++;
        }
      } catch (err) {
        results.errors.push(`"${productName}": ${err.message}`);
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  getImportTemplate,
  importProducts,
};
