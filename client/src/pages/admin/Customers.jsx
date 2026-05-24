import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Eye,
  X,
  ShoppingBag,
  Mail,
  Phone,
  ShieldCheck,
  UserCheck,
  UserX,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { userApi, orderApi } from "../../services/api";
import useStore from "../../store/useStore";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ConfirmModal from "../../components/admin/ConfirmModal";
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
  const queryClient = useQueryClient();
  const currentUser = useStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === "admin";
  const [updating, setUpdating] = useState(false);

  const { data: ordersData } = useQuery({
    queryKey: ["customerOrders", customer._id],
    queryFn: () =>
      orderApi.getAll({ userId: customer._id, limit: 10 }).then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => userApi.update(customer._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["customers"]);
      toast.success("User updated successfully");
      setUpdating(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update user");
      setUpdating(false);
    },
  });

  const handleRoleChange = (newRole) => {
    if (newRole === customer.role) return;
    if (window.confirm(`Change ${customer.name}'s role to ${newRole}?`)) {
      setUpdating(true);
      updateMutation.mutate({ role: newRole });
    }
  };

  const toggleStatus = () => {
    const action = customer.isActive ? "deactivate" : "activate";
    if (window.confirm(`Are you sure you want to ${action} this account?`)) {
      setUpdating(true);
      updateMutation.mutate({ isActive: !customer.isActive });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg my-8 shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">
            Customer Profile
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Avatar & info */}
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center border-2 border-accent/20">
              <span className="text-3xl font-display font-bold text-accent">
                {customer.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="space-y-1">
              <p className="font-display font-bold text-2xl text-gray-900 dark:text-white">
                {customer.name}
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-lg ${
                    customer.role === "admin"
                      ? "bg-red-100 text-red-600 border border-red-200"
                      : customer.role === "staff"
                        ? "bg-purple-100 text-purple-600 border border-purple-200"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {customer.role}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${customer.isActive ? "bg-green-500" : "bg-red-500"}`}
                />
              </div>
            </div>
          </div>

          {/* Admin Controls */}
          {isSuperAdmin && customer._id !== currentUser._id && (
            <div className="bg-brand-light dark:bg-gray-800/40 rounded-2xl p-6 border border-brand/5 dark:border-gray-700 space-y-4">
              <div className="flex items-center gap-2 text-brand dark:text-white mb-2">
                <ShieldCheck size={18} className="text-accent" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Administrative Actions
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">
                    Change Role
                  </label>
                  <select
                    disabled={updating}
                    value={customer.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all cursor-pointer disabled:opacity-50"
                  >
                    <option value="user">User (Customer)</option>
                    <option value="staff">Staff (Limited Access)</option>
                    <option value="admin">Admin (Full Access)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">
                    Account Status
                  </label>
                  <button
                    disabled={updating}
                    onClick={toggleStatus}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                      customer.isActive
                        ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                        : "bg-green-50 text-green-600 border-green-100 hover:bg-green-100"
                    } disabled:opacity-50`}
                  >
                    {customer.isActive ? (
                      <UserX size={16} />
                    ) : (
                      <UserCheck size={16} />
                    )}
                    {customer.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>

              {customer.role === "admin" && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                  <AlertCircle size={14} className="text-yellow-600 shrink-0" />
                  <p className="text-[11px] text-yellow-700 dark:text-yellow-400 leading-tight">
                    Careful: Admin users have full control over the system,
                    including deleting data.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Contact & Info Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Email Address
              </p>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Mail size={14} className="text-gray-400" />
                <span className="text-sm font-medium">{customer.email}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Phone Number
              </p>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Phone size={14} className="text-gray-400" />
                <span className="text-sm font-medium">
                  {customer.phone || "Not provided"}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Member Since
              </p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {new Date(customer.createdAt).toLocaleDateString("en-BD", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Default Address
              </p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {customer.address?.city
                  ? `${customer.address.city}, ${customer.address.zip || ""}`
                  : "No address saved"}
              </p>
            </div>
          </div>

          {/* Orders */}
          <div className="space-y-4 pt-4 border-t dark:border-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Recent Activity
              </p>
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider px-2 py-0.5 bg-accent/10 rounded-full">
                {ordersData?.total || 0} Orders
              </span>
            </div>

            {!ordersData?.orders?.length ? (
              <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <ShoppingBag
                  size={32}
                  className="mx-auto mb-2 text-gray-300 dark:text-gray-600"
                />
                <p className="text-sm text-gray-400">No order history found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ordersData.orders.map((o) => (
                  <div
                    key={o._id}
                    className="group flex items-center justify-between p-4 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-accent/30 transition-all"
                  >
                    <div className="space-y-1">
                      <p className="font-mono font-bold text-sm text-brand dark:text-white group-hover:text-accent transition-colors">
                        {o.orderNumber}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {formatPrice(o.totalPrice)}
                      </p>
                      <span
                        className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-lg ${STATUS_STYLES[o.orderStatus] || ""}`}
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
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const currentUser = useStore((s) => s.user);
  const qc = useQueryClient();

  const deleteMut = useMutation({
    mutationFn: (id) => userApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries(["customers"]);
      toast.success("Customer deleted permanently");
      setConfirmDeleteId(null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Could not delete customer"),
  });

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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelected(c)}
                        className="text-gray-400 hover:text-accent transition-colors"
                      >
                        <Eye size={15} />
                      </button>
                      {currentUser?._id !== c._id && (
                        <button
                          onClick={() => setConfirmDeleteId(c._id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
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

      {confirmDeleteId && (
        <ConfirmModal
          title="Delete Customer?"
          message="Permanently delete this customer account and all associated data? This cannot be undone."
          confirmText="Delete Customer"
          cancelText="Keep Customer"
          isDanger
          isLoading={deleteMut.isPending}
          onConfirm={() => deleteMut.mutate(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
