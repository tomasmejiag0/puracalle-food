/**
 * COMPONENTE: MAPA INTERACTIVO CON WEBVIEW (EXPO GO COMPATIBLE)
 * 
 * Permite al usuario:
 * - Ver un mapa interactivo de Google Maps dentro de la app
 * - Moverse por el mapa arrastrando
 * - Hacer zoom in/out
 * - Seleccionar ubicación tocando en el mapa
 * - Ver dirección en tiempo real mediante reverse geocoding
 * - Usar ubicación actual
 * - Todo sin salir de la aplicación
 */

import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Check, Minus, Navigation, Plus, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

interface LocationPickerProps {
    initialLocation?: {
        latitude: number;
        longitude: number;
    };
    onLocationSelect: (location: {
        latitude: number;
        longitude: number;
        address: string;
    }) => void;
    onClose: () => void;
}

// Ubicación por defecto: Santa Fe de Antioquia, Colombia (centro)
const DEFAULT_LOCATION = {
    latitude: 6.5386,
    longitude: -75.9159,
};

const { width, height } = Dimensions.get('window');

export default function LocationPicker({
    initialLocation,
    onLocationSelect,
    onClose,
}: LocationPickerProps) {
    const webViewRef = useRef<WebView>(null);

    const [position, setPosition] = useState({
        latitude: initialLocation?.latitude || DEFAULT_LOCATION.latitude,
        longitude: initialLocation?.longitude || DEFAULT_LOCATION.longitude,
    });

    const [address, setAddress] = useState<string>('Cargando dirección...');
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        reverseGeocode(position.latitude, position.longitude);
    }, [position]);

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const [geocoded] = await Location.reverseGeocodeAsync({
                latitude: lat,
                longitude: lng,
            });

            if (geocoded) {
                const fullAddress = [
                    geocoded.street,
                    geocoded.streetNumber,
                    geocoded.district,
                    geocoded.subregion,
                    geocoded.city,
                ]
                    .filter(Boolean)
                    .join(', ');

                setAddress(fullAddress || 'Dirección no disponible');
            } else {
                setAddress('Dirección no disponible');
            }
        } catch (error) {
            console.error('Error en reverse geocoding:', error);
            setAddress(`Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`);
        }
    };

    const handleGetCurrentLocation = async () => {
        setLoadingLocation(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permiso Denegado',
                    'Necesitamos acceso a tu ubicación para usar esta función.'
                );
                setLoadingLocation(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const newPosition = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            setPosition(newPosition);
            updateMapCenter(newPosition.latitude, newPosition.longitude);

            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error: any) {
            console.error('Error obteniendo ubicación:', error);
            Alert.alert('Error', 'No se pudo obtener tu ubicación actual.');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoadingLocation(false);
        }
    };

    const updateMapCenter = (lat: number, lng: number) => {
        if (webViewRef.current && mapReady) {
            webViewRef.current.injectJavaScript(`
        map.setView([${lat}, ${lng}], 16);
        marker.setLatLng([${lat}, ${lng}]);
        true;
      `);
        }
    };

    const handleZoomIn = () => {
        if (webViewRef.current && mapReady) {
            webViewRef.current.injectJavaScript(`
        map.zoomIn();
        true;
      `);
        }
    };

    const handleZoomOut = () => {
        if (webViewRef.current && mapReady) {
            webViewRef.current.injectJavaScript(`
        map.zoomOut();
        true;
      `);
        }
    };

    const handleConfirm = async () => {
        if (!address || address === 'Cargando dirección...') {
            Alert.alert('Error', 'Espera a que se cargue la dirección.');
            return;
        }

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onLocationSelect({
            latitude: position.latitude,
            longitude: position.longitude,
            address,
        });
    };

    // HTML del mapa interactivo con Leaflet (OpenStreetMap - GRATIS, sin API key)
    const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { width: 100%; height: 100%; overflow: hidden; }
        .custom-marker {
          width: 40px;
          height: 40px;
          background: #f97316;
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .custom-marker::after {
          content: '';
          position: absolute;
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        let map;
        let marker;
        
        // Inicializar mapa
        map = L.map('map', {
          center: [${position.latitude}, ${position.longitude}],
          zoom: 16,
          zoomControl: false,
          attributionControl: false
        });

        // Agregar tiles de OpenStreetMap (gratis!)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        // Crear ícono personalizado
        const customIcon = L.divIcon({
          className: 'custom-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        });

        // Agregar marcador draggable
        marker = L.marker([${position.latitude}, ${position.longitude}], {
          draggable: true,
          icon: customIcon
        }).addTo(map);

        // Evento cuando se arrastra el marcador
        marker.on('dragend', function(e) {
          const lat = e.target.getLatLng().lat;
          const lng = e.target.getLatLng().lng;
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'markerMoved',
            lat: lat,
            lng: lng
          }));
        });

        // Evento cuando se toca el mapa
        map.on('click', function(e) {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;
          marker.setLatLng([lat, lng]);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'markerMoved',
            lat: lat,
            lng: lng
          }));
        });

        // Notificar que el mapa está listo
        setTimeout(function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
        }, 500);
      </script>
    </body>
    </html>
  `;

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === 'ready') {
                setMapReady(true);
            } else if (data.type === 'markerMoved' || data.type === 'mapMoved') {
                setPosition({
                    latitude: data.lat,
                    longitude: data.lng,
                });
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <X size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Seleccionar Ubicación</Text>
                <TouchableOpacity
                    onPress={handleGetCurrentLocation}
                    disabled={loadingLocation}
                    style={styles.locationHeaderButton}
                >
                    {loadingLocation ? (
                        <ActivityIndicator size="small" color="#f97316" />
                    ) : (
                        <Navigation size={20} color="#f97316" />
                    )}
                </TouchableOpacity>
            </View>

            {/* Mapa interactivo */}
            <View style={styles.mapContainer}>
                <WebView
                    ref={webViewRef}
                    source={{ html: mapHtml }}
                    style={styles.webview}
                    onMessage={handleMessage}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#f97316" />
                            <Text style={styles.loadingText}>Cargando mapa...</Text>
                        </View>
                    )}
                />

                {/* Zoom Controls */}
                <View style={styles.zoomControls}>
                    <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
                        <Plus size={20} color="#1f2937" strokeWidth={3} />
                    </TouchableOpacity>
                    <View style={styles.zoomDivider} />
                    <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
                        <Minus size={20} color="#1f2937" strokeWidth={3} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Address Display */}
            <View style={styles.addressContainer}>
                <View style={styles.addressHeader}>
                    <Text style={styles.addressLabel}>📍 Dirección seleccionada:</Text>
                    <Text style={styles.coordsText}>
                        {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
                    </Text>
                </View>
                <Text style={styles.addressText} numberOfLines={2}>
                    {address}
                </Text>
            </View>

            {/* Info */}
            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                    💡 Arrastra el marcador o toca en el mapa para seleccionar tu ubicación exacta
                </Text>
            </View>

            {/* Bottom Button */}
            <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
                disabled={!mapReady}
            >
                <Check size={20} color="white" strokeWidth={3} />
                <Text style={styles.confirmButtonText}>Confirmar Ubicación</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fef2e7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#fed7aa',
    },
    closeButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1f2937',
    },
    locationHeaderButton: {
        padding: 8,
    },
    mapContainer: {
        flex: 1,
        margin: 16,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#e5e7eb',
        position: 'relative',
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fef2e7',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    zoomControls: {
        position: 'absolute',
        right: 16,
        top: 16,
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
        overflow: 'hidden',
    },
    zoomButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    zoomDivider: {
        height: 1,
        backgroundColor: '#e5e7eb',
    },
    addressContainer: {
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    addressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    addressLabel: {
        fontSize: 13,
        fontWeight: '800',
        color: '#f97316',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    coordsText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6b7280',
        fontFamily: 'monospace',
    },
    addressText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937',
        lineHeight: 20,
    },
    infoContainer: {
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 12,
        backgroundColor: '#eff6ff',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#3b82f6',
    },
    infoText: {
        fontSize: 12,
        color: '#1e40af',
        lineHeight: 16,
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 16,
        marginBottom: 16,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#f97316',
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 0.5,
    },
});
