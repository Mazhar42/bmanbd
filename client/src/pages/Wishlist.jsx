import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import useStore from "../store/useStore";
import ProductCard from "../components/product/ProductCard";

export default function Wishlist() {
  const { wishlist, toggleWishlist } = useStore();

  if (wishlist.length === 0) {
    return (
      <div className="container-custom py-32 text-center">
        <Heart
          size={60}
          className="mx-auto text-gray-200 dark:text-gray-700 mb-6"
        />
        <h2 className="section-title mb-4">Your Wishlist is Empty</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Save items you love and come back to them later.
        </p>
        <Link to="/shop" className="btn-primary inline-block">
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-10">
      <h1 className="section-title mb-2">Wishlist</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        {wishlist.length} saved {wishlist.length === 1 ? "item" : "items"}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
        {wishlist.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}
