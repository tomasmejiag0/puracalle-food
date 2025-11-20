import { useAuth } from '@/hooks/useAuth';
import { getActiveFeaturedDeal, getAppConfig, getBusinessStats, type AppConfig, type BusinessStats, type FeaturedDeal } from '@/services/appConfig';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import {
  Award,
  ChevronRight,
  Clock,
  Flame, LogIn, MapPin,
  Sparkles,
  Star,
  TrendingUp,
  UtensilsCrossed
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { role, user } = useAuth();
  
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [featuredDeal, setFeaturedDeal] = useState<FeaturedDeal | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, dealData, configData] = await Promise.all([
        getBusinessStats(),
        getActiveFeaturedDeal(),
        getAppConfig(),
      ]);
      setStats(statsData);
      setFeaturedDeal(dealData);
      setConfig(configData);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  const handleNavigation = async (route: Href) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#f97316']}
            tintColor="#f97316"
          />
        }
      >
        {/* Hero Header with Gradient Effect */}
        <View style={styles.heroContainer}>
          <View style={styles.heroGradient}>
            {/* Top Actions */}
            <View style={styles.topActions}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.profileButton}
                onPress={() => handleNavigation(user ? '/profile' : '/auth')}
              >
                <LogIn size={20} color="white" strokeWidth={2.5} />
                <Text style={styles.profileButtonText}>
                  {user ? 'Perfil' : 'Entrar'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Logo & Welcome */}
            <View style={styles.heroContent}>
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={styles.logo}
                contentFit="contain"
              />
              <View style={styles.sparklesContainer}>
                <Sparkles size={24} color="#fed7aa" fill="#fed7aa" />
                <Text style={styles.heroTitle}>¡Bienvenido a Pura Calle!</Text>
                <Sparkles size={24} color="#fed7aa" fill="#fed7aa" />
              </View>
              <Text style={styles.heroSubtitle}>
                La mejor comida callejera de la ciudad
              </Text>
              <Text style={styles.heroTagline}>
                Sabores auténticos 🔥 Calidad premium 🍔
              </Text>
            </View>

            {/* Quick Access CTA */}
            <TouchableOpacity 
              style={styles.ctaButton}
              onPress={() => handleNavigation('/(tabs)/menu')}
            >
              <UtensilsCrossed size={22} color="#f97316" strokeWidth={2.5} />
              <Text style={styles.ctaButtonText}>Ver Menú Completo</Text>
              <ChevronRight size={20} color="#f97316" strokeWidth={3} />
            </TouchableOpacity>

            {/* Admin Badge */}
            {role === 'admin' && (
              <TouchableOpacity
                style={styles.adminBadge}
                onPress={() => handleNavigation('/admin')}
              >
                <Award size={18} color="#fbbf24" fill="#fbbf24" />
                <Text style={styles.adminBadgeText}>Panel Admin</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats Bar */}
        {loading ? (
          <View style={[styles.statsBar, { justifyContent: 'center' }]}>
            <ActivityIndicator size="small" color="#f97316" />
          </View>
        ) : stats && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Star size={20} color="#fbbf24" fill="#fbbf24" />
              </View>
              <Text style={styles.statValue}>{stats.average_rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <TrendingUp size={20} color="#10b981" />
              </View>
              <Text style={styles.statValue}>
                {stats.total_orders >= 1000 ? `${Math.floor(stats.total_orders / 1000)}K+` : stats.total_orders}
              </Text>
              <Text style={styles.statLabel}>Pedidos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Award size={20} color="#f97316" />
              </View>
              <Text style={styles.statValue}>100%</Text>
              <Text style={styles.statLabel}>Calidad</Text>
            </View>
          </View>
        )}

        {/* Content Cards */}
        <View style={styles.content}>
          {/* Special Offer Card */}
          {featuredDeal && (
            <View style={styles.specialCard}>
              <View style={styles.specialBadge}>
                <Flame size={18} color="white" fill="white" />
                <Text style={styles.specialBadgeText}>
                  {featuredDeal.discount_percent}% OFF
                </Text>
              </View>
              <View style={styles.specialContent}>
                <Text style={styles.specialTitle}>{featuredDeal.title}</Text>
                {featuredDeal.description && (
                  <Text style={styles.specialDescription}>
                    {featuredDeal.description}
                  </Text>
                )}
                <View style={styles.specialPriceRow}>
                  <View>
                    {featuredDeal.original_price_cents > 0 && (
                      <Text style={styles.specialOldPrice}>
                        ${(featuredDeal.original_price_cents / 100).toLocaleString('es-CO')}
                      </Text>
                    )}
                    <Text style={styles.specialPrice}>
                      ${(featuredDeal.discounted_price_cents / 100).toLocaleString('es-CO')}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.specialOrderButton}
                    onPress={() => handleNavigation('/(tabs)/menu')}
                  >
                    <Text style={styles.specialOrderText}>Pedir Ahora</Text>
                    <ChevronRight size={18} color="white" strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Location Card */}
          {config && (
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <MapPin size={28} color="#f97316" strokeWidth={2} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Visítanos</Text>
                <Text style={styles.infoText}>📍 {config.business_address}</Text>
                <Text style={styles.infoText}>🏙️ {config.business_city}</Text>
              </View>
              <ChevronRight size={20} color="#d1d5db" />
            </View>
          )}

          {/* Hours Card */}
          {config && (
            <View style={styles.infoCard}>
              <View style={[styles.infoIconContainer, { backgroundColor: config.is_open ? '#dbeafe' : '#fee2e2' }]}>
                <Clock size={28} color={config.is_open ? '#3b82f6' : '#ef4444'} strokeWidth={2} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Horario</Text>
                <Text style={styles.infoText}>🕐 {config.business_schedule}</Text>
                <View style={styles.statusBadge}>
                  <View style={[styles.statusDot, { backgroundColor: config.is_open ? '#10b981' : '#ef4444' }]} />
                  <Text style={[styles.statusText, { color: config.is_open ? '#10b981' : '#ef4444' }]}>
                    {config.is_open ? 'Abierto Ahora' : 'Cerrado'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Testimonial Card */}
          <View style={styles.testimonialCard}>
            <View style={styles.testimonialHeader}>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={16} color="#fbbf24" fill="#fbbf24" />
                ))}
              </View>
              <Text style={styles.testimonialRating}>5.0</Text>
            </View>
            <Text style={styles.testimonialText}>
              &ldquo;¡Las papas mas chimbas que he probado! No me arrepiento del viaje hasta Santa Fe de Antioquia.&rdquo;
            </Text>
            <Text style={styles.testimonialAuthor}>— María G.</Text>
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef2e7',
  },

  // Hero Section
  heroContainer: {
    backgroundColor: '#f97316',
    overflow: 'hidden',
  },
  heroGradient: {
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },

  // Logo & Hero Content
  heroContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    height: 100,
    width: 150,
    marginBottom: 20,
  },
  sparklesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#fed7aa',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  heroTagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontWeight: '500',
  },

  // CTA Button
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaButtonText: {
    color: '#f97316',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Admin Badge
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  adminBadgeText: {
    color: '#fef3c7',
    fontWeight: '700',
    fontSize: 14,
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },

  // Content
  content: {
    padding: 20,
    paddingTop: 28,
    gap: 16,
  },

  // Special Offer Card
  specialCard: {
    backgroundColor: '#1f2937',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  specialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    borderBottomRightRadius: 12,
  },
  specialBadgeText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
  specialContent: {
    padding: 24,
  },
  specialTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: 'white',
    marginBottom: 8,
  },
  specialDescription: {
    fontSize: 15,
    color: '#d1d5db',
    marginBottom: 20,
    lineHeight: 22,
  },
  specialPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specialOldPrice: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  specialPrice: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  specialOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f97316',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  specialOrderText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 15,
  },

  // Info Cards
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#ffedd5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '700',
  },

  // Testimonial Card
  testimonialCard: {
    backgroundColor: '#fef3c7',
    padding: 24,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fde68a',
    shadowColor: '#eab308',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  testimonialRating: {
    fontSize: 18,
    fontWeight: '900',
    color: '#92400e',
  },
  testimonialText: {
    fontSize: 15,
    color: '#78350f',
    lineHeight: 22,
    marginBottom: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  testimonialAuthor: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '700',
  },
});
