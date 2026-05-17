import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Heart,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { productApi } from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ProductCard from "../components/product/ProductCard";
import useStore from "../store/useStore";
import {
  formatPrice,
  groupVariantsByColor,
  getStockStatus,
} from "../utils/helpers";

export default function ProductDetail() {
  const { slug } = useParams();
  const {
    addToCart,
    toggleWishlist,
    isWishlisted,
    setCartOpen,
    addRecentlyViewed,
  } = useStore();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => productApi.getOne(slug).then((r) => r.data),
  });

  const { data: relatedData } = useQuery({
    queryKey: ["related", data?.product?.category?._id],
    queryFn: () =>
      productApi
        .getAll({ category: data.product.category._id, limit: 4 })
        .then((r) => r.data.products),
    enabled: !!data?.product?.category?._id,
  });

  const product = data?.product;
  const variants = product?.variants || [];
  const variantsByColor = groupVariantsByColor(variants);
  const colors = Object.keys(variantsByColor);
  const wishlisted = isWishlisted(product?._id);

  useEffect(() => {
    if (product) {
      addRecentlyViewed(product);
      if (colors.length > 0 && !selectedColor) setSelectedColor(colors[0]);
    }
  }, [product?._id]);

  const availableSizes = selectedColor
    ? variantsByColor[selectedColor]?.sizes || []
    : [];

  const selectedVariantData = availableSizes.find(
    (s) => s.size === selectedSize,
  );
  const price =
    selectedVariantData?.discountPrice || selectedVariantData?.price || 0;
  const originalPrice = selectedVariantData?.price || 0;
  const stock = selectedVariantData
    ? getStockStatus(selectedVariantData.stock)
    : null;

  const handleAddToCart = () => {
    if (!selectedColor) return toast.error("Please select a color");
    if (!selectedSize) return toast.error("Please select a size");
    if (!selectedVariantData) return toast.error("Variant not available");
    if (selectedVariantData.stock === 0) return toast.error("Out of stock");

    addToCart({
      variantId: selectedVariantData.variantId,
      productId: product._id,
      name: product.name,
      size: selectedSize,
      color: selectedColor,
      image: product.images?.[0],
      price,
      quantity,
    });
    setCartOpen(true);
    toast.success("Added to cart!");
  };

  if (isLoading) return <LoadingSpinner size="lg" className="py-32" />;
  if (error || !product) {
    return (
      <div className="container-custom py-32 text-center">
        <p className="text-gray-500">Product not found.</p>
        <Link to="/shop" className="btn-outline inline-block mt-6">
          Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8">
        <Link to="/" className="hover:text-accent">
          Home
        </Link>{" "}
        /
        <Link to="/shop" className="hover:text-accent">
          Shop
        </Link>{" "}
        /
        {product.category && (
          <>
            <Link
              to={`/shop?category=${product.category.slug}`}
              className="hover:text-accent capitalize"
            >
              {product.category.name}
            </Link>{" "}
            /
          </>
        )}
        <span className="text-brand dark:text-white">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">
        {/* Image Gallery */}
        <div className="flex gap-3">
          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex flex-col gap-2 w-16">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`border-2 transition-all ${
                    selectedImage === i ? "border-accent" : "border-transparent"
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full aspect-square object-cover"
                  />
                </button>
              ))}
            </div>
          )}
          {/* Main image */}
          <div className="flex-1 relative overflow-hidden bg-gray-50 dark:bg-gray-800 aspect-[3/4]">
            <motion.img
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={product.images?.[selectedImage] || product.images?.[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {/* Nav arrows */}
            {product.images?.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage((i) => Math.max(0, i - 1))}
                  disabled={selectedImage === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 p-2 disabled:opacity-30 hover:bg-white transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() =>
                    setSelectedImage((i) =>
                      Math.min(product.images.length - 1, i + 1),
                    )
                  }
                  disabled={selectedImage === product.images.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 p-2 disabled:opacity-30 hover:bg-white transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div>
            {product.category && (
              <Link
                to={`/shop?category=${product.category.slug}`}
                className="text-xs text-accent tracking-widest uppercase font-medium hover:underline"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="text-2xl md:text-3xl font-display font-medium mt-2 leading-tight">
              {product.name}
            </h1>
            {selectedVariantData ? (
              <div className="flex items-center gap-3 mt-3">
                <span className="text-2xl font-bold">{formatPrice(price)}</span>
                {price < originalPrice && (
                  <>
                    <span className="text-base text-gray-400 line-through">
                      {formatPrice(originalPrice)}
                    </span>
                    <span className="badge-sale">
                      -
                      {Math.round(
                        ((originalPrice - price) / originalPrice) * 100,
                      )}
                      %
                    </span>
                  </>
                )}
              </div>
            ) : (
              <p className="text-xl font-semibold mt-3 text-gray-400">
                Select variant for price
              </p>
            )}
          </div>

          {/* Color selector */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3">
              Color:{" "}
              <span className="text-accent font-normal normal-case text-sm">
                {selectedColor || "Select"}
              </span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {colors.map((color) => {
                const hex = variantsByColor[color]?.colorHex;
                return (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      setSelectedSize(null);
                    }}
                    title={color}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color
                        ? "border-accent scale-110"
                        : "border-gray-200 dark:border-gray-600"
                    }`}
                    style={{ backgroundColor: hex || color }}
                  />
                );
              })}
            </div>
          </div>

          {/* Size selector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold tracking-widest uppercase">
                Size:{" "}
                <span className="text-accent font-normal normal-case text-sm">
                  {selectedSize || "Select"}
                </span>
              </p>
              <button className="text-xs text-gray-400 hover:text-accent underline">
                Size Guide
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {availableSizes.map(({ size, stock: qty }) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  disabled={qty === 0}
                  className={`min-w-[3rem] h-10 px-3 text-sm font-medium border transition-all ${
                    selectedSize === size
                      ? "bg-brand dark:bg-white text-white dark:text-brand border-brand dark:border-white"
                      : qty === 0
                        ? "border-gray-100 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed line-through"
                        : "border-gray-200 dark:border-gray-600 hover:border-accent hover:text-accent"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {stock && (
              <p className={`text-xs mt-2 ${stock.color}`}>{stock.label}</p>
            )}
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                −
              </button>
              <span className="px-5 py-3 text-sm min-w-[3rem] text-center border-x border-gray-200 dark:border-gray-600">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} />
              Add to Cart
            </button>
            <button
              onClick={() => {
                toggleWishlist(product);
                toast.success(
                  wishlisted ? "Removed from wishlist" : "Saved to wishlist",
                );
              }}
              className={`p-4 border transition-all ${
                wishlisted
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-500"
                  : "border-gray-200 dark:border-gray-600 hover:border-accent hover:text-accent"
              }`}
              aria-label="Wishlist"
            >
              <Heart size={18} className={wishlisted ? "fill-red-500" : ""} />
            </button>
          </div>

          {/* Delivery */}
          <div className="border border-gray-100 dark:border-gray-700 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Package size={15} />
              <span>Free delivery on orders above ৳1000</span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            {product.fabric && (
              <p>
                <span className="font-medium text-brand dark:text-white">
                  Fabric:
                </span>{" "}
                {product.fabric}
              </p>
            )}
            {product.fit && (
              <p>
                <span className="font-medium text-brand dark:text-white">
                  Fit:
                </span>{" "}
                {product.fit}
              </p>
            )}
            {product.description && (
              <p className="leading-relaxed mt-4">{product.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedData?.filter((p) => p._id !== product._id).length > 0 && (
        <section className="mt-20">
          <h2 className="section-title mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
            {relatedData
              .filter((p) => p._id !== product._id)
              .slice(0, 4)
              .map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
