import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Layers,
  Archive,
  ShoppingCart,
  Users,
  Monitor,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  X,
} from "lucide-react";
import { useState } from "react";
import useStore from "../../store/useStore";
import { authApi } from "../../services/api";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/categories", label: "Categories", icon: Layers },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/inventory", label: "Inventory", icon: Archive },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/pos", label: "POS Terminal", icon: Monitor },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default function AdminSidebar({ mobileOpen = false, onClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout API errors and still clear local auth state.
    }
    logout();
    navigate("/");
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/40 lg:hidden transition-opacity ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-brand dark:bg-gray-950 text-white transition-all duration-300 ${
          collapsed ? "lg:w-16" : "lg:w-64"
        } w-72 flex-shrink-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
          {!collapsed && (
            <div className="h-16 flex items-center flex-1">
              <img
                src="/assets/IMG_1105.PNG"
                alt="BMAN"
                className="h-full w-auto"
              />
            </div>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:text-accent transition-colors mr-1 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:text-accent transition-colors ml-auto hidden lg:inline-flex"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              size={18}
              className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* User */}
        {!collapsed && user && (
          <div className="px-4 py-4 border-b border-white/10">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-sm font-semibold mb-2">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-white/50 capitalize">{user.role}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {links.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-accent text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                } ${collapsed ? "lg:justify-center" : ""}`
              }
              title={collapsed ? label : undefined}
              onClick={onClose}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-white/10 space-y-1">
          <NavLink
            to="/admin/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
            title={collapsed ? "Settings" : undefined}
            onClick={onClose}
          >
            <Settings size={18} className="flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </NavLink>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-all w-full ${
              collapsed ? "justify-center" : ""
            }`}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
