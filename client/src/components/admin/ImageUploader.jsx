import { useRef, useState } from "react";
import { Upload, X, ImageIcon, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { mediaApi } from "../../services/api";

/**
 * ImageUploader — reusable image upload component for admin pages.
 *
 * Props:
 *  value       — string (single mode) or string[] (multi mode)
 *  onChange    — (url: string) => void   OR   (urls: string[]) => void
 *  multiple    — boolean; defaults false (single image mode)
 *  folder      — string; sub-folder hint sent to the backend, e.g. "bman/products"
 *  label       — optional section label shown above the zone
 *  maxFiles    — max images allowed in multi mode (default 8)
 */
export default function ImageUploader({
  value,
  onChange,
  multiple = false,
  folder = "bman/general",
  label,
  maxFiles = 8,
}) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Normalise to array internally
  const images = multiple
    ? Array.isArray(value)
      ? value
      : value
        ? [value]
        : []
    : [];

  const singleUrl = !multiple ? value || "" : "";

  const upload = async (files) => {
    const fileList = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (!fileList.length) return;

    if (multiple && images.length + fileList.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed`);
      return;
    }

    setUploading(true);
    try {
      const results = await Promise.all(
        fileList.map((file) => mediaApi.uploadImage(file, folder)),
      );
      const urls = results.map((r) => r.data.media.url);

      if (multiple) {
        onChange([...images, ...urls]);
      } else {
        onChange(urls[0]);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (idx) => {
    if (multiple) {
      onChange(images.filter((_, i) => i !== idx));
    } else {
      onChange("");
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    upload(e.dataTransfer.files);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = () => setDragging(false);

  // ── MULTI IMAGE MODE ──────────────────────────────────────────
  if (multiple) {
    return (
      <div className="space-y-3">
        {label && (
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-0.5 block">
            {label}
          </label>
        )}

        {/* Thumbnail grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            <AnimatePresence>
              {images.map((url, idx) => (
                <motion.div
                  key={url + idx}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shadow-sm"
                >
                  <img
                    src={url}
                    alt={`Image ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Remove overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {idx === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded font-bold tracking-wider uppercase">
                      Cover
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Drop zone / add more button */}
        {images.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            disabled={uploading}
            className={`w-full flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
              dragging
                ? "border-accent bg-accent/5 dark:bg-accent/10"
                : "border-gray-200 dark:border-gray-700 hover:border-accent/50 bg-gray-50/50 dark:bg-gray-800/30"
            } disabled:opacity-60`}
          >
            {uploading ? (
              <Loader size={24} className="animate-spin text-accent" />
            ) : (
              <Upload size={24} className="text-gray-400" />
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {uploading
                ? "Uploading…"
                : images.length === 0
                  ? "Click to upload images or drag & drop"
                  : `Add more images (${images.length}/${maxFiles})`}
            </span>
            <span className="text-[10px] text-gray-400">
              JPG, PNG, WebP up to 5 MB
            </span>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
      </div>
    );
  }

  // ── SINGLE IMAGE MODE ─────────────────────────────────────────
  return (
    <div className="space-y-3">
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-0.5 block">
          {label}
        </label>
      )}

      {singleUrl ? (
        /* Preview */
        <div className="relative group w-full aspect-video rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 shadow-sm">
          <img
            src={singleUrl}
            alt="Uploaded"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-white/90 text-gray-900 text-xs font-bold rounded-xl hover:bg-white transition-colors"
            >
              {uploading ? "Uploading…" : "Change"}
            </button>
            <button
              type="button"
              onClick={() => remove()}
              className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader size={28} className="animate-spin text-white" />
            </div>
          )}
        </div>
      ) : (
        /* Drop zone */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          disabled={uploading}
          className={`w-full flex flex-col items-center justify-center gap-3 py-10 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
            dragging
              ? "border-accent bg-accent/5 dark:bg-accent/10"
              : "border-gray-200 dark:border-gray-700 hover:border-accent/50 bg-gray-50/50 dark:bg-gray-800/30"
          } disabled:opacity-60`}
        >
          {uploading ? (
            <Loader size={32} className="animate-spin text-accent" />
          ) : (
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-2xl">
              <ImageIcon size={32} className="text-gray-400" />
            </div>
          )}
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {uploading ? "Uploading…" : "Click to upload or drag & drop"}
            </p>
            <p className="text-xs text-gray-400">JPG, PNG, WebP up to 5 MB</p>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => upload(e.target.files)}
      />
    </div>
  );
}
