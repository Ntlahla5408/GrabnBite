import { createContext, useContext, useEffect, useState } from "react";

import {
    addCartItem,
    getCarts,
    removeCartItem,
    updateCartItem,
    type Cart,
} from "@/services/cartService";
import { getCurrentUser } from "@/services/sessionService";

interface CartContextValue {
  carts: Cart[];
  loading: boolean;
  refreshing: boolean;
  refreshCart: () => Promise<void>;
  addItem: (menuItemId: number) => Promise<void>;
  setItemQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refreshCart = async () => {
    const userId = getCurrentUser()?.userId;
    if (!userId) {
      setCarts([]);
      setLoading(false);
      return;
    }

    try {
      setCarts(await getCarts(userId));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshCart().catch(() => setLoading(false));
  }, []);

  const mutate = async (action: (userId: number) => Promise<void>) => {
    const userId = getCurrentUser()?.userId;
    if (!userId) {
      throw new Error("Please sign in before using the cart.");
    }

    await action(userId);
    await refreshCart();
  };

  const value: CartContextValue = {
    carts,
    loading,
    refreshing,
    refreshCart: async () => {
      setRefreshing(true);
      await refreshCart();
    },
    addItem: (menuItemId) =>
      mutate((userId) => addCartItem(userId, menuItemId)),
    setItemQuantity: (cartItemId, quantity) =>
      mutate((userId) => updateCartItem(userId, cartItemId, quantity)),
    removeItem: (cartItemId) =>
      mutate((userId) => removeCartItem(userId, cartItemId)),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }
  return context;
}
