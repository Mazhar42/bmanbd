const ProductVariant = require("../models/ProductVariant");
const InventoryTransaction = require("../models/InventoryTransaction");
const Product = require("../models/Product");

// @desc    Get inventory overview (all variants with stock)
// @route   GET /api/inventory
const getInventory = async (req, res, next) => {
  try {
    const { lowStock, category, search, page = 1, limit = 20, minStock, maxStock } = req.query;
    const LOW_STOCK_THRESHOLD = 10;

    let variantFilter = { isActive: true };

    // Stock level filtering
    if (minStock !== undefined) {
      variantFilter.stock = { ...variantFilter.stock, $gte: Number(minStock) };
    }
    if (maxStock !== undefined) {
      variantFilter.stock = { ...variantFilter.stock, $lte: Number(maxStock) };
    }
    if (lowStock === "true") {
      variantFilter.stock = { ...variantFilter.stock, $lt: LOW_STOCK_THRESHOLD };
    }

    // Product-based filtering (Category, Search, Status)
    let productQuery = { status: { $ne: "archived" } };
    if (category) productQuery.category = category;

    if (search) {
      // Search by product name OR variant SKU
      const productsMatchingName = await Product.find({
        ...productQuery,
        name: { $regex: search, $options: "i" },
      }).select("_id");
      const productIds = productsMatchingName.map((p) => p._id);

      // If category is provided, we only want variants of products in that category
      let categoryProductIds = null;
      if (category) {
        const allProductsInCategory = await Product.find(productQuery).select("_id");
        categoryProductIds = allProductsInCategory.map((p) => p._id);
      }

      variantFilter.$and = [
        {
          $or: [
            { sku: { $regex: search, $options: "i" } },
            { product: { $in: productIds } },
          ],
        },
      ];

      if (categoryProductIds) {
        variantFilter.$and.push({ product: { $in: categoryProductIds } });
      } else {
        // Even without category, we only want variants of non-archived products
        const allActiveProducts = await Product.find({ status: { $ne: "archived" } }).select("_id");
        variantFilter.$and.push({ product: { $in: allActiveProducts.map(p => p._id) } });
      }
    } else {
      // No search, but may have category
      const productsToInclude = await Product.find(productQuery).select("_id");
      variantFilter.product = { $in: productsToInclude.map((p) => p._id) };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await ProductVariant.countDocuments(variantFilter);
    const variants = await ProductVariant.find(variantFilter)
      .populate({
        path: "product",
        populate: { path: "category", select: "name" },
      })
      .sort("product")
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      lowStockCount: await ProductVariant.countDocuments({
        stock: { $lt: LOW_STOCK_THRESHOLD },
        isActive: true,
      }),
      variants,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get inventory transactions
// @route   GET /api/inventory/transactions
const getTransactions = async (req, res, next) => {
  try {
    const { variant, type, source, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (variant) filter.variant = variant;
    if (type) filter.type = type;
    if (source) filter.source = source;

    const total = await InventoryTransaction.countDocuments(filter);
    const transactions = await InventoryTransaction.find(filter)
      .populate({
        path: "variant",
        populate: { path: "product", select: "name" },
      })
      .populate("createdBy", "name")
      .sort("-createdAt")
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      transactions,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Adjust stock manually (admin)
// @route   POST /api/inventory/adjust
const adjustStock = async (req, res, next) => {
  try {
    const { variantId, quantity, type = "adjustment", note } = req.body;
    const variant = await ProductVariant.findById(variantId);
    if (!variant)
      return res
        .status(404)
        .json({ success: false, message: "Variant not found" });

    const before = variant.stock;
    variant.stock = Math.max(0, variant.stock + Number(quantity));
    await variant.save();

    await InventoryTransaction.create({
      variant: variantId,
      type,
      quantity: Number(quantity),
      stockBefore: before,
      stockAfter: variant.stock,
      source: "admin",
      note,
      createdBy: req.user._id,
    });

    res.json({ success: true, variant, message: "Stock adjusted" });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk purchase / restock
// @route   POST /api/inventory/purchase
const purchaseStock = async (req, res, next) => {
  try {
    const { items, note } = req.body; // items: [{ variantId, quantity }]
    const results = [];
    for (const item of items) {
      const variant = await ProductVariant.findById(item.variantId);
      if (!variant) continue;
      const before = variant.stock;
      variant.stock += Number(item.quantity);
      await variant.save();
      await InventoryTransaction.create({
        variant: item.variantId,
        type: "purchase",
        quantity: Number(item.quantity),
        stockBefore: before,
        stockAfter: variant.stock,
        source: "admin",
        note,
        createdBy: req.user._id,
      });
      results.push({ variantId: item.variantId, newStock: variant.stock });
    }
    res.json({ success: true, results, message: "Stock updated" });
  } catch (err) {
    next(err);
  }
};

// @desc    Get low stock alerts
// @route   GET /api/inventory/alerts
const getAlerts = async (req, res, next) => {
  try {
    const LOW_STOCK_THRESHOLD = 10;
    const variants = await ProductVariant.find({
      stock: { $lt: LOW_STOCK_THRESHOLD },
      isActive: true,
    }).populate({
      path: "product",
      select: "name images category",
      populate: { path: "category", select: "name" },
    });

    const lowStock = variants.filter((v) => v.stock > 0).length;
    const outOfStock = variants.filter((v) => v.stock === 0).length;

    res.json({
      success: true,
      count: variants.length,
      lowStock,
      outOfStock,
      alerts: variants.map((v) => ({
        sku: v.sku,
        product: v.product?.name,
        category: v.product?.category?.name,
        size: v.size,
        color: v.color,
        stock: v.stock,
        isOutOfStock: v.stock === 0,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get inventory stats for dashboard
// @route   GET /api/inventory/stats
const getStats = async (req, res, next) => {
  try {
    const totalVariants = await ProductVariant.countDocuments({
      isActive: true,
    });
    const totalStock = await ProductVariant.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: "$stock" } } },
    ]);
    const outOfStock = await ProductVariant.countDocuments({
      isActive: true,
      stock: 0,
    });
    const lowStock = await ProductVariant.countDocuments({
      isActive: true,
      stock: { $gt: 0, $lt: 10 },
    });

    // Recent transactions
    const recentActivity = await InventoryTransaction.find()
      .sort("-createdAt")
      .limit(5)
      .populate({
        path: "variant",
        populate: { path: "product", select: "name" },
      });

    res.json({
      success: true,
      stats: {
        totalVariants,
        totalStock: totalStock[0]?.total || 0,
        outOfStock,
        lowStock,
      },
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInventory,
  getTransactions,
  adjustStock,
  purchaseStock,
  getAlerts,
  getStats,
};
