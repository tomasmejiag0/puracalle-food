/**
 * SERVICIO DE DIRECCIONES/UBICACIONES
 * 
 * Gestiona las direcciones de entrega de los usuarios:
 * - CRUD completo de direcciones
 * - Soporte para múltiples ubicaciones por usuario
 * - Dirección predeterminada
 * - Etiquetas personalizadas ("Casa", "Trabajo", "Novia", etc.)
 * - Coordenadas geográficas para mapas
 */

import { supabase } from '@/lib/supabase';

export type Address = {
  id: string;
  user_id: string;
  label: string; // "Casa", "Trabajo", etc.
  address_line: string; // Dirección completa
  latitude: number;
  longitude: number;
  city?: string;
  neighborhood?: string;
  postal_code?: string;
  phone_number?: string;
  delivery_instructions?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateAddressInput = {
  label: string;
  address_line: string;
  latitude: number;
  longitude: number;
  city?: string;
  neighborhood?: string;
  postal_code?: string;
  phone_number?: string;
  delivery_instructions?: string;
  is_default?: boolean;
};

export type UpdateAddressInput = Partial<CreateAddressInput>;

/**
 * Obtener todas las direcciones del usuario actual
 */
export async function listAddresses(): Promise<Address[]> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .order('is_default', { ascending: false }) // Default primero
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Obtener una dirección por ID
 */
export async function getAddress(id: string): Promise<Address> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Obtener la dirección predeterminada del usuario
 */
export async function getDefaultAddress(): Promise<Address | null> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('is_default', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Crear una nueva dirección
 */
export async function createAddress(input: CreateAddressInput): Promise<Address> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('addresses')
    .insert({
      user_id: userData.user.id,
      ...input,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Actualizar una dirección existente
 */
export async function updateAddress(id: string, input: UpdateAddressInput): Promise<Address> {
  const { data, error } = await supabase
    .from('addresses')
    .update(input)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Eliminar una dirección
 * Verifica si hay órdenes usando esta dirección antes de eliminar
 */
export async function deleteAddress(id: string): Promise<void> {
  // Verificar si hay órdenes usando esta dirección
  const { data: orders, error: checkError } = await supabase
    .from('orders')
    .select('id, status_detailed')
    .eq('address_id', id)
    .in('status_detailed', ['pending', 'preparing', 'ready_for_pickup', 'assigned_to_driver', 'out_for_delivery']);

  if (checkError) throw checkError;

  // Si hay órdenes activas, no permitir eliminar
  if (orders && orders.length > 0) {
    throw new Error(
      `No se puede eliminar esta dirección porque tiene ${orders.length} pedido(s) activo(s). Espera a que se completen o cancela los pedidos primero.`
    );
  }

  // Si no hay órdenes activas, proceder con la eliminación
  const { error } = await supabase.from('addresses').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Marcar una dirección como predeterminada
 * (automáticamente desmarca las demás gracias al trigger en la BD)
 */
export async function setDefaultAddress(id: string): Promise<Address> {
  return updateAddress(id, { is_default: true });
}

