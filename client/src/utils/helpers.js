export const formatPrice = (amount) =>
  `৳${Number(amount).toLocaleString("en-BD")}`;

export const getDiscountPercent = (price, discountPrice) => {
  if (!discountPrice || discountPrice >= price) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
};

export const truncate = (str, n = 60) =>
  str?.length > n ? `${str.slice(0, n)}...` : str;

export const slugify = (str) =>
  str
    ?.toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "") || "";

export const getStockStatus = (stock) => {
  if (stock === 0) return { label: "Out of Stock", color: "text-red-500" };
  if (stock < 10)
    return { label: `Only ${stock} left`, color: "text-amber-500" };
  return { label: "In Stock", color: "text-green-600 dark:text-green-400" };
};

/**
 * Build a nested category tree from a flat array of category objects.
 * Each category object should have `_id` and optionally `parent._id`.
 */
export const buildCategoryTree = (flatList = []) => {
  const map = {};
  const roots = [];

  flatList.forEach((cat) => {
    map[cat._id] = { ...cat, children: [] };
  });

  flatList.forEach((cat) => {
    const parentId = cat.parent?._id || cat.parent || null;
    if (parentId && map[parentId]) {
      map[parentId].children.push(map[cat._id]);
    } else {
      roots.push(map[cat._id]);
    }
  });

  return roots;
};

/**
 * Flatten a category tree into an ordered array with depth info.
 * Useful for rendering indented <select> options.
 * Returns: [{ _id, name, slug, depth, ... }, ...]
 */
export const flattenCategoryForSelect = (tree, depth = 0, result = []) => {
  tree.forEach((node) => {
    result.push({ ...node, depth });
    if (node.children?.length) {
      flattenCategoryForSelect(node.children, depth + 1, result);
    }
  });
  return result;
};

export const groupVariantsByColor = (variants = []) => {
  return variants.reduce((acc, v) => {
    const key = v.color;
    if (!acc[key])
      acc[key] = { color: v.color, colorHex: v.colorHex, sizes: [] };
    acc[key].sizes.push({
      size: v.size,
      stock: v.stock,
      variantId: v._id,
      price: v.price,
      discountPrice: v.discountPrice,
    });
    return acc;
  }, {});
};

export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
