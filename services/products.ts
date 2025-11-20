import { supabase } from '@/lib/supabase';

export type Category = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  video_url: string | null; // Soporte para videos de productos
  category_id: string | null;
  is_active: boolean;
  created_at: string;
};

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return data as Category[];
}

export async function listProducts(activeOnly = true): Promise<Product[]> {
  let query = supabase.from('products').select('*').order('created_at', { ascending: false });
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw error;
  return data as Product[];
}

export async function createProduct(payload: Partial<Product>): Promise<Product> {
  const { data, error } = await supabase.from('products').insert(payload).select('*').single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  // Soft delete: marcar como inactivo en lugar de eliminar
  // Esto evita violar foreign keys con order_items
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}


