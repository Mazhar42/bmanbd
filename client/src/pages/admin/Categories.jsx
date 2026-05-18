import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, X, HardDrive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { categoryApi } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";

function CategoryModal({ category, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
    parent: category?.parent?._id || category?.parent || "",
    isLive: category?.isLive ?? true,
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
    if (!payload.parent) delete payload.parent; // Don't send empty string
    mutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md my-8 shadow-2xl"
      >
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <h2 className="font-bold text-base">
            {isEditing ? "Edit Category" : "Add Category"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              className="input-field"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              className="input-field min-h-[80px]"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Parent Category
            </label>
            <select
              className="input-field"
              value={formData.parent}
              onChange={(e) =>
                setFormData({ ...formData, parent: e.target.value })
              }
            >
              <option value="">None (Top Level)</option>
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
          </div>

          <div className="flex items-center gap-3 mt-4">
            <input
              type="checkbox"
              id="isLive"
              checked={formData.isLive}
              onChange={(e) =>
                setFormData({ ...formData, isLive: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
            />
            <label
              htmlFor="isLive"
              className="text-sm font-medium dark:text-white"
            >
              Is Live (Visible)
            </label>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 text-sm"
              disabled={mutation.isLoading}
            >
              {mutation.isLoading
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create"}
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

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["categoriesAdmin"],
    queryFn: () => categoryApi.getAll().then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => categoryApi.delete(id),
    onSuccess: () => {
      toast.success("Category deleted");
      queryClient.invalidateQueries(["categoriesAdmin"]);
      queryClient.invalidateQueries(["categories"]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete");
    },
  });

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const categories = data?.categories || [];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Categories</h1>
          <p className="text-gray-500 text-sm">Manage product categories</p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setModalOpen(true);
          }}
          className="btn-primary text-sm whitespace-nowrap"
        >
          <Plus size={16} className="mr-2" />
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
      </AnimatePresence>
    </div>
  );
}
