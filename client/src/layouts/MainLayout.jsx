import { Outlet } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import CartDrawer from "../components/cart/CartDrawer";

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-brand-dark">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
