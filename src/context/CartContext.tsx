import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types';
import { formatQuantity } from '../utils/text';

export interface CartItemRecord {
  product: Product;
  quantity: number;
}

interface CartContextType {
  cartCount: number;
  items: CartItemRecord[];
  subtotal: number;
  hasWeightedProducts: boolean;
  isDrawerOpen: boolean;
  lastAdded: { product: Product; quantity: number } | null;
  addToCart: (product: Product, quantity: number, openDrawerAfter?: boolean) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  setIsDrawerOpen: (open: boolean) => void;
  clearLastAddedNotification: () => void;
}

const CART_STORAGE_KEY = 'carnion_cart_items_v1';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Inițializare din localStorage cu try/catch
  const [items, setItems] = useState<CartItemRecord[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Eroare la citirea coșului din localStorage:', e);
    }
    return [];
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<{ product: Product; quantity: number } | null>(null);

  // Salvare în localStorage la orice modificare a coșului
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Eroare la salvarea coșului în localStorage:', e);
    }
  }, [items]);

  const addToCart = (product: Product, quantity: number, openDrawerAfter: boolean = false) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = Math.round((updated[existingIndex].quantity + quantity) * 100) / 100;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        return updated;
      }
      return [...prev, { product, quantity: Math.round(quantity * 100) / 100 }];
    });

    setLastAdded({ product, quantity });

    if (openDrawerAfter) {
      setIsDrawerOpen(true);
    }

    // Auto-ascundere toast după 3.5 secunde
    setTimeout(() => {
      setLastAdded((curr) => (curr?.product.id === product.id ? null : curr));
    }, 3500);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }
      return prev.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            quantity: Math.round(quantity * 100) / 100,
          };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {
      console.warn('Eroare la ștergerea coșului din localStorage:', e);
    }
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const clearLastAddedNotification = () => setLastAdded(null);

  // Calcule
  const cartCount = items.length;
  const subtotal = Math.round(
    items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) * 100
  ) / 100;

  const hasWeightedProducts = items.some((item) => item.product.soldByWeight);

  return (
    <CartContext.Provider
      value={{
        cartCount,
        items,
        subtotal,
        hasWeightedProducts,
        isDrawerOpen,
        lastAdded,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        openDrawer,
        closeDrawer,
        setIsDrawerOpen,
        clearLastAddedNotification,
      }}
    >
      {children}

      {/* Notificare toast când un produs este adăugat */}
      {lastAdded && !isDrawerOpen && (
        <aside
          aria-label="Notificare coș"
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div className="bg-[#171412] border border-[#C9A55C]/40 text-[#F3EBDD] p-3.5 rounded-xl shadow-2xl shadow-black/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#B3202A]/20 border border-[#B3202A]/40 flex items-center justify-center shrink-0 text-[#C9A55C]">
                ✓
              </div>
              <div className="truncate">
                <p className="text-xs text-[#C9A55C] font-medium tracking-wide uppercase">Adăugat în coș</p>
                <p className="text-sm font-semibold truncate text-[#F3EBDD]">{lastAdded.product.name}</p>
                <p className="text-xs text-[#A89B8C]">
                  {formatQuantity(lastAdded.quantity, lastAdded.product.unit)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  clearLastAddedNotification();
                  openDrawer();
                }}
                className="px-2.5 py-1 text-xs bg-[#B3202A] hover:bg-[#961720] text-white font-medium rounded transition-colors"
              >
                Vezi coș
              </button>
              <button
                type="button"
                onClick={clearLastAddedNotification}
                className="text-[#A89B8C] hover:text-[#F3EBDD] p-1.5 transition-colors text-lg leading-none"
                aria-label="Închide notificarea"
              >
                ×
              </button>
            </div>
          </div>
        </aside>
      )}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
