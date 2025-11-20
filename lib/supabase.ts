/**
 * Supabase Client - Cliente centralizado de Backend as a Service
 * 
 * 🚀 ¿QUÉ ES SUPABASE?
 * Supabase es una alternativa open source a Firebase que provee:
 * - PostgreSQL: Base de datos relacional completa
 * - Auth: Autenticación con JWT y múltiples providers
 * - Storage: Almacenamiento de archivos con CDN
 * - Realtime: WebSockets para actualizaciones en vivo
 * - Edge Functions: Serverless functions
 * - Row Level Security (RLS): Seguridad a nivel de fila
 * 
 * 🔐 SEGURIDAD:
 * - ANON_KEY: Clave pública (segura de exponer en cliente)
 * - RLS: Políticas de seguridad en PostgreSQL protegen datos
 * - JWT: Tokens seguros para autenticación
 * 
 * ⚙️ CONFIGURACIÓN ACTUAL:
 * - AsyncStorage: Persiste sesión en almacenamiento local del dispositivo
 * - autoRefreshToken: Renueva automáticamente tokens antes de expirar
 * - persistSession: Mantiene sesión activa entre reinicios de app
 * - detectSessionInUrl: Deshabilitado (solo necesario en web)
 * 
 * 📊 USO EN EL PROYECTO:
 * - Autenticación de usuarios (login/registro)
 * - CRUD de productos, órdenes, perfiles
 * - Realtime tracking de ubicación de drivers
 * - Storage de fotos de entrega
 * - Notificaciones push (tokens en BD)
 * 
 * ⚠️ MEJORES PRÁCTICAS:
 * - En producción: Usar variables de entorno (EXPO_PUBLIC_SUPABASE_URL)
 * - No exponer SERVICE_ROLE_KEY en código cliente
 * - Implementar RLS en todas las tablas sensibles
 * 
 * @module supabase
 * @see https://supabase.com/docs
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


