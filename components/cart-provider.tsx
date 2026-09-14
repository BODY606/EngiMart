"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
  useState,
} from "react";
import type { CartLine, Product } from "@/lib/types";

const STORAGE_KEY = "engimart.cart";
const CART_EVENT = "engimart-cart";
const EMPTY: CartLine[] = [];

type CartContextValue = {
  items: CartLine[];
  count: number;
  subtotal: number;
  bump: boolean;
  add: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

let snapshotRaw = "";
let snapshot: CartLine[] = EMPTY;

function parseCart(raw: string | null): CartLine[] {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): CartLine[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === snapshotRaw) return snapshot;
  snapshotRaw = raw ?? "";
  snapshot = parseCart(raw);
  return snapshot;
}

function getServerSnapshot(): CartLine[] {
  return EMPTY;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CART_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CART_EVENT, onChange);
  };
}

function writeCart(next: CartLine[]) {
  const raw = JSON.stringify(next);
  snapshotRaw = raw;
  snapshot = next;
  window.localStorage.setItem(STORAGE_KEY, raw);
  window.dispatchEvent(new Event(CART_EVENT));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [bump, setBump] = useState(false);
  const bumpTimer = useRef<number>(0);

  const add = useCallback((product: Product, quantity = 1) => {
    const current = getSnapshot();
    const existing = current.find((line) => line.productId === product.id);
    const effectivePrice =
      product.sale_price !== null &&
      product.sale_price !== undefined &&
      Number(product.sale_price) > 0 &&
      Number(product.sale_price) < Number(product.base_price)
        ? Number(product.sale_price)
        : Number(product.base_price);

    writeCart(
      existing
        ? current.map((line) =>
            line.productId === product.id
              ? {
                  ...line,
                  basePrice: effectivePrice,
                  quantity: Math.min(99, line.quantity + quantity),
                }
              : line,
          )
        : [
            ...current,
            {
              productId: product.id,
              name: product.name,
              basePrice: effectivePrice,
              imageUrl: product.image_url,
              quantity,
            },
          ],
    );
    setBump(true);
    window.clearTimeout(bumpTimer.current);
    bumpTimer.current = window.setTimeout(() => setBump(false), 420);
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const current = getSnapshot();
    writeCart(
      quantity < 1
        ? current.filter((line) => line.productId !== productId)
        : current.map((line) =>
            line.productId === productId
              ? { ...line, quantity: Math.min(99, quantity) }
              : line,
          ),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    writeCart(getSnapshot().filter((line) => line.productId !== productId));
  }, []);

  const clear = useCallback(() => writeCart([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = items.reduce(
      (sum, line) => sum + line.basePrice * line.quantity,
      0,
    );
    return { items, count, subtotal, bump, add, setQuantity, remove, clear };
  }, [items, bump, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
