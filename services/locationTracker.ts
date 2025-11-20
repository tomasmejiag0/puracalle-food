import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

let locationSubscription: Location.LocationSubscription | null = null;

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
