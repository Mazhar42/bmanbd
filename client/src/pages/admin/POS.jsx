import { useState, useRef, useEffect, useMemo } from "react";
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

function ProductSelectModal({ product, onClose, onAdd }) {
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.[0] || null,
  );
  const [qty, setQty] = useState(1);

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h3 className="font-bold">{product.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
              Select Variant
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {product.variants?.map((v) => {
                const isSelected = selectedVariant?._id === v._id;
                const price = v.discountPrice || v.price;
                return (
                  <button
                    key={v._id}
                    onClick={() => setSelectedVariant(v)}
                    disabled={v.stock === 0}
                    className={`text-left p-3 rounded-lg border ${isSelected ? "border-accent bg-accent/10" : "border-gray-200 dark:border-gray-700"} ${v.stock === 0 ? "opacity-40 cursor-not-allowed" : "hover:border-accent/50"}`}
                  >
                    <div className="text-sm font-semibold">
                      {v.size} / {v.color}
                    </div>
                    <div className="text-xs text-gray-500 flex justify-between mt-1">
                      <span>{formatPrice(price)}</span>
                      <span>
                        {v.stock > 0 ? `In stock: ${v.stock}` : "OOS"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          {selectedVariant && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-10 h-10 rounded-lg border dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Minus size={16} />
                </button>
                <div className="w-16 h-10 rounded-lg border dark:border-gray-600 flex items-center justify-center font-bold">
                  {qty}
                </div>
                <button
                  onClick={() =>
                    setQty(Math.min(selectedVariant.stock, qty + 1))
                  }
                  disabled={qty >= selectedVariant.stock}
                  className="w-10 h-10 rounded-lg border dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              if (selectedVariant) {
                onAdd(selectedVariant, qty);
                onClose();
              }
            }}
            disabled={!selectedVariant || selectedVariant.stock === 0}
            className="btn-primary w-full py-3 mt-4"
          >
            Add to Cart
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
  const [selectedProduct, setSelectedProduct] = useState(null);

  const inputRef = useRef();

  const { data: displayProductsData, isLoading: isLoadingDisplay } = useQuery({
    queryKey: ["posProducts"],
    queryFn: () =>
      productApi
        .getAll({ limit: 40, status: "active" })
        .then((res) => res.data),
  });

  const doSearch = useMemo(
    () =>
      debounce(async (q) => {
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
      }, 300),
    [],
  );

  const handleSearch = (e) => {
    setSearch(e.target.value);
    doSearch(e.target.value);
  };

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && search.trim()) {
      e.preventDefault();
      setSearching(true);
      try {
        const res = await productApi.getAll({ search: search, limit: 5 });
        const products = res.data.products || [];

        let exactMatchVariant = null;
        let parentProduct = null;

        for (const p of products) {
          const match = p.variants?.find(
            (v) => v.barcode === search || v.sku === search,
          );
          if (match) {
            exactMatchVariant = match;
            parentProduct = p;
            break;
          }
        }

        if (exactMatchVariant) {
          if (exactMatchVariant.stock > 0) {
            addVariantToCartHelper(parentProduct, exactMatchVariant, 1);
            setSearch("");
            setSearchResults([]);
            toast.success(`Scanned ${parentProduct.name}`);
          } else {
            toast.error("Item is out of stock");
          }
        } else if (products.length === 1) {
          setSelectedProduct(products[0]);
        }
      } finally {
        setSearching(false);
      }
    }
  };

  const addVariantToCartHelper = (product, variant, qty = 1) => {
    const key = variant._id;
    setCart((prev) => {
      const existing = prev.find((i) => i.variantId === key);
      if (existing) {
        return prev.map((i) =>
          i.variantId === key ? { ...i, qty: i.qty + qty } : i,
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
          qty: qty,
          sku: variant.sku,
        },
      ];
    });
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

  const displayProducts = search.trim()
    ? searchResults
    : displayProductsData?.products || [];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-3rem)] -m-4 lg:-m-8">
      <div className="p-4 lg:p-6 border-b dark:border-gray-800 bg-white dark:bg-gray-950 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            POS Terminal
          </h1>
          <p className="text-xs text-gray-500">Point of Sale — Branch</p>
        </div>
        <div className="relative w-72 lg:w-96">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            ref={inputRef}
            type="text"
            className="input pl-10"
            placeholder="Search or scan barcode..."
            value={search}
            onChange={handleSearch}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-gray-50 dark:bg-gray-900">
        {/* Left: Product Grid */}
        <div className="lg:col-span-8 overflow-y-auto p-4 lg:p-6">
          {isLoadingDisplay && !search.trim() ? (
            <div className="flex justify-center pt-20">
              <LoadingSpinner />
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="text-center pt-20 text-gray-400">
              No products found.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
              {displayProducts.map((p) => {
                const image = p.images?.[0];
                return (
                  <button
                    key={p._id}
                    onClick={() => {
                      if (p.variants?.length === 1) {
                        addVariantToCartHelper(p, p.variants[0], 1);
                      } else {
                        setSelectedProduct(p);
                      }
                    }}
                    className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-transparent hover:border-accent/40 transition-all text-left flex flex-col group p-0 m-0"
                  >
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 w-full relative">
                      {image ? (
                        <img
                          src={image}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          No img
                        </div>
                      )}
                      {/* Quick stock warning overlay */}
                      {!p.variants?.some((v) => v.stock > 0) && (
                        <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center">
                          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                            OUT OF STOCK
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
                        {p.name}
                      </p>
                      <p className="text-[11px] font-semibold text-accent mt-1">
                        {p.variants?.length > 1
                          ? `${p.variants?.length} Options`
                          : formatPrice(
                              p.variants?.[0]?.discountPrice ||
                                p.variants?.[0]?.price ||
                                0,
                            )}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Checkout panel */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 border-l dark:border-gray-800 flex flex-col h-full">
          {cart.length > 0 ? (
            <div className="flex-1 overflow-y-auto divide-y dark:divide-gray-800 pt-2">
              {cart.map((item) => (
                <div key={item.variantId} className="px-4 py-3 flex gap-3">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.size} / {item.color} · {formatPrice(item.price)}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(item.variantId, -1)}
                          className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="w-6 text-center text-xs font-semibold">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.variantId, 1)}
                          disabled={item.qty >= item.stock}
                          className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                      <p className="text-xs font-semibold">
                        {formatPrice(item.price * item.qty)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="text-gray-300 hover:text-red-400 self-start p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-gray-300 dark:text-gray-600 text-center">
              <ShoppingBag size={48} strokeWidth={1.5} />
              <p className="mt-4 text-sm font-medium text-gray-400">
                Cart is empty
              </p>
              <p className="mt-1 text-xs">
                Scan barcode or tap a product
                <br />
                to add it to cart.
              </p>
            </div>
          )}

          <div className="p-4 lg:p-5 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-4">
            <div className="flex gap-3">
              <input
                className="input text-xs py-2 bg-white dark:bg-gray-800"
                placeholder="Customer Name (Optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <input
                className="input text-xs py-2 bg-white dark:bg-gray-800"
                placeholder="Phone (Optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.slice(0, 2).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPayment(m.id)}
                      className={`py-1.5 text-xs font-medium rounded border transition-colors ${payment === m.id ? "border-accent bg-accent/10 text-accent" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}
                    >
                      {m.label}
                    </button>
                  ))}
                  {PAYMENT_METHODS.slice(2).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPayment(m.id)}
                      className={`py-1.5 text-xs font-medium rounded border transition-colors ${payment === m.id ? "border-accent bg-accent/10 text-accent" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-24">
                <input
                  type="number"
                  className="input text-xs py-2 h-full bg-white dark:bg-gray-800 w-full"
                  placeholder="Disc ৳"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5 text-sm">
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
              <div className="flex justify-between font-bold text-lg pt-2 border-t dark:border-gray-700 mt-2">
                <span>TOTAL</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <button
              onClick={() => saleMut.mutate()}
              disabled={cart.length === 0 || saleMut.isPending}
              className="btn-primary w-full py-3.5 text-sm font-bold shadow-md"
            >
              {saleMut.isPending ? "Processing..." : "Process Sale"}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedProduct && (
          <ProductSelectModal
            product={selectedProduct}
            onClose={() => {
              setSelectedProduct(null);
              inputRef.current?.focus();
            }}
            onAdd={(variant, qty) =>
              addVariantToCartHelper(selectedProduct, variant, qty)
            }
          />
        )}
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
