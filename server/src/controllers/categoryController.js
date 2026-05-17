const Category = require("../models/Category");

// ─── Utility ──────────────────────────────────────────────────
/**
 * Build a nested tree from a flat Category document array.
 * Each node gets a `children` array containing its direct children.
 */
const buildTree = (flatList) => {
  const map = {};
  const roots = [];

  flatList.forEach((cat) => {
    map[cat._id.toString()] = { ...cat.toObject(), children: [] };
  });

  flatList.forEach((cat) => {
    const parentId =
      cat.parent?._id?.toString() || cat.parent?.toString() || null;
    if (parentId && map[parentId]) {
      map[parentId].children.push(map[cat._id.toString()]);
    } else {
      roots.push(map[cat._id.toString()]);
    }
  });

  return roots;
};

// ─── Handlers ─────────────────────────────────────────────────
const getCategoryTree = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate("parent", "name slug")
      .sort("sortOrder");
    const tree = buildTree(categories);
    res.json({ success: true, tree });
  } catch (err) {
    next(err);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate("parent", "name slug")
      .sort("sortOrder");
    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
};

const getCategory = async (req, res, next) => {
  try {
    const { slugOrId } = req.params;
    const filter = slugOrId.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: slugOrId }
      : { slug: slugOrId };
    const category = await Category.findOne(filter).populate(
      "parent",
      "name slug",
    );
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    res.json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    res.json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    await Category.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: "Category deactivated" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCategoryTree,
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
