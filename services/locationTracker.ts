/**
 * SERVICE: Location Tracker
 * 
 * Servicio de rastreo GPS en tiempo real para repartidores.
 * Utiliza expo-location para obtener coordenadas del dispositivo
 * y almacenarlas en Supabase para tracking en vivo.
 * 
 * Funcionalidades:
 * - Solicitud automática de permisos de ubicación
 * - Actualización continua cada 5 segundos o 10 metros
 * - Almacenamiento en base de datos con metadata (precisión, velocidad, dirección)
 * - Gestión de suscripciones para evitar memory leaks
 * 
 * @module locationTracker
 */

import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

// Suscripción activa de ubicación (singleton)
let locationSubscription: Location.LocationSubscription | null = null;

/**
 * Inicia el rastreo GPS en tiempo real del repartidor
 * 
 * @param driverId - ID del repartidor a rastrear
 * @param orderId - ID de la orden asociada (opcional)
 * 
 * Proceso:
 * 1. Solicita permisos de ubicación (ACCESS_FINE_LOCATION)
 * 2. Configura listener de posición con alta precisión
 * 3. Actualiza base de datos cada 5 segundos o 10 metros de movimiento
 * 4. Incluye metadata: precisión GPS, velocidad, dirección
 * 
 * @example
 * ```typescript
 * await startTracking(user.id, order.id);
 * ```
 */
export const startTracking = async (driverId: string, orderId?: string) => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Se requiere acceso a la ubicación para el rastreo.');
            return;
        }

        // Stop any existing subscription
        if (locationSubscription) {
            locationSubscription.remove();
        }

        locationSubscription = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 5000, // Update every 5 seconds
                distanceInterval: 10, // Update every 10 meters
            },
            async (location) => {
                const { latitude, longitude, accuracy, heading, speed } = location.coords;

                try {
                    const { error } = await supabase
                        .from('driver_locations')
                        .insert({
                            driver_id: driverId,
                            order_id: orderId || null,
                            latitude,
                            longitude,
                            accuracy: accuracy || null,
                            heading: heading || null,
                            speed: speed || null,
                        });

                    if (error && error.code !== '42501') {
                        console.error('Error updating location:', error);
                    }
                } catch (err: any) {
                    if (__DEV__) {
                        console.error('Location update error:', err.message);
                    }
                }
            }
        );
    } catch (error) {
        console.error('Error starting tracking:', error);
    }
};

export const stopTracking = () => {
    if (locationSubscription) {
        locationSubscription.remove();
        locationSubscription = null;
    }
};
