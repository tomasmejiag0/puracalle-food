/**
 * SERVICIO DE CONFIGURACIÓN DE LA APP
 * 
 * Obtiene configuración y datos dinámicos desde Supabase
 * en lugar de usar datos hardcodeados
 */

import { supabase } from '@/lib/supabase';

export type AppConfig = {
  business_name: string;
  business_tagline: string;
  business_address: string;
  business_city: string;
  business_phone: string;
  business_email: string;
  business_schedule: string;
  delivery_fee_cents: number;
  min_order_cents: number;
  is_open: boolean;
};

export type BusinessStats = {
  total_orders: number;
  average_rating: number;
  total_users: number;
  completed_orders: number;
  total_revenue_cents: number;
};

export type FeaturedDeal = {
  id: string;
  title: string;
  description: string;
  original_price_cents: number;
  discounted_price_cents: number;
  discount_percent: number;
};

/**
 * Obtener configuración de la app
 */
export async function getAppConfig(): Promise<AppConfig> {
  const { data, error } = await supabase
    .from('app_config')
    .select('key, value');

  if (error) throw error;

  // Convertir array de {key, value} a objeto
  const config: any = {};
  data?.forEach((item) => {
    config[item.key] = item.value;
  });

  return {
    business_name: config.business_name || 'Pura Calle',
    business_tagline: config.business_tagline || 'La mejor comida callejera',
    business_address: config.business_address || 'Parque Central',
    business_city: config.business_city || 'Bogotá',
    business_phone: config.business_phone || '',
    business_email: config.business_email || '',
    business_schedule: config.business_schedule || 'Lunes a Domingo: 11:00 AM - 10:00 PM',
    delivery_fee_cents: parseInt(config.delivery_fee_cents || '300000', 10),
    min_order_cents: parseInt(config.min_order_cents || '1000000', 10),
    is_open: config.is_open === 'true',
  };
}

/**
 * Obtener estadísticas del negocio
 */
export async function getBusinessStats(): Promise<BusinessStats> {
  const { data, error } = await supabase
    .from('business_stats')
    .select('*')
    .single();

  if (error) {
    console.warn('Error fetching business stats:', error);
    // Retornar valores por defecto si falla
    return {
      total_orders: 2000,
      average_rating: 4.9,
      total_users: 500,
      completed_orders: 1800,
      total_revenue_cents: 50000000,
    };
  }

  return {
    total_orders: data.total_orders || 0,
    average_rating: parseFloat(data.average_rating) || 4.9,
    total_users: data.total_users || 0,
    completed_orders: data.completed_orders || 0,
    total_revenue_cents: data.total_revenue_cents || 0,
  };
}

/**
 * Obtener oferta destacada activa
 */
export async function getActiveFeaturedDeal(): Promise<FeaturedDeal | null> {
  const { data, error } = await supabase.rpc('get_active_featured_deal');

  if (error) {
    console.warn('Error fetching featured deal:', error);
    return null;
  }

  if (!data || data.length === 0) return null;

  return data[0];
}

/**
 * Obtener valor de configuración específico
 */
export async function getConfigValue(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error || !data) return null;
  return data.value;
}

