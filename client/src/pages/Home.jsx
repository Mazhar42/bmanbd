import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { productApi } from "../services/api";
import ProductCard from "../components/product/ProductCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import useStore from "../store/useStore";

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative h-[34vh] min-h-[220px] overflow-hidden bg-gray-100 dark:bg-gray-900 md:h-[80vh] md:min-h-[520px]">
      <img
        src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop"
        alt="BMAN Journey"
        className="absolute inset-0 w-full h-full object-cover object-top"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center text-white px-4"
        >
          <h1 className="text-5xl sm:text-6xl md:text-[10rem] font-display font-bold tracking-[0.15em] uppercase hero-text-shadow leading-none">
            JOUR
            <span className="inline-block -rotate-12 text-accent">/</span>
            EY
          </h1>
          <p className="hidden md:block text-sm md:text-base font-light tracking-[0.3em] uppercase mt-6 text-white/80">
            Crafted for the modern man
          </p>
          <div className="hidden md:flex gap-4 justify-center mt-8">
            <Link
              to="/shop"
              className="btn-primary bg-white text-brand hover:bg-accent hover:text-white"
            >
              Shop Now
            </Link>
            <Link
              to="/shop?isNewArrival=true"
              className="btn-outline border-white text-white hover:bg-white hover:text-brand"
            >
              New Arrivals
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Featured Products ─────────────────────────────────────────────────────────
const DESKTOP_TABS = [
  { label: "All", filter: { isFeatured: "true" } },
  { label: "Shirt", filter: { isFeatured: "true", category: "shirt" } },
  { label: "Pant", filter: { isFeatured: "true", category: "pant" } },
  { label: "Panjabi", filter: { isFeatured: "true", category: "panjabi" } },
  { label: "T-shirts", filter: { isNewArrival: "true" } },
  { label: "Polo", filter: { isNewArrival: "true" } },
  { label: "Shorts", filter: { isNewArrival: "true" } },
];

const MOBILE_TABS = [
  { label: "Shirt", filter: { isFeatured: "true", category: "shirt" } },
  { label: "Pant", filter: { isFeatured: "true", category: "pant" } },
  { label: "Panjabi", filter: { isFeatured: "true", category: "panjabi" } },
  { label: "T-shirts", filter: { isNewArrival: "true" } },
  { label: "Polo", filter: { isNewArrival: "true" } },
  { label: "Shorts", filter: { isNewArrival: "true" } },
  { label: "Trending", filter: { isTrending: "true" } },
  { label: "Featured", filter: { isFeatured: "true" } },
];

function FeaturedProducts() {
  const [activeDesktopTab, setActiveDesktopTab] = useState(0);
  const [activeMobileTab, setActiveMobileTab] = useState(0);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const tab = isMobile
    ? MOBILE_TABS[activeMobileTab]
    : DESKTOP_TABS[activeDesktopTab];

  const { data, isLoading } = useQuery({
    queryKey: ["featured", isMobile ? "mobile" : "desktop", tab.label],
    queryFn: () =>
      productApi
        .getAll({ ...tab.filter, limit: 8 })
        .then((r) => r.data.products),
  });

  return (
    <section className="container-custom py-16">
      {/* Desktop tabs */}
      <div className="hidden md:flex items-center gap-6 mb-10 border-b dark:border-gray-700">
        {DESKTOP_TABS.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setActiveDesktopTab(i)}
            className={`pb-3 text-xs font-semibold tracking-widest uppercase transition-all border-b-2 -mb-px ${
              activeDesktopTab === i
                ? "border-brand dark:border-white text-brand dark:text-white"
                : "border-transparent text-gray-400 hover:text-brand dark:hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Mobile category pills: 3 columns x 2 rows, excludes "All" */}
      <div className="md:hidden grid grid-cols-4 gap-2 mb-8 max-w-xs mx-auto place-items-center">
        {MOBILE_TABS.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setActiveMobileTab(i)}
            className={`justify-self-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              activeMobileTab === i
                ? "bg-brand text-white border-brand"
                : "bg-white text-brand border-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
          {data?.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      <div className="text-center mt-12">
        <Link to="/shop" className="btn-outline inline-flex items-center gap-2">
          View All Products <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}

// ─── Seasonal Favs ────────────────────────────────────────────────────────────
const SEASONAL_CATEGORIES = [
  {
    label: "SHIRT",
    subtitle: "Shop the Collection",
    to: "/shop?category=shirt",
    image:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop",
  },
  {
    label: "PANT",
    subtitle: "Shop the Collection",
    to: "/shop?category=pant",
    image:
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop",
  },
  {
    label: "PANJABI",
    subtitle: "Shop the Collection",
    to: "/shop?category=panjabi",
    image:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop",
  },
  {
    label: "T-SHIRT",
    subtitle: "Shop the Collection",
    to: "/shop?category=t-shirt",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop",
  },
  {
    label: "POLO",
    subtitle: "Shop the Collection",
    to: "/shop?category=polo",
    image:
      "https://images.unsplash.com/photo-1563630381190-77c336ea545a?w=800&auto=format&fit=crop",
  },
  {
    label: "SHORTS",
    subtitle: "Shop the Collection",
    to: "/shop?category=shorts",
    image:
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop",
  },
  {
    label: "NEW ARRIVALS",
    subtitle: "Explore the Latest",
    to: "/shop?isNewArrival=true",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop",
  },
  {
    label: "LOOKBOOKS",
    subtitle: "See the Looks",
    to: "/shop?isFeatured=true",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
  },
];

function SeasonalFavs() {
  return (
    <section className="container-custom py-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="section-title">Seasonal Favs</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {SEASONAL_CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Link
              to={cat.to}
              className="group relative block overflow-hidden aspect-[4/5]"
            >
              <img
                src={cat.image}
                alt={cat.label}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="text-xs text-white/70 tracking-widest uppercase mb-1">
                  {cat.subtitle}
                </p>
                <h3 className="text-2xl font-display font-bold text-white tracking-widest">
                  {cat.label}
                </h3>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── New Drops / Trending ─────────────────────────────────────────────────────
function NewDropsTrending() {
  const [active, setActive] = useState("new");

  const { data, isLoading } = useQuery({
    queryKey: ["newDrops", active],
    queryFn: () =>
      productApi
        .getAll({
          [active === "new" ? "isNewArrival" : "isTrending"]: "true",
          limit: 4,
        })
        .then((r) => r.data.products),
  });

  return (
    <section className="container-custom py-8">
      {/* Toggle buttons */}
      <div className="flex justify-center gap-4 mb-10">
        <button
          onClick={() => setActive("new")}
          className={`btn-${active === "new" ? "primary" : "outline"} text-xs`}
        >
          New Drops
        </button>
        <button
          onClick={() => setActive("trending")}
          className={`btn-${active === "trending" ? "primary" : "outline"} text-xs`}
        >
          Most Trending
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
          {data?.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Promo Banners ────────────────────────────────────────────────────────────
function PromoBanners() {
  return (
    <section className="container-custom py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Banner 1 */}
        <Link
          to="/shop?isFeatured=true"
          className="group relative overflow-hidden aspect-[4/3]"
        >
          <img
            src="https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&auto=format&fit=crop"
            alt="Moments in Poise"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
          <div className="absolute bottom-8 left-8">
            <h3 className="font-display text-4xl font-bold text-white leading-tight">
              MOMENTS
              <br />
              IN POISE
            </h3>
            <span className="inline-flex items-center gap-2 text-white text-xs tracking-widest uppercase mt-4 border-b border-white pb-0.5 hover:text-accent hover:border-accent transition-colors">
              Explore <ArrowRight size={13} />
            </span>
          </div>
        </Link>

        {/* Banner 2 */}
        <Link
          to="/shop?isNewArrival=true"
          className="group relative overflow-hidden aspect-[4/3]"
        >
          <img
            src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&auto=format&fit=crop"
            alt="Bold"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-black/50 to-transparent" />
          <div className="absolute bottom-8 right-8 text-right">
            <h3 className="font-display text-5xl font-bold text-white leading-tight">
              B<span className="text-accent">O</span>LD
            </h3>
            <span className="inline-flex items-center gap-2 text-white text-xs tracking-widest uppercase mt-4 border-b border-white pb-0.5 hover:text-accent hover:border-accent transition-colors">
              Shop New <ArrowRight size={13} />
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}

// ─── Recently Viewed ─────────────────────────────────────────────────────────
function RecentlyViewed() {
  const { recentlyViewed } = useStore();
  if (!recentlyViewed?.length) return null;

  return (
    <section className="container-custom py-12">
      <h2 className="section-title mb-8">Recently Viewed</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
        {recentlyViewed.slice(0, 4).map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}

// ─── Category Showcase ────────────────────────────────────────────────────────
function CategoryShowcase() {
  const categories = [
    { label: "Panjabi", to: "/shop?category=panjabi", icon: "👘" },
    { label: "Shirt", to: "/shop?category=shirt", icon: "👔" },
    { label: "Pant", to: "/shop?category=pant", icon: "👖" },
  ];

  return (
    <section className="container-custom py-12">
      <h2 className="section-title mb-8 text-center">Show by Category</h2>
      <div className="flex justify-center gap-12">
        {categories.map((cat) => (
          <Link
            key={cat.label}
            to={cat.to}
            className="group flex flex-col items-center gap-3"
          >
            <div className="w-24 h-24 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-4xl transition-all duration-300 group-hover:bg-accent/10 group-hover:scale-110 border border-gray-100 dark:border-gray-700">
              {cat.icon}
            </div>
            <span className="text-xs font-semibold tracking-widest uppercase group-hover:text-accent transition-colors">
              {cat.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Newsletter ───────────────────────────────────────────────────────────────
function Newsletter() {
  return (
    <section className="bg-brand-light dark:bg-gray-800 py-16">
      <div className="container-custom text-center max-w-lg">
        <h2 className="section-title mb-3">Stay in the Loop</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Get the latest drops, exclusive offers, and style inspiration.
        </p>
        <form onSubmit={(e) => e.preventDefault()} className="flex gap-0">
          <input
            type="email"
            placeholder="Enter your email"
            className="input flex-1 border-r-0"
          />
          <button type="submit" className="btn-primary whitespace-nowrap">
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}

// ─── Main Home ────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturedProducts />
      <SeasonalFavs />
      <NewDropsTrending />
      <PromoBanners />
      <RecentlyViewed />
      <CategoryShowcase />
      <Newsletter />
    </>
  );
}
