import { Link } from "react-router-dom";
import { X, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useStore from "../../store/useStore";
import { formatPrice } from "../../utils/helpers";

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, removeFromCart, updateQuantity } =
    useStore();
  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const shippingCost = subtotal > 0 && subtotal < 1000 ? 80 : 0;

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setCartOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b dark:border-gray-700">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} />
                <h2 className="font-medium text-sm tracking-widest uppercase">
                  Cart ({cart.length} {cart.length === 1 ? "item" : "items"})
                </h2>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1.5 hover:text-accent transition-colors"
                aria-label="Close cart"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <ShoppingBag
                    size={48}
                    className="text-gray-200 dark:text-gray-700 mb-4"
                  />
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                    Your cart is empty
                  </p>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="btn-outline text-xs"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.variantId} className="flex gap-4">
                    <Link
                      to={`/shop/${item.productId}`}
                      onClick={() => setCartOpen(false)}
                      className="flex-shrink-0"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-24 object-cover bg-gray-50 dark:bg-gray-800"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-medium leading-tight line-clamp-2 pr-2">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.variantId)}
                          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                          aria-label="Remove"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {item.color} / {item.size}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-gray-200 dark:border-gray-600">
                          <button
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity - 1)
                            }
                            className="px-2.5 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-3 text-sm min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity + 1)
                            }
                            className="px-2.5 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="text-sm font-semibold">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="px-6 py-5 border-t dark:border-gray-700 space-y-4">
                {/* Shipping notice */}
                {subtotal < 1000 && (
                  <div className="bg-brand-light dark:bg-gray-800 px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                    Add{" "}
                    <span className="font-semibold text-brand dark:text-white">
                      {formatPrice(1000 - subtotal)}
                    </span>{" "}
                    more for free shipping
                  </div>
                )}

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Shipping</span>
                    <span>
                      {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t dark:border-gray-700">
                    <span>Total</span>
                    <span>{formatPrice(subtotal + shippingCost)}</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="space-y-2">
                  <Link
                    to="/checkout"
                    onClick={() => setCartOpen(false)}
                    className="btn-primary w-full text-center flex items-center justify-center gap-2"
                  >
                    Checkout <ArrowRight size={15} />
                  </Link>
                  <Link
                    to="/cart"
                    onClick={() => setCartOpen(false)}
                    className="btn-outline w-full text-center block"
                  >
                    View Cart
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
