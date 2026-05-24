import { useState, useMemo, useRef } from "react";
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
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { productApi, categoryApi } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ConfirmModal from "../../components/admin/ConfirmModal";
import ImageUploader from "../../components/admin/ImageUploader";
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
  barcode: "",
  price: "",
  discountPrice: "",
  stock: "",
};

function VariantRow({ variant, onUpdate, onDelete, onDuplicate }) {
  return (
    <div className="grid grid-cols-12 gap-3 items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
      <div className="col-span-12 sm:col-span-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">
          Size
        </label>
        <select
          value={variant.size}
          onChange={(e) => onUpdate({ ...variant, size: e.target.value })}
          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
        >
          {["XS", "S", "M", "L", "XL", "XXL"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="col-span-6 sm:col-span-2 relative">
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">
          Color
        </label>
        <input
          value={variant.color}
          onChange={(e) => onUpdate({ ...variant, color: e.target.value })}
          placeholder="Name"
          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none pl-10"
        />
        <input
          type="color"
          value={variant.colorHex}
          onChange={(e) => onUpdate({ ...variant, colorHex: e.target.value })}
          className="w-5 h-5 rounded absolute left-3 top-7 cursor-pointer border-0 p-0 overflow-hidden"
        />
      </div>

      <div className="col-span-6 sm:col-span-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">
          SKU
        </label>
        <input
          value={variant.sku}
          onChange={(e) => onUpdate({ ...variant, sku: e.target.value })}
          placeholder="Auto"
          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
        />
      </div>

      <div className="col-span-6 sm:col-span-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">
          Barcode
        </label>
        <input
          value={variant.barcode || ""}
          onChange={(e) => onUpdate({ ...variant, barcode: e.target.value })}
          placeholder="Optional"
          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
        />
      </div>

      <div className="col-span-6 sm:col-span-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">
          Price
        </label>
        <input
          type="number"
          value={variant.price}
          onChange={(e) => onUpdate({ ...variant, price: e.target.value })}
          placeholder="0"
          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
        />
      </div>

      <div className="col-span-6 sm:col-span-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">
          Sale
        </label>
        <input
          type="number"
          value={variant.discountPrice}
          onChange={(e) =>
            onUpdate({ ...variant, discountPrice: e.target.value })
          }
          placeholder="0"
          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
        />
      </div>

      <div className="col-span-6 sm:col-span-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">
          Stock
        </label>
        <input
          type="number"
          value={variant.stock}
          onChange={(e) => onUpdate({ ...variant, stock: e.target.value })}
          placeholder="0"
          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
        />
      </div>

      <div className="col-span-12 sm:col-span-1 flex items-end justify-end gap-2 pb-1 sm:h-full sm:pb-0">
        <button
          onClick={onDuplicate}
          title="Duplicate variant"
          type="button"
          className="p-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl text-gray-400 hover:text-accent hover:border-accent/40 transition-all"
        >
          <Copy size={16} />
        </button>
        <button
          onClick={onDelete}
          title="Remove variant"
          type="button"
          className="p-2 border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-500/10 rounded-xl text-red-400 hover:text-red-500 transition-all"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

function ProductModal({ product, categories, onClose, mode }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(product || EMPTY_PRODUCT);
  const [variants, setVariants] = useState(
    product?.variants || [{ ...EMPTY_VARIANT, id: Date.now() }],
  );
  const [images, setImages] = useState(product?.images || []);
  const [deletedVariantIds, setDeletedVariantIds] = useState([]);

  const categoryOptions = useMemo(() => {
    if (!categories?.length) return [];
    const tree = buildCategoryTree(categories);
    return flattenCategoryForSelect(tree);
  }, [categories]);

  const createMut = useMutation({
    mutationFn: async () => {
      const payloadForm = {
        ...form,
        tags: form.tags?.split(",").map((t) => t.trim()),
        images,
      };
      const res = await productApi.create(payloadForm);
      const productId = res.data?.product?._id;

      if (!productId)
        throw new Error("Created product id missing from API response");

      const base = form.name.substring(0, 4).toUpperCase().replace(/\s/g, "");
      let skuIdx = 0;
      for (const v of variants) {
        if (v.color && v.price) {
          skuIdx += 1;
          const autoSku =
            v.sku ||
            `${base}-${v.color.substring(0, 3).toUpperCase()}-${v.size}-${Date.now()}-${skuIdx}`;
          const payload = {
            size: v.size,
            color: v.color,
            colorHex: v.colorHex,
            sku: autoSku,
            barcode: v.barcode,
            price: Number(v.price),
            stock: Number(v.stock) || 0,
          };
          if (v.discountPrice) payload.discountPrice = Number(v.discountPrice);
          await productApi.createVariant(productId, payload);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries(["adminProducts"]);
      toast.success("Product created!");
      onClose();
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Error creating product"),
  });

  const updateMut = useMutation({
    mutationFn: async () => {
      await productApi.update(product._id, {
        ...form,
        tags:
          typeof form.tags === "string"
            ? form.tags.split(",").map((t) => t.trim())
            : form.tags,
        images,
      });

      // Delete removed variants
      for (const vid of deletedVariantIds) {
        await productApi.deleteVariant(product._id, vid);
      }

      // Sync remaining variants
      const base = form.name.substring(0, 4).toUpperCase().replace(/\s/g, "");
      let skuIdx = 0;
      for (const v of variants) {
        if (!v.color || !v.price) continue;
        skuIdx += 1;
        const autoSku =
          v.sku ||
          `${base}-${v.color.substring(0, 3).toUpperCase()}-${v.size}-${Date.now()}-${skuIdx}`;
        const payload = {
          size: v.size,
          color: v.color,
          colorHex: v.colorHex,
          sku: autoSku,
          barcode: v.barcode,
          price: Number(v.price),
          stock: Number(v.stock) || 0,
        };
        if (v.discountPrice) payload.discountPrice = Number(v.discountPrice);

        if (v._id) {
          await productApi.updateVariant(product._id, v._id, payload);
        } else {
          await productApi.createVariant(product._id, payload);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries(["adminProducts"]);
      toast.success("Product updated!");
      onClose();
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Error updating product"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Product name is required");
    if (!form.category) return toast.error("Category is required");
    mode === "create" ? createMut.mutate() : updateMut.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-black/40 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden my-auto max-h-min"
      >
        <div className="relative px-8 pt-8 pb-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 border-b dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-semibold text-gray-900 dark:text-white">
                {mode === "create" ? "Create Product" : "Edit Product"}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {mode === "create"
                  ? "Add a new item to your store catalog"
                  : "Modify existing product details"}
              </p>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 max-h-[65vh] overflow-y-auto custom-scrollbar"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* General Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 border-b dark:border-gray-800 pb-2">
                Basic Info
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                  Product Name <span className="text-accent">*</span>
                </label>
                <input
                  required
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/20 outline-none"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Premium Cotton Shirt"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                  Category <span className="text-accent">*</span>
                </label>
                <select
                  required
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/20 outline-none appearance-none"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  <option value="">Select a category</option>
                  {categoryOptions.map((c) => (
                    <option key={c._id} value={c._id}>
                      {"\u2014".repeat(c.depth)}
                      {c.depth > 0 ? " " : ""}
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                    Gender
                  </label>
                  <select
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                    value={form.gender}
                    onChange={(e) =>
                      setForm({ ...form, gender: e.target.value })
                    }
                  >
                    {["men", "women", "unisex", "kids"].map((g) => (
                      <option key={g} value={g} className="capitalize">
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                    Fit
                  </label>
                  <select
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
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
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                  Fabric details
                </label>
                <input
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                  value={form.fabric}
                  onChange={(e) => setForm({ ...form, fabric: e.target.value })}
                  placeholder="100% Cotton"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                  Tags (Comma-separated)
                </label>
                <input
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="summer, casual, popular"
                />
              </div>
            </div>

            {/* Config & Variants */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 border-b dark:border-gray-800 pb-2">
                Description & Highlights
              </h3>

              <ImageUploader
                multiple
                folder="bman/products"
                label="Product Images"
                value={images}
                onChange={setImages}
              />

              <div className="space-y-1.5">
                <textarea
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3.5 text-sm h-32 resize-none focus:ring-2 focus:ring-accent/20 outline-none"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Tell us about the product..."
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    key: "isFeatured",
                    icon: Star,
                    label: "Featured Product",
                    desc: "Highlight on homepage",
                  },
                  {
                    key: "isNewArrival",
                    icon: Sparkles,
                    label: "New Arrival",
                    desc: "Show in new collections",
                  },
                  {
                    key: "isTrending",
                    icon: Zap,
                    label: "Trending",
                    desc: "Mark as highly popular",
                  },
                ].map(({ key, icon: Icon, label, desc }) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 cursor-pointer group"
                  >
                    <div className="flex gap-3 items-center">
                      <div
                        className={`p-2 rounded-lg ${form[key] ? "bg-accent/10 text-accent" : "bg-white dark:bg-gray-700 text-gray-400 group-hover:text-gray-600"}`}
                      >
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {label}
                        </p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </div>
                    <div className="relative inline-flex items-center">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={form[key]}
                        onChange={(e) =>
                          setForm({ ...form, [key]: e.target.checked })
                        }
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent cursor-pointer"></div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Variants section */}
          <div className="mt-10 space-y-4">
            <div className="flex items-center justify-between border-b dark:border-gray-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Product Variants
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {mode === "edit"
                    ? "Edit, add or remove sizes, colors, pricing and stock"
                    : "Add sizing, colors, pricing and stock limits"}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setVariants([
                    ...variants,
                    { ...EMPTY_VARIANT, id: Date.now() },
                  ])
                }
                className="btn-outline flex items-center gap-2 text-sm !rounded-xl"
              >
                <Plus size={16} /> Add Variant
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {variants.map((v, i) => (
                <VariantRow
                  key={v._id || v.id || i}
                  variant={v}
                  onUpdate={(updated) =>
                    setVariants(variants.map((x, j) => (j === i ? updated : x)))
                  }
                  onDuplicate={() =>
                    setVariants([
                      ...variants.slice(0, i + 1),
                      {
                        ...v,
                        _id: undefined,
                        id: Date.now(),
                        sku: "",
                        barcode: "",
                      },
                      ...variants.slice(i + 1),
                    ])
                  }
                  onDelete={() => {
                    if (v._id) setDeletedVariantIds((prev) => [...prev, v._id]);
                    setVariants(variants.filter((_, j) => j !== i));
                  }}
                />
              ))}
            </div>
          </div>
        </form>

        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-800 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition-all"
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={createMut.isPending || updateMut.isPending}
            onClick={handleSubmit}
            className="flex-1 px-6 py-4 rounded-2xl bg-brand dark:bg-white text-white dark:text-brand text-sm font-bold uppercase tracking-widest hover:bg-accent disabled:opacity-50 transition-all shadow-xl shadow-brand/10"
          >
            {createMut.isPending || updateMut.isPending
              ? "Saving..."
              : mode === "create"
                ? "Create Product"
                : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Import Modal ─────────────────────────────────────────────
function ImportModal({ onClose }) {
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls"].includes(ext)) {
      toast.error("Please select an .xlsx or .xls file");
      return;
    }
    setFile(f);
    setResults(null);
  };

  const downloadTemplate = async () => {
    try {
      const res = await productApi.downloadTemplate();
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "bman-import-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download template");
    }
  };

  const importMut = useMutation({
    mutationFn: () => productApi.importXlsx(file),
    onSuccess: (res) => {
      setResults(res.data.results);
      qc.invalidateQueries(["adminProducts"]);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Import failed"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-black/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-xl">
              <FileSpreadsheet size={20} className="text-brand" />
            </div>
            <div>
              <h2 className="font-display font-bold text-gray-900 dark:text-white text-lg">
                Import Products
              </h2>
              <p className="text-xs text-gray-500">
                Upload an .xlsx file to bulk-add products
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-gray-700 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-7 space-y-5">
          {/* Template download */}
          <button
            onClick={downloadTemplate}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-brand hover:text-brand dark:hover:text-brand transition-all"
          >
            <Download size={15} />
            Download sample template (.xlsx)
          </button>

          {/* Drop zone */}
          {!results && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFile(e.dataTransfer.files[0]);
              }}
              onClick={() => fileRef.current?.click()}
              className={`cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                dragging
                  ? "border-brand bg-brand/5"
                  : file
                    ? "border-green-400 bg-green-50 dark:bg-green-900/10"
                    : "border-gray-200 dark:border-gray-700 hover:border-brand hover:bg-brand/5"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
              <UploadCloud
                size={36}
                className={`mx-auto mb-3 ${file ? "text-green-500" : "text-gray-300 dark:text-gray-600"}`}
              />
              {file ? (
                <>
                  <p className="font-semibold text-sm text-green-600 dark:text-green-400">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(file.size / 1024).toFixed(1)} KB — click to change
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Drop your .xlsx file here
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    or click to browse
                  </p>
                </>
              )}
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Products Created",
                    value: results.productsCreated,
                    color: "text-green-600",
                  },
                  {
                    label: "Already Existed",
                    value: results.productsUpdated,
                    color: "text-blue-500",
                  },
                  {
                    label: "Variants Added",
                    value: results.variantsCreated,
                    color: "text-brand",
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 text-center"
                  >
                    <p className={`text-2xl font-bold font-display ${color}`}>
                      {value}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              {results.skipped > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertCircle size={13} /> {results.skipped} row(s) skipped
                </p>
              )}
              {results.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 max-h-32 overflow-y-auto">
                  {results.errors.map((e, i) => (
                    <p
                      key={i}
                      className="text-xs text-red-600 dark:text-red-400"
                    >
                      {e}
                    </p>
                  ))}
                </div>
              )}
              {results.errors.length === 0 && (
                <p className="text-xs text-green-600 flex items-center gap-1.5">
                  <CheckCircle size={13} /> Import completed with no errors
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            {results ? "Close" : "Cancel"}
          </button>
          {!results && (
            <button
              disabled={!file || importMut.isPending}
              onClick={() => importMut.mutate()}
              className="flex-1 py-3 rounded-2xl bg-brand text-white text-sm font-semibold hover:bg-accent disabled:opacity-50 transition-all"
            >
              {importMut.isPending ? "Importing…" : "Import"}
            </button>
          )}
          {results && (
            <button
              onClick={() => {
                setFile(null);
                setResults(null);
              }}
              className="flex-1 py-3 rounded-2xl bg-brand text-white text-sm font-semibold hover:bg-accent transition-all"
            >
              Import Another File
            </button>
          )}
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
  const [modal, setModal] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [showImport, setShowImport] = useState(false);

  // Confirmation modal state
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["adminProducts", search, categoryFilter, statusFilter],
    queryFn: () =>
      productApi
        .getAll({
          search,
          category: categoryFilter,
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
      toast.success("Product permanently deleted");
      setConfirmDeleteId(null);
    },
    onError: () => toast.error("Could not delete product"),
  });

  const toggleFlag = useMutation({
    mutationFn: ({ id, field, value }) =>
      productApi.update(id, { [field]: value }),
    onSuccess: () => qc.invalidateQueries(["adminProducts"]),
  });

  const categoryFilterOptions = useMemo(() => {
    if (!categories?.length) return [];
    return flattenCategoryForSelect(buildCategoryTree(categories));
  }, [categories]);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
            Products
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage inventory, variations and details
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 px-5 py-4 rounded-2xl font-semibold text-xs uppercase tracking-widest hover:border-brand hover:text-brand transition-all"
          >
            <UploadCloud size={16} />
            Import xlsx
          </button>
          <button
            onClick={() => setModal({ mode: "create" })}
            className="group relative flex items-center gap-2 bg-brand dark:bg-white text-white dark:text-brand px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand/10 hover:shadow-accent/20 hover:bg-accent hover:dark:bg-accent hover:dark:text-white transition-all duration-300 active:scale-95"
          >
            <div className="p-1 bg-white/20 dark:bg-brand/10 rounded-lg group-hover:rotate-90 transition-transform duration-300">
              <Plus size={18} />
            </div>
            Add Product
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all"
            placeholder="Search products by name or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="w-full sm:w-56 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all appearance-none cursor-pointer"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categoryFilterOptions.map((c) => (
            <option key={c._id} value={c._id}>
              {"\u2014".repeat(c.depth)}
              {c.depth > 0 ? " " : ""}
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="w-full sm:w-48 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all appearance-none cursor-pointer"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="py-20">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 uppercase font-medium">
                <tr>
                  {[
                    "Product",
                    "Category",
                    "Total Stock",
                    "Tags & Badges",
                    "Status",
                    "Actions",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-4 ${i === 5 ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {!products?.length ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No products found matching filters.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <AnimatePresence key={p._id}>
                      <tr
                        onClick={() =>
                          setExpanded(expanded === p._id ? null : p._id)
                        }
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-1.5 rounded-lg transition-transform ${expanded === p._id ? "rotate-180 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}
                            >
                              <ChevronDown size={14} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                                {p.name}
                              </p>
                              <p className="text-xs text-gray-500 capitalize mt-0.5">
                                {p.gender} • {p.fit}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 capitalize">
                          {p.category?.name || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full ${(p.totalStock || 0) === 0 ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" : (p.totalStock || 0) < 10 ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" : "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"}`}
                          >
                            {p.totalStock || 0} unit{p.totalStock !== 1 && "s"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 flex-wrap">
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
                                className="text-accent hover:scale-110 transition-transform"
                              >
                                <Star size={16} fill="currentColor" />
                              </button>
                            )}
                            {p.isNewArrival && (
                              <Sparkles
                                size={16}
                                className="text-blue-500"
                                title="New Arrival"
                              />
                            )}
                            {p.isTrending && (
                              <Zap
                                size={16}
                                className="text-purple-500"
                                title="Trending"
                              />
                            )}
                            {!p.isFeatured &&
                              !p.isNewArrival &&
                              !p.isTrending && (
                                <span className="text-gray-300">—</span>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${p.status === "active" ? "bg-green-100 text-green-700" : p.status === "draft" ? "bg-yellow-100 text-yellow-700" : "bg-gray-200 text-gray-600"}`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className="flex items-center justify-end gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() =>
                                setModal({ mode: "edit", product: p })
                              }
                              className="p-2 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-xl transition-colors"
                              title="Edit Product"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(p._id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expanded === p._id && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-gray-50/80 dark:bg-gray-800/20 border-b border-t border-gray-100 dark:border-gray-800/50"
                        >
                          <td colSpan={6} className="px-6 py-6">
                            <div className="pl-12 border-l-2 border-brand/20 ml-2">
                              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
                                Stock Variations ({p.variants?.length || 0})
                              </p>
                              <div className="flex flex-wrap gap-3">
                                {p.variants?.map((v) => (
                                  <div
                                    key={v._id}
                                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 min-w-[160px] shadow-sm"
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <div
                                        className="w-4 h-4 rounded-full border border-gray-200 shadow-inner"
                                        style={{
                                          backgroundColor: v.colorHex || "#ddd",
                                        }}
                                      />
                                      <p className="font-bold text-gray-900 dark:text-white uppercase">
                                        {v.size}
                                      </p>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-2">
                                      {v.color} {v.sku ? `• ${v.sku}` : ""}
                                    </p>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t dark:border-gray-800">
                                      <p className="font-semibold text-gray-900 dark:text-white">
                                        {formatPrice(
                                          v.discountPrice || v.price,
                                        )}
                                      </p>
                                      <p
                                        className={`text-xs font-bold px-2 py-0.5 rounded ${v.stock === 0 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}
                                      >
                                        {v.stock} in stat
                                      </p>
                                    </div>
                                  </div>
                                ))}
                                {!p.variants?.length && (
                                  <p className="text-sm text-gray-400 italic">
                                    No variants configured.
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

        {showImport && <ImportModal onClose={() => setShowImport(false)} />}

        {confirmDeleteId && (
          <ConfirmModal
            title="Delete Product?"
            message="Are you absolutely sure you want to permanently delete this product? This will remove all its variants, analytics, and dependencies. This action cannot be undone."
            confirmText="Delete Product"
            cancelText="Keep Product"
            isDanger={true}
            isLoading={deleteMut.isPending}
            onConfirm={() => deleteMut.mutate(confirmDeleteId)}
            onCancel={() => setConfirmDeleteId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
