"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

export type CartItem = {
  id: string;
  product_id: string;
  title: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  variant_id?: string | null;
  slug?: string;
};

type CartContextValue = {
  items: CartItem[];
  addToCart: (item: { productId: string; variantId?: string }) => Promise<boolean>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

async function getCartId(): Promise<string> {
  let id = sessionStorage.getItem("cart_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("cart_id", id);
  }
  return id;
}

async function postCartAction(action: string, body: Record<string, unknown> = {}) {
  const sessionId = await getCartId();
  const res = await fetch("/api/public/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
    credentials: "include",
  });
  return res;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subtotal, setSubtotal] = useState(0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    getCartId().then(async (sessionId) => {
      try {
        const res = await fetch("/api/public/cart", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setItems(data.items ?? []);
          setSubtotal(Number(data.subtotal) || 0);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  const addToCart = useCallback(async ({ productId, variantId }: { productId: string; variantId?: string }) => {
    const res = await postCartAction("add", { productId, variantId: variantId ?? null, quantity: 1 });
    if (res.ok) {
      const data = await res.json().catch(() => ({ item: null }));
      if (data.item) {
        setItems((prev) => {
          const exists = prev.find((i) => i.id === data.item.id);
          if (exists) {
            return prev.map((i) => (i.id === data.item.id ? { ...i, quantity: data.item.quantity } : i));
          }
          return [
            ...prev,
            {
              id: data.item.id,
              product_id: data.item.product_id,
              variant_id: data.item.variant_id,
              quantity: data.item.quantity,
              unit_price: data.item.unit_price,
              title: data.item.title ?? "",
              image_url: data.item.image_url ?? null,
              slug: data.item.slug ?? "",
            },
          ];
        });
      }
      return true;
    }
    return false;
  }, []);

  const removeFromCart = useCallback(async (itemId: string) => {
    await postCartAction("remove", { itemId });
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    await postCartAction("update", { itemId, quantity });
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
    );
  }, []);

  const clearCart = useCallback(async () => {
    await postCartAction("clear");
    setItems([]);
  }, []);

  useEffect(() => {
    setSubtotal(items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0));
  }, [items]);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, itemCount, subtotal, isLoading }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
