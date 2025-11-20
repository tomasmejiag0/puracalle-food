import { supabase } from '@/lib/supabase';

export type Promotion = {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
};

export async function listPromotions(activeOnly = true): Promise<Promotion[]> {
  let query = supabase.from('promotions').select('*').order('created_at', { ascending: false });
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw error;
  return data as Promotion[];
}

export async function createPromotion(payload: {
  title: string;
  description?: string;
  discount_percent?: number;
  starts_at?: string;
  ends_at?: string;
  is_active?: boolean;
}): Promise<Promotion> {
  const { data, error } = await supabase.from('promotions').insert(payload).select('*').single();
  if (error) throw error;
  return data as Promotion;
}

export async function updatePromotion(id: string, updates: Partial<Omit<Promotion, 'id' | 'created_at'>>): Promise<Promotion> {
  const { data, error } = await supabase.from('promotions').update(updates).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Promotion;
}

export async function deletePromotion(id: string): Promise<void> {
  const { error } = await supabase.from('promotions').delete().eq('id', id);
  if (error) throw error;
}


