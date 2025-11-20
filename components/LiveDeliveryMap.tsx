import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface Location {
    latitude: number;
    longitude: number;
}

interface LiveDeliveryMapProps {
    driverLocation?: Location | null;
    customerLocation: Location;
    restaurantLocation?: Location; // Optional, can be fixed or passed
    isDriver?: boolean; // To show different markers/controls
}

export default function LiveDeliveryMap({
    driverLocation,
    customerLocation,
    restaurantLocation = { latitude: 6.5386, longitude: -75.9160 }, // Santa Fe de Antioquia, Cra 10 # 11-108, Colombia
    isDriver = false
}: LiveDeliveryMapProps) {
    const webViewRef = useRef<WebView>(null);

    // Update map when locations change
    useEffect(() => {
        if (webViewRef.current && driverLocation) {
            const script = `
        updateDriverLocation(${driverLocation.latitude}, ${driverLocation.longitude});
      `;
            webViewRef.current.injectJavaScript(script);
        }
    }, [driverLocation]);

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100%; height: 100vh; }
          .custom-icon {
            font-size: 24px;
            text-align: center;
            line-height: 24px;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${customerLocation.latitude}, ${customerLocation.longitude}], 13);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          // Icons
          var driverIcon = L.divIcon({
            className: 'custom-icon',
            html: '🛵',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });

          var customerIcon = L.divIcon({
            className: 'custom-icon',
            html: '🏠',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });

          var restaurantIcon = L.divIcon({
            className: 'custom-icon',
            html: '🏪',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });

          // Markers
          var customerMarker = L.marker([${customerLocation.latitude}, ${customerLocation.longitude}], {icon: customerIcon}).addTo(map);
          var restaurantMarker = L.marker([${restaurantLocation.latitude}, ${restaurantLocation.longitude}], {icon: restaurantIcon}).addTo(map);
          var driverMarker;

          // Fit bounds to include customer and restaurant initially
          var bounds = L.latLngBounds(
            [${customerLocation.latitude}, ${customerLocation.longitude}],
            [${restaurantLocation.latitude}, ${restaurantLocation.longitude}]
          );
          map.fitBounds(bounds, { padding: [50, 50] });

          function updateDriverLocation(lat, lng) {
            if (driverMarker) {
              driverMarker.setLatLng([lat, lng]);
            } else {
              driverMarker = L.marker([lat, lng], {icon: driverIcon}).addTo(map);
            }
            
            // Pan to driver if it's the driver view, otherwise keep bounds
            // For now, let's just keep bounds updated to include driver
            bounds.extend([lat, lng]);
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        </script>
      </body>
    </html>
  `;

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                source={{ html: htmlContent }}
                style={styles.map}
                scrollEnabled={false}
            />
            {!driverLocation && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color="#f97316" />
                </View>
            )}
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
    },
    map: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
