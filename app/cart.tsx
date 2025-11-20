/**
 * CART SCREEN - Pantalla del Carrito Rediseñada
 * 
 * CARACTERÍSTICAS:
 * - Diseño premium con resumen visual
 * - Control de cantidad (+/-)
 * - Cálculo de subtotal, envío y total
 * - Botón de pago destacado
 * - Safe Area Context para dispositivos con notch
 * - Animaciones y feedback háptico
 */

import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { listAddresses, type Address } from '@/services/addresses';
import { getAppConfig } from '@/services/appConfig';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  ChefHat,
  ChevronRight,
  CreditCard,
  Home as HomeIcon,
  MapPin,
  Minus, Plus,
  ShoppingBag,
  Trash2,
  X
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CartScreen() {
  const { items, totalCents, clear, addItem, decrementItem, removeItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [processing, setProcessing] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Cálculos dinámicos
  const [deliveryFee, setDeliveryFee] = useState(300000); // Default 3000 COP
  const subtotal = totalCents;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    if (user) {
      loadAddresses();
      loadConfig();
    }
  }, [user]);

  const loadConfig = async () => {
    try {
      const config = await getAppConfig();
      setDeliveryFee(config.delivery_fee_cents);
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const loadAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const addressList = await listAddresses();
      setAddresses(addressList);

      // Auto-seleccionar dirección predeterminada si existe
      const defaultAddr = addressList.find(a => a.is_default);
      if (defaultAddr && !selectedAddress) {
        setSelectedAddress(defaultAddr);
      }
    } catch (error: any) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleQuantityChange = async (productId: string, delta: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const item = items.find(i => i.product.id === productId);
    if (!item) return;

    if (delta < 0 && item.quantity === 1) {
      // Si es la última unidad, preguntar si eliminar
      Alert.alert(
        'Eliminar producto',
        `¿Quitar "${item.product.name}" del carrito?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              decrementItem(productId); // Esto lo eliminará porque quantity es 1
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }
        ]
      );
    } else if (delta < 0) {
      // Decrementar cantidad
      decrementItem(productId);
    } else if (delta > 0) {
      // Incrementar cantidad
      addItem(item.product);
    }
  };

  const handleRemoveItem = async (productId: string, productName: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Eliminar producto',
      `¿Quitar "${productName}" del carrito?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            removeItem(productId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      ]
    );
  };

  const checkout = async () => {
    if (!user) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para completar tu pedido.');
      router.push('/auth');
      return;
    }
    if (!items.length) return;

    // Validar que haya dirección seleccionada
    if (!selectedAddress) {
      Alert.alert(
        'Selecciona una dirección',
        '¿Dónde quieres recibir tu pedido?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Seleccionar Dirección',
            onPress: () => {
              if (addresses.length === 0) {
                router.push('/addresses');
              } else {
                setShowAddressModal(true);
              }
            }
          }
        ]
      );
      return;
    }

    setProcessing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      // Crear orden con dirección
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'pending',
          status_detailed: 'ready_for_pickup', // Auto-ready for testing
          total_cents: total,
          address_id: selectedAddress.id,
          notes: deliveryNotes || null,
          delivery_code: Math.floor(10000 + Math.random() * 90000).toString() // 5-digit code
        })
        .select('*')
        .single();

      if (orderError) throw orderError;

      // Crear items de la orden
      const itemsPayload = items.map((i) => ({
        order_id: order.id,
        product_id: i.product.id,
        quantity: i.quantity,
        unit_price_cents: i.product.price_cents,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsPayload);

      if (itemsError) throw itemsError;

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clear();

      Alert.alert(
        '¡Pedido Creado! 🎉',
        'Tu pedido ha sido recibido. Te notificaremos cuando esté listo.',
        [
          {
            text: 'Ver seguimiento',
            onPress: () => router.push(`/order/${order.id}`)
          },
          {
            text: 'Ver mis pedidos',
            onPress: () => router.push('/(tabs)/pedidos'),
            style: 'cancel'
          }
        ]
      );
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', e.message ?? 'No se pudo crear el pedido');
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Carrito',
            headerStyle: { backgroundColor: '#f97316' },
            headerTintColor: 'white',
            headerTitleStyle: { fontWeight: '800' }
          }}
        />
        <View style={styles.emptyContainer}>
          <ShoppingBag size={80} color="#d1d5db" strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
          <Text style={styles.emptySubtitle}>
            Agrega productos del menú para empezar tu pedido
          </Text>
          <TouchableOpacity
            style={styles.continueShoppingBtn}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/menu');
            }}
          >
            <Text style={styles.continueShoppingText}>Ver Menú</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Carrito',
          headerStyle: { backgroundColor: '#f97316' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: '800' },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 8 }}
            >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
          )
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 100 } // Espacio para botón fijo
        ]}
      >
        {/* Header Info */}
        <View style={styles.headerInfo}>
          <ShoppingBag size={24} color="#f97316" />
          <Text style={styles.headerText}>
            {items.length} {items.length === 1 ? 'producto' : 'productos'}
          </Text>
        </View>

        {/* Items List */}
        {items.map((item) => (
          <View key={item.product.id} style={styles.cartItem}>
            {/* Image */}
            <View style={styles.itemImageContainer}>
              {item.product.image_url ? (
                <Image
                  source={{ uri: item.product.image_url }}
                  style={styles.itemImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.itemImage, styles.placeholderImage]}>
                  <ChefHat size={32} color="#d1d5db" />
                </View>
              )}
            </View>

            {/* Info */}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.product.name}
              </Text>
              <Text style={styles.itemPrice}>
                ${(item.product.price_cents / 100).toLocaleString('es-CO')}
              </Text>
            </View>

            {/* Quantity Controls */}
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={() => handleQuantityChange(item.product.id, -1)}
              >
                <Minus size={16} color="#6b7280" strokeWidth={3} />
              </TouchableOpacity>

              <Text style={styles.quantityText}>{item.quantity}</Text>

              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={() => handleQuantityChange(item.product.id, 1)}
              >
                <Plus size={16} color="#f97316" strokeWidth={3} />
              </TouchableOpacity>
            </View>

            {/* Remove Button */}
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemoveItem(item.product.id, item.product.name)}
            >
              <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Address Selection */}
        <View style={styles.sectionTitle}>
          <MapPin size={20} color="#f97316" />
          <Text style={styles.sectionTitleText}>Dirección de Entrega</Text>
        </View>

        {selectedAddress ? (
          <TouchableOpacity
            style={styles.selectedAddressCard}
            onPress={() => setShowAddressModal(true)}
          >
            <View style={styles.addressIconContainer}>
              <HomeIcon size={24} color="#f97316" />
            </View>
            <View style={styles.addressDetails}>
              <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
              <Text style={styles.addressText} numberOfLines={2}>
                {selectedAddress.address_line}
              </Text>
              {selectedAddress.phone_number && (
                <Text style={styles.addressPhone}>📞 {selectedAddress.phone_number}</Text>
              )}
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.noAddressCard}
            onPress={() => {
              if (addresses.length === 0) {
                router.push('/addresses');
              } else {
                setShowAddressModal(true);
              }
            }}
          >
            <MapPin size={32} color="#d1d5db" />
            <Text style={styles.noAddressText}>Selecciona una dirección de entrega</Text>
            <Text style={styles.noAddressSubtext}>
              {addresses.length === 0 ? 'Agrega una dirección nueva' : 'Toca para seleccionar'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Delivery Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notas para el repartidor (opcional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Ej: Tocar timbre 2 veces, Apto 301"
            placeholderTextColor="#9ca3af"
            value={deliveryNotes}
            onChangeText={setDeliveryNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen del pedido</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              ${(subtotal / 100).toLocaleString('es-CO')}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Domicilio</Text>
            <Text style={styles.summaryValue}>
              ${(deliveryFee / 100).toLocaleString('es-CO')}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>
              ${(total / 100).toLocaleString('es-CO')}
            </Text>
          </View>
        </View>

        {/* Payment Note */}
        <View style={styles.paymentNote}>
          <CreditCard size={18} color="#9ca3af" />
          <Text style={styles.paymentNoteText}>
            Paga en efectivo al recibir tu pedido
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Checkout Button */}
      <View
        style={[
          styles.checkoutContainer,
          { paddingBottom: Math.max(insets.bottom, 16) }
        ]}
      >
        <TouchableOpacity
          style={[styles.checkoutBtn, processing && styles.checkoutBtnDisabled]}
          disabled={processing}
          onPress={checkout}
        >
          {processing ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.checkoutBtnText}>Procesando...</Text>
            </>
          ) : (
            <>
              <ShoppingBag size={20} color="white" strokeWidth={2.5} />
              <Text style={styles.checkoutBtnText}>
                Confirmar Pedido · ${(total / 100).toLocaleString('es-CO')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Address Selection Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Dirección</Text>
            <TouchableOpacity onPress={() => setShowAddressModal(false)}>
              <X size={28} color="#1f2937" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {loadingAddresses ? (
              <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 40 }} />
            ) : addresses.length === 0 ? (
              <View style={styles.emptyAddresses}>
                <MapPin size={60} color="#d1d5db" />
                <Text style={styles.emptyAddressesText}>No tienes direcciones guardadas</Text>
                <TouchableOpacity
                  style={styles.addAddressBtn}
                  onPress={() => {
                    setShowAddressModal(false);
                    router.push('/addresses');
                  }}
                >
                  <Text style={styles.addAddressBtnText}>Agregar Dirección</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {addresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    style={[
                      styles.addressOption,
                      selectedAddress?.id === address.id && styles.addressOptionSelected,
                    ]}
                    onPress={async () => {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedAddress(address);
                      setShowAddressModal(false);
                    }}
                  >
                    <View style={styles.addressOptionIcon}>
                      <HomeIcon size={24} color={selectedAddress?.id === address.id ? '#f97316' : '#6b7280'} />
                    </View>
                    <View style={styles.addressOptionDetails}>
                      <Text style={styles.addressOptionLabel}>{address.label}</Text>
                      <Text style={styles.addressOptionText} numberOfLines={2}>
                        {address.address_line}
                      </Text>
                      {address.phone_number && (
                        <Text style={styles.addressOptionPhone}>📞 {address.phone_number}</Text>
                      )}
                    </View>
                    {selectedAddress?.id === address.id && (
                      <View style={styles.checkIcon}>
                        <Check size={20} color="white" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={styles.addNewAddressBtn}
                  onPress={() => {
                    setShowAddressModal(false);
                    router.push('/addresses');
                  }}
                >
                  <MapPin size={20} color="#f97316" />
                  <Text style={styles.addNewAddressBtnText}>Agregar Nueva Dirección</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fef2e7' },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  continueShoppingBtn: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueShoppingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Content
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },

  // Header Info
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },

  // Cart Item
  cartItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  itemImageContainer: {
    width: 70,
    height: 70,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  placeholderImage: {
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f97316',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    minWidth: 24,
    textAlign: 'center',
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Delivery Info
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  deliveryTextContainer: { flex: 1 },
  deliveryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  deliverySubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#fed7aa',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
  },
  summaryTotalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f97316',
    letterSpacing: 0.5,
  },

  // Payment Note
  paymentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  paymentNoteText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },

  // Checkout Button
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  checkoutBtn: {
    backgroundColor: '#f97316',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  checkoutBtnDisabled: {
    backgroundColor: '#9ca3af',
  },
  checkoutBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Address Selection
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
  },
  selectedAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f97316',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  addressIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ffedd5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressDetails: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  addressPhone: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  noAddressCard: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 40,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  noAddressText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6b7280',
    marginTop: 16,
  },
  noAddressSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },

  // Delivery Notes
  notesSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1f2937',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    textAlignVertical: 'top',
    minHeight: 80,
  },

  // Address Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#fef2e7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1f2937',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  emptyAddresses: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyAddressesText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 24,
  },
  addAddressBtn: {
    backgroundColor: '#f97316',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addAddressBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  addressOptionSelected: {
    borderColor: '#f97316',
    backgroundColor: '#fff7ed',
  },
  addressOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressOptionDetails: {
    flex: 1,
  },
  addressOptionLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  addressOptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  addressOptionPhone: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNewAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#f97316',
  },
  addNewAddressBtnText: {
    color: '#f97316',
    fontSize: 16,
    fontWeight: '800',
  },
});
