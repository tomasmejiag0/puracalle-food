/**
 * useAuth Hook - Sistema de autenticación centralizado
 * 
 * Hook personalizado que gestiona toda la autenticación y autorización
 * de la aplicación utilizando Supabase Auth.
 * 
 * 🔐 FUNCIONALIDADES:
 * - Persistencia de sesión (mantiene login entre reinicios)
 * - Sistema de roles (user/admin/worker)
 * - Listeners reactivos a cambios de autenticación
 * - Validación automática de sesiones expiradas
 * 
 * 📊 FLUJO DE AUTENTICACIÓN:
 * 1. App inicia → Verifica sesión guardada en AsyncStorage
 * 2. Usuario existe → Carga rol desde tabla 'profiles'
 * 3. Escucha cambios → Actualiza estado automáticamente
 * 4. Cambio de rol → Re-renderiza componentes que usen el hook
 * 
 * 🎯 CASOS DE USO:
 * - Proteger rutas según rol
 * - Mostrar/ocultar contenido según autenticación
 * - Personalizar UI según tipo de usuario
 * - Gestionar formularios de login/registro
 * 
 * @hook
 * @returns {Object} Estado y funciones de autenticación
 * @property {Session | null} session - Sesión activa de Supabase
 * @property {User | null} user - Usuario autenticado
 * @property {UserRole | null} role - Rol del usuario (user/admin/worker)
 * @property {boolean} loading - Estado de carga inicial
 * @property {string | null} error - Mensaje de error si existe
 * @property {Function} signInWithEmail - Iniciar sesión con email/password
 * @property {Function} signUpWithEmail - Registrar nuevo usuario
 * @property {Function} signOut - Cerrar sesión
 * 
 * @example
 * ```tsx
 * function ProtectedScreen() {
 *   const { user, role, loading, signOut } = useAuth();
 *   
 *   if (loading) return <LoadingSpinner />;
 *   if (!user) return <LoginScreen />;
 *   if (role !== 'admin') return <UnauthorizedScreen />;
 *   
 *   return <AdminDashboard onLogout={signOut} />;
 * }
 * ```
 */

import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

export type UserRole = 'user' | 'admin' | 'worker';

export function useAuth() {
  // Estados del hook
  const [session, setSession] = useState<Session | null>(null); // Sesión activa
  const [user, setUser] = useState<User | null>(null); // Usuario logueado
  const [loading, setLoading] = useState(true); // Estado de carga inicial
  const [error, setError] = useState<string | null>(null); // Errores de autenticación
  const [role, setRole] = useState<UserRole | null>(null); // Rol del usuario

  // Effect 1: Inicializa la sesión y escucha cambios de autenticación
  useEffect(() => {
    let mounted = true; // Flag para evitar memory leaks

    // Obtener sesión actual al montar el componente
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return; // Si el componente se desmontó, no actualizar estado
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    })();

    // Escuchar cambios en el estado de autenticación (login/logout)
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    // Cleanup: desuscribirse cuando el componente se desmonte
    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  // Effect 2: Obtiene el rol del usuario desde la tabla profiles
  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null); // Si no hay usuario, no hay rol
        return;
      }
      // Buscar el rol en la tabla profiles usando el ID del usuario
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      setRole((data?.role as UserRole) ?? null);
    };
    fetchRole();
  }, [user]); // Se ejecuta cada vez que cambia el usuario

  // Función: Iniciar sesión con email y contraseña
  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    return !err; // Retorna true si no hubo error
  };

  // Función: Registrarse con email y contraseña
  const signUpWithEmail = async (email: string, password: string) => {
    setError(null);
    const { error: err } = await supabase.auth.signUp({ email, password });
    if (err) setError(err.message);
    return !err; // Retorna true si no hubo error
  };

  // Función: Cerrar sesión
  const signOut = async () => {
    setError(null);
    const { error: err } = await supabase.auth.signOut();
    if (err) setError(err.message);
    return !err; // Retorna true si no hubo error
  };

  // Retornar todos los estados y funciones
  return { session, user, role, loading, error, signInWithEmail, signUpWithEmail, signOut };
}


