import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Filter, Eye, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { orderApi } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatPrice } from "../../utils/helpers";

const STATUSES = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_STYLES = {
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-600",
};

function OrderDetailModal({ order, onClose }) {
  const qc = useQueryClient();

  const updateMut = useMutation({
    mutationFn: (status) => orderApi.updateStatus(order._id, { status }),
    onSuccess: () => {
      qc.invalidateQueries(["adminOrders"]);
      toast.success("Status updated");
      onClose();
    },
    onError: () => toast.error("Could not update status"),
  });

  const nextStatus = {
    pending: "confirmed",
    confirmed: "processing",
    processing: "shipped",
    shipped: "delivered",
  }[order.orderStatus];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg my-8 shadow-2xl"
      >
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <div>
            <h2 className="font-bold text-base">Order {order.orderNumber}</h2>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${STATUS_STYLES[order.orderStatus]}`}
            >
              {order.orderStatus}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Customer / Address */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">
                CUSTOMER
              </p>
              <p>
                {order.user?.name || order.shippingAddress?.fullName || "Guest"}
              </p>
              <p className="text-gray-500 text-xs">
                {order.user?.email || order.shippingAddress?.phone}
              </p>
            </div>
            <div>
              {order.source === "pos" ? (
                <>
                  <p className="text-xs font-semibold text-gray-400 mb-1">
                    SALE TYPE
                  </p>
                  <p className="text-xs font-medium">In-Store / Walk-in</p>
                  <p className="text-xs text-gray-500">No shipping required</p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-gray-400 mb-1">
                    SHIP TO
                  </p>
                  <p className="text-xs">
                    {order.shippingAddress?.street},{" "}
                    {order.shippingAddress?.city}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.shippingAddress?.phone}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">ITEMS</p>
            <div className="space-y-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      {item.size} / {item.color} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t dark:border-gray-700 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Shipping</span>
              <span>
                {order.shippingCost === 0
                  ? "Free"
                  : formatPrice(order.shippingCost)}
              </span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatPrice(order.totalPrice)}</span>
            </div>
          </div>

          {/* Payment & Source */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p className="text-gray-400 mb-1">Payment</p>
              <p className="font-semibold capitalize">
                {order.paymentMethod?.replace("_", " ")}
              </p>
              <p
                className={
                  order.paymentStatus === "paid"
                    ? "text-green-600"
                    : "text-yellow-500"
                }
              >
                {order.paymentStatus}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p className="text-gray-400 mb-1">Source</p>
              <p className="font-semibold capitalize">{order.source}</p>
              <p className="text-gray-400">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          {order.orderStatus !== "delivered" &&
            order.orderStatus !== "cancelled" && (
              <div className="flex gap-3">
                {nextStatus && (
                  <button
                    onClick={() => updateMut.mutate(nextStatus)}
                    disabled={updateMut.isPending}
                    className="btn-primary text-sm flex-1 capitalize"
                  >
                    Mark as {nextStatus}
                  </button>
                )}
                <button
                  onClick={() => updateMut.mutate("cancelled")}
                  disabled={updateMut.isPending}
                  className="btn-outline text-red-500 border-red-300 hover:bg-red-50 text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminOrders() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["adminOrders", activeTab, search, page],
    queryFn: () =>
      orderApi
        .getAll({
          status: activeTab === "all" ? undefined : activeTab,
          search,
          page,
          limit: 20,
        })
        .then((r) => r.data),
  });

  const orders = data?.orders || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Orders
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {data?.total || 0} total orders
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex overflow-x-auto border-b dark:border-gray-700 mb-5 gap-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setActiveTab(s);
              setPage(1);
            }}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === s
                ? "border-accent text-accent"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          className="input pl-8 text-sm"
          placeholder="Search order # or customer..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : (
        <div className="card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                {[
                  "Order #",
                  "Customer",
                  "Items",
                  "Total",
                  "Payment",
                  "Status",
                  "Source",
                  "Date",
                  "",
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
              {orders.map((order) => (
                <tr
                  key={order._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-semibold text-xs">
                    {order.orderNumber}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {order.user?.name ||
                        order.shippingAddress?.fullName ||
                        "Guest"}
                    </p>
                    <p className="text-xs text-gray-400">{order.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {order.items?.length}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {formatPrice(order.totalPrice)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 capitalize">
                    {order.paymentMethod?.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${STATUS_STYLES[order.orderStatus] || ""}`}
                    >
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${order.source === "pos" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}
                    >
                      {order.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(order)}
                      className="text-gray-400 hover:text-accent transition-colors"
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!orders.length && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No orders found
            </div>
          )}
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
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <OrderDetailModal
            key={selected._id}
            order={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
