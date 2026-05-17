import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  X,
  ShoppingBag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { productApi, orderApi } from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatPrice, debounce } from "../../utils/helpers";

const PAYMENT_METHODS = [
  { id: "cash_pos", label: "Cash" },
  { id: "card", label: "Card" },
  { id: "bkash", label: "bKash" },
  { id: "nagad", label: "Nagad" },
];

function ReceiptModal({ order, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
      >
        <div className="bg-black dark:bg-gray-900 text-white p-5 text-center">
          <h2 className="text-lg font-bold tracking-widest">BMAN</h2>
          <p className="text-xs text-gray-400 mt-0.5">Point of Sale Receipt</p>
        </div>
        <div className="p-5 font-mono text-sm space-y-3">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Order #</span>
            <span>{order.orderNumber}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Date</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
          <div className="border-t border-dashed dark:border-gray-600 pt-3 space-y-1">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-xs">
                  {item.name} ({item.size}/{item.color}) ×{item.quantity}
                </span>
                <span className="text-xs font-semibold">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed dark:border-gray-600 pt-3 space-y-1 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 dark:text-white text-base">
              <span>TOTAL</span>
              <span>{formatPrice(order.totalPrice)}</span>
            </div>
          </div>
          <div className="border-t border-dashed dark:border-gray-600 pt-3 text-xs text-center text-gray-400">
            <p>
              Payment: {order.paymentMethod?.replace("_", " ")?.toUpperCase()}
            </p>
            <p className="mt-2">Thank you for shopping at BMAN!</p>
          </div>
        </div>
        <div className="p-5 border-t dark:border-gray-700">
          <button onClick={onClose} className="btn-primary w-full text-sm">
            New Sale
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminPOS() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [payment, setPayment] = useState("cash_pos");
  const [discount, setDiscount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef();

  const doSearch = debounce(async (q) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await productApi.getAll({ search: q, limit: 10 });
      setSearchResults(res.data.products || []);
    } finally {
      setSearching(false);
    }
  }, 300);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    doSearch(e.target.value);
  };

  const addVariantToCart = (product, variant) => {
    const key = variant._id;
    setCart((prev) => {
      const existing = prev.find((i) => i.variantId === key);
      if (existing) {
        return prev.map((i) =>
          i.variantId === key ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          variantId: key,
          productId: product._id,
          name: product.name,
          size: variant.size,
          color: variant.color,
          image: product.images?.[0] || "",
          price: variant.discountPrice || variant.price,
          stock: variant.stock,
          qty: 1,
          sku: variant.sku,
        },
      ];
    });
    setSearch("");
    setSearchResults([]);
    inputRef.current?.focus();
  };

  const updateQty = (variantId, delta) => {
    setCart((prev) =>
      prev.map((i) =>
        i.variantId === variantId
          ? { ...i, qty: Math.max(1, i.qty + delta) }
          : i,
      ),
    );
  };

  const removeItem = (variantId) =>
    setCart((prev) => prev.filter((i) => i.variantId !== variantId));
  const clearCart = () => {
    setCart([]);
    setDiscount("");
    setCustomerName("");
    setCustomerPhone("");
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmt = Math.min(Number(discount) || 0, subtotal);
  const total = subtotal - discountAmt;

  const saleMut = useMutation({
    mutationFn: () =>
      orderApi.createPOS({
        items: cart.map((i) => ({
          product: i.productId,
          variant: i.variantId,
          name: i.name,
          size: i.size,
          color: i.color,
          image: i.image,
          price: i.price,
          quantity: i.qty,
        })),
        paymentMethod: payment,
        discount: discountAmt,
        customerName: customerName || "Walk-in Customer",
        customerPhone,
      }),
    onSuccess: (res) => {
      setReceipt(res.data.order);
      clearCart();
      toast.success("Sale processed!");
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Error processing sale"),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          POS Terminal
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Point of Sale — walk-in customers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
        {/* Left: Product Search */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              ref={inputRef}
              type="text"
              className="input pl-10"
              placeholder="Search product name or SKU..."
              value={search}
              onChange={handleSearch}
              autoFocus
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </div>

          {/* Search results */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="card rounded-xl overflow-hidden"
              >
                {searchResults.map((product) => (
                  <div
                    key={product._id}
                    className="border-b dark:border-gray-700 last:border-0"
                  >
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50">
                      <p className="text-sm font-semibold">{product.name}</p>
                      <p className="text-xs text-gray-400">
                        {product.category?.name}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 px-4 py-2">
                      {product.variants?.map((v) => (
                        <button
                          key={v._id}
                          onClick={() => addVariantToCart(product, v)}
                          disabled={v.stock === 0}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            v.stock === 0
                              ? "opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-700"
                              : "hover:border-accent hover:text-accent bg-white dark:bg-gray-800"
                          }`}
                        >
                          {v.size}/{v.color}
                          <span className="ml-1 text-gray-400">
                            {formatPrice(v.discountPrice || v.price)}
                          </span>
                          {v.stock === 0 && (
                            <span className="ml-1 text-red-400">OOS</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cart items */}
          {cart.length > 0 ? (
            <div className="card rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b dark:border-gray-700 flex justify-between items-center">
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">
                  Cart — {cart.length} items
                </p>
                <button
                  onClick={clearCart}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Clear all
                </button>
              </div>
              <div className="divide-y dark:divide-gray-700">
                {cart.map((item) => (
                  <div
                    key={item.variantId}
                    className="px-4 py-3 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.size} / {item.color} · {formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(item.variantId, -1)}
                        className="w-6 h-6 rounded border dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.variantId, 1)}
                        disabled={item.qty >= item.stock}
                        className="w-6 h-6 rounded border dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                    <p className="w-20 text-right text-sm font-semibold">
                      {formatPrice(item.price * item.qty)}
                    </p>
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="text-gray-300 hover:text-red-400 transition-colors ml-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300 dark:text-gray-600">
              <ShoppingBag size={56} strokeWidth={1} />
              <p className="mt-3 text-sm">Search and add products above</p>
            </div>
          )}
        </div>

        {/* Right: Checkout panel */}
        <div className="lg:col-span-2">
          <div className="card rounded-xl p-5 space-y-5 sticky top-6">
            <h2 className="text-sm font-semibold tracking-widest uppercase">
              Checkout
            </h2>

            {/* Customer info */}
            <div className="space-y-2">
              <input
                className="input text-sm"
                placeholder="Customer name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <input
                className="input text-sm"
                placeholder="Phone number (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            {/* Discount */}
            <div>
              <label className="block text-xs font-semibold mb-1">
                Discount (৳)
              </label>
              <input
                type="number"
                className="input text-sm"
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                min="0"
                max={subtotal}
              />
            </div>

            {/* Payment method */}
            <div>
              <label className="block text-xs font-semibold mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPayment(m.id)}
                    className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                      payment === m.id
                        ? "bg-accent/10 border-accent text-accent"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Discount</span>
                  <span>− {formatPrice(discountAmt)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t dark:border-gray-600 pt-2 mt-1">
                <span>TOTAL</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Process sale */}
            <button
              onClick={() => saleMut.mutate()}
              disabled={cart.length === 0 || saleMut.isPending}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm"
            >
              <Receipt size={16} />
              {saleMut.isPending
                ? "Processing…"
                : `Process Sale · ${formatPrice(total)}`}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {receipt && (
          <ReceiptModal
            key="receipt"
            order={receipt}
            onClose={() => setReceipt(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
