import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Menu } from "lucide-react";
import AdminSidebar from "../components/admin/Sidebar";

export default function AdminLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center px-4">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Open admin menu"
          >
            <Menu size={20} />
          </button>
          <p className="text-sm font-semibold ml-3 text-gray-700 dark:text-gray-200">
            Admin Panel
          </p>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
