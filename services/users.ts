import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
};

export async function listProfiles(search?: string, roles?: ('user' | 'admin' | 'worker')[]): Promise<Profile[]> {
  let query = supabase.from('profiles').select('id,email,full_name,phone,avatar_url,role,created_at,updated_at').order('created_at', { ascending: false });

  if (search) {
    // Simple search by email
    query = query.ilike('email', `%${search}%`);
  }

  if (roles && roles.length > 0) {
    query = query.in('role', roles);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function updateProfileRole(id: string, role: 'user' | 'admin'): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select('id,email,full_name,phone,avatar_url,role,created_at,updated_at')
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateOwnProfile(updates: { full_name?: string; phone?: string; avatar_url?: string }): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select('id,email,full_name,phone,avatar_url,role,created_at,updated_at')
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function getOwnProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,full_name,phone,avatar_url,role,created_at,updated_at')
    .eq('id', user.id)
    .single();
  if (error) throw error;
  return data as Profile;
}


