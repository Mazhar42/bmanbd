const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");
const Category = require("../models/Category");

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
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
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
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: "archived" },
      { new: true },
    );
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Product archived" });
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

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant,
};
