/**
 * SERVICIO DE RESEÑAS
 * 
 * Gestiona las reseñas/calificaciones de órdenes:
 * - Crear reseña para una orden entregada
 * - Obtener reseñas del usuario
 * - Obtener estadísticas globales de calificación
 */

import { supabase } from '@/lib/supabase';

export type Review = {
  id: string;
  user_id: string;
  order_id: string;
  rating: number; // 1-5 estrellas
  comment?: string;
  created_at: string;
  updated_at: string;
};

export type CreateReviewInput = {
  order_id: string;
  rating: number;
  comment?: string;
};

export type ReviewStats = {
  total_reviews: number;
  average_rating: number;
  five_stars: number;
  four_stars: number;
  three_stars: number;
  two_stars: number;
  one_star: number;
};

/**
 * Crear una nueva reseña para una orden
 */
export async function createReview(input: CreateReviewInput): Promise<Review> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error('Usuario no autenticado');

  // Validar rating
  if (input.rating < 1 || input.rating > 5) {
    throw new Error('La calificación debe estar entre 1 y 5 estrellas');
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      user_id: userData.user.id,
      ...input,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      throw new Error('Ya has dejado una reseña para este pedido');
    }
    throw error;
  }

  return data;
}

/**
 * Obtener la reseña de una orden específica (si existe)
 */
export async function getReviewByOrderId(orderId: string): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Obtener todas las reseñas del usuario actual
 */
export async function listMyReviews(): Promise<Review[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Obtener estadísticas globales de reseñas
 */
export async function getReviewStats(): Promise<ReviewStats> {
  const { data, error } = await supabase
    .from('review_stats')
    .select('*')
    .single();

  if (error) throw error;

  return {
    total_reviews: data.total_reviews || 0,
    average_rating: parseFloat(data.average_rating) || 0,
    five_stars: data.five_stars || 0,
    four_stars: data.four_stars || 0,
    three_stars: data.three_stars || 0,
    two_stars: data.two_stars || 0,
    one_star: data.one_star || 0,
  };
}

/**
 * Actualizar una reseña existente
 */
export async function updateReview(
  id: string,
  input: { rating?: number; comment?: string }
): Promise<Review> {
  if (input.rating && (input.rating < 1 || input.rating > 5)) {
    throw new Error('La calificación debe estar entre 1 y 5 estrellas');
  }

  const { data, error } = await supabase
    .from('reviews')
    .update(input)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Eliminar una reseña
 */
export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) throw error;
}

