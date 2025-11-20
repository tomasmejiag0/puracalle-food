/**
 * TAB LAYOUT - Sistema de navegación principal
 * 
 * Implementa un Tab Navigator con pestañas condicionales
 * según el rol del usuario autenticado.
 * 
 * 🎯 ARQUITECTURA:
 * - React Navigation Bottom Tabs
 * - Renderizado condicional basado en roles
 * - Safe Area Insets para dispositivos con notch
 * - Iconos con Lucide React Native
 * 
 * 👥 ROLES Y VISIBILIDAD:
 * 
 * USUARIO NORMAL (role: 'user'):
 * ✅ Home - Página principal y destacados
 * ✅ Menú - Catálogo de productos
 * ✅ Pedidos - Historial de órdenes
 * ✅ Promos - Promociones activas
 * ✅ Nosotros - Información de la empresa
 * ✅ Perfil - Datos personales
 * 
 * REPARTIDOR (role: 'worker'):
 * ✅ Entregas - Dashboard de órdenes disponibles
 * ✅ Perfil - Datos personales
 * ❌ Resto de tabs ocultos
 * 
 * ADMINISTRADOR (role: 'admin'):
 * ✅ Todos los tabs de usuario normal
 * ✅ Acceso adicional a panel admin (no en tabs)
 * 
 * 💡 TÉCNICA DE OCULTACIÓN:
 * - href: null → Tab NO se renderiza
 * - href: undefined → Tab SÍ se renderiza
 * 
 * @component
 * @example
 * ```tsx
 * // En cualquier pantalla, navegar a un tab:
 * router.push('/(tabs)/menu');
 * 
 * // Verificar tab activo:
 * const route = useRoute();
 * const isMenuActive = route.name === 'menu';
 * ```
 */

import { useAuth } from '@/hooks/useAuth';
import { Tabs } from 'expo-router';
import { Gift, Home, Info, ShoppingCart, Truck, User, UtensilsCrossed } from 'lucide-react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  const isWorker = role === 'worker';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#f97316',
        tabBarInactiveTintColor: '#6b7280',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#e5e7eb',
          paddingTop: 5,
          paddingBottom: Math.max(insets.bottom, 5),
          height: 60 + Math.max(insets.bottom, 5),
          position: 'absolute',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 2,
        },
      }}>

      {/* ========== TABS COMUNES (HOME) ========== */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          href: isWorker ? null : undefined, // Ocultar si es worker
        }}
      />

      {/* ========== TABS DE USUARIO ========== */}
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menú',
          tabBarIcon: ({ color, size }) => <UtensilsCrossed size={size} color={color} />,
          href: isWorker ? null : undefined,
        }}
      />

      <Tabs.Screen
        name="pedidos"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, size }) => <ShoppingCart size={size} color={color} />,
          href: isWorker ? null : undefined,
        }}
      />

      <Tabs.Screen
        name="promos"
        options={{
          title: 'Promos',
          tabBarIcon: ({ color, size }) => <Gift size={size} color={color} />,
          href: isWorker ? null : undefined,
        }}
      />

      {/* ========== TABS DE WORKER ========== */}
      <Tabs.Screen
        name="deliveries"
        options={{
          title: 'Entregas',
          tabBarIcon: ({ color, size }) => <Truck size={size} color={color} />,
          href: isWorker ? undefined : null, // Ocultar si NO es worker
        }}
      />

      {/* ========== TABS COMPARTIDOS (PERFIL, NOSOTROS) ========== */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="nosotros"
        options={{
          title: 'Nosotros',
          tabBarIcon: ({ color, size }) => <Info size={size} color={color} />,
          href: isWorker ? null : undefined,
        }}
      />
    </Tabs>
  );
}
