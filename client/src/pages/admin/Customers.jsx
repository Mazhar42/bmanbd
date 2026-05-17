import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Eye, X, ShoppingBag, Mail, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { userApi, orderApi } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatPrice } from "../../utils/helpers";

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

function CustomerDetailModal({ customer, onClose }) {
  const { data: ordersData } = useQuery({
    queryKey: ["customerOrders", customer._id],
    queryFn: () =>
      orderApi.getAll({ userId: customer._id, limit: 10 }).then((r) => r.data),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg my-8 shadow-2xl"
      >
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <h2 className="font-bold text-base">Customer Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Avatar & info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-xl font-bold text-accent">
                {customer.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-bold text-lg">{customer.name}</p>
              <span
                className={`text-xs px-2 py-0.5 rounded capitalize ${customer.role === "admin" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`}
              >
                {customer.role}
              </span>
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Mail size={14} />
              <span>{customer.email}</span>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-2 text-gray-500">
                <Phone size={14} />
                <span>{customer.phone}</span>
              </div>
            )}
          </div>

          {/* Address */}
          {customer.address?.city && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm">
              <p className="text-xs font-semibold text-gray-400 mb-1">
                DEFAULT ADDRESS
              </p>
              <p>{customer.address.address}</p>
              <p className="text-gray-500">
                {customer.address.city}, {customer.address.zip}
              </p>
            </div>
          )}

          {/* Joined / active */}
          <div className="flex gap-4 text-sm text-gray-500">
            <div>
              <p className="text-xs text-gray-400">JOINED</p>
              <p>{new Date(customer.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">ACCOUNT</p>
              <p
                className={
                  customer.isActive ? "text-green-600" : "text-red-500"
                }
              >
                {customer.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          </div>

          {/* Orders */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-3">
              RECENT ORDERS
            </p>
            {!ordersData?.orders?.length ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                <ShoppingBag size={28} className="mx-auto mb-2 opacity-40" />
                No orders yet
              </div>
            ) : (
              <div className="space-y-2">
                {ordersData.orders.map((o) => (
                  <div
                    key={o._id}
                    className="flex items-center justify-between text-sm py-2 border-b dark:border-gray-700 last:border-0"
                  >
                    <div>
                      <p className="font-mono font-semibold text-xs">
                        {o.orderNumber}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatPrice(o.totalPrice)}
                      </p>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded capitalize ${STATUS_STYLES[o.orderStatus] || ""}`}
                      >
                        {o.orderStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["customers", search, page],
    queryFn: () =>
      userApi.getAll({ search, page, limit: 20 }).then((r) => r.data),
  });

  const customers = data?.users || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Customers
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {data?.total || 0} total customers
        </p>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          className="input pl-8 text-sm"
          placeholder="Search by name or email..."
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
                  "Customer",
                  "Email",
                  "Phone",
                  "Role",
                  "Joined",
                  "Status",
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
              {customers.map((c) => (
                <tr
                  key={c._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-accent">
                          {c.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.email}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {c.phone || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                        c.role === "admin"
                          ? "bg-red-100 text-red-600"
                          : c.role === "staff"
                            ? "bg-purple-100 text-purple-600"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {c.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`w-2 h-2 rounded-full inline-block mr-1.5 ${c.isActive ? "bg-green-500" : "bg-red-400"}`}
                    />
                    <span className="text-xs">
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(c)}
                      className="text-gray-400 hover:text-accent transition-colors"
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!customers.length && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No customers found
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
          <CustomerDetailModal
            key={selected._id}
            customer={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
