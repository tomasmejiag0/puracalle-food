/**
 * ROOT LAYOUT - Layout raíz de la aplicación
 * 
 * Componente más externo que configura toda la arquitectura base
 * de la aplicación React Native con Expo Router.
 * 
 * 🏗️ ARQUITECTURA DE PROVIDERS (de afuera hacia adentro):
 * 
 * 1. SafeAreaProvider (react-native-safe-area-context)
 *    - Maneja áreas seguras del dispositivo (notch, status bar, home indicator)
 *    - Provee insets para todos los componentes hijos
 *    - Esencial para diseño adaptativo en diferentes dispositivos
 * 
 * 2. ThemeProvider (React Navigation)
 *    - Gestiona tema claro/oscuro
 *    - Detecta preferencia del sistema operativo
 *    - Aplica colores apropiados a navegación y componentes
 * 
 * 3. CartProvider (Context API personalizado)
 *    - Estado global del carrito de compras
 *    - Accesible desde cualquier pantalla sin prop drilling
 *    - Persiste durante la sesión de la app
 * 
 * 4. Stack Navigator (Expo Router)
 *    - Sistema de navegación principal
 *    - File-based routing (estructura de carpetas = rutas)
 *    - Transiciones nativas entre pantallas
 * 
 * 📱 CONFIGURACIÓN DE UI:
 * - StatusBar: style="dark" (iconos oscuros sobre fondo naranja)
 * - Background color: #f97316 (naranja del sistema)
 * - Global CSS: Importado de global.css (TailwindCSS)
 * 
 * 🎯 EXPO ROUTER CONFIG:
 * - Anchor: '(tabs)' - Define punto de entrada principal
 * - Typed Routes: Habilitado para type-safety
 * - React Compiler: Experimental optimizations
 * 
 * 🔔 INICIALIZACIÓN GLOBAL:
 * - useNotifications hook: Configura listeners de notificaciones
 * - SystemUI color: Establece color del status bar
 * 
 * 📊 FLUJO DE RENDERIZADO:
 * App inicia → SafeArea → Theme → Cart → Stack → (tabs) → Pantalla activa
 * 
 * @component
 * @route Raíz de todas las rutas
 */

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { CartProvider } from '@/context/CartContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useNotifications } from '@/hooks/useNotifications';

// Configuración de Expo Router: define que (tabs) es el punto de anclaje
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  // Detecta si el dispositivo está en modo oscuro o claro
  const colorScheme = useColorScheme();

  // Inicializar notificaciones globalmente
  useNotifications();

  // Configurar el color de fondo del status bar a naranja
  useEffect(() => {
    SystemUI.setBackgroundColorAsync('#f97316');
  }, []);

  return (
    // 1. SafeAreaProvider: Proveedor raíz para manejar safe areas en toda la app
    <SafeAreaProvider>
      {/* 2. ThemeProvider: Aplica tema claro/oscuro a React Navigation */}
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {/* 3. CartProvider: Estado global del carrito accesible desde cualquier pantalla */}
        <CartProvider>
          {/* Stack Navigator: Gestiona la navegación entre pantallas */}
          <Stack>
            {/* Pantalla principal: Tab Navigator (Home, Menú, Pedidos, etc.) */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            {/* Pantalla modal de ejemplo */}
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          {/* StatusBar: Configura la barra de estado del sistema
              style="dark" = iconos oscuros (se ven bien sobre fondo naranja) */}
          <StatusBar style="dark" backgroundColor="#f97316" />
        </CartProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
