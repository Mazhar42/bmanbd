import { X, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ConfirmModal({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDanger = true,
  isLoading = false,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-black/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
      >
        <div className="p-8">
          <div className="flex items-start gap-5">
            <div
              className={`p-3 rounded-full shrink-0 ${isDanger ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" : "bg-brand/10 text-brand"}`}
            >
              <AlertCircle size={28} />
            </div>
            <div>
              <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-800 flex gap-3 justify-end items-center">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold tracking-wide text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-6 py-3 rounded-xl text-sm font-bold tracking-wide text-white transition-all duration-200 shadow-lg ${
              isDanger
                ? "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                : "bg-brand hover:bg-accent shadow-brand/20"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
