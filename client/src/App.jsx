import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Account from "./pages/Account";
import Wishlist from "./pages/Wishlist";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminInventory from "./pages/admin/Inventory";
import AdminOrders from "./pages/admin/Orders";
import AdminCustomers from "./pages/admin/Customers";
import AdminPOS from "./pages/admin/POS";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminSettings from "./pages/admin/Settings";
import OAuthCallback from "./pages/OAuthCallback";
import { authApi } from "./services/api";
import useStore from "./store/useStore";

function ProtectedAdmin({ children }) {
  const user = useStore((s) => s.user);
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return <Navigate to="/account" replace />;
  }
  return children;
}

export default function App() {
  const { theme, initTheme, setUser, logout, setCsrfToken } = useStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    let mounted = true;

    const bootstrapAuth = async () => {
      try {
        const csrfResponse = await authApi.getCsrfToken();
        if (mounted) {
          setCsrfToken(csrfResponse.data.csrfToken);
        }
        const { data } = await authApi.refresh();
        if (mounted) {
          setUser(data.user, data.token);
        }
      } catch {
        if (mounted) {
          logout();
        }
      }
    };

    bootstrapAuth();

    return () => {
      mounted = false;
    };
  }, [logout, setCsrfToken, setUser]);

  return (
    <Routes>
      {/* Public storefront */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="shop/:slug" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="account" element={<Account />} />
        <Route path="account/oauth/callback" element={<OAuthCallback />} />
        <Route path="wishlist" element={<Wishlist />} />
      </Route>

      {/* Admin dashboard */}
      <Route
        path="/admin"
        element={
          <ProtectedAdmin>
            <AdminLayout />
          </ProtectedAdmin>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="pos" element={<AdminPOS />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
