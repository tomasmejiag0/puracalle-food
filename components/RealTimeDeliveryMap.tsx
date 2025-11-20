/**
 * COMPONENTE: MAPA EN TIEMPO REAL PARA ENTREGAS
 * 
 * Muestra:
 * - Ubicación del cliente (fija)
 * - Ubicación del driver (actualizada en tiempo real)
 * - Mapa interactivo con zoom y controles
 * - Basado en AddressMapPicker pero adaptado para tracking en tiempo real
 */

import { Minus, Plus } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';

interface Location {
    latitude: number;
    longitude: number;
}

interface RealTimeDeliveryMapProps {
    customerLocation: Location;
    driverLocation?: Location | null;
    restaurantLocation?: Location; // Optional restaurant location
}

// Ubicación del restaurante: Santa Fe de Antioquia, Cra 10 # 11-108, Colombia

const DEFAULT_LOCATION = {
    latitude: 6.5386,
    longitude: -75.9160,
};

export default function RealTimeDeliveryMap({
    customerLocation,
    driverLocation,
    restaurantLocation = DEFAULT_LOCATION,
}: RealTimeDeliveryMapProps) {
    const webViewRef = useRef<WebView>(null);
    const [mapReady, setMapReady] = useState(false);

    // Update driver location when it changes
    useEffect(() => {
        if (webViewRef.current && mapReady && driverLocation) {
            webViewRef.current.injectJavaScript(`
        updateDriverLocation(${driverLocation.latitude}, ${driverLocation.longitude});
        true;
      `);
        }
    }, [driverLocation, mapReady]);

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

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'ready') {
                setMapReady(true);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    };

    // Calculate center point between customer and driver (or just customer if no driver)
    const centerLat = driverLocation
        ? (customerLocation.latitude + driverLocation.latitude) / 2
        : customerLocation.latitude;
    const centerLng = driverLocation
        ? (customerLocation.longitude + driverLocation.longitude) / 2
        : customerLocation.longitude;

    // HTML del mapa interactivo con Leaflet
    const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { width: 100%; height: 100%; overflow: hidden; }
        .customer-icon {
          width: 40px;
          height: 40px;
          background: #10b981;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        .driver-icon {
          width: 40px;
          height: 40px;
          background: #f97316;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        .restaurant-icon {
          width: 35px;
          height: 35px;
          background: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        let map;
        let customerMarker;
        let driverMarker;
        let restaurantMarker;
        let routePolyline = null;
        let driverHistory = [];
        
        // Inicializar mapa
        map = L.map('map', {
          center: [${centerLat}, ${centerLng}],
          zoom: 14,
          zoomControl: false,
          attributionControl: false
        });

        // Agregar tiles de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        // Crear íconos personalizados
        const customerIcon = L.divIcon({
          className: 'customer-icon',
          html: '🏠',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const driverIcon = L.divIcon({
          className: 'driver-icon',
          html: '🏍️',
          iconSize: [45, 45],
          iconAnchor: [22.5, 22.5]
        });

        const restaurantIcon = L.divIcon({
          className: 'restaurant-icon',
          html: '🏪',
          iconSize: [35, 35],
          iconAnchor: [17.5, 17.5]
        });

        // Agregar marcador del cliente (fijo)
        customerMarker = L.marker([${customerLocation.latitude}, ${customerLocation.longitude}], {
          icon: customerIcon
        }).addTo(map);

        // Agregar marcador del restaurante
        restaurantMarker = L.marker([${restaurantLocation.latitude}, ${restaurantLocation.longitude}], {
          icon: restaurantIcon
        }).addTo(map);

        // Agregar marcador del driver si existe ubicación inicial
        ${driverLocation ? `
        driverMarker = L.marker([${driverLocation.latitude}, ${driverLocation.longitude}], {
          icon: driverIcon
        }).addTo(map);
        ` : ''}

        // Función para calcular y dibujar ruta
        async function updateRoute(driverLat, driverLng, customerLat, customerLng) {
          try {
            // Usar OSRM para obtener la ruta
            const url = \`https://router.project-osrm.org/route/v1/driving/\${driverLng},\${driverLat};\${customerLng},\${customerLat}?overview=full&geometries=geojson\`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
              const route = data.routes[0];
              const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]); // OSRM devuelve [lng, lat], Leaflet necesita [lat, lng]
              
              // Eliminar ruta anterior si existe
              if (routePolyline) {
                map.removeLayer(routePolyline);
              }
              
              // Dibujar nueva ruta
              routePolyline = L.polyline(coordinates, {
                color: '#f97316',
                weight: 5,
                opacity: 0.7,
                dashArray: '10, 10'
              }).addTo(map);
              
              // Ajustar vista para incluir toda la ruta
              const bounds = L.latLngBounds(coordinates);
              map.fitBounds(bounds, { padding: [50, 50] });
            }
          } catch (error) {
            console.error('Error calculating route:', error);
            // Si falla la API, dibujar línea recta como fallback
            if (routePolyline) {
              map.removeLayer(routePolyline);
            }
            routePolyline = L.polyline(
              [[driverLat, driverLng], [customerLat, customerLng]],
              {
                color: '#f97316',
                weight: 3,
                opacity: 0.5,
                dashArray: '5, 5'
              }
            ).addTo(map);
          }
        }

        // Función para actualizar ubicación del driver
        function updateDriverLocation(lat, lng) {
          // Agregar a historial (máximo 10 puntos)
          driverHistory.push([lat, lng]);
          if (driverHistory.length > 10) {
            driverHistory.shift();
          }
          
          if (driverMarker) {
            driverMarker.setLatLng([lat, lng]);
          } else {
            driverMarker = L.marker([lat, lng], {
              icon: driverIcon
            }).addTo(map);
          }
          
          // Actualizar ruta en tiempo real
          updateRoute(lat, lng, ${customerLocation.latitude}, ${customerLocation.longitude});
          
          // Dibujar historial de movimiento (trail)
          if (driverHistory.length > 1) {
            const trail = L.polyline(driverHistory, {
              color: '#f97316',
              weight: 2,
              opacity: 0.3
            });
            if (window.driverTrail) {
              map.removeLayer(window.driverTrail);
            }
            window.driverTrail = trail;
            trail.addTo(map);
          }
        }

        // Ajustar vista inicial para incluir todos los marcadores
        const initialBounds = L.latLngBounds(
          [${customerLocation.latitude}, ${customerLocation.longitude}],
          [${restaurantLocation.latitude}, ${restaurantLocation.longitude}]
          ${driverLocation ? `, [${driverLocation.latitude}, ${driverLocation.longitude}]` : ''}
        );
        map.fitBounds(initialBounds, { padding: [50, 50] });

        // Notificar que el mapa está listo
        setTimeout(function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
        }, 500);
      </script>
    </body>
    </html>
  `;

    return (
        <View style={styles.container}>
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

            {/* Legend */}
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                    <Text style={styles.legendText}>Cliente</Text>
                </View>
                {driverLocation && (
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
                        <Text style={styles.legendText}>Repartidor</Text>
                    </View>
                )}
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                    <Text style={styles.legendText}>Restaurante</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 300,
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#f3f4f6',
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
        right: 12,
        top: 12,
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
    legend: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 8,
        padding: 8,
        flexDirection: 'row',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    legendText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1f2937',
    },
});

