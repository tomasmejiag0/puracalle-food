/**
 * ROOT LAYOUT - Layout raíz de la aplicación
 * 
 * Este es el componente más externo de la app. Aquí se configuran:
 * 1. Providers globales (Context API)
 * 2. Navegación principal (Stack Navigator)
 * 3. Safe Area para dispositivos con notch
 * 4. Temas claro/oscuro
 * 
 * ORDEN DE PROVIDERS (de afuera hacia adentro):
 * - SafeAreaProvider: Maneja áreas seguras (notch, status bar)
 * - ThemeProvider: Temas de React Navigation
 * - CartProvider: Estado global del carrito de compras
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
