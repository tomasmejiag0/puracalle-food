/**
 * PANTALLA: TRACKING DE ORDEN PARA CLIENTE
 * 
 * Muestra información completa de una orden en tiempo real:
 * - Estado de la orden
 * - Mapa en tiempo real con ubicación del driver
 * - Código de entrega
 * - Tiempo estimado de entrega
 * - Información del driver (si está asignado)
 */

import RealTimeDeliveryMap from '@/components/RealTimeDeliveryMap';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Clock, MapPin, Package, Phone, Truck, User, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface OrderDetail {
    id: string;
    status: string;
    status_detailed: string;
    total_cents: number;
    created_at: string;
    driver_accepted_at?: string;
    out_for_delivery_at?: string;
    notes?: string;
    delivery_code?: string;
    assigned_driver_id?: string;
    profiles?: {
        full_name?: string;
        email?: string;
        phone?: string;
    };
    driver?: {
        full_name?: string;
        phone?: string;
    };
    addresses?: {
        address_line: string;
        latitude: number;
        longitude: number;
        phone_number?: string;
        delivery_instructions?: string;
    };
}

export default function CustomerOrderTracking() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [driverLocation, setDriverLocation] = useState<{ latitude: number, longitude: number } | null>(null);

    useEffect(() => {
        loadOrder();

        // Subscribe to order changes
        const channel = supabase
            .channel(`order-${id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${id}`,
                },
                (payload: any) => {
                    const newStatus = payload.new?.status_detailed;
                    if (newStatus === 'delivered') {
                        // Recargar orden para actualizar UI
                        loadOrder();
                        // Mostrar alerta y redirigir después de un momento
                        setTimeout(() => {
                            Alert.alert(
                                '¡Pedido Entregado! ✅',
                                'Tu pedido ha sido entregado exitosamente. Gracias por tu compra.',
                                [
                                    {
                                        text: 'Ver mis pedidos',
                                        onPress: () => router.replace('/(tabs)/pedidos'),
                                    },
                                    {
                                        text: 'Quedarme aquí',
                                        style: 'cancel',
                                    }
                                ]
                            );
                        }, 500);
                    } else {
                        loadOrder();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Subscribe to driver location updates (only if order is active, not delivered)
    useEffect(() => {
        // Don't subscribe if order is delivered or cancelled
        if (order?.status_detailed === 'delivered' || order?.status_detailed === 'cancelled') {
            return;
        }

        if (order?.assigned_driver_id && (order.status_detailed === 'assigned_to_driver' || order.status_detailed === 'out_for_delivery')) {
            const locationChannel = supabase
                .channel(`driver-loc-${order.assigned_driver_id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'driver_locations',
                        filter: `driver_id=eq.${order.assigned_driver_id}`,
                    },
                    (payload: any) => {
                        if (payload.new) {
                            setDriverLocation({
                                latitude: payload.new.latitude,
                                longitude: payload.new.longitude
                            });
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(locationChannel);
            };
        }
    }, [order?.assigned_driver_id, order?.status_detailed]);

    const loadOrder = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          profiles!user_id (full_name, email, phone),
          driver:profiles!assigned_driver_id (full_name, phone),
          addresses!fk_orders_addresses (address_line, latitude, longitude, phone_number, delivery_instructions)
        `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setOrder(data);

            // Load driver location if available (only if order is active, not delivered)
            if (data.assigned_driver_id && data.status_detailed !== 'delivered' && data.status_detailed !== 'cancelled') {
                const { data: locationData } = await supabase
                    .from('driver_locations')
                    .select('latitude, longitude')
                    .eq('driver_id', data.assigned_driver_id)
                    .order('updated_at', { ascending: false })
                    .limit(1)
                    .single();

                if (locationData) {
                    setDriverLocation({
                        latitude: locationData.latitude,
                        longitude: locationData.longitude
                    });
                }
            } else {
                // Clear driver location if order is delivered or cancelled
                setDriverLocation(null);
            }
        } catch (error: any) {
            console.error('Error loading order:', error);
            Alert.alert('Error', 'No se pudo cargar la orden');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    // Calculate estimated delivery time (30 minutes from driver acceptance or order creation)
    const getEstimatedTime = () => {
        if (order?.status_detailed === 'delivered') return null;
        
        // Use driver acceptance time if available, otherwise use order creation time
        const startTime = order?.driver_accepted_at 
            ? new Date(order.driver_accepted_at).getTime()
            : new Date(order?.created_at || Date.now()).getTime();
        
        const estimatedTime = startTime + (30 * 60 * 1000); // 30 minutes
        const now = Date.now();
        const remaining = estimatedTime - now;
        
        if (remaining <= 0) return 'Llegando pronto';
        
        const minutes = Math.ceil(remaining / (60 * 1000));
        if (minutes <= 0) return 'Llegando pronto';
        return `${minutes} min`;
    };

    const getStatusText = () => {
        switch (order?.status_detailed) {
            case 'pending':
            case 'ready_for_pickup':
                return 'Esperando repartidor';
            case 'assigned_to_driver':
                return 'Repartidor asignado';
            case 'out_for_delivery':
                return 'En camino';
            case 'delivered':
                return 'Entregado';
            case 'cancelled':
                return 'Cancelado';
            default:
                return 'Procesando';
        }
    };

    const getStatusColor = () => {
        switch (order?.status_detailed) {
            case 'pending':
            case 'ready_for_pickup':
                return '#6b7280';
            case 'assigned_to_driver':
                return '#3b82f6';
            case 'out_for_delivery':
                return '#f97316';
            case 'delivered':
                return '#10b981';
            case 'cancelled':
                return '#dc2626';
            default:
                return '#6b7280';
        }
    };

    const handleCancelOrder = async () => {
        // Only allow cancellation if order is not delivered or cancelled
        if (order?.status_detailed === 'delivered' || order?.status_detailed === 'cancelled') {
            return;
        }

        // Don't allow cancellation if driver is already out for delivery
        if (order?.status_detailed === 'out_for_delivery') {
            Alert.alert(
                '⚠️ No se puede cancelar',
                'El repartidor ya está en camino. No puedes cancelar esta orden.'
            );
            return;
        }

        Alert.alert(
            '⚠️ Cancelar Pedido',
            '¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer.',
            [
                {
                    text: 'No',
                    style: 'cancel'
                },
                {
                    text: 'Sí, Cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Delete order items first (cascade should handle this, but being explicit)
                            const { error: itemsError } = await supabase
                                .from('order_items')
                                .delete()
                                .eq('order_id', id);

                            if (itemsError) console.error('Error deleting order items:', itemsError);

                            // Delete the order (this will cascade to related records)
                            const { error } = await supabase
                                .from('orders')
                                .delete()
                                .eq('id', id);

                            if (error) throw error;

                            Alert.alert('Pedido Cancelado', 'Tu pedido ha sido cancelado y eliminado exitosamente.');
                            router.replace('/(tabs)/pedidos');
                        } catch (error: any) {
                            console.error('Error cancelling order:', error);
                            Alert.alert('Error', error.message || 'No se pudo cancelar el pedido');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#f97316" />
            </SafeAreaView>
        );
    }

    if (!order) return null;

    const estimatedTime = getEstimatedTime();
    // Solo mostrar mapa si el pedido está activo (no entregado ni cancelado)
    const showMap = (order.status_detailed === 'assigned_to_driver' || order.status_detailed === 'out_for_delivery') 
        && order.status_detailed !== 'delivered' 
        && order.status_detailed !== 'cancelled';
    const isDelivered = order.status_detailed === 'delivered';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ title: 'Seguimiento de Pedido', headerShown: true }} />

            <ScrollView style={styles.content}>
                {/* Status Badge */}
                <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor() }]}>
                            {getStatusText()}
                        </Text>
                    </View>
                    {isDelivered && order.delivered_at && (
                        <View style={styles.deliveredBadge}>
                            <Text style={styles.deliveredText}>
                                ✅ Entregado el {new Date(order.delivered_at).toLocaleDateString('es-CO', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Text>
                        </View>
                    )}
                    {estimatedTime && !isDelivered && (
                        <View style={styles.timeBadge}>
                            <Clock size={16} color="#f97316" />
                            <Text style={styles.timeText}>Llega en: {estimatedTime}</Text>
                        </View>
                    )}
                </View>

                {/* Delivery Code */}
                {order.delivery_code && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Package size={20} color="#f97316" />
                            <Text style={styles.cardTitle}>Código de Entrega</Text>
                        </View>
                        <View style={styles.codeDisplay}>
                            <Text style={styles.codeText}>{order.delivery_code}</Text>
                        </View>
                        <Text style={styles.codeHint}>
                            📱 Muestra este código al repartidor para confirmar la entrega
                        </Text>
                    </View>
                )}

                {/* Real-time Map - Solo mostrar si el pedido está activo */}
                {showMap && order.addresses && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <MapPin size={20} color="#f97316" />
                            <Text style={styles.cardTitle}>Ubicación en Tiempo Real</Text>
                        </View>
                        <View style={styles.mapWrapper}>
                            <RealTimeDeliveryMap
                                customerLocation={{
                                    latitude: order.addresses.latitude,
                                    longitude: order.addresses.longitude
                                }}
                                driverLocation={driverLocation}
                            />
                            {order.status_detailed === 'out_for_delivery' && driverLocation && (
                                <View style={styles.mapStatusOverlay}>
                                    <Text style={styles.mapStatusText}>
                                        🚗 Repartidor en camino
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Mensaje cuando el pedido está entregado */}
                {isDelivered && (
                    <View style={styles.card}>
                        <View style={styles.deliveredMessage}>
                            <Text style={styles.deliveredMessageTitle}>✅ Pedido Entregado</Text>
                            <Text style={styles.deliveredMessageText}>
                                Tu pedido ha sido entregado exitosamente. Gracias por tu compra.
                            </Text>
                            {order.delivered_at && (
                                <Text style={styles.deliveredMessageDate}>
                                    Entregado el {new Date(order.delivered_at).toLocaleDateString('es-CO', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                {/* Driver Info */}
                {order.driver && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Truck size={20} color="#f97316" />
                            <Text style={styles.cardTitle}>Repartidor</Text>
                        </View>
                        <Text style={styles.driverName}>{order.driver.full_name || 'Repartidor asignado'}</Text>
                        {order.driver.phone && (
                            <TouchableOpacity
                                style={styles.phoneButton}
                                onPress={() => {
                                    // Linking.openURL(`tel:${order.driver.phone}`);
                                }}
                            >
                                <Phone size={16} color="#3b82f6" />
                                <Text style={styles.phoneText}>{order.driver.phone}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Delivery Address */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MapPin size={20} color="#f97316" />
                        <Text style={styles.cardTitle}>Dirección de Entrega</Text>
                    </View>
                    <Text style={styles.address}>{order.addresses?.address_line}</Text>

                    {order.addresses?.delivery_instructions && (
                        <View style={styles.instructions}>
                            <Text style={styles.instructionsLabel}>📝 Instrucciones:</Text>
                            <Text style={styles.instructionsText}>{order.addresses.delivery_instructions}</Text>
                        </View>
                    )}
                </View>

                {/* Order Total */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Package size={20} color="#f97316" />
                        <Text style={styles.cardTitle}>Total del Pedido</Text>
                    </View>
                    <Text style={styles.total}>${(order.total_cents / 100).toFixed(2)}</Text>
                    {order.notes && (
                        <View style={styles.notes}>
                            <Text style={styles.notesText}>{order.notes}</Text>
                        </View>
                    )}
                </View>

                {/* Cancel Button - Only show if order can be cancelled */}
                {order.status_detailed !== 'delivered' && 
                 order.status_detailed !== 'cancelled' && 
                 order.status_detailed !== 'out_for_delivery' && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancelOrder}
                    >
                        <X size={20} color="white" />
                        <Text style={styles.cancelButtonText}>Cancelar Pedido</Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 40 }} />
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
    statusContainer: {
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    statusBadge: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 999,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '900',
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#fed7aa',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 999,
    },
    timeText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#92400e',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1f2937',
    },
    codeDisplay: {
        backgroundColor: '#fef2e7',
        borderWidth: 2,
        borderColor: '#f97316',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginBottom: 12,
    },
    codeText: {
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 8,
        color: '#f97316',
    },
    codeHint: {
        fontSize: 13,
        color: '#6b7280',
        textAlign: 'center',
    },
    mapWrapper: {
        marginTop: 12,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    mapStatusOverlay: {
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        backgroundColor: 'rgba(16, 185, 129, 0.95)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    mapStatusText: {
        fontSize: 12,
        fontWeight: '800',
        color: 'white',
        letterSpacing: 0.5,
    },
    driverName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1f2937',
        marginBottom: 8,
    },
    phoneButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#eff6ff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 8,
    },
    phoneText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#3b82f6',
    },
    address: {
        fontSize: 16,
        color: '#374151',
        lineHeight: 24,
        marginBottom: 12,
    },
    instructions: {
        backgroundColor: '#fffbeb',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#fbbf24',
    },
    instructionsLabel: {
        fontSize: 13,
        fontWeight: '800',
        color: '#92400e',
        marginBottom: 4,
    },
    instructionsText: {
        fontSize: 14,
        color: '#78350f',
        lineHeight: 20,
    },
    total: {
        fontSize: 32,
        fontWeight: '900',
        color: '#f97316',
        marginBottom: 12,
    },
    notes: {
        backgroundColor: '#f3f4f6',
        padding: 12,
        borderRadius: 8,
    },
    notesText: {
        fontSize: 14,
        color: '#4b5563',
        fontStyle: 'italic',
    },
    cancelButton: {
        backgroundColor: '#dc2626',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
    },
    deliveredBadge: {
        backgroundColor: '#d1fae5',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 999,
        marginTop: 8,
    },
    deliveredText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#065f46',
    },
    deliveredMessage: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    deliveredMessageTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#10b981',
        marginBottom: 8,
    },
    deliveredMessageText: {
        fontSize: 15,
        color: '#374151',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 22,
    },
    deliveredMessageDate: {
        fontSize: 13,
        color: '#6b7280',
        fontStyle: 'italic',
    },
});

