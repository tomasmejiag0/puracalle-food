/**
 * PANTALLA: DETALLE DE ORDEN PARA REPARTIDOR
 * 
 * Muestra información completa de una orden asignada:
 * - Datos del cliente
 * - Dirección de entrega con mapa (LiveDeliveryMap)
 * - Items de la orden
 * - Botones de acción (Iniciar entrega, Completar entrega con foto)
 */

import RealTimeDeliveryMap from '@/components/RealTimeDeliveryMap';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { startTracking, stopTracking } from '@/services/locationTracker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Navigation, Package, Phone, User, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    Linking,
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
    notes?: string;
    delivery_code?: string;
    profiles?: {
        full_name?: string;
        email?: string;
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

export default function DriverOrderDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [driverLocation, setDriverLocation] = useState<{ latitude: number, longitude: number } | null>(null);

    useEffect(() => {
        // Load order immediately, then reload after a delay to catch updates
        loadOrder();
        
        // Reload after delay to ensure order is updated in database after acceptance
        const timer = setTimeout(() => {
            loadOrder();
        }, 1000);

        // Subscribe to order changes (e.g. cancellation)
        const channel = supabase
            .channel(`order-${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${id}`,
                },
                (payload: any) => {
                    const newStatus = payload.new?.status_detailed;
                    if (newStatus === 'cancelled') {
                        Alert.alert('Orden Cancelada', 'La orden ha sido cancelada.');
                        stopTracking();
                        router.replace('/(tabs)/deliveries');
                    } else {
                        loadOrder(); // Reload order to get latest status
                    }
                }
            )
            .subscribe();

        return () => {
            clearTimeout(timer);
            supabase.removeChannel(channel);
            stopTracking();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Block navigation when order is accepted (assigned_to_driver or out_for_delivery)
    useEffect(() => {
        const isOrderActive = order?.status_detailed === 'assigned_to_driver' || order?.status_detailed === 'out_for_delivery';
        
        if (isOrderActive) {
            const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
                Alert.alert(
                    '⚠️ Orden Activa',
                    'Tienes una orden activa. Debes completarla o liberarla antes de salir.',
                    [
                        {
                            text: 'Liberar Orden',
                            style: 'destructive',
                            onPress: async () => {
                                try {
                                    // Reset order to ready_for_pickup and clear driver assignment
                                    const { error } = await supabase
                                        .from('orders')
                                        .update({
                                            status_detailed: 'ready_for_pickup',
                                            assigned_driver_id: null,
                                            driver_accepted_at: null,
                                            out_for_delivery_at: null,
                                        })
                                        .eq('id', id);

                                    if (error) throw error;

                                    stopTracking();
                                    Alert.alert('✅ Orden Liberada', 'La orden ha sido liberada y está disponible para otros repartidores.');
                                    router.replace('/(tabs)/deliveries');
                                } catch (error: any) {
                                    Alert.alert('Error', error.message || 'No se pudo liberar la orden');
                                }
                            }
                        },
                        {
                            text: 'Continuar',
                            style: 'cancel'
                        }
                    ]
                );
                return true; // Prevent default back behavior
            });

            return () => backHandler.remove();
        }
    }, [order?.status_detailed, id, router]);

    // Subscribe to own location for map updates
    useEffect(() => {
        if (user && (order?.status_detailed === 'assigned_to_driver' || order?.status_detailed === 'out_for_delivery')) {
            const locationChannel = supabase
                .channel(`driver-loc-${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'driver_locations',
                        filter: `driver_id=eq.${user.id}`,
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
    }, [user, order?.status_detailed]);

    const loadOrder = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          profiles!user_id (full_name, email, phone),
          addresses!fk_orders_addresses (address_line, latitude, longitude, phone_number, delivery_instructions)
        `)
                .eq('id', id)
                .single();

            if (error) throw error;
            
            let orderData = data;
            
            // Fix: If order is assigned to this driver but status is still ready_for_pickup, update it
            if (user && orderData.assigned_driver_id === user.id && orderData.status_detailed === 'ready_for_pickup') {
                const { data: updateResult, error: fixError } = await supabase
                    .from('orders')
                    .update({ 
                        status_detailed: 'assigned_to_driver',
                        driver_accepted_at: orderData.driver_accepted_at || new Date().toISOString()
                    })
                    .eq('id', id)
                    .select('status_detailed')
                    .single();
                
                if (!fixError && updateResult) {
                    const { data: fixedData, error: reloadError } = await supabase
                        .from('orders')
                        .select(`
                          *,
                          profiles!user_id (full_name, email, phone),
                          addresses!fk_orders_addresses (address_line, latitude, longitude, phone_number, delivery_instructions)
                        `)
                        .eq('id', id)
                        .single();
                    
                    if (!reloadError && fixedData) {
                        orderData = fixedData;
                    }
                } else if (fixError) {
                    console.error('Error fixing order status:', fixError);
                    Alert.alert('Error', `No se pudo actualizar el estado: ${fixError.message}`);
                }
            }
            
            setOrder(orderData);

            // Load initial driver location if available
            if (user && orderData) {
                const { data: locationData } = await supabase
                    .from('driver_locations')
                    .select('latitude, longitude')
                    .eq('driver_id', user.id)
                    .order('updated_at', { ascending: false })
                    .limit(1)
                    .single();

                if (locationData) {
                    setDriverLocation({
                        latitude: locationData.latitude,
                        longitude: locationData.longitude
                    });
                }

                // Start tracking automatically if order is assigned or out for delivery
                if (orderData.status_detailed === 'assigned_to_driver' || orderData.status_detailed === 'out_for_delivery') {
                    startTracking(user.id, orderData.id);
                }
            }
        } catch (error: any) {
            console.error('Error loading order:', error);
            Alert.alert('Error', 'No se pudo cargar la orden');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleStartDelivery = async () => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    status_detailed: 'out_for_delivery',
                    out_for_delivery_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (error) throw error;

            // Start tracking
            if (user) {
                startTracking(user.id, id as string);
            }

            Alert.alert('¡En Camino!', 'Has iniciado la entrega. Tu ubicación se comparte en tiempo real.');
            loadOrder();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleCompleteDelivery = () => {
        // Navegar a la pantalla de completar con cámara
        router.push(`/driver/complete/${id}`);
    };

    const handleCancelOrder = async () => {
        Alert.alert(
            '⚠️ Liberar Orden',
            '¿Estás seguro de que deseas liberar esta orden? La orden volverá a estar disponible para otros repartidores.',
            [
                {
                    text: 'No',
                    style: 'cancel'
                },
                {
                    text: 'Sí, Liberar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Reset order to ready_for_pickup and clear driver assignment
                            // This makes it available for other drivers
                            const { error } = await supabase
                                .from('orders')
                                .update({
                                    status_detailed: 'ready_for_pickup',
                                    assigned_driver_id: null,
                                    driver_accepted_at: null,
                                    out_for_delivery_at: null,
                                })
                                .eq('id', id);

                            if (error) throw error;

                            // Stop tracking
                            stopTracking();

                            Alert.alert(
                                '✅ Orden Liberada',
                                'La orden ha sido liberada y está disponible para otros repartidores.',
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => router.replace('/(tabs)/deliveries')
                                    }
                                ]
                            );
                        } catch (error: any) {
                            console.error('Error releasing order:', error);
                            Alert.alert('Error', error.message || 'No se pudo liberar la orden');
                        }
                    }
                }
            ]
        );
    };

    const handleOpenMaps = () => {
        if (!order?.addresses) return;

        const { latitude, longitude, address_line } = order.addresses;
        const label = encodeURIComponent(address_line);

        const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_label=${label}`;

        Linking.openURL(url);
    };

    const handleCall = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#f97316" />
            </SafeAreaView>
        );
    }

    if (!order) return null;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ title: 'Detalle de Orden', headerShown: true }} />

            <ScrollView style={styles.content}>
                {/* Status Badge */}
                <View style={styles.statusContainer}>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>
                            {order.status_detailed === 'assigned_to_driver' && '📦 Asignada'}
                            {order.status_detailed === 'out_for_delivery' && '🚗 En Entrega'}
                            {order.status_detailed === 'delivered' && '✅ Entregada'}
                        </Text>
                    </View>
                </View>


                {/* Customer Info */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <User size={20} color="#f97316" />
                        <Text style={styles.cardTitle}>Cliente</Text>
                    </View>
                    <Text style={styles.customerName}>{order.profiles?.full_name || 'Sin nombre'}</Text>
                    <Text style={styles.customerEmail}>{order.profiles?.email}</Text>
                    {order.profiles?.phone && (
                        <TouchableOpacity
                            style={styles.phoneButton}
                            onPress={() => handleCall(order.profiles!.phone!)}
                        >
                            <Phone size={16} color="#3b82f6" />
                            <Text style={styles.phoneText}>{order.profiles.phone}</Text>
                        </TouchableOpacity>
                    )}
                </View>

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

                    {order.addresses?.phone_number && (
                        <TouchableOpacity
                            style={styles.phoneButton}
                            onPress={() => handleCall(order.addresses!.phone_number!)}
                        >
                            <Phone size={16} color="#3b82f6" />
                            <Text style={styles.phoneText}>{order.addresses.phone_number}</Text>
                        </TouchableOpacity>
                    )}

                    {/* Real-time Map */}
                    {order.addresses && (
                        <View style={styles.mapWrapper}>
                            <RealTimeDeliveryMap
                                customerLocation={{
                                    latitude: order.addresses.latitude,
                                    longitude: order.addresses.longitude
                                }}
                                driverLocation={driverLocation}
                            />
                            {(order.status_detailed === 'assigned_to_driver' || order.status_detailed === 'out_for_delivery') && (
                                <View style={styles.mapStatusOverlay}>
                                    <Text style={styles.mapStatusText}>
                                        {order.status_detailed === 'out_for_delivery' && driverLocation
                                            ? '🚗 Compartiendo ubicación en tiempo real'
                                            : '📍 Tu ubicación se mostrará cuando inicies la entrega'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Optional: Open in Google Maps button */}
                    <TouchableOpacity style={styles.mapsButton} onPress={handleOpenMaps}>
                        <Navigation size={20} color="white" />
                        <Text style={styles.mapsButtonText}>Abrir en Google Maps</Text>
                    </TouchableOpacity>
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

                {/* Actions - Always show if order is assigned or out for delivery */}
                {(order.status_detailed === 'assigned_to_driver' || order.status_detailed === 'out_for_delivery') && (
                    <View style={styles.actionsContainer}>
                        {order.status_detailed === 'assigned_to_driver' && (
                            <TouchableOpacity style={styles.actionButton} onPress={handleStartDelivery}>
                                <Text style={styles.actionButtonText}>🚗 Iniciar Entrega</Text>
                            </TouchableOpacity>
                        )}

                        {order.status_detailed === 'out_for_delivery' && (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.completeButton]}
                                onPress={handleCompleteDelivery}
                            >
                                <Text style={styles.actionButtonText}>📸 Completar Entrega</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={handleCancelOrder}
                        >
                            <X size={20} color="white" />
                            <Text style={styles.actionButtonText}>Liberar Orden</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Debug info - Remove in production */}
                {__DEV__ && (
                    <View style={styles.debugContainer}>
                        <Text style={styles.debugText}>Status: {order.status_detailed}</Text>
                        <Text style={styles.debugText}>Order ID: {order.id}</Text>
                    </View>
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
    },
    statusBadge: {
        backgroundColor: '#fed7aa',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 999,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '900',
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
    customerName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1f2937',
        marginBottom: 6,
    },
    customerEmail: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 12,
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
    mapWrapper: {
        marginTop: 16,
        marginBottom: 12,
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
    mapsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#3b82f6',
        paddingVertical: 14,
        borderRadius: 10,
        marginTop: 12,
    },
    mapsButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
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
    actionsContainer: {
        gap: 12,
        marginTop: 8,
    },
    actionButton: {
        backgroundColor: '#f97316',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    completeButton: {
        backgroundColor: '#10b981',
        shadowColor: '#10b981',
    },
    cancelButton: {
        backgroundColor: '#dc2626',
        shadowColor: '#dc2626',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
    },
    debugContainer: {
        backgroundColor: '#f3f4f6',
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    debugText: {
        fontSize: 12,
        color: '#6b7280',
        fontFamily: 'monospace',
    },
});
