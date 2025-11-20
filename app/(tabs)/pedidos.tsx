/**
 * PEDIDOS SCREEN - Pantalla de Pedidos 
 * 
 * CARACTERÍSTICAS:
 * - Timeline visual de estados
 * - Detalles expandibles por pedido
 * - Botón para dejar reseña en pedidos entregados
 * - Información de dirección de entrega
 * - Pull to refresh
 * - Estados con colores diferenciados
 */

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Calendar,
  CheckCircle2,
  ChevronDown, ChevronUp,
  Clock,
  MapPin,
  Package,
  ShoppingBag,
  Star,
  Truck,
  XCircle
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView, StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type OrderStatus = 'pending' | 'preparing' | 'in_transit' | 'delivered' | 'cancelled';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_cents: number;
  products: {
    name: string;
    image_url?: string;
  };
}

interface Address {
  label: string;
  address_line: string;
  phone_number?: string;
}

interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  total_cents: number;
  notes?: string;
  delivered_at?: string;
  addresses?: Address | null;
  order_items: OrderItem[];
}

const PedidosScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const loadOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, 
          created_at, 
          status, 
          total_cents, 
          notes, 
          delivered_at,
          addresses!fk_orders_addresses (
            label,
            address_line,
            phone_number
          ),
          order_items (
            id,
            product_id,
            quantity,
            unit_price_cents,
            products (
              name,
              image_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match Order interface
      const transformedOrders: Order[] = (data || []).map((order: any) => ({
        ...order,
        addresses: order.addresses || null
      }));

      setOrders(transformedOrders);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'No se pudieron cargar tus pedidos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const toggleOrderExpansion = async (orderId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const handleLeaveReview = async (order: Order) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/review?orderId=${order.id}`);
  };

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pendiente',
          color: '#f59e0b',
          bgColor: '#fef3c7',
          icon: Clock,
        };
      case 'preparing':
        return {
          label: 'Preparando',
          color: '#3b82f6',
          bgColor: '#dbeafe',
          icon: Package,
        };
      case 'in_transit':
        return {
          label: 'En Camino',
          color: '#8b5cf6',
          bgColor: '#ede9fe',
          icon: Truck,
        };
      case 'delivered':
        return {
          label: 'Entregado',
          color: '#10b981',
          bgColor: '#d1fae5',
          icon: CheckCircle2,
        };
      case 'cancelled':
        return {
          label: 'Cancelado',
          color: '#ef4444',
          bgColor: '#fee2e2',
          icon: XCircle,
        };
      default:
        return {
          label: status,
          color: '#6b7280',
          bgColor: '#f3f4f6',
          icon: Clock,
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hoy';
    if (diffDays === 2) return 'Ayer';
    if (diffDays <= 7) return `Hace ${diffDays} días`;

    return date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderOrder = (order: Order) => {
    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;
    const isExpanded = expandedOrders.has(order.id);
    const canReview = order.status === 'delivered';

    return (
      <View key={order.id} style={styles.orderCard}>
        {/* Order Header */}
        <TouchableOpacity
          style={styles.orderHeader}
          onPress={() => toggleOrderExpansion(order.id)}
          activeOpacity={0.7}
        >
          <View style={styles.orderHeaderLeft}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <StatusIcon size={20} color={statusConfig.color} strokeWidth={2.5} />
            </View>
            <View style={styles.orderHeaderInfo}>
              <Text style={styles.orderNumber}>
                Pedido #{order.id.slice(0, 8).toUpperCase()}
              </Text>
              <Text style={styles.orderDate}>
                {formatDate(order.created_at)}
              </Text>
            </View>
          </View>
          <View style={styles.orderHeaderRight}>
            <Text style={styles.orderTotal}>
              ${(order.total_cents / 100).toLocaleString('es-CO')}
            </Text>
            {isExpanded ? (
              <ChevronUp size={20} color="#9ca3af" />
            ) : (
              <ChevronDown size={20} color="#9ca3af" />
            )}
          </View>
        </TouchableOpacity>

        {/* Status Badge */}
        <View style={[styles.statusPill, { backgroundColor: statusConfig.bgColor }]}>
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.orderDetails}>
            {/* Address Info */}
            {order.addresses && (
              <View style={styles.detailSection}>
                <View style={styles.detailHeader}>
                  <MapPin size={18} color="#f97316" />
                  <Text style={styles.detailTitle}>Dirección de Entrega</Text>
                </View>
                <Text style={styles.addressLabel}>{order.addresses.label}</Text>
                <Text style={styles.addressText}>{order.addresses.address_line}</Text>
                {order.addresses.phone_number && (
                  <Text style={styles.addressPhone}>📞 {order.addresses.phone_number}</Text>
                )}
              </View>
            )}

            {/* Order Items */}
            <View style={styles.detailSection}>
              <View style={styles.detailHeader}>
                <ShoppingBag size={18} color="#f97316" />
                <Text style={styles.detailTitle}>Productos</Text>
              </View>
              {order.order_items.map((item) => (
                <View key={item.id} style={styles.orderItem}>
                  <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                  <Text style={styles.itemName}>{item.products.name}</Text>
                  <Text style={styles.itemPrice}>
                    ${((item.unit_price_cents * item.quantity) / 100).toLocaleString('es-CO')}
                  </Text>
                </View>
              ))}
            </View>

            {/* Tracking Button */}
            {(order.status === 'preparing' || order.status === 'in_transit' || order.status === 'pending') && (
              <TouchableOpacity
                style={styles.trackingButton}
                onPress={() => router.push(`/order/${order.id}`)}
              >
                <Truck size={20} color="white" />
                <Text style={styles.trackingButtonText}>Ver Seguimiento en Tiempo Real</Text>
              </TouchableOpacity>
            )}

            {/* Notes */}
            {order.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>📝 Notas:</Text>
                <Text style={styles.notesText}>{order.notes}</Text>
              </View>
            )}

            {/* Delivered Date */}
            {order.delivered_at && (
              <View style={styles.deliveredSection}>
                <Calendar size={16} color="#10b981" />
                <Text style={styles.deliveredText}>
                  Entregado el {new Date(order.delivered_at).toLocaleString('es-CO')}
                </Text>
              </View>
            )}

            {/* Review Button */}
            {canReview && (
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() => handleLeaveReview(order)}
              >
                <Star size={20} color="#f59e0b" fill="#f59e0b" />
                <Text style={styles.reviewButtonText}>Dejar Reseña</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔐</Text>
          <Text style={styles.emptyTitle}>Inicia sesión</Text>
          <Text style={styles.emptySubtitle}>
            Inicia sesión para ver tus pedidos
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Package size={32} color="white" strokeWidth={2.5} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Mis Pedidos</Text>
            <Text style={styles.subtitle}>
              {orders.length > 0
                ? `${orders.length} ${orders.length === 1 ? 'pedido' : 'pedidos'} realizados`
                : 'Historial de órdenes'
              }
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#f97316" />
            <Text style={styles.loadingText}>Cargando pedidos...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>¡Haz tu primer pedido!</Text>
            <Text style={styles.emptySubtitle}>
              Ve al menú y elige tus papas favoritas
            </Text>
          </View>
        ) : (
          orders.map(renderOrder)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef2e7',
  },

  // Header
  header: {
    backgroundColor: '#f97316',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    color: '#fed7aa',
    fontSize: 15,
    fontWeight: '600',
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 60,
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Order Card
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderHeaderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  orderHeaderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#f97316',
  },

  // Status Pill
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Order Details
  orderDetails: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1f2937',
  },

  // Address
  addressLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 13,
    color: '#9ca3af',
  },

  // Order Items
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f97316',
    width: 30,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },

  // Notes
  notesSection: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },

  // Delivered
  deliveredSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#d1fae5',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  deliveredText: {
    fontSize: 13,
    color: '#065f46',
    fontWeight: '600',
  },

  // Review Button
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fffbeb',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fbbf24',
    marginTop: 4,
  },
  reviewButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400e',
  },

  // Tracking Button
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#f97316',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  trackingButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: 'white',
  },
});

export default PedidosScreen;
