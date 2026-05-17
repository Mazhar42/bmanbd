import { Link } from "react-router-dom";
import { Plus, Minus, X, ArrowRight, ShoppingBag } from "lucide-react";
import useStore from "../store/useStore";
import { formatPrice } from "../utils/helpers";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useStore();
  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const shippingCost = subtotal > 0 && subtotal < 1000 ? 80 : 0;
  const total = subtotal + shippingCost;

  if (cart.length === 0) {
    return (
      <div className="container-custom py-32 text-center">
        <ShoppingBag
          size={60}
          className="mx-auto text-gray-200 dark:text-gray-700 mb-6"
        />
        <h2 className="section-title mb-4">Your Cart is Empty</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Discover our newest collection and add items to your cart.
        </p>
        <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
          Continue Shopping <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-10">
      <h1 className="section-title mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header row */}
          <div className="hidden md:grid grid-cols-12 text-xs font-semibold tracking-widest uppercase text-gray-400 pb-3 border-b dark:border-gray-700">
            <span className="col-span-6">Product</span>
            <span className="col-span-2 text-center">Price</span>
            <span className="col-span-2 text-center">Quantity</span>
            <span className="col-span-2 text-right">Total</span>
          </div>

          {cart.map((item) => (
            <div
              key={item.variantId}
              className="grid grid-cols-12 gap-4 items-start py-4 border-b dark:border-gray-700"
            >
              {/* Image + name */}
              <div className="col-span-12 md:col-span-6 flex gap-4">
                <Link to={`/shop/${item.productId}`}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-24 object-cover bg-gray-50 dark:bg-gray-800 flex-shrink-0"
                  />
                </Link>
                <div>
                  <h3 className="text-sm font-medium leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {item.color} / Size {item.size}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.variantId)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors mt-2 flex items-center gap-1"
                  >
                    <X size={12} /> Remove
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="col-span-4 md:col-span-2 text-sm md:text-center">
                <span className="md:hidden text-xs text-gray-400 mr-2">
                  Price:
                </span>
                {formatPrice(item.price)}
              </div>

              {/* Quantity */}
              <div className="col-span-4 md:col-span-2 flex md:justify-center">
                <div className="flex items-center border border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() =>
                      updateQuantity(item.variantId, item.quantity - 1)
                    }
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-8 text-center text-sm">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.variantId, item.quantity + 1)
                    }
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className="col-span-4 md:col-span-2 text-sm font-semibold md:text-right">
                <span className="md:hidden text-xs text-gray-400 mr-2 font-normal">
                  Total:
                </span>
                {formatPrice(item.price * item.quantity)}
              </div>
            </div>
          ))}

          <div className="flex justify-between pt-2">
            <Link
              to="/shop"
              className="text-sm text-gray-500 hover:text-accent underline"
            >
              ← Continue Shopping
            </Link>
            <button
              onClick={clearCart}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              Clear Cart
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 space-y-4 sticky top-24">
            <h2 className="text-sm font-semibold tracking-widest uppercase border-b dark:border-gray-700 pb-4">
              Order Summary
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>
                  Subtotal ({cart.reduce((s, c) => s + c.quantity, 0)} items)
                </span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Shipping</span>
                <span
                  className={
                    shippingCost === 0
                      ? "text-green-600 dark:text-green-400"
                      : ""
                  }
                >
                  {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                </span>
              </div>
              {subtotal > 0 && subtotal < 1000 && (
                <p className="text-xs text-gray-400 bg-brand-light dark:bg-gray-800 p-2">
                  Add {formatPrice(1000 - subtotal)} more for free shipping
                </p>
              )}
              <div className="flex justify-between font-bold text-base border-t dark:border-gray-700 pt-3">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <Link
              to="/checkout"
              className="btn-primary w-full text-center flex items-center justify-center gap-2"
            >
              Proceed to Checkout <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
