import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import useStore from "../../store/useStore";
import { formatPrice } from "../../utils/helpers";

export default function ProductCard({ product }) {
  const [hovered, setHovered] = useState(false);
  const { addToCart, toggleWishlist, isWishlisted, setCartOpen } = useStore();
  const wishlisted = isWishlisted(product._id);

  const defaultVariant = product.variants?.[0];
  const price =
    product.minPrice ||
    defaultVariant?.discountPrice ||
    defaultVariant?.price ||
    0;
  const originalPrice = defaultVariant?.price || 0;
  const hasDiscount =
    product.hasDiscount ||
    (defaultVariant?.discountPrice &&
      defaultVariant.discountPrice < originalPrice);
  const mainImage =
    product.images?.[0] ||
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600";
  const hoverImage = product.images?.[1] || mainImage;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!defaultVariant) {
      toast.error("No variants available");
      return;
    }
    addToCart({
      variantId: defaultVariant._id,
      productId: product._id,
      name: product.name,
      size: defaultVariant.size,
      color: defaultVariant.color,
      image: mainImage,
      price: defaultVariant.discountPrice || defaultVariant.price,
      quantity: 1,
    });
    setCartOpen(true);
    toast.success("Added to cart!");
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    toggleWishlist(product);
    toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-gray-50 dark:bg-gray-800 aspect-[3/4]">
        <Link to={`/shop/${product.slug}`} className="block">
          {/* Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
            {product.isNewArrival && <span className="badge-new">New</span>}
            {hasDiscount && !product.isNewArrival && (
              <span className="badge-sale">Sale</span>
            )}
            {product.isTrending && (
              <span className="badge-trending">Trending</span>
            )}
          </div>

          {/* Main image */}
          <img
            src={hovered ? hoverImage : mainImage}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 z-10 p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
          aria-label="Wishlist"
        >
          <Heart
            size={15}
            className={
              wishlisted
                ? "fill-red-500 text-red-500"
                : "text-gray-600 dark:text-gray-300"
            }
          />
        </button>

        {/* Quick actions */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-3 flex gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleQuickAdd}
            className="flex-1 bg-brand dark:bg-white text-white dark:text-brand text-xs font-medium tracking-widest uppercase py-3 hover:bg-accent hover:dark:bg-accent hover:dark:text-white transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag size={14} />
            Quick Add
          </button>
          <Link
            to={`/shop/${product.slug}`}
            className="bg-white/90 dark:bg-gray-800/90 p-3 hover:bg-accent hover:text-white transition-colors"
            aria-label="View product"
          >
            <Eye size={16} />
          </Link>
        </div>
      </div>

      <Link to={`/shop/${product.slug}`} className="block">
        {/* Info */}
        <div className="pt-3 pb-1">
          <h3 className="text-sm font-medium text-brand dark:text-gray-100 leading-snug group-hover:text-accent transition-colors line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-sm font-semibold text-brand dark:text-white">
              {formatPrice(price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
          {/* Color dots */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex gap-1 mt-2">
              {product.colors.slice(0, 4).map((color) => (
                <div
                  key={color}
                  className="w-3 h-3 rounded-full border border-gray-200 dark:border-gray-600"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-xs text-gray-400">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
