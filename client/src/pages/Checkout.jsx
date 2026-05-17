import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, CheckCircle, Lock, LogIn } from "lucide-react";
import { orderApi, authApi } from "../services/api";
import useStore from "../store/useStore";
import { formatPrice } from "../utils/helpers";
import LoadingSpinner from "../components/common/LoadingSpinner";

const STEPS = ["Delivery", "Payment", "Confirm"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart, user, setUser, token } = useStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  // Guest inline-login (when submitted email already has an account)
  const [guestLoginMode, setGuestLoginMode] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Set-password screen (shown after guest order is placed)
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    paymentMethod: "cash_on_delivery",
    notes: "",
  });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const shippingCost = subtotal < 1000 ? 80 : 0;
  const total = subtotal + shippingCost;

  const buildOrderPayload = () => ({
    items: cart.map((c) => ({ variant: c.variantId, quantity: c.quantity })),
    shippingAddress: {
      fullName: form.fullName,
      phone: form.phone,
      street: form.street,
      city: form.city,
      state: form.state,
      postalCode: form.postalCode,
    },
    paymentMethod: form.paymentMethod,
    notes: form.notes,
  });

  const validateDelivery = () => {
    if (!form.fullName || !form.phone || !form.street || !form.city) {
      toast.error("Please fill all required fields");
      return false;
    }
    if (!user && (!form.email || !EMAIL_RE.test(form.email))) {
      toast.error("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!form.fullName || !form.phone || !form.street || !form.city) {
      return toast.error("Please fill all required fields");
    }
    if (cart.length === 0) return toast.error("Cart is empty");
    setLoading(true);
    try {
      let wasGuest = false;
      if (!user) {
        if (!form.email || !EMAIL_RE.test(form.email)) {
          setStep(0);
          setLoading(false);
          return toast.error("Please go back and enter a valid email address");
        }
        try {
          const { data } = await authApi.guestRegister({
            email: form.email,
            name: form.fullName,
            phone: form.phone,
          });
          setUser(data.user, data.token);
          wasGuest = true;
        } catch (err) {
          if (err.response?.status === 409) {
            setLoginForm((f) => ({ ...f, email: form.email }));
            setGuestLoginMode(true);
            setLoading(false);
            toast("Account found! Sign in to place your order.", {
              icon: "🔑",
            });
            return;
          }
          throw err;
        }
      }
      const { data } = await orderApi.create(buildOrderPayload());
      clearCart();
      if (wasGuest) {
        setPlacedOrder(data.order);
        setStep(3);
      } else {
        toast.success(`Order ${data.order.orderNumber} placed!`);
        navigate("/account");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Order failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const { data } = await authApi.login(loginForm);
      setUser(data.user, data.token);
      setGuestLoginMode(false);
      toast.success("Signed in! Placing your order…");
      setLoading(true);
      const res = await orderApi.create(buildOrderPayload());
      clearCart();
      toast.success(`Order ${res.data.order.orderNumber} placed!`);
      navigate("/account");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      setLoginLoading(false);
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6)
      return toast.error("Password must be at least 6 characters");
    if (newPassword !== confirmPassword)
      return toast.error("Passwords don't match");
    setPwLoading(true);
    try {
      const { data } = await authApi.setPassword({ newPassword });
      setUser(data.user, token);
      toast.success("Password set! Welcome to BMAN.");
      navigate("/account");
    } catch {
      toast.error("Failed to set password. Try from your account settings.");
    } finally {
      setPwLoading(false);
    }
  };

  if (cart.length === 0 && !placedOrder) {
    navigate("/cart");
    return null;
  }

  // ── Step 3: Success + Set Password (guest only) ──────────────────
  if (step === 3 && placedOrder) {
    return (
      <div className="container-custom py-16 max-w-lg text-center">
        <CheckCircle size={56} className="mx-auto text-green-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Order Placed!</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          Your order{" "}
          <span className="font-mono font-semibold text-brand dark:text-white">
            {placedOrder.orderNumber}
          </span>{" "}
          is confirmed.
        </p>
        <p className="text-xs text-gray-400 mb-8">
          We'll keep it updated so you can track it anytime.
        </p>
        <div className="card p-6 text-left">
          <div className="flex items-center gap-2 mb-1">
            <Lock size={16} className="text-accent" />
            <h2 className="font-semibold text-sm">Secure your account</h2>
          </div>
          <p className="text-xs text-gray-400 mb-5">
            We created a free account for{" "}
            <span className="font-medium text-brand dark:text-white">
              {form.email}
            </span>
            . Set a password so you can sign in and track your order anytime.
          </p>
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="relative">
              <input
                className="input pr-10"
                type={showPw ? "text" : "password"}
                placeholder="New password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <input
              className="input"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={pwLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {pwLoading ? <LoadingSpinner size="sm" /> : <Lock size={15} />}
              {pwLoading ? "Setting password…" : "Set Password & Go to Account"}
            </button>
          </form>
          <button
            onClick={() => navigate("/account")}
            className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline-offset-2 hover:underline"
          >
            Do this later (you'll be reminded on your account page)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-10 max-w-5xl">
      <h1 className="section-title mb-8">Checkout</h1>

      {/* Step indicator */}
      <div className="flex gap-0 mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 flex items-center">
            <div className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                  i <= step
                    ? "bg-brand dark:bg-accent text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs font-medium tracking-wide hidden sm:block ${i <= step ? "text-brand dark:text-white" : "text-gray-400"}`}
              >
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px mx-2 ${i < step ? "bg-brand dark:bg-accent" : "bg-gray-200 dark:bg-gray-700"}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          {/* ── STEP 0: Delivery ── */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-medium">Delivery Information</h2>

              {/* Email for guests */}
              {!user && (
                <div className="rounded-xl border border-accent/40 bg-accent/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold tracking-widest uppercase text-accent">
                      Your Account
                    </p>
                    <Link
                      to="/account"
                      state={{ from: "/checkout" }}
                      className="text-xs text-gray-400 hover:text-accent underline-offset-2 hover:underline flex items-center gap-1"
                    >
                      <LogIn size={12} /> Already have an account?
                    </Link>
                  </div>
                  <div>
                    <label className="text-xs font-medium tracking-widest uppercase block mb-2">
                      Email Address *
                    </label>
                    <input
                      className="input"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      We'll create a free account to track your order.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium tracking-widest uppercase block mb-2">
                    Full Name *
                  </label>
                  <input
                    className="input"
                    value={form.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium tracking-widest uppercase block mb-2">
                    Phone *
                  </label>
                  <input
                    className="input"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="01XXXXXXXXX"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium tracking-widest uppercase block mb-2">
                  Street Address *
                </label>
                <input
                  className="input"
                  value={form.street}
                  onChange={(e) => update("street", e.target.value)}
                  placeholder="House no, Road, Area"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium tracking-widest uppercase block mb-2">
                    City *
                  </label>
                  <input
                    className="input"
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    placeholder="Dhaka"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium tracking-widest uppercase block mb-2">
                    District
                  </label>
                  <input
                    className="input"
                    value={form.state}
                    onChange={(e) => update("state", e.target.value)}
                    placeholder="District"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium tracking-widest uppercase block mb-2">
                    Post Code
                  </label>
                  <input
                    className="input"
                    value={form.postalCode}
                    onChange={(e) => update("postalCode", e.target.value)}
                    placeholder="1200"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium tracking-widest uppercase block mb-2">
                  Order Notes
                </label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Any special instructions…"
                />
              </div>
              <button
                onClick={() => {
                  if (validateDelivery()) setStep(1);
                }}
                className="btn-primary"
              >
                Continue to Payment →
              </button>
            </div>
          )}

          {/* ── STEP 1: Payment ── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-medium">Payment Method</h2>
              {[
                {
                  value: "cash_on_delivery",
                  label: "Cash on Delivery",
                  desc: "Pay when you receive",
                },
                { value: "bkash", label: "bKash", desc: "Mobile banking" },
                { value: "nagad", label: "Nagad", desc: "Mobile banking" },
              ].map((method) => (
                <label
                  key={method.value}
                  className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${
                    form.paymentMethod === method.value
                      ? "border-accent bg-accent/5"
                      : "border-gray-200 dark:border-gray-700 hover:border-accent"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.value}
                    checked={form.paymentMethod === method.value}
                    onChange={(e) => update("paymentMethod", e.target.value)}
                    className="accent-accent"
                  />
                  <div>
                    <p className="text-sm font-medium">{method.label}</p>
                    <p className="text-xs text-gray-400">{method.desc}</p>
                  </div>
                </label>
              ))}
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="btn-outline">
                  ← Back
                </button>
                <button onClick={() => setStep(2)} className="btn-primary">
                  Review Order →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Confirm ── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-medium">Confirm Order</h2>

              {/* Inline login when email already exists */}
              {guestLoginMode ? (
                <div className="rounded-xl border border-accent/40 bg-accent/5 p-5 space-y-4">
                  <div className="flex items-center gap-2 text-accent">
                    <LogIn size={16} />
                    <p className="font-semibold text-sm">
                      Sign in to complete your order
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    An account already exists for{" "}
                    <span className="font-medium text-brand dark:text-white">
                      {loginForm.email}
                    </span>
                    . Sign in to place your order.
                  </p>
                  <form onSubmit={handleGuestLogin} className="space-y-3">
                    <input
                      className="input text-sm bg-gray-50 dark:bg-gray-700/50"
                      type="email"
                      value={loginForm.email}
                      readOnly
                    />
                    <div className="relative">
                      <input
                        className="input text-sm pr-10"
                        type={showLoginPw ? "text" : "password"}
                        placeholder="Your password"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm((f) => ({
                            ...f,
                            password: e.target.value,
                          }))
                        }
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showLoginPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={loginLoading || loading}
                      className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                    >
                      {loginLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <LogIn size={15} />
                      )}
                      {loginLoading ? "Signing in…" : "Sign In & Place Order"}
                    </button>
                  </form>
                  <button
                    onClick={() => {
                      setGuestLoginMode(false);
                      update("email", "");
                      setStep(0);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline-offset-2 hover:underline"
                  >
                    Use a different email address
                  </button>
                </div>
              ) : (
                <>
                  <div className="card p-4 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-1 text-gray-600 dark:text-gray-300">
                      <span>Name:</span>
                      <span className="font-medium text-brand dark:text-white">
                        {form.fullName}
                      </span>
                      {!user && (
                        <>
                          <span>Email:</span>
                          <span className="font-medium text-brand dark:text-white">
                            {form.email}
                          </span>
                        </>
                      )}
                      <span>Phone:</span>
                      <span className="font-medium text-brand dark:text-white">
                        {form.phone}
                      </span>
                      <span>Address:</span>
                      <span className="font-medium text-brand dark:text-white">
                        {form.street}, {form.city}
                      </span>
                      <span>Payment:</span>
                      <span className="font-medium text-brand dark:text-white capitalize">
                        {form.paymentMethod.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                  {!user && (
                    <p className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                      🛡️ A free account will be created for{" "}
                      <span className="font-medium text-brand dark:text-white">
                        {form.email}
                      </span>{" "}
                      — you'll set a password after ordering.
                    </p>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)} className="btn-outline">
                      ← Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="btn-primary flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" />{" "}
                          {!user ? "Creating account…" : "Placing Order…"}
                        </>
                      ) : (
                        "Place Order ✓"
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="card p-5 space-y-4 h-fit sticky top-24">
          <h3 className="text-sm font-semibold tracking-widest uppercase border-b dark:border-gray-700 pb-3">
            Your Order
          </h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.variantId} className="flex gap-3 text-sm">
                <img
                  src={item.image}
                  alt=""
                  className="w-14 h-16 object-cover flex-shrink-0 bg-gray-50"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-snug line-clamp-2">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {item.color} / {item.size} × {item.quantity}
                  </p>
                  <p className="text-xs font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t dark:border-gray-700 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Shipping</span>
              <span>
                {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t dark:border-gray-700">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
