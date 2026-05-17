import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Copy,
  Star,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { productApi, categoryApi } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  formatPrice,
  buildCategoryTree,
  flattenCategoryForSelect,
} from "../../utils/helpers";

const EMPTY_PRODUCT = {
  name: "",
  description: "",
  category: "",
  gender: "unisex",
  fabric: "",
  fit: "regular",
  tags: "",
  isFeatured: false,
  isNewArrival: false,
  isTrending: false,
};

const EMPTY_VARIANT = {
  size: "M",
  color: "",
  colorHex: "#000000",
  sku: "",
  price: "",
  discountPrice: "",
  stock: "",
};

function VariantRow({ variant, onUpdate, onDelete, onDuplicate }) {
  return (
    <tr className="text-xs border-b dark:border-gray-700">
      <td className="py-2 pr-2">
        <select
          value={variant.size}
          onChange={(e) => onUpdate({ ...variant, size: e.target.value })}
          className="input py-1 text-xs"
        >
          {["XS", "S", "M", "L", "XL", "XXL"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2 pr-2">
        <input
          value={variant.color}
          onChange={(e) => onUpdate({ ...variant, color: e.target.value })}
          placeholder="Color name"
          className="input py-1 text-xs w-24"
        />
      </td>
      <td className="py-2 pr-2">
        <input
          type="color"
          value={variant.colorHex}
          onChange={(e) => onUpdate({ ...variant, colorHex: e.target.value })}
          className="w-8 h-8 rounded cursor-pointer border border-gray-300"
        />
      </td>
      <td className="py-2 pr-2">
        <input
          value={variant.sku}
          onChange={(e) => onUpdate({ ...variant, sku: e.target.value })}
          placeholder="SKU"
          className="input py-1 text-xs w-24"
        />
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          value={variant.price}
          onChange={(e) => onUpdate({ ...variant, price: e.target.value })}
          placeholder="Price"
          className="input py-1 text-xs w-20"
        />
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          value={variant.discountPrice}
          onChange={(e) =>
            onUpdate({ ...variant, discountPrice: e.target.value })
          }
          placeholder="Sale"
          className="input py-1 text-xs w-20"
        />
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          value={variant.stock}
          onChange={(e) => onUpdate({ ...variant, stock: e.target.value })}
          placeholder="Stock"
          className="input py-1 text-xs w-16"
        />
      </td>
      <td className="py-2 pl-1 flex items-center gap-1.5">
        <button
          onClick={onDuplicate}
          title="Duplicate row"
          className="text-gray-400 hover:text-accent transition-colors"
        >
          <Copy size={13} />
        </button>
        <button
          onClick={onDelete}
          title="Delete row"
          className="text-red-400 hover:text-red-600 transition-colors"
        >
          <X size={14} />
        </button>
      </td>
    </tr>
  );
}

function ProductModal({ product, categories, onClose, mode }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(product || EMPTY_PRODUCT);
  const [variants, setVariants] = useState(
    product?.variants || [{ ...EMPTY_VARIANT, id: Date.now() }],
  );

  // Build hierarchical flat list for the category <select>
  const categoryOptions = useMemo(() => {
    if (!categories?.length) return [];
    const tree = buildCategoryTree(categories);
    return flattenCategoryForSelect(tree);
  }, [categories]);

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await productApi.create({
        ...form,
        tags: form.tags?.split(",").map((t) => t.trim()),
      });
      const productId = res.data?.product?._id;

      if (!productId) {
        throw new Error("Created product id missing from API response");
      }

      const base = form.name.substring(0, 4).toUpperCase().replace(/\s/g, "");
      let skuIdx = 0;
      for (const v of variants) {
        if (v.color && v.price) {
          skuIdx += 1;
          // Auto-generate a unique SKU if the user left it blank
          const autoSku =
            v.sku ||
            `${base}-${v.color.substring(0, 3).toUpperCase().replace(/\s/g, "")}-${v.size}-${Date.now()}-${skuIdx}`;
          const payload = {
            size: v.size,
            color: v.color,
            colorHex: v.colorHex,
            sku: autoSku,
            price: Number(v.price),
            stock: Number(v.stock) || 0,
          };
          // Only include discountPrice if the user actually entered a value
          if (v.discountPrice !== "" && v.discountPrice != null) {
            payload.discountPrice = Number(v.discountPrice);
          }
          await productApi.createVariant(productId, payload);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries(["adminProducts"]);
      toast.success("Product created");
      onClose();
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Error creating product"),
  });

  const updateMut = useMutation({
    mutationFn: () =>
      productApi.update(product._id, {
        ...form,
        tags:
          typeof form.tags === "string"
            ? form.tags.split(",").map((t) => t.trim())
            : form.tags,
      }),
    onSuccess: () => {
      qc.invalidateQueries(["adminProducts"]);
      toast.success("Product updated");
      onClose();
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Error updating product"),
  });

  const handleSave = () =>
    mode === "create" ? createMut.mutate() : updateMut.mutate();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl my-8 shadow-2xl"
      >
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <h2 className="font-bold text-lg">
            {mode === "create" ? "Add Product" : "Edit Product"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1">
                Product Name *
              </label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Premium Cotton Oxford Shirt"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Category *
              </label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Select category</option>
                {categoryOptions.map((c) => (
                  <option key={c._id} value={c._id}>
                    {"\u2014".repeat(c.depth)}
                    {c.depth > 0 ? " " : ""}
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Gender</label>
              <select
                className="input"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                {["men", "women", "unisex", "kids"].map((g) => (
                  <option key={g} value={g} className="capitalize">
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Fabric</label>
              <input
                className="input"
                value={form.fabric}
                onChange={(e) => setForm({ ...form, fabric: e.target.value })}
                placeholder="e.g. 100% Cotton"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Fit</label>
              <select
                className="input"
                value={form.fit}
                onChange={(e) => setForm({ ...form, fit: e.target.value })}
              >
                {["slim", "regular", "relaxed", "oversized"].map((f) => (
                  <option key={f} value={f} className="capitalize">
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1">
                Description
              </label>
              <textarea
                className="input resize-none h-24"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1">
                Tags (comma-separated)
              </label>
              <input
                className="input"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="casual, summer, bestseller"
              />
            </div>
          </div>

          {/* Flags */}
          <div className="flex gap-4 flex-wrap">
            {[
              { key: "isFeatured", icon: Star, label: "Featured" },
              { key: "isNewArrival", icon: Sparkles, label: "New Arrival" },
              { key: "isTrending", icon: Zap, label: "Trending" },
            ].map(({ key, icon: Icon, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer select-none text-sm"
              >
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) =>
                    setForm({ ...form, [key]: e.target.checked })
                  }
                  className="w-4 h-4 accent-accent"
                />
                <Icon size={14} />
                {label}
              </label>
            ))}
          </div>

          {/* Variants table (create mode only) */}
          {mode === "create" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold">Variants</label>
                <button
                  onClick={() =>
                    setVariants([
                      ...variants,
                      { ...EMPTY_VARIANT, id: Date.now() },
                    ])
                  }
                  className="text-xs text-accent hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Add Row
                </button>
              </div>
              <div className="overflow-x-auto rounded border dark:border-gray-700">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 uppercase">
                      {[
                        "Size",
                        "Color",
                        "Hex",
                        "SKU",
                        "Price",
                        "Sale",
                        "Stock",
                        "",
                      ].map((h) => (
                        <th key={h} className="text-left py-2 pr-2 pl-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, i) => (
                      <VariantRow
                        key={v.id || i}
                        variant={v}
                        onUpdate={(updated) =>
                          setVariants(
                            variants.map((x, j) => (j === i ? updated : x)),
                          )
                        }
                        onDuplicate={() =>
                          setVariants([
                            ...variants.slice(0, i + 1),
                            { ...v, id: Date.now(), sku: "" },
                            ...variants.slice(i + 1),
                          ])
                        }
                        onDelete={() =>
                          setVariants(variants.filter((_, j) => j !== i))
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} className="btn-outline text-sm">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={createMut.isPending || updateMut.isPending}
            className="btn-primary text-sm"
          >
            {createMut.isPending || updateMut.isPending
              ? "Saving…"
              : "Save Product"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(null); // null | { mode, product? }
  const [expanded, setExpanded] = useState(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["adminProducts", search, categoryFilter, statusFilter],
    queryFn: () =>
      productApi
        .getAll({
          search,
          category: categoryFilter,
          // empty = "All status" → send 'all' so backend returns every status
          status: statusFilter || "all",
          limit: 50,
        })
        .then((r) => r.data.products),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.getAll().then((r) => r.data.categories),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => productApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries(["adminProducts"]);
      toast.success("Product archived");
    },
    onError: () => toast.error("Could not delete product"),
  });

  const toggleFlag = useMutation({
    mutationFn: ({ id, field, value }) =>
      productApi.update(id, { [field]: value }),
    onSuccess: () => qc.invalidateQueries(["adminProducts"]),
  });

  // Build hierarchical options for the category filter bar
  const categoryFilterOptions = useMemo(() => {
    if (!categories?.length) return [];
    const tree = buildCategoryTree(categories);
    return flattenCategoryForSelect(tree);
  }, [categories]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Products
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {products?.length || 0} products
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: "create" })}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            className="input pl-9 text-sm"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input text-sm w-44"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All categories</option>
          {categoryFilterOptions.map((c) => (
            <option key={c._id} value={c._id}>
              {"\u2014".repeat(c.depth)}
              {c.depth > 0 ? " " : ""}
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="input text-sm w-36"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : (
        <div className="card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                {[
                  "Product",
                  "Category",
                  "Stock",
                  "Tags",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold tracking-widest uppercase text-gray-400 px-4 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {products?.map((p) => (
                <>
                  <tr
                    key={p._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer"
                    onClick={() =>
                      setExpanded(expanded === p._id ? null : p._id)
                    }
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {expanded === p._id ? (
                          <ChevronUp size={14} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={14} className="text-gray-400" />
                        )}
                        <div>
                          <p className="font-medium line-clamp-1">{p.name}</p>
                          <p className="text-xs text-gray-400 capitalize">
                            {p.gender} · {p.fit}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize">
                      {p.category?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          (p.totalStock || 0) === 0
                            ? "bg-red-100 text-red-600"
                            : (p.totalStock || 0) < 10
                              ? "bg-amber-100 text-amber-600"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {p.totalStock || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {p.isFeatured && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFlag.mutate({
                                id: p._id,
                                field: "isFeatured",
                                value: false,
                              });
                            }}
                            title="Unmark featured"
                            className="text-accent"
                          >
                            <Star size={14} fill="currentColor" />
                          </button>
                        )}
                        {p.isNewArrival && (
                          <Sparkles size={14} className="text-blue-400" />
                        )}
                        {p.isTrending && (
                          <Zap size={14} className="text-purple-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${
                          p.status === "active"
                            ? "bg-green-100 text-green-700"
                            : p.status === "draft"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setModal({ mode: "edit", product: p })}
                          className="text-gray-400 hover:text-accent transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Archive this product?"))
                              deleteMut.mutate(p._id);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === p._id && (
                    <tr
                      key={`${p._id}-exp`}
                      className="bg-gray-50 dark:bg-gray-800/30"
                    >
                      <td colSpan={6} className="px-4 py-3">
                        <p className="text-xs text-gray-500 mb-2">
                          Variants — {p.variants?.length || 0} total
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {p.variants?.map((v) => (
                            <div
                              key={v._id}
                              className="text-xs bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg px-3 py-2"
                            >
                              <p className="font-semibold">
                                {v.size} / {v.color}
                              </p>
                              <p>
                                {formatPrice(v.effectivePrice || v.price)}
                                {v.discountPrice ? (
                                  <span className="text-red-400 ml-1 line-through text-[10px]">
                                    {formatPrice(v.price)}
                                  </span>
                                ) : (
                                  ""
                                )}
                              </p>
                              <p className="text-gray-400">Stock: {v.stock}</p>
                            </div>
                          ))}
                          {!p.variants?.length && (
                            <p className="text-xs text-gray-400">No variants</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {!products?.length && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No products found
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <ProductModal
            key={modal.mode + (modal.product?._id || "")}
            mode={modal.mode}
            product={modal.product}
            categories={categories || []}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
