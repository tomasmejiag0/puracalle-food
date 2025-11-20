/**
 * CartContext - Contexto global del carrito de compras
 * 
 * ¿QUÉ ES REACT CONTEXT?
 * Es una forma de compartir datos entre componentes sin pasar props manualmente
 * por cada nivel (evita "prop drilling").
 * 
 * PROPÓSITO DE ESTE CONTEXT:
 * Gestionar el estado del carrito de compras de forma global:
 * - Qué productos están en el carrito
 * - Cantidad de cada producto
 * - Total a pagar
 * - Funciones para agregar/eliminar/limpiar
 * 
 * CÓMO SE USA:
 * 1. Wrappear la app con <CartProvider> (en app/_layout.tsx)
 * 2. En cualquier componente: const { items, addItem, ... } = useCart()
 * 3. No necesitas pasar props, el estado es global
 * 
 * BENEFICIOS:
 * - Agregar al carrito desde cualquier pantalla
 * - Ver items del carrito en cualquier lugar
 * - Estado persiste mientras la app está abierta
 */

import React, { createContext, useContext, useMemo, useState } from 'react';
import type { Product } from '@/services/products';

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


