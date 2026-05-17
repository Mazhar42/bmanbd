import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Package,
  Search,
  X,
  RefreshCcw,
  ShoppingBag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { inventoryApi } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatPrice } from "../../utils/helpers";

function StockBadge({ stock }) {
  if (stock === 0)
    return (
      <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
        Out of Stock
      </span>
    );
  if (stock < 10)
    return (
      <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
        {stock} low
      </span>
    );
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
      {stock}
    </span>
  );
}

function AdjustModal({ variant, onClose, mode }) {
  const qc = useQueryClient();
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  const adjustMut = useMutation({
    mutationFn: () =>
      inventoryApi.adjust({
        variantId: variant._id,
        quantity: Number(quantity),
        note: note || (mode === "purchase" ? "Restock" : "Manual adjustment"),
        type: mode === "purchase" ? "purchase" : "adjustment",
      }),
    onSuccess: () => {
      qc.invalidateQueries(["inventory"]);
      qc.invalidateQueries(["stockAlerts"]);
      toast.success(mode === "purchase" ? "Stock restocked" : "Stock adjusted");
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || "Error"),
  });

  const title = mode === "purchase" ? "Restock / Purchase" : "Adjust Stock";
  const hint =
    mode === "purchase"
      ? "Positive number adds stock"
      : "Use negative to reduce stock";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <h2 className="font-bold text-base">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm">
            <p className="font-semibold">{variant.product?.name}</p>
            <p className="text-gray-500 text-xs mt-0.5">
              {variant.size} / {variant.color} · SKU: {variant.sku}
            </p>
            <p className="text-xs mt-1">
              Current stock: <strong>{variant.stock}</strong>
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Quantity <span className="text-gray-400 font-normal">{hint}</span>
            </label>
            <input
              type="number"
              className="input"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={mode === "purchase" ? "+10" : "±10"}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Note (optional)
            </label>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for change..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} className="btn-outline text-sm">
            Cancel
          </button>
          <button
            onClick={() => adjustMut.mutate()}
            disabled={!quantity || adjustMut.isPending}
            className="btn-primary text-sm"
          >
            {adjustMut.isPending ? "Saving…" : "Confirm"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminInventory() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { variant, mode }
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'low' | 'out'

  const { data, isLoading } = useQuery({
    queryKey: ["inventory", page, search, activeTab],
    queryFn: () =>
      inventoryApi
        .getAll({
          page,
          limit: 20,
          search,
          ...(activeTab === "low" ? { maxStock: 9, minStock: 1 } : {}),
          ...(activeTab === "out" ? { maxStock: 0 } : {}),
        })
        .then((r) => r.data),
  });

  const { data: alerts } = useQuery({
    queryKey: ["stockAlerts"],
    queryFn: () => inventoryApi.getAlerts().then((r) => r.data),
  });

  const { data: txData } = useQuery({
    queryKey: ["transactions"],
    queryFn: () =>
      inventoryApi.getTransactions({ limit: 10 }).then((r) => r.data),
  });

  const variants = data?.variants || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Inventory
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage stock levels across all variants
        </p>
      </div>

      {/* Alert banner */}
      {alerts?.count > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-5 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-700 dark:text-amber-400">
              {alerts.outOfStock} out of stock · {alerts.lowStock} low stock
            </p>
            <p className="text-amber-600 dark:text-amber-500 text-xs mt-0.5">
              Restock items to avoid missed sales
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-5 items-center">
        {/* Tabs */}
        <div className="flex">
          {["all", "low", "out"].map((t) => (
            <button
              key={t}
              onClick={() => {
                setActiveTab(t);
                setPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === t
                  ? "border-accent text-accent"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {t === "all"
                ? "All Stock"
                : t === "low"
                  ? "Low Stock"
                  : "Out of Stock"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative ml-auto">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            className="input pl-8 text-sm w-52"
            placeholder="Search SKU / product..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main table */}
        <div className="xl:col-span-2 card rounded-xl overflow-hidden">
          {isLoading ? (
            <LoadingSpinner className="py-16" />
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    {[
                      "Product",
                      "SKU",
                      "Size",
                      "Color",
                      "Price",
                      "Stock",
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
                  {variants.map((v) => (
                    <tr
                      key={v._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium line-clamp-1">
                          {v.product?.name || "—"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {v.product?.category?.name}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {v.sku}
                      </td>
                      <td className="px-4 py-3 font-medium">{v.size}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-full border border-gray-200"
                            style={{ background: v.colorHex || "#999" }}
                          />
                          <span className="text-xs">{v.color}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span>{formatPrice(v.effectivePrice ?? v.price)}</span>
                        {v.discountPrice > 0 && (
                          <span className="text-xs text-gray-400 line-through ml-1">
                            {formatPrice(v.price)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StockBadge stock={v.stock} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setModal({ variant: v, mode: "adjust" })
                            }
                            title="Adjust stock"
                            className="text-xs text-gray-500 hover:text-accent border dark:border-gray-600 rounded px-2 py-0.5 transition-colors"
                          >
                            <RefreshCcw size={12} />
                          </button>
                          <button
                            onClick={() =>
                              setModal({ variant: v, mode: "purchase" })
                            }
                            title="Restock"
                            className="text-xs text-gray-500 hover:text-green-600 border dark:border-gray-600 rounded px-2 py-0.5 transition-colors"
                          >
                            <ShoppingBag size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!variants.length && (
                <div className="text-center py-12 text-gray-400 text-sm">
                  <Package size={40} className="mx-auto mb-3 opacity-40" />
                  No items found
                </div>
              )}
              {/* Pagination */}
              {data?.pages > 1 && (
                <div className="flex justify-center gap-2 p-4 border-t dark:border-gray-700">
                  {Array.from({ length: data.pages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-8 h-8 rounded text-sm font-medium ${
                        page === i + 1
                          ? "bg-accent text-white"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Recent transactions */}
        <div className="card rounded-xl p-5">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
            Recent Transactions
          </h2>
          <div className="space-y-3">
            {txData?.transactions?.map((tx, i) => (
              <div
                key={i}
                className="text-xs border-b dark:border-gray-700 pb-3 last:border-0"
              >
                <div className="flex justify-between">
                  <span
                    className={`font-semibold capitalize ${
                      tx.type === "purchase"
                        ? "text-green-600"
                        : tx.type === "sale"
                          ? "text-blue-600"
                          : tx.type === "adjustment"
                            ? "text-purple-600"
                            : "text-gray-500"
                    }`}
                  >
                    {tx.type}
                  </span>
                  <span
                    className={
                      tx.quantity > 0 ? "text-green-600" : "text-red-500"
                    }
                  >
                    {tx.quantity > 0 ? "+" : ""}
                    {tx.quantity}
                  </span>
                </div>
                <p className="text-gray-500 mt-0.5 line-clamp-1">
                  {tx.variant?.product?.name} · {tx.variant?.size}/
                  {tx.variant?.color}
                </p>
                <p className="text-gray-400 mt-0.5">
                  {tx.stockBefore} → {tx.stockAfter}
                </p>
              </div>
            ))}
            {!txData?.transactions?.length && (
              <p className="text-gray-400 text-xs text-center py-6">
                No transactions yet
              </p>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modal && (
          <AdjustModal
            key={modal.variant._id + modal.mode}
            variant={modal.variant}
            mode={modal.mode}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
