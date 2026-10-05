"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ClientApiError, api, errorMessage, getCartToken, setCartToken } from "@/lib/client-api";
import type { Cart } from "@/lib/types";

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  /** true while a mutation is running */
  busy: boolean;
  error: string | null;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  itemCount: number;
  refresh: () => Promise<void>;
  addItem: (productId: string, quantity?: number, openDrawer?: boolean) => Promise<boolean>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<string | null>;
  removeCoupon: () => Promise<void>;
  reset: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const loaded = useRef(false);

  const accept = useCallback((c: Cart | null) => {
    if (c?.token) setCartToken(c.token);
    setCart(c);
  }, []);

  const refresh = useCallback(async () => {
    const token = getCartToken();
    if (!token) {
      setCart(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api<Cart>("/store/cart", { cartToken: token });
      accept(data);
    } catch (e) {
      if (e instanceof ClientApiError && (e.status === 404 || e.status === 400)) {
        setCartToken(null);
        setCart(null);
      }
    } finally {
      setLoading(false);
    }
  }, [accept]);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    void refresh();
  }, [refresh]);

  const mutate = useCallback(
    async (fn: (token: string | null) => Promise<{ data: Cart }>) => {
      setBusy(true);
      setError(null);
      try {
        const { data } = await fn(getCartToken());
        accept(data);
        return true;
      } catch (e) {
        setError(errorMessage(e));
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [accept],
  );

  const addItem = useCallback(
    async (productId: string, quantity = 1, openDrawer = true) => {
      try {
        await mutate((token) =>
          api<Cart>("/store/cart/items", { method: "POST", body: { product_id: productId, quantity }, cartToken: token }),
        );
        if (openDrawer) setDrawerOpen(true);
        return true;
      } catch {
        return false;
      }
    },
    [mutate],
  );

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      await mutate((token) =>
        api<Cart>(`/store/cart/items/${itemId}`, { method: "PATCH", body: { quantity }, cartToken: token }),
      ).catch(() => undefined);
    },
    [mutate],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      await mutate((token) => api<Cart>(`/store/cart/items/${itemId}`, { method: "DELETE", cartToken: token })).catch(
        () => undefined,
      );
    },
    [mutate],
  );

  const applyCoupon = useCallback(
    async (code: string) => {
      try {
        await mutate((token) =>
          api<Cart>("/store/cart/coupon", { method: "POST", body: { code: code.trim().toUpperCase() }, cartToken: token }),
        );
        return null;
      } catch (e) {
        return errorMessage(e);
      }
    },
    [mutate],
  );

  const removeCoupon = useCallback(async () => {
    await mutate((token) => api<Cart>("/store/cart/coupon", { method: "DELETE", cartToken: token })).catch(() => undefined);
  }, [mutate]);

  const reset = useCallback(() => {
    setCartToken(null);
    setCart(null);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading,
      busy,
      error,
      drawerOpen,
      setDrawerOpen,
      itemCount: cart?.item_count ?? cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0,
      refresh,
      addItem,
      updateItem,
      removeItem,
      applyCoupon,
      removeCoupon,
      reset,
    }),
    [cart, loading, busy, error, drawerOpen, refresh, addItem, updateItem, removeItem, applyCoupon, removeCoupon, reset],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
