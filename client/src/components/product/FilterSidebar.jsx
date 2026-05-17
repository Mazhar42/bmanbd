import { useState } from "react";
import { ChevronDown, ChevronUp, ChevronRight, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { categoryApi } from "../../services/api";

const SIZES = ["S", "M", "L", "XL", "XXL"];
const FITS = ["slim", "regular", "relaxed", "oversized"];
const FABRICS = [
  "Cotton",
  "Oxford Cotton",
  "Linen",
  "Canvas",
  "Cotton Silk",
  "Stretch Cotton",
];
const PRICE_RANGES = [
  { label: "Under ৳1000", min: 0, max: 999 },
  { label: "৳1000 – ৳1500", min: 1000, max: 1500 },
  { label: "৳1500 – ৳2000", min: 1500, max: 2000 },
  { label: "Above ৳2000", min: 2001, max: 99999 },
];

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-3"
      >
        <span className="text-xs font-semibold tracking-widest uppercase text-gray-600 dark:text-gray-300">
          {title}
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && children}
    </div>
  );
}

function CategoryTree({ allCats, filters, onChange }) {
  const [expanded, setExpanded] = useState({});

  // Build tree: find root (no parent), then level-1 (children of root)
  const getParentId = (cat) =>
    cat.parent
      ? typeof cat.parent === "object"
        ? (cat.parent._id || cat.parent).toString()
        : cat.parent.toString()
      : null;

  const getChildren = (parentId) =>
    allCats.filter((c) => getParentId(c) === parentId);

  const roots = allCats.filter((c) => !c.parent);
  // Prefer level-1 categories under root; fallback to roots when needed.
  const level1 = roots.flatMap((r) => {
    const children = getChildren(r._id.toString());
    return children.length > 0 ? children : [r];
  });

  const activeSlug = filters.category;

  const isSelected = (cat) => activeSlug === cat.slug;

  // Check if any descendant is selected (to auto-expand parent)
  const hasActiveDescendant = (cat) => {
    const children = getChildren(cat._id.toString());
    return children.some((c) => isSelected(c) || hasActiveDescendant(c));
  };

  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const selectCategory = (cat) => {
    const current = filters.category;
    onChange({
      ...filters,
      category: current === cat.slug ? undefined : cat.slug,
    });
  };

  const renderNode = (cat, depth = 0) => {
    const children = getChildren(cat._id.toString());
    const hasChildren = children.length > 0;
    const isOpen =
      expanded[cat._id] !== undefined
        ? expanded[cat._id]
        : depth === 0 || hasActiveDescendant(cat); // parent groups open by default
    const active = isSelected(cat);

    return (
      <div key={cat._id}>
        <div
          className="flex items-center gap-1.5 py-1 rounded cursor-pointer group"
          style={{ paddingLeft: depth * 12 }}
        >
          {/* Expand/collapse chevron */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(cat._id)}
              className="text-gray-400 hover:text-accent flex-shrink-0"
            >
              {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          ) : (
            <span className="w-[13px] flex-shrink-0" />
          )}
          {/* Label */}
          <button
            onClick={() => selectCategory(cat)}
            className={`text-sm text-left flex-1 transition-colors ${
              active
                ? "font-semibold text-accent"
                : "text-gray-600 dark:text-gray-300 group-hover:text-accent"
            }`}
          >
            {cat.name}
          </button>
          {active && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
          )}
        </div>
        {hasChildren && isOpen && (
          <div
            className="ml-1 border-l border-gray-200 dark:border-gray-700"
            style={{ marginLeft: depth * 8 + 4 }}
          >
            {children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-0.5">{level1.map((cat) => renderNode(cat))}</div>
  );
}

export default function FilterSidebar({ filters, onChange, onClear }) {
  const { data: catData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.getAll().then((r) => r.data.categories),
  });

  const allCats = catData || [];

  const toggle = (key, value) => {
    onChange({ ...filters, [key]: filters[key] === value ? undefined : value });
  };

  const hasFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== "",
  );

  // Active price range check: URL params are strings, compare as numbers
  const activePriceRange = PRICE_RANGES.find(
    (r) =>
      Number(filters.minPrice) === r.min && Number(filters.maxPrice) === r.max,
  );

  return (
    <div className="w-56 flex-shrink-0">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-semibold tracking-widest uppercase">
          Filters
        </h3>
        {hasFilters && (
          <button
            onClick={onClear}
            className="text-xs text-accent hover:underline flex items-center gap-1"
          >
            <X size={12} /> Clear All
          </button>
        )}
      </div>

      {/* Category */}
      <FilterSection title="Category">
        {allCats.length > 0 ? (
          <CategoryTree
            allCats={allCats}
            filters={filters}
            onChange={onChange}
          />
        ) : (
          <p className="text-xs text-gray-400">Loading…</p>
        )}
      </FilterSection>

      {/* Price */}
      <FilterSection title="Price">
        <div className="space-y-2">
          {PRICE_RANGES.map((range) => (
            <label
              key={range.label}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="radio"
                name="priceRange"
                checked={activePriceRange?.label === range.label}
                onChange={() => {
                  if (activePriceRange?.label === range.label) {
                    onChange({
                      ...filters,
                      minPrice: undefined,
                      maxPrice: undefined,
                    });
                  } else {
                    onChange({
                      ...filters,
                      minPrice: range.min,
                      maxPrice: range.max,
                    });
                  }
                }}
                className="accent-accent"
              />
              <span
                className={`text-sm transition-colors ${
                  activePriceRange?.label === range.label
                    ? "text-accent font-medium"
                    : "text-gray-600 dark:text-gray-300 group-hover:text-accent"
                }`}
              >
                {range.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Size */}
      <FilterSection title="Size">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => toggle("size", size)}
              className={`w-10 h-10 text-xs font-medium border transition-all ${
                filters.size === size
                  ? "bg-brand dark:bg-white text-white dark:text-brand border-brand dark:border-white"
                  : "border-gray-200 dark:border-gray-600 hover:border-accent hover:text-accent"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Fit */}
      <FilterSection title="Fit">
        <div className="space-y-2">
          {FITS.map((fit) => (
            <label
              key={fit}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="radio"
                name="fitFilter"
                checked={filters.fit === fit}
                onChange={() => toggle("fit", fit)}
                className="accent-accent"
              />
              <span
                className={`text-sm capitalize transition-colors ${
                  filters.fit === fit
                    ? "text-accent font-medium"
                    : "text-gray-600 dark:text-gray-300 group-hover:text-accent"
                }`}
              >
                {fit}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Fabric */}
      <FilterSection title="Fabric" defaultOpen={false}>
        <div className="space-y-2">
          {FABRICS.map((fabric) => (
            <label
              key={fabric}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="radio"
                name="fabricFilter"
                checked={filters.fabric === fabric}
                onChange={() => toggle("fabric", fabric)}
                className="accent-accent"
              />
              <span
                className={`text-sm transition-colors ${
                  filters.fabric === fabric
                    ? "text-accent font-medium"
                    : "text-gray-600 dark:text-gray-300 group-hover:text-accent"
                }`}
              >
                {fabric}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability" defaultOpen={false}>
        <div className="space-y-2">
          {[
            { label: "New Arrivals", key: "isNewArrival" },
            { label: "Trending", key: "isTrending" },
            { label: "Featured", key: "isFeatured" },
          ].map(({ label, key }) => (
            <label
              key={key}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={filters[key] === "true"}
                onChange={() => toggle(key, "true")}
                className="accent-accent"
              />
              <span
                className={`text-sm transition-colors ${
                  filters[key] === "true"
                    ? "text-accent font-medium"
                    : "text-gray-600 dark:text-gray-300 group-hover:text-accent"
                }`}
              >
                {label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
}
