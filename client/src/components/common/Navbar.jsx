import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Heart,
  Search,
  Menu,
  X,
  Sun,
  Moon,
  User,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import useStore from "../../store/useStore";
import { settingsApi, categoryApi } from "../../services/api";

const navLinks = [
  { label: "Shirt", to: "/shop?category=shirt" },
  { label: "Pant", to: "/shop?category=pant" },
  { label: "Panjabi", to: "/shop?category=panjabi" },
  { label: "T-Shirt", to: "/shop?category=t-shirt" },
  { label: "Polo", to: "/shop?category=polo" },
  { label: "Shorts", to: "/shop?category=shorts" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { cart, wishlist, theme, toggleTheme, setCartOpen, user } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [expandedCat, setExpandedCat] = useState(null);

  const { data: siteSettings } = useQuery({
    queryKey: ["public-site-settings"],
    queryFn: async () => {
      const { data } = await settingsApi.getPublic();
      return data.settings;
    },
  });

  const { data: categoryTree } = useQuery({
    queryKey: ["category-tree"],
    queryFn: async () => {
      const { data } = await categoryApi.getTree();
      return data.tree;
    },
  });

  // Direct children of the "Men" root (the 6 main categories + any siblings)
  const menChildren =
    categoryTree?.find((n) => n.slug === "men")?.children ?? [];

  const logoSrc =
    siteSettings?.logo ||
    (theme === "dark" ? "/assets/IMG_1105.PNG" : "/assets/IMG_1106.PNG");

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchOpen(false);
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 dark:bg-brand-dark/95 backdrop-blur-sm shadow-sm"
            : "bg-white dark:bg-brand-dark"
        }`}
      >
        {siteSettings?.promotionalContent?.announcement && (
          <div className="h-8 bg-brand text-white text-xs tracking-wide flex items-center justify-center px-4 text-center">
            {siteSettings.promotionalContent.announcement}
          </div>
        )}
        <div className="container-custom">
          <div className="flex items-center justify-between h-20 md:h-20 relative">
            {/* Mobile: hamburger left | Desktop: nothing here (logo takes its natural place) */}
            <div className="flex items-center">
              <button
                className="md:hidden p-2 -ml-2"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
            </div>

            {/* Logo — centered absolutely on mobile, static in flow on desktop */}
            <Link
              to="/"
              className="absolute left-1/2 -translate-x-1/2 md:static md:left-auto md:translate-x-0 h-20 md:h-20 flex items-center"
            >
              <img
                src={logoSrc}
                alt={siteSettings?.siteName || "BMAN"}
                className="h-full w-auto"
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.to}
                  className={({ isActive }) =>
                    `text-xs font-medium tracking-widest uppercase transition-colors hover:text-accent ${
                      isActive
                        ? "text-accent"
                        : "text-gray-600 dark:text-gray-300"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Desktop-only icons */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden md:block p-1.5 hover:text-accent transition-colors"
                aria-label="Search"
              >
                <Search size={19} />
              </button>

              <button
                onClick={toggleTheme}
                className="hidden md:block p-1.5 hover:text-accent transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
              </button>

              <Link
                to="/wishlist"
                className="hidden md:inline-flex relative p-1.5 hover:text-accent transition-colors"
                aria-label="Wishlist"
              >
                <Heart size={19} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-semibold">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart — always visible */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-1.5 hover:text-accent transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag size={19} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand dark:bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-semibold">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Profile — always visible */}
              <Link
                to={
                  user
                    ? user.role === "admin" || user.role === "staff"
                      ? "/admin"
                      : "/account"
                    : "/account"
                }
                className="p-1.5 hover:text-accent transition-colors"
                aria-label="Account"
              >
                <User size={19} />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom border */}
        <div className="h-px bg-gray-100 dark:bg-gray-800" />
      </header>

      {/* Spacer */}
      <div
        className={`${siteSettings?.promotionalContent?.announcement ? "h-24 md:h-28" : "h-16 md:h-20"}`}
      />

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-gray-900 z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
                <img
                  src={logoSrc}
                  alt={siteSettings?.siteName || "BMAN"}
                  className="h-16 w-auto"
                />
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={22} />
                </button>
              </div>
              <nav className="flex-1 p-6 overflow-y-auto">
                {/* Category accordion */}
                <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-2">
                  Shop by Category
                </p>
                <div className="mb-6">
                  {menChildren.map((cat) => (
                    <div
                      key={cat._id}
                      className="border-b dark:border-gray-800"
                    >
                      {cat.children?.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between">
                            <Link
                              to={`/shop?category=${cat.slug}`}
                              onClick={() => setMobileOpen(false)}
                              className="py-3 text-sm font-medium tracking-widest uppercase hover:text-accent transition-colors"
                            >
                              {cat.name}
                            </Link>
                            <button
                              onClick={() =>
                                setExpandedCat(
                                  expandedCat === cat._id ? null : cat._id,
                                )
                              }
                              className="p-2 hover:text-accent transition-colors"
                              aria-label={
                                expandedCat === cat._id ? "Collapse" : "Expand"
                              }
                            >
                              {expandedCat === cat._id ? (
                                <X size={13} />
                              ) : (
                                <ChevronDown size={13} />
                              )}
                            </button>
                          </div>
                          <AnimatePresence initial={false}>
                            {expandedCat === cat._id && (
                              <motion.div
                                key="sub"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="pl-3 pb-3 space-y-3">
                                  {cat.children.map((sub) => (
                                    <Link
                                      key={sub._id}
                                      to={`/shop?category=${sub.slug}`}
                                      onClick={() => setMobileOpen(false)}
                                      className="block text-xs font-medium tracking-widest uppercase text-gray-500 dark:text-gray-400 hover:text-accent transition-colors"
                                    >
                                      {sub.name}
                                    </Link>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <Link
                          to={`/shop?category=${cat.slug}`}
                          onClick={() => setMobileOpen(false)}
                          className="block py-3 text-sm font-medium tracking-widest uppercase hover:text-accent transition-colors"
                        >
                          {cat.name}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>

                {/* Discover links */}
                <div className="border-t dark:border-gray-700 pt-5 mb-6">
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-2">
                    Discover
                  </p>
                  <div className="border-b dark:border-gray-800">
                    <Link
                      to="/shop?isNewArrival=true"
                      onClick={() => setMobileOpen(false)}
                      className="block py-3 text-sm font-medium tracking-widest uppercase hover:text-accent transition-colors"
                    >
                      New Arrivals
                    </Link>
                  </div>
                  <div className="border-b dark:border-gray-800">
                    <Link
                      to="/shop?isFeatured=true"
                      onClick={() => setMobileOpen(false)}
                      className="block py-3 text-sm font-medium tracking-widest uppercase hover:text-accent transition-colors"
                    >
                      Lookbook
                    </Link>
                  </div>
                </div>

                {/* Utility actions */}
                <div className="border-t dark:border-gray-700 pt-6 space-y-4">
                  <button
                    onClick={() => {
                      setSearchOpen(true);
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-3 w-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-accent transition-colors"
                  >
                    <Search size={18} />
                    Search
                  </button>

                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-3 w-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-accent transition-colors"
                  >
                    {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </button>

                  <Link
                    to="/wishlist"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-accent transition-colors"
                  >
                    <Heart size={18} />
                    Wishlist
                    {wishlist.length > 0 && (
                      <span className="ml-auto bg-accent text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                        {wishlist.length}
                      </span>
                    )}
                  </Link>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/95 dark:bg-brand-dark/95 backdrop-blur-sm z-50 flex items-start justify-center pt-32 px-4"
          >
            <button
              className="absolute top-6 right-6 p-2 hover:text-accent"
              onClick={() => setSearchOpen(false)}
            >
              <X size={24} />
            </button>
            <form onSubmit={handleSearch} className="w-full max-w-2xl">
              <p className="text-xs tracking-widest uppercase text-gray-400 mb-4 text-center">
                Search Products
              </p>
              <div className="flex border-b-2 border-brand dark:border-white">
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search..."
                  className="flex-1 bg-transparent text-xl md:text-3xl font-display py-3 focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
                />
                <button type="submit" className="pl-4 hover:text-accent">
                  <Search size={24} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
