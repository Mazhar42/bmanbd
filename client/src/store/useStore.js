import { create } from "zustand";
import { persist } from "zustand/middleware";

const useStore = create(
  persist(
    (set, get) => ({
      // ─── Theme ─────────────────────────────────────────────
      theme: "light",
      initTheme: () => {
        const saved = localStorage.getItem("bman-theme") || "light";
        set({ theme: saved });
      },
      toggleTheme: () => {
        const next = get().theme === "light" ? "dark" : "light";
        localStorage.setItem("bman-theme", next);
        set({ theme: next });
      },

      // ─── Auth / User ────────────────────────────────────────
      user: null,
      token: null,
      csrfToken: null,
      setCsrfToken: (csrfToken) => set({ csrfToken }),
      setUser: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),

      // ─── Cart ───────────────────────────────────────────────
      cart: [],
      cartOpen: false,
      setCartOpen: (open) => set({ cartOpen: open }),

      addToCart: (item) => {
        const { cart } = get();
        const existing = cart.find((c) => c.variantId === item.variantId);
        if (existing) {
          set({
            cart: cart.map((c) =>
              c.variantId === item.variantId
                ? { ...c, quantity: c.quantity + item.quantity }
                : c,
            ),
          });
        } else {
          set({ cart: [...cart, item] });
        }
      },

      removeFromCart: (variantId) => {
        set({ cart: get().cart.filter((c) => c.variantId !== variantId) });
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity < 1) return get().removeFromCart(variantId);
        set({
          cart: get().cart.map((c) =>
            c.variantId === variantId ? { ...c, quantity } : c,
          ),
        });
      },

      clearCart: () => set({ cart: [] }),

      get cartTotal() {
        return get().cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
      },

      get cartCount() {
        return get().cart.reduce((sum, c) => sum + c.quantity, 0);
      },

      // ─── Wishlist ───────────────────────────────────────────
      wishlist: [],

      toggleWishlist: (product) => {
        const { wishlist } = get();
        const exists = wishlist.find((w) => w._id === product._id);
        if (exists) {
          set({ wishlist: wishlist.filter((w) => w._id !== product._id) });
        } else {
          set({ wishlist: [...wishlist, product] });
        }
      },

      isWishlisted: (productId) => {
        return get().wishlist.some((w) => w._id === productId);
      },

      // ─── Recently Viewed ────────────────────────────────────
      recentlyViewed: [],

      addRecentlyViewed: (product) => {
        const { recentlyViewed } = get();
        const filtered = recentlyViewed.filter((p) => p._id !== product._id);
        set({ recentlyViewed: [product, ...filtered].slice(0, 8) });
      },
    }),
    {
      name: "bman-store",
      partialize: (state) => ({
        cart: state.cart,
        wishlist: state.wishlist,
        recentlyViewed: state.recentlyViewed,
        user: state.user,
        token: state.token,
        theme: state.theme,
      }),
    },
  ),
);

export default useStore;
