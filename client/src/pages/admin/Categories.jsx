import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, X, HardDrive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { categoryApi } from "../../services/api";
import ConfirmModal from "../../components/admin/ConfirmModal";
import ImageUploader from "../../components/admin/ImageUploader";
import LoadingSpinner from "../../components/common/LoadingSpinner";

function CategoryModal({ category, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
    parent: category?.parent?._id || category?.parent || "",
    isLive: category?.isLive ?? true,
    image: category?.image || "",
  });

  const { data: treeRes } = useQuery({
    queryKey: ["categoriesBranch"],
    queryFn: () => categoryApi.getAll().then((r) => r.data),
  });

  const queryClient = useQueryClient();

  const isEditing = !!category;

  const mutation = useMutation({
    mutationFn: (data) =>
      isEditing
        ? categoryApi.update(category._id, data)
        : categoryApi.create(data),
    onSuccess: () => {
      toast.success(`Category ${isEditing ? "updated" : "created"}!`);
      queryClient.invalidateQueries(["categoriesAdmin"]);
      queryClient.invalidateQueries(["categories"]);
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to save category");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Name is required");
    const payload = { ...formData };
    if (!payload.parent) delete payload.parent;
    mutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-black/40 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
      >
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 border-b dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-semibold text-gray-900 dark:text-white">
                {isEditing ? "Edit Category" : "Create Category"}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {isEditing
                  ? "Update category details and organization"
                  : "Organize your products with a new category"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 gap-5">
            {/* Category Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">
                Category Name <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all duration-200"
                placeholder="e.g., Summer Collection"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            {/* Parent Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">
                Parent Category
              </label>
              <div className="relative">
                <select
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all duration-200 appearance-none cursor-pointer"
                  value={formData.parent}
                  onChange={(e) =>
                    setFormData({ ...formData, parent: e.target.value })
                  }
                >
                  <option value="">None (Top Level Category)</option>
                  {treeRes?.categories?.map((c) => (
                    <option
                      key={c._id}
                      value={c._id}
                      disabled={isEditing && c._id === category._id}
                    >
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">
                Description
              </label>
              <textarea
                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all duration-200 min-h-[100px] resize-none"
                placeholder="Briefly describe what's in this category..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* Cover Image */}
            <ImageUploader
              folder="bman/categories"
              label="Cover Image"
              value={formData.image}
              onChange={(url) => setFormData({ ...formData, image: url })}
            />

            {/* Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="space-y-0.5">
                <label
                  htmlFor="isLive"
                  className="text-sm font-bold text-gray-900 dark:text-white cursor-pointer"
                >
                  Live Status
                </label>
                <p className="text-xs text-gray-500">
                  Visible to customers on the store
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="isLive"
                  className="sr-only peer"
                  checked={formData.isLive}
                  onChange={(e) =>
                    setFormData({ ...formData, isLive: e.target.checked })
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-brand dark:bg-white text-white dark:text-brand text-xs font-bold uppercase tracking-wider hover:bg-accent hover:dark:bg-accent hover:dark:text-white disabled:opacity-50 transition-all duration-200 shadow-md shadow-brand/10"
            >
              {mutation.isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : isEditing ? (
                "Update"
              ) : (
                "Create"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function AdminCategories() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["categoriesAdmin"],
    queryFn: () => categoryApi.getAll().then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => categoryApi.delete(id),
    onSuccess: () => {
      toast.success("Category deleted");
      setConfirmDeleteId(null);
      queryClient.invalidateQueries(["categoriesAdmin"]);
      queryClient.invalidateQueries(["categories"]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete");
    },
  });

  const handleDelete = (id) => {
    setConfirmDeleteId(id);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const categories = data?.categories || [];

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
            Categories
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Organize and manage your product catalog
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setModalOpen(true);
          }}
          className="group relative flex items-center gap-2 bg-brand dark:bg-white text-white dark:text-brand px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand/10 hover:shadow-accent/20 hover:bg-accent hover:dark:bg-accent hover:dark:text-white transition-all duration-300 active:scale-95"
        >
          <div className="p-1 bg-white/20 dark:bg-brand/10 rounded-lg group-hover:rotate-90 transition-transform duration-300">
            <Plus size={18} />
          </div>
          Add Category
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <HardDrive className="mx-auto mb-3 opacity-20" size={32} />
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr
                    key={category._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </div>
                      {category.parent && (
                        <div className="text-xs text-gray-500">
                          Parent: {category.parent.name || category.parent}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{category.slug}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${category.isLive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                      >
                        {category.isLive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(category._id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <CategoryModal
            category={editingCategory}
            onClose={() => setModalOpen(false)}
            onSuccess={() => setModalOpen(false)}
          />
        )}

        {confirmDeleteId && (
          <ConfirmModal
            title="Delete Category?"
            message="Are you sure you want to delete this category? This will make products assigned to this category orphans."
            confirmText="Delete Category"
            cancelText="Cancel"
            isDanger={true}
            isLoading={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate(confirmDeleteId)}
            onCancel={() => setConfirmDeleteId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
