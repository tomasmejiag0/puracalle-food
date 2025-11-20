/**
 * PANTALLA: PANEL DEL REPARTIDOR
 * 
 * Dashboard para domiciliarios que muestra:
 * - Órdenes disponibles para aceptar (ready_for_pickup)
 * - Órdenes asignadas al repartidor
 * - Orden activa en entrega
 * - Notificaciones en tiempo real de nuevas órdenes
 */

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Stack, useRouter } from 'expo-router';
import { Package, TruckIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Order {
    id: string;
    order_number?: string;
    status: string;
    status_detailed: string;
    total_cents: number;
    created_at: string;
    assigned_driver_id?: string;
    user_id: string;
    address_id?: string;
    // Relations
    profiles?: {
        full_name?: string;
        email?: string;
    };
    addresses?: {
        address_line: string;
        latitude: number;
        longitude: number;
    };
}

export default function DriverDashboard() {
    const router = useRouter();
    const { user } = useAuth();

    const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (user) {
            loadOrders();
            setupRealtimeSubscription();
        }
    }, [user]);

    const loadOrders = async () => {
        try {
            // Órdenes disponibles (listas para pickup, sin asignar)
            const { data: available, error: availableError } = await supabase
                .from('orders')
                .select(`
          *,
          profiles!user_id (full_name, email),
          addresses!fk_orders_addresses (address_line, latitude, longitude)
        `)
                .eq('status_detailed', 'ready_for_pickup')
                .is('assigned_driver_id', null)
                .order('created_at', { ascending: true });

            if (availableError) throw availableError;

            // Mis órdenes asignadas
            const { data: assigned, error: assignedError } = await supabase
                .from('orders')
                .select(`
          *,
          profiles!user_id (full_name, email),
          addresses!fk_orders_addresses (address_line, latitude, longitude)
        `)
                .eq('assigned_driver_id', user!.id)
                .in('status_detailed', ['assigned_to_driver', 'out_for_delivery'])
                .order('created_at', { ascending: true });

            if (assignedError) throw assignedError;

            setAvailableOrders(available || []);
            setMyOrders(assigned || []);
        } catch (error: any) {
            console.error('Error loading orders:', error);
            Alert.alert('Error', 'No se pudieron cargar las órdenes');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const setupRealtimeSubscription = () => {
        // Suscribirse a cambios en órdenes
        const channel = supabase
            .channel('driver-orders')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `status_detailed=eq.ready_for_pickup`,
                },
                () => {
                    loadOrders(); // Recargar cuando hay cambios
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const handleAcceptOrder = async (orderId: string) => {
        try {
            // Verify the order exists and is available
            const { data: orderCheck, error: checkError } = await supabase
                .from('orders')
                .select('id, status_detailed, assigned_driver_id')
                .eq('id', orderId)
                .single();

            if (checkError) {
                throw checkError;
            }

            // Update order with explicit status
            const { data, error } = await supabase
                .from('orders')
                .update({
                    assigned_driver_id: user!.id,
                    driver_accepted_at: new Date().toISOString(),
                    status_detailed: 'assigned_to_driver',
                })
                .eq('id', orderId)
                .eq('status_detailed', 'ready_for_pickup')
                .is('assigned_driver_id', null)
                .select('id, status_detailed, assigned_driver_id, driver_accepted_at')
                .single();

            if (error) {
                throw error;
            }

            if (!data) {
                Alert.alert('Error', 'La orden ya fue asignada a otro repartidor');
                loadOrders();
                return;
            }

            // Wait a moment for database to update, then navigate
            await new Promise(resolve => setTimeout(resolve, 800));

            // Navigate directly to order detail screen
            router.replace(`/driver/order/${orderId}`);
        } catch (error: any) {
            console.error('Error accepting order:', error);
            Alert.alert('Error', error.message || 'No se pudo aceptar la orden');
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadOrders();
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ title: 'Mis Entregas', headerShown: true }} />
                <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 40 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ title: 'Mis Entregas', headerShown: true }} />

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Mis Órdenes Activas */}
                {myOrders.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <TruckIcon size={20} color="#f97316" />
                            <Text style={styles.sectionTitle}>Mis Entregas ({myOrders.length})</Text>
                        </View>

                        {myOrders.map((order) => (
                            <TouchableOpacity
                                key={order.id}
                                style={[styles.orderCard, styles.myOrderCard]}
                                onPress={() => router.push(`/driver/order/${order.id}`)}
                            >
                                <View style={styles.orderHeader}>
                                    <Text style={styles.orderNumber}>
                                        Orden #{order.created_at.slice(0, 10).replace(/-/g, '')}
                                    </Text>
                                    <View style={styles.statusBadge}>
                                        <Text style={styles.statusText}>
                                            {order.status_detailed === 'assigned_to_driver' ? 'Asignada' : 'En Entrega'}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.customerName}>📦 {order.profiles?.full_name || 'Cliente'}</Text>
                                <Text style={styles.address} numberOfLines={2}>
                                    📍 {order.addresses?.address_line || 'Sin dirección'}
                                </Text>
                                <Text style={styles.total}>Total: ${(order.total_cents / 100).toFixed(2)}</Text>

                                <View style={styles.actionButton}>
                                    <Text style={styles.actionButtonText}>Ver Detalles →</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Órdenes Disponibles */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Package size={20} color="#3b82f6" />
                        <Text style={styles.sectionTitle}>Órdenes Disponibles ({availableOrders.length})</Text>
                    </View>

                    {availableOrders.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Package size={60} color="#d1d5db" />
                            <Text style={styles.emptyText}>No hay órdenes disponibles</Text>
                            <Text style={styles.emptySubtext}>Se te notificará cuando haya nuevas</Text>
                        </View>
                    ) : (
                        availableOrders.map((order) => (
                            <View key={order.id} style={styles.orderCard}>
                                <View style={styles.orderHeader}>
                                    <Text style={styles.orderNumber}>
                                        Orden #{order.created_at.slice(0, 10).replace(/-/g, '')}
                                    </Text>
                                    <View style={[styles.statusBadge, styles.availableBadge]}>
                                        <Text style={styles.statusText}>Disponible</Text>
                                    </View>
                                </View>

                                <Text style={styles.customerName}>📦 {order.profiles?.full_name || 'Cliente'}</Text>
                                <Text style={styles.address} numberOfLines={2}>
                                    📍 {order.addresses?.address_line || 'Sin dirección'}
                                </Text>
                                <Text style={styles.total}>Total: ${(order.total_cents / 100).toFixed(2)}</Text>

                                <TouchableOpacity
                                    style={styles.acceptButton}
                                    onPress={() => handleAcceptOrder(order.id)}
                                >
                                    <Text style={styles.acceptButtonText}>Aceptar Orden</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
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
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1f2937',
    },
    orderCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    myOrderCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#f97316',
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderNumber: {
        fontSize: 14,
        fontWeight: '800',
        color: '#6b7280',
    },
    statusBadge: {
        backgroundColor: '#fed7aa',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 999,
    },
    availableBadge: {
        backgroundColor: '#dbeafe',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#92400e',
    },
    customerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 6,
    },
    address: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
        lineHeight: 20,
    },
    total: {
        fontSize: 16,
        fontWeight: '800',
        color: '#f97316',
        marginBottom: 12,
    },
    acceptButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    acceptButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '800',
    },
    actionButton: {
        backgroundColor: '#f97316',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '800',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#9ca3af',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#d1d5db',
        marginTop: 8,
    },
});
