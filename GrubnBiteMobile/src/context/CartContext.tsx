import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  setPendingCheckout: (cart: Cart) => void;
  restorePendingCheckout: () => Promise<void>;
  clearPendingCheckout: () => void;
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
  const [pendingCheckout, setPendingCheckoutState] = useState<Cart | null>(
    null,
  );

  const refreshCart = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    refreshCart().catch(() => setLoading(false));
  }, []);

  const mutate = useCallback(
    async (action: (userId: number) => Promise<void>) => {
      const userId = getCurrentUser()?.userId;
      if (!userId) {
        throw new Error("Please sign in before using the cart.");
      }

      await action(userId);
      await refreshCart();
    },
    [refreshCart],
  );

  const restorePendingCheckout = useCallback(async () => {
    if (!pendingCheckout) {
      return;
    }

    const userId = getCurrentUser()?.userId;
    if (!userId) {
      return;
    }

    const snapshot = pendingCheckout;
    setPendingCheckoutState(null);

    try {
      for (const item of snapshot.items) {
        await addCartItem(userId, item.menuItemId, item.quantity);
      }

      await refreshCart();
    } catch (error) {
      setPendingCheckoutState(snapshot);
      throw error;
    }
  }, [pendingCheckout, refreshCart]);

  const refreshCartForConsumer = useCallback(async () => {
    setRefreshing(true);
    await refreshCart();
  }, [refreshCart]);

  const value = useMemo<CartContextValue>(
    () => ({
      carts,
      loading,
      refreshing,
      setPendingCheckout: (cart) => setPendingCheckoutState(cart),
      restorePendingCheckout,
      clearPendingCheckout: () => setPendingCheckoutState(null),
      refreshCart: refreshCartForConsumer,
      addItem: (menuItemId) =>
        mutate((userId) => addCartItem(userId, menuItemId)),
      setItemQuantity: (cartItemId, quantity) =>
        mutate((userId) => updateCartItem(userId, cartItemId, quantity)),
      removeItem: (cartItemId) =>
        mutate((userId) => removeCartItem(userId, cartItemId)),
    }),
    [
      carts,
      loading,
      refreshing,
      mutate,
      refreshCartForConsumer,
      restorePendingCheckout,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }
  return context;
}
