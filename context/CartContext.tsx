/**
 * CartContext - Estado global del carrito de compras
 * 
 * Implementación del patrón Context API de React para gestionar
 * el carrito de compras de manera centralizada.
 * 
 * 🛒 ¿QUÉ ES REACT CONTEXT?
 * Context API permite compartir datos entre componentes sin necesidad
 * de pasar props manualmente a través de cada nivel del árbol de componentes.
 * Soluciona el problema de "prop drilling".
 * 
 * 📦 ESTADO GESTIONADO:
 * - Lista de productos en el carrito con cantidades
 * - Cálculo automático del total en centavos
 * - Operaciones CRUD sobre items del carrito
 * 
 * 🔄 OPERACIONES DISPONIBLES:
 * - addItem: Agregar producto (incrementa si ya existe)
 * - decrementItem: Restar cantidad (elimina si llega a 0)
 * - removeItem: Eliminar producto completamente
 * - clear: Vaciar todo el carrito
 * 
 * 💡 ARQUITECTURA:
 * 1. CartProvider: Componente que provee el contexto (en _layout.tsx)
 * 2. useState: Mantiene el estado de items
 * 3. useMemo: Optimiza cálculo del total
 * 4. useCart hook: Acceso fácil desde cualquier componente
 * 
 * ⚡ OPTIMIZACIONES:
 * - useMemo para evitar recalcular total en cada render
 * - Value context memoizado para prevenir re-renders innecesarios
 * 
 * @module CartContext
 * @example
 * ```tsx
 * // En _layout.tsx - Configuración inicial
 * <CartProvider>
 *   <App />
 * </CartProvider>
 * 
 * // En cualquier componente - Consumir el contexto
 * function ProductCard({ product }) {
 *   const { addItem, items } = useCart();
 *   const quantity = items.find(i => i.product.id === product.id)?.quantity || 0;
 *   
 *   return (
 *     <Button onPress={() => addItem(product)}>
 *       Agregar al carrito ({quantity})
 *     </Button>
 *   );
 * }
 * ```
 */

import type { Product } from '@/services/products';
import React, { createContext, useContext, useMemo, useState } from 'react';

// Tipo: Un item del carrito (producto + cantidad)
export type CartItem = {
  product: Product;
  quantity: number;
};

// Tipo: Funciones y estados que el Context expondrá
type CartContextType = {
  items: CartItem[]; // Array de productos en el carrito
  addItem: (product: Product) => void; // Agregar producto (incrementa si ya existe)
  decrementItem: (productId: string) => void; // Restar 1 a la cantidad (elimina si llega a 0)
  removeItem: (productId: string) => void; // Eliminar producto completamente
  clear: () => void; // Vaciar todo el carrito
  totalCents: number; // Total a pagar en centavos
};

// Crear el contexto (inicialmente undefined)
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider: Componente que provee el contexto a sus hijos
export function CartProvider({ children }: { children: React.ReactNode }) {
  // Estado: Array de items del carrito
  const [items, setItems] = useState<CartItem[]>([]);

  // Función: Agregar producto al carrito
  const addItem = (product: Product) => {
    setItems((prev) => {
      // Buscar si el producto ya está en el carrito
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx >= 0) {
        // Si existe, incrementar su cantidad
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      // Si no existe, agregarlo con cantidad 1
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Función: Decrementar cantidad del producto (restar 1)
  const decrementItem = (productId: string) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product.id === productId);
      if (idx < 0) return prev; // No existe, no hacer nada

      const currentQuantity = prev[idx].quantity;
      if (currentQuantity <= 1) {
        // Si cantidad es 1, eliminar el producto del carrito
        return prev.filter((i) => i.product.id !== productId);
      }

      // Si cantidad > 1, decrementar
      const copy = [...prev];
      copy[idx] = { ...copy[idx], quantity: copy[idx].quantity - 1 };
      return copy;
    });
  };

  // Función: Eliminar producto del carrito (completamente, sin importar cantidad)
  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  // Función: Vaciar todo el carrito
  const clear = () => setItems([]);

  // Cálculo memoizado: Total en centavos (sum de precio * cantidad de cada item)
  // useMemo evita recalcular en cada render, solo cuando items cambia
  const totalCents = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price_cents * i.quantity, 0),
    [items]
  );

  // Value memoizado: Objeto con todos los valores y funciones del contexto
  // useMemo evita recrear el objeto en cada render
  const value = useMemo(() => ({ items, addItem, decrementItem, removeItem, clear, totalCents }), [items, totalCents]);

  // Proveer el contexto a todos los componentes hijos
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Hook personalizado: Acceso fácil al contexto desde cualquier componente
export function useCart() {
  const ctx = useContext(CartContext);
  // Si se usa fuera del Provider, lanzar error informativo
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}


