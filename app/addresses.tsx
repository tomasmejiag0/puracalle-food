/**
 * PANTALLA DE GESTIÓN DE UBICACIONES
 * 
 * Permite al usuario:
 * - Ver todas sus direcciones guardadas
 * - Agregar nueva dirección con mapa
 * - Usar ubicación actual (con permisos)
 * - Editar/eliminar direcciones
 * - Marcar dirección predeterminada
 * - Personalizar etiquetas ("Casa", "Trabajo", etc.)
 */

import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Stack, useRouter } from 'expo-router';
import {
  Briefcase,
  Heart,
  Home as HomeIcon,
  MapPin,
  Navigation,
  Plus,
  Star,
  Trash2,
  X
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AddressMapPicker from '@/components/AddressMapPicker';
import { useAuth } from '@/hooks/useAuth';
import {
  createAddress,
  deleteAddress,
  listAddresses,
  setDefaultAddress,
  type Address,
} from '@/services/addresses';

// Etiquetas predefinidas comunes
const PRESET_LABELS = [
  { label: 'Casa', icon: HomeIcon, color: '#3b82f6' },
  { label: 'Trabajo', icon: Briefcase, color: '#8b5cf6' },
  { label: 'Novia', icon: Heart, color: '#ec4899' },
  { label: 'Otro', icon: MapPin, color: '#6b7280' },
];

const AddressesScreen = React.memo(function AddressesScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [label, setLabel] = useState('Casa');
  const [addressLine, setAddressLine] = useState('');
  const [phone, setPhone] = useState('');
  const [instructions, setInstructions] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [useCustomLabel, setUseCustomLabel] = useState(false);

  // Location state
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const data = await listAddresses();
      setAddresses(data);
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'No se pudieron cargar las direcciones');
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const hasPermission = await requestLocationPermission();

      if (!hasPermission) {
        Alert.alert(
          'Permiso de Ubicación',
          'Necesitamos acceso a tu ubicación para usar esta función. Por favor, actívalo en la configuración de tu dispositivo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Ir a Configuración',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  // Linking.openURL('app-settings:');
                } else {
                  // Linking.openSettings();
                }
              },
            },
          ]
        );
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCurrentLocation(location);

      // Reverse geocoding para obtener dirección legible
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        const fullAddress = [
          address.street,
          address.streetNumber,
          address.district,
          address.city,
        ]
          .filter(Boolean)
          .join(', ');

        setAddressLine(fullAddress || 'Ubicación actual');
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación. Intenta de nuevo.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSaveAddress = async () => {
    const finalLabel = useCustomLabel && customLabel ? customLabel : label;

    if (!finalLabel || !addressLine) {
      Alert.alert('Error', 'Por favor completa el nombre y la dirección');
      return;
    }

    if (!currentLocation) {
      Alert.alert('Error', 'Por favor obtén tu ubicación actual primero');
      return;
    }

    try {
      await createAddress({
        label: finalLabel,
        address_line: addressLine,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        phone_number: phone || undefined,
        delivery_instructions: instructions || undefined,
        is_default: addresses.length === 0, // Primera dirección es default automáticamente
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('¡Listo!', 'Dirección guardada exitosamente');
      resetForm();
      setShowAddModal(false);
      loadAddresses();
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message ?? 'No se pudo guardar la dirección');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Eliminar Dirección',
      '¿Estás seguro de que quieres eliminar esta dirección?\n\nNota: No puedes eliminar direcciones que tienen pedidos activos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAddress(id);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('✅ Dirección Eliminada', 'La dirección ha sido eliminada exitosamente.');
              loadAddresses();
            } catch (error: any) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', error.message ?? 'No se pudo eliminar la dirección');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      loadAddresses();
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'No se pudo marcar como predeterminada');
    }
  };

  const resetForm = () => {
    setLabel('Casa');
    setAddressLine('');
    setPhone('');
    setInstructions('');
    setCustomLabel('');
    setUseCustomLabel(false);
    setCurrentLocation(null);
  };

  const handleMapLocationSelect = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    // Crear objeto LocationObject compatible con la estructura existente
    const locationObject: Location.LocationObject = {
      coords: {
        latitude: location.latitude,
        longitude: location.longitude,
        altitude: null,
        accuracy: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    };

    setCurrentLocation(locationObject);
    setAddressLine(location.address);
    setShowMapPicker(false);
  };

  const getLabelIcon = (labelText: string) => {
    const preset = PRESET_LABELS.find((p) => p.label === labelText);
    return preset ? preset.icon : MapPin;
  };

  const getLabelColor = (labelText: string) => {
    const preset = PRESET_LABELS.find((p) => p.label === labelText);
    return preset ? preset.color : '#6b7280';
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ title: 'Mis Ubicaciones', headerShown: true }} />
        <View style={styles.emptyContainer}>
          <MapPin size={60} color="#d1d5db" />
          <Text style={styles.emptyText}>Inicia sesión para gestionar tus direcciones</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'Mis Ubicaciones', headerShown: true }} />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#f97316" style={styles.loader} />
        ) : addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MapPin size={60} color="#d1d5db" />
            <Text style={styles.emptyText}>No tienes direcciones guardadas</Text>
            <Text style={styles.emptySubtext}>Agrega una dirección para recibir tus pedidos</Text>
          </View>
        ) : (
          addresses.map((address) => {
            const IconComponent = getLabelIcon(address.label);
            const iconColor = getLabelColor(address.label);

            return (
              <View key={address.id} style={styles.addressCard}>
                {address.is_default && (
                  <View style={styles.defaultBadge}>
                    <Star size={12} color="#fbbf24" fill="#fbbf24" />
                    <Text style={styles.defaultText}>Predeterminada</Text>
                  </View>
                )}

                <View style={styles.addressHeader}>
                  <View style={[styles.labelIcon, { backgroundColor: `${iconColor}20` }]}>
                    <IconComponent size={24} color={iconColor} />
                  </View>
                  <View style={styles.addressInfo}>
                    <Text style={styles.addressLabel}>{address.label}</Text>
                    <Text style={styles.addressLine} numberOfLines={2}>
                      {address.address_line}
                    </Text>
                    {address.phone_number && (
                      <Text style={styles.addressPhone}>📞 {address.phone_number}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.addressActions}>
                  {!address.is_default && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleSetDefault(address.id)}
                    >
                      <Star size={18} color="#fbbf24" />
                      <Text style={styles.actionText}>Predeterminada</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(address.id)}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          resetForm();
          setShowAddModal(true);
        }}
      >
        <Plus size={24} color="white" strokeWidth={3} />
        <Text style={styles.addButtonText}>Agregar Dirección</Text>
      </TouchableOpacity>

      {/* Add Address Modal */}
      {showAddModal && (
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer} edges={['top']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Dirección</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={28} color="#1f2937" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Label Selection */}
              <Text style={styles.formLabel}>Etiqueta</Text>
              <View style={styles.labelGrid}>
                {PRESET_LABELS.map((preset) => {
                  const IconComp = preset.icon;
                  const isSelected = !useCustomLabel && label === preset.label;
                  return (
                    <TouchableOpacity
                      key={preset.label}
                      style={[
                        styles.labelOption,
                        isSelected && { backgroundColor: `${preset.color}20`, borderColor: preset.color },
                      ]}
                      onPress={() => {
                        setLabel(preset.label);
                        setUseCustomLabel(false);
                      }}
                    >
                      <IconComp size={20} color={isSelected ? preset.color : '#9ca3af'} />
                      <Text style={[styles.labelOptionText, isSelected && { color: preset.color }]}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Label */}
              <TouchableOpacity
                style={styles.customLabelToggle}
                onPress={() => setUseCustomLabel(!useCustomLabel)}
              >
                <Text style={styles.customLabelToggleText}>Usar etiqueta personalizada</Text>
              </TouchableOpacity>

              {useCustomLabel && (
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Casa de mi mamá"
                  placeholderTextColor="#9ca3af"
                  value={customLabel}
                  onChangeText={setCustomLabel}
                />
              )}

              {/* Get Current Location */}
              <TouchableOpacity
                style={styles.locationButton}
                onPress={getCurrentLocation}
                disabled={loadingLocation}
              >
                {loadingLocation ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Navigation size={20} color="white" />
                    <Text style={styles.locationButtonText}>Usar Mi Ubicación Actual</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Select on Map */}
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => setShowMapPicker(true)}
              >
                <MapPin size={20} color="white" />
                <Text style={styles.mapButtonText}>Seleccionar en Mapa</Text>
              </TouchableOpacity>

              {/* Address Line */}
              <Text style={styles.formLabel}>Dirección Completa *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Calle 123 #45-67"
                placeholderTextColor="#9ca3af"
                value={addressLine}
                onChangeText={setAddressLine}
                multiline
                numberOfLines={2}
              />

              {/* Phone */}
              <Text style={styles.formLabel}>Teléfono de Contacto</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 3001234567"
                placeholderTextColor="#9ca3af"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              {/* Instructions */}
              <Text style={styles.formLabel}>Instrucciones de Entrega</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ej: Tocar timbre 2 veces, Apto 501"
                placeholderTextColor="#9ca3af"
                value={instructions}
                onChangeText={setInstructions}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveAddress}>
                <MapPin size={20} color="white" />
                <Text style={styles.saveButtonText}>Guardar Dirección</Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </SafeAreaView>
        </View>
      )}

      {/* Map Picker Modal */}
      {showMapPicker && (
        <View style={styles.modalOverlay}>
          <AddressMapPicker
            initialLocation={
              currentLocation
                ? {
                  latitude: currentLocation.coords.latitude,
                  longitude: currentLocation.coords.longitude,
                }
                : undefined
            }
            onLocationSelect={handleMapLocationSelect}
            onClose={() => setShowMapPicker(false)}
          />
        </View>
      )}
    </SafeAreaView>
  );
});

export default AddressesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fef2e7' },
  content: { flex: 1, padding: 20 },
  scrollContent: { paddingBottom: 100 },
  loader: { marginTop: 40 },

  // Empty State
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#9ca3af', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#d1d5db', marginTop: 8, textAlign: 'center' },

  // Address Card
  addressCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  defaultText: { fontSize: 11, fontWeight: '800', color: '#92400e', letterSpacing: 0.5 },
  addressHeader: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  labelIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressInfo: { flex: 1 },
  addressLabel: { fontSize: 18, fontWeight: '800', color: '#1f2937', marginBottom: 6 },
  addressLine: { fontSize: 14, color: '#6b7280', marginBottom: 4, lineHeight: 20 },
  addressPhone: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  addressActions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  actionText: { fontSize: 13, fontWeight: '700', color: '#92400e' },
  deleteBtn: { backgroundColor: '#fef2f2' },

  // Add Button
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 999,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  addButtonText: { color: 'white', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },

  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fef2e7',
  },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
  },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#1f2937' },
  modalContent: { flex: 1, padding: 20 },
  formLabel: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 8, marginTop: 16 },

  // Label Grid
  labelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  labelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  labelOptionText: { fontSize: 14, fontWeight: '700', color: '#6b7280' },

  customLabelToggle: { marginBottom: 12 },
  customLabelToggleText: { fontSize: 14, color: '#f97316', fontWeight: '600' },

  // Location Button
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  locationButtonText: { color: 'white', fontSize: 16, fontWeight: '800' },

  // Map Button
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#f97316',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  mapButtonText: { color: 'white', fontSize: 16, fontWeight: '800' },

  // Inputs
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 2,
    borderColor: '#fde6d3',
  },
  textArea: { height: 80, textAlignVertical: 'top' },

  // Save Button
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 32,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
});

