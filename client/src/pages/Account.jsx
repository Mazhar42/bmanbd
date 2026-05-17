import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  LogIn,
  UserPlus,
  Package,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  Link2,
  Globe,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import { authApi, orderApi } from "../services/api";
import useStore from "../store/useStore";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatPrice } from "../utils/helpers";

function OAuthButtons({ mode = "login", linkedProviders, onLinked }) {
  const [loadingProvider, setLoadingProvider] = useState(null);

  const startFlow = async (provider) => {
    setLoadingProvider(provider);
    try {
      const request =
        mode === "link"
          ? authApi.startOauthLink(provider, {
              redirectPath: "/account/oauth/callback",
            })
          : authApi.startOauth(provider, {
              redirectPath: "/account/oauth/callback",
            });
      const { data } = await request;
      window.location.assign(data.url);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || `Failed to start ${provider} sign-in`,
      );
      setLoadingProvider(null);
      onLinked?.();
    }
  };

  const providers = [
    {
      key: "google",
      label: mode === "link" ? "Link Google" : "Continue with Google",
      icon: Globe,
    },
    {
      key: "facebook",
      label: mode === "link" ? "Link Facebook" : "Continue with Facebook",
      icon: Globe,
    },
  ];

  return (
    <div className="space-y-3">
      {providers.map(({ key, label, icon: Icon }) => {
        const linked = Boolean(linkedProviders?.[key]);
        return (
          <button
            key={key}
            type="button"
            onClick={() => startFlow(key)}
            disabled={loadingProvider === key || (mode === "link" && linked)}
            className="w-full btn-outline flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mode === "link" && linked ? (
              <BadgeCheck size={16} />
            ) : (
              <Icon size={16} />
            )}
            {loadingProvider === key
              ? "Redirecting..."
              : mode === "link" && linked
                ? `${key[0].toUpperCase()}${key.slice(1)} linked`
                : label}
          </button>
        );
      })}
    </div>
  );
}

function LoginForm({ onSuccess }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { setUser } = useStore();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fn = tab === "login" ? authApi.login : authApi.register;
      const { data } = await fn(form);
      setUser(data.user, data.token);
      toast.success(tab === "login" ? "Welcome back!" : "Account created!");
      const isAdminUser =
        data.user?.role === "admin" || data.user?.role === "staff";
      if (isAdminUser) {
        navigate("/admin", { replace: true });
      } else {
        onSuccess?.();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto py-20">
      <h1 className="section-title mb-8 text-center">My Account</h1>
      <div className="flex border-b dark:border-gray-700 mb-6">
        {["login", "register"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 pb-3 text-xs font-semibold tracking-widest uppercase transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-accent text-accent"
                : "border-transparent text-gray-400"
            }`}
          >
            {t === "login" ? "Sign In" : "Register"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4">
        {tab === "register" && (
          <input
            className="input"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        )}
        <input
          className="input"
          type="email"
          placeholder="Email Address"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : tab === "login" ? (
            <LogIn size={16} />
          ) : (
            <UserPlus size={16} />
          )}
          {tab === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-[10px] tracking-[0.3em] uppercase text-gray-400 bg-white dark:bg-brand-dark px-3 w-max mx-auto">
          Or continue with
        </div>
      </div>
      <OAuthButtons mode="login" />
    </div>
  );
}

function OrderStatusBadge({ status }) {
  const colors = {
    pending:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    confirmed:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    processing: "bg-indigo-100 text-indigo-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-red-100 text-red-700",
    returned: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`text-xs font-semibold px-2 py-1 capitalize rounded ${colors[status] || ""}`}
    >
      {status}
    </span>
  );
}

const TIMELINE_STEPS = [
  { key: "pending", label: "Order Placed", desc: "We've received your order." },
  {
    key: "confirmed",
    label: "Confirmed",
    desc: "Your order has been confirmed.",
  },
  {
    key: "processing",
    label: "Processing",
    desc: "Your items are being prepared.",
  },
  { key: "shipped", label: "Shipped", desc: "Your order is on the way." },
  {
    key: "delivered",
    label: "Delivered",
    desc: "Order delivered successfully.",
  },
];
const STATUS_ORDER = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

function OrderTimeline({ order }) {
  const [expanded, setExpanded] = useState(false);
  const currentIdx = STATUS_ORDER.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === "cancelled";

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleString("en-BD", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
            <Package size={18} className="text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <p className="font-mono font-semibold text-sm text-brand dark:text-white">
              {order.orderNumber}
            </p>
            <p className="text-xs text-gray-400">
              {new Date(order.createdAt).toLocaleDateString("en-BD", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}{" "}
              · {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
              {formatPrice(order.totalPrice)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.orderStatus} />
          {expanded ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Items preview (always visible) */}
      <div className="px-4 pb-4 flex flex-wrap gap-2">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            {item.image && (
              <img
                src={item.image}
                alt=""
                className="w-10 h-12 object-cover bg-gray-50 dark:bg-gray-800 rounded"
              />
            )}
            <div>
              <p className="text-xs font-medium line-clamp-1 max-w-[110px]">
                {item.name}
              </p>
              <p className="text-xs text-gray-400">
                {item.size}/{item.color} ×{item.quantity}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Expanded: Timeline */}
      {expanded && (
        <div className="border-t dark:border-gray-700 px-4 pt-4 pb-5">
          {isCancelled ? (
            <div className="flex items-center gap-3 py-3">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <Circle size={14} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  Order Cancelled
                </p>
                <p className="text-xs text-gray-400">
                  {fmtDate(order.updatedAt)}
                </p>
              </div>
            </div>
          ) : (
            <ol className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 space-y-0">
              {TIMELINE_STEPS.map((step, idx) => {
                const done = idx <= currentIdx;
                const active = idx === currentIdx;
                const timestamp =
                  idx === 0
                    ? fmtDate(order.createdAt)
                    : idx === currentIdx &&
                        order.deliveredAt &&
                        step.key === "delivered"
                      ? fmtDate(order.deliveredAt)
                      : idx === currentIdx
                        ? fmtDate(order.updatedAt)
                        : null;

                return (
                  <li key={step.key} className="ml-5 pb-6 last:pb-0">
                    {/* Dot */}
                    <span
                      className={`absolute -left-[13px] flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-white dark:ring-gray-800 ${
                        done
                          ? "bg-accent text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                      }`}
                    >
                      {done ? <CheckCircle2 size={13} /> : <Circle size={11} />}
                    </span>
                    <div className={`${done ? "" : "opacity-40"}`}>
                      <p
                        className={`text-sm font-semibold ${
                          active
                            ? "text-accent"
                            : "text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {step.label}
                        {active && (
                          <span className="ml-2 text-xs font-normal text-accent">
                            — Current
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {step.desc}
                      </p>
                      {timestamp && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Clock size={10} />
                          {timestamp}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {/* Shipping info */}
          {order.source !== "pos" && (
            <div className="mt-5 pt-4 border-t dark:border-gray-700 text-xs text-gray-500 space-y-1">
              <p>
                <span className="font-semibold text-gray-600 dark:text-gray-400">
                  Deliver to:
                </span>{" "}
                {order.shippingAddress?.fullName},{" "}
                {order.shippingAddress?.street}, {order.shippingAddress?.city}
              </p>
              <p>
                <span className="font-semibold text-gray-600 dark:text-gray-400">
                  Payment:
                </span>{" "}
                <span className="capitalize">
                  {order.paymentMethod?.replace(/_/g, " ")}
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SetPasswordBanner() {
  const { user, setUser, token } = useStore();
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6)
      return toast.error("Password must be at least 6 characters");
    if (newPassword !== confirmPassword)
      return toast.error("Passwords don't match");
    setLoading(true);
    try {
      const { data } = await authApi.setPassword({ newPassword });
      setUser(data.user, token);
      toast.success("Password set successfully!");
      setOpen(false);
    } catch {
      toast.error("Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  if (!user?.mustSetPassword) return null;

  return (
    <div className="mb-6 rounded-xl border border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-4">
      <div className="flex items-start gap-3">
        <ShieldAlert
          size={18}
          className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
        />
        <div className="flex-1">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
            Your account needs a password
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
            Set a password to sign in and manage your orders securely.
          </p>
          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="mt-2 text-xs font-semibold text-yellow-800 dark:text-yellow-300 underline underline-offset-2 hover:no-underline"
            >
              Set password now →
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="mt-3 space-y-3 max-w-sm">
              <div className="relative">
                <input
                  className="input pr-10 text-sm"
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
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <input
                className="input text-sm"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-sm flex items-center gap-1.5"
                >
                  <Lock size={13} />
                  {loading ? "Saving…" : "Set Password"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-outline text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function AccountDashboard() {
  const { user, logout } = useStore();
  const [activeTab, setActiveTab] = useState("orders");

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear local session even if the logout request fails.
    }
    logout();
  };

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["myOrders"],
    queryFn: () => orderApi.getMyOrders().then((r) => r.data.orders),
  });

  return (
    <div className="container-custom py-10">
      <SetPasswordBanner />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">My Account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Welcome,{" "}
            <span className="font-medium text-brand dark:text-white">
              {user.name}
            </span>
          </p>
        </div>
        <button onClick={handleLogout} className="btn-outline text-sm">
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b dark:border-gray-700 mb-8 gap-6">
        {[
          { key: "orders", label: "My Orders", icon: Package },
          { key: "profile", label: "Profile", icon: MapPin },
          { key: "security", label: "Security", icon: Link2 },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 pb-3 text-xs font-semibold tracking-widest uppercase border-b-2 -mb-px transition-colors ${
              activeTab === key
                ? "border-accent text-accent"
                : "border-transparent text-gray-400 hover:text-brand dark:hover:text-white"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "orders" && (
        <>
          {isLoading ? (
            <LoadingSpinner className="py-20" />
          ) : ordersData?.length === 0 ? (
            <div className="text-center py-20">
              <Package
                size={48}
                className="mx-auto text-gray-200 dark:text-gray-700 mb-4"
              />
              <p className="text-gray-500 dark:text-gray-400">No orders yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ordersData?.map((order) => (
                <OrderTimeline key={order._id} order={order} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "profile" && <ProfileForm user={user} />}
      {activeTab === "security" && <SecurityPanel user={user} />}
    </div>
  );
}

function SecurityPanel({ user }) {
  return (
    <div className="max-w-xl space-y-6">
      <div className="card p-5 space-y-3">
        <div>
          <p className="text-sm font-semibold text-brand dark:text-white">
            Linked sign-in providers
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Link Google or Facebook so you can sign in without a password.
          </p>
        </div>
        <OAuthButtons mode="link" linkedProviders={user.linkedProviders} />
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-600 dark:text-gray-300">
        <p className="font-medium text-brand dark:text-white mb-2">
          Account linking rules
        </p>
        <ul className="space-y-1 text-sm">
          <li>
            Google or Facebook sign-in will attach to your existing account when
            the provider email matches your account email.
          </li>
          <li>
            A provider account cannot be linked to more than one BMAN account.
          </li>
          <li>
            Linking is blocked if the provider email already belongs to another
            user account.
          </li>
        </ul>
      </div>
    </div>
  );
}

function ProfileForm({ user }) {
  const [form, setForm] = useState({
    name: user.name || "",
    phone: user.phone || "",
  });
  const [loading, setLoading] = useState(false);
  const { setUser, token } = useStore();

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.updateMe(form);
      setUser(data.user, token);
      toast.success("Profile updated");
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={save} className="max-w-md space-y-4">
      <div>
        <label className="text-xs font-medium tracking-widest uppercase block mb-2">
          Name
        </label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div>
        <label className="text-xs font-medium tracking-widest uppercase block mb-2">
          Email
        </label>
        <input
          className="input bg-gray-50 dark:bg-gray-800"
          value={user.email}
          disabled
        />
      </div>
      <div>
        <label className="text-xs font-medium tracking-widest uppercase block mb-2">
          Phone
        </label>
        <input
          className="input"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
      </div>
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? <LoadingSpinner size="sm" /> : "Save Changes"}
      </button>
    </form>
  );
}

export default function Account() {
  const user = useStore((s) => s.user);

  if (!user) return <LoginForm />;
  if (user.role === "admin" || user.role === "staff") {
    return <Navigate to="/admin" replace />;
  }

  return <AccountDashboard />;
}
