import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, Grid3X3, Grid2X2, X } from "lucide-react";
import { productApi } from "../services/api";
import ProductCard from "../components/product/ProductCard";
import FilterSidebar from "../components/product/FilterSidebar";
import LoadingSpinner from "../components/common/LoadingSpinner";

const SORT_OPTIONS = [
  { label: "Newest First", value: "-createdAt" },
  { label: "Price: Low to High", value: "price" },
  { label: "Price: High to Low", value: "-price" },
  { label: "Most Popular", value: "-reviewCount" },
];

const FILTER_KEYS = [
  "category",
  "search",
  "isNewArrival",
  "isTrending",
  "isFeatured",
  "minPrice",
  "maxPrice",
  "size",
  "fit",
  "fabric",
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [gridCols, setGridCols] = useState(3);

  // Derive filters and pagination directly from the URL — single source of truth
  const filters = Object.fromEntries(
    FILTER_KEYS.map((k) => [k, searchParams.get(k) || undefined]).filter(
      ([, v]) => v !== undefined,
    ),
  );
  const sort = searchParams.get("sort") || "-createdAt";
  const page = Number(searchParams.get("page") || 1);

  const updateParams = (updates) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") {
          next.delete(k);
        } else {
          next.set(k, String(v));
        }
      });
      // Reset page whenever any filter changes (except page itself)
      if (!("page" in updates)) next.set("page", "1");
      return next;
    });
  };

  const handleFiltersChange = (newFilters) => {
    // Build a diff: clear removed keys, set new/changed ones
    const updates = {};
    FILTER_KEYS.forEach((k) => {
      updates[k] = newFilters[k] ?? undefined;
    });
    updateParams(updates);
  };

  const handleClearFilters = () => {
    setSearchParams({});
  };

  const queryParams = {
    ...filters,
    sort,
    page,
    limit: 12,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["products", queryParams],
    queryFn: () => productApi.getAll(queryParams).then((r) => r.data),
    keepPreviousData: true,
  });

  const activeFilterCount = Object.keys(filters).length;

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="section-title">Shop</h1>
          {data && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {data.total} products found
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="input py-2 text-sm flex-1 sm:flex-none sm:w-auto min-w-0"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Grid toggle */}
          <div className="hidden md:flex border border-gray-200 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => setGridCols(3)}
              className={`p-2 transition-colors ${gridCols === 3 ? "bg-brand text-white" : "hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              aria-label="3 columns"
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setGridCols(2)}
              className={`p-2 transition-colors ${gridCols === 2 ? "bg-brand text-white" : "hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              aria-label="2 columns"
            >
              <Grid2X2 size={16} />
            </button>
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 text-sm border px-3 py-2 transition-colors ${
              showFilters
                ? "border-accent text-accent"
                : "border-gray-200 dark:border-gray-600 hover:border-accent"
            }`}
          >
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active filters chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(filters).map(([key, val]) =>
            val !== undefined ? (
              <span
                key={key}
                className="inline-flex items-center gap-1 bg-brand-light dark:bg-gray-800 text-xs px-3 py-1.5"
              >
                {key}: {String(val)}
                <button
                  onClick={() => updateParams({ [key]: undefined })}
                  className="hover:text-red-500 ml-1"
                >
                  <X size={11} />
                </button>
              </span>
            ) : null,
          )}
          <button
            onClick={handleClearFilters}
            className="text-xs text-accent hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Mobile filter drawer (right slide-in) */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.28 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-white dark:bg-gray-900 z-50 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-700">
                <span className="text-xs font-semibold tracking-widest uppercase">
                  Filters
                </span>
                <button
                  onClick={() => setShowFilters(false)}
                  aria-label="Close filters"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <FilterSidebar
                  filters={filters}
                  onChange={(f) => {
                    handleFiltersChange(f);
                  }}
                  onClear={() => {
                    handleClearFilters();
                    setShowFilters(false);
                  }}
                />
              </div>
              <div className="px-5 py-4 border-t dark:border-gray-700">
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full btn-primary text-sm py-3"
                >
                  Show Results
                  {activeFilterCount > 0 && (
                    <span className="ml-2 bg-white/20 rounded-full px-2 py-0.5 text-xs">
                      {activeFilterCount} active
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex gap-8">
        {/* Filter sidebar — desktop only inline */}
        {showFilters && (
          <aside className="hidden md:block">
            <FilterSidebar
              filters={filters}
              onChange={handleFiltersChange}
              onClear={handleClearFilters}
            />
          </aside>
        )}

        {/* Product grid */}
        <div className="flex-1">
          {isLoading ? (
            <LoadingSpinner className="py-32" />
          ) : data?.products?.length === 0 ? (
            <div className="text-center py-32">
              <p className="text-gray-400 mb-4">
                No products found matching your filters.
              </p>
              <button
                onClick={handleClearFilters}
                className="btn-outline text-sm"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div
                className={`grid gap-x-5 gap-y-10 ${
                  gridCols === 2 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {data?.products?.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {data?.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                  <button
                    disabled={page <= 1}
                    onClick={() => updateParams({ page: page - 1 })}
                    className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 hover:border-accent transition-colors disabled:opacity-40"
                  >
                    Previous
                  </button>
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => updateParams({ page: p })}
                        className={`w-9 h-9 text-sm transition-all ${
                          p === page
                            ? "bg-brand dark:bg-white text-white dark:text-brand"
                            : "border border-gray-200 dark:border-gray-600 hover:border-accent"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    disabled={page >= data.totalPages}
                    onClick={() => updateParams({ page: page + 1 })}
                    className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 hover:border-accent transition-colors disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
