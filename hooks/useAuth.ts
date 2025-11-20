/**
 * useAuth Hook - Hook personalizado para gestionar autenticación
 * 
 * PROPÓSITO:
 * Centralizar toda la lógica de autenticación en un solo lugar.
 * Cualquier componente puede usar este hook para:
 * - Saber si hay un usuario logueado
 * - Conocer el rol del usuario (user/admin)
 * - Iniciar sesión, registrarse o cerrar sesión
 * 
 * CÓMO FUNCIONA:
 * 1. Al cargar, verifica si hay una sesión activa en Supabase
 * 2. Escucha cambios de autenticación (login/logout)
 * 3. Cuando hay un usuario, busca su rol en la tabla 'profiles'
 * 4. Expone funciones para login, registro y logout
 * 
 * RETORNA:
 * - session: Sesión completa de Supabase (incluye tokens)
 * - user: Objeto User con id, email, etc.
 * - role: 'user' | 'admin' | 'worker' | null
 * - loading: true mientras carga la sesión inicial
 * - error: Mensaje de error si algo falla
 * - signInWithEmail(email, password): Función para iniciar sesión
 * - signUpWithEmail(email, password): Función para registrarse
 * - signOut(): Función para cerrar sesión
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


