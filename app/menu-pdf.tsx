import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import WebView from 'react-native-webview';

const PDF_URL = 'https://storage2.me-qr.com/pdf/8d0dcd77-46d0-446b-acfa-16d071913b3e.pdf?time=1757535213';

export default function MenuPdfScreen() {
  const sourceUri = useMemo(() => {
    if (Platform.OS === 'android') {
      // Use Google Docs viewer on Android to ensure PDF rendering works across devices
      return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(PDF_URL)}`;
    }
    return PDF_URL;
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <Stack.Screen options={{ title: 'Menú Físico' }} />
      {Platform.OS === 'web' ? (
        <View style={{ flex: 1 }}>
          <iframe
            src={sourceUri}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Menú Físico"
          />
        </View>
      ) : (
        <WebView
          originWhitelist={["*"]}
          startInLoadingState
          allowsInlineMediaPlayback
          style={{ flex: 1, backgroundColor: '#000' }}
          source={{ uri: sourceUri }}
        />
      )}
    </SafeAreaView>
  );
}


