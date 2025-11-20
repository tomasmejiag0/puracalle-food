/**
 * Supabase Client - Configuración del cliente de Supabase
 * 
 * ¿QUÉ ES SUPABASE?
 * Backend as a Service que provee PostgreSQL + Auth + Storage + Realtime.
 * 
 * EN ESTE PROYECTO:
 * - PostgreSQL: Base de datos relacional
 * - Auth: Sistema de autenticación con roles
 * - RLS: Row Level Security para seguridad granular
 * 
 * CONFIGURACIÓN:
 * - AsyncStorage: Persiste sesión en el dispositivo
 * - autoRefreshToken: Renueva token automáticamente
 * - persistSession: Mantiene sesión entre reinicios
 * 
 * ⚠️ PRODUCCIÓN: Mover a variables de entorno (EXPO_PUBLIC_SUPABASE_URL, etc.)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// URL del proyecto Supabase (único por proyecto)
const SUPABASE_URL = 'https://xeptmpgseemvjdhlsfla.supabase.co';

// Anon Key: Clave pública (segura de exponer, RLS protege la seguridad)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlcHRtcGdzZWVtdmpkaGxzZmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjYyMzksImV4cCI6MjA3NzM0MjIzOX0.kTfzT-0cqIxAnA1rjRW6hu5lCGTonp_-VOE6fkwkEWY';

// Crear y exportar el cliente configurado
export const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '', {
  auth: {
    storage: AsyncStorage, // Persistir sesión en dispositivo
    autoRefreshToken: true, // Renovar token automáticamente
    persistSession: true, // Mantener sesión entre reinicios
    detectSessionInUrl: false, // Solo necesario en web
  },
});


