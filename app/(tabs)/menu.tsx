/**
 * MENU SCREEN - Pantalla del Menú Rediseñada
 * 
 * CARACTERÍSTICAS:
 * - Diseño moderno inspirado en el packaging de Pura Calle
 * - Cards con imágenes grandes y estilo premium
 * - Soporte para videos de productos
 * - Admin puede agregar/editar/eliminar productos
 * - Pull-to-refresh
 * - Carrito flotante
 */

import React, { useEffect, useState } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, 
  RefreshControl, Alert, TextInput, Modal, ActivityIndicator,
  Dimensions 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ChefHat, Plus, X, Trash2, Edit, Play, ShoppingBag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import Logo from '@/assets/images/logo.png';
import { listProducts, listCategories, createProduct, updateProduct, deleteProduct, type Product, type Category } from '@/services/products';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48; // Padding 24 de cada lado

const MenuScreen = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  
  const { addItem, items: cartItems } = useCart();
  const { role } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        listProducts(role !== 'admin'), // Admin ve todos, user solo activos
        listCategories()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const openAdminModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormName(product.name);
      setFormDescription(product.description ?? '');
      setFormPrice((product.price_cents / 100).toString());
      setFormImageUrl(product.image_url ?? '');
      setFormVideoUrl(product.video_url ?? '');
      setFormCategoryId(product.category_id ?? '');
    } else {
      setEditingProduct(null);
      setFormName('');
      setFormDescription('');
      setFormPrice('');
      setFormImageUrl('');
      setFormVideoUrl('');
      setFormCategoryId('');
    }
    setShowAdminModal(true);
  };

  const closeAdminModal = () => {
    setShowAdminModal(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = async () => {
    if (!formName || !formPrice) {
      Alert.alert('Error', 'Nombre y precio son requeridos');
      return;
    }

    try {
      const payload = {
        name: formName,
        description: formDescription || null,
        price_cents: Math.round(parseFloat(formPrice) * 100),
        image_url: formImageUrl || null,
        video_url: formVideoUrl || null,
        category_id: formCategoryId || null,
        is_active: true,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('¡Listo!', 'Producto actualizado');
      } else {
        await createProduct(payload);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('¡Listo!', 'Producto creado');
      }

      closeAdminModal();
      fetchData();
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', e.message);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    Alert.alert(
      'Desactivar Producto',
      `¿Desactivar "${product.name}"?\n\nEl producto dejará de aparecer en el menú, pero se mantendrá en el historial de órdenes.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('✅ Producto Desactivado', 'El producto ha sido desactivado y ya no aparecerá en el menú.');
              fetchData();
            } catch (e: any) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', e.message || 'No se pudo desactivar el producto');
            }
          },
        },
      ]
    );
  };

  const ProductCard = ({ item }: { item: Product }) => {
    const [videoLoaded, setVideoLoaded] = useState(false);

    return (
      <View style={styles.productCard}>
        {/* Media: Imagen o Video */}
        <View style={styles.mediaContainer}>
          {item.video_url ? (
            <View style={styles.videoWrapper}>
              <Video
                source={{ uri: item.video_url }}
                style={styles.media}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
                isMuted
                onLoad={() => setVideoLoaded(true)}
              />
              {!videoLoaded && (
                <View style={styles.videoPlaceholder}>
                  <ActivityIndicator size="large" color="#f97316" />
                </View>
              )}
              <View style={styles.playIcon}>
                <Play size={20} color="white" fill="white" />
              </View>
            </View>
          ) : item.image_url ? (
            <Image 
              source={{ uri: item.image_url }} 
              style={styles.media}
              contentFit="cover"
              transition={300}
              placeholder={require('@/assets/images/logo.png')}
              placeholderContentFit="contain"
              cachePolicy="memory-disk"
              priority="high"
            />
          ) : (
            <View style={[styles.media, styles.placeholderMedia]}>
              <ChefHat size={48} color="#d1d5db" />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.productDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>
            <View style={styles.priceTag}>
              <Text style={styles.priceLabel}>Precio</Text>
              <Text style={styles.productPrice}>${(item.price_cents / 100).toLocaleString('es-CO')}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.cardActions}>
            {role === 'admin' && (
              <View style={styles.adminActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    openAdminModal(item);
                  }}
                >
                  <Edit size={18} color="#6b7280" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleDeleteProduct(item);
                  }}
                >
                  <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={styles.addToCartBtn}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                addItem(item);
              }}
            >
              <Plus size={20} color="white" strokeWidth={3} />
              <Text style={styles.addToCartText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={Logo} style={styles.logo} contentFit="contain" />
        <View style={styles.titleRow}>
          <ChefHat size={28} color="white" />
          <Text style={styles.title}>Nuestro Menú</Text>
        </View>
        <Text style={styles.subtitle}>Sabores auténticos de la calle 🔥</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={styles.pdfButton}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/menu-pdf');
          }}
        >
          <Text style={styles.pdfButtonText}>📄 Menú PDF</Text>
        </TouchableOpacity>

        {role === 'admin' && (
          <TouchableOpacity
            style={styles.addProductButton}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              openAdminModal();
            }}
          >
            <Plus size={18} color="white" strokeWidth={3} />
            <Text style={styles.addProductText}>Nuevo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Products List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          // Padding extra si hay carrito flotante para no taparlo
          cartItems.length > 0 && { paddingBottom: 180 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f97316']} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 40 }} />
        ) : products.length === 0 ? (
          <View style={styles.emptyState}>
            <ChefHat size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No hay productos aún</Text>
            {role === 'admin' && (
              <Text style={styles.emptySubtext}>Toca "Nuevo" para agregar el primer producto</Text>
            )}
          </View>
        ) : (
          products.map((product) => <ProductCard key={product.id} item={product} />)
        )}
      </ScrollView>

      {/* Floating Cart Button */}
      {cartItems.length > 0 && (
        <TouchableOpacity
          style={[
            styles.floatingCart,
            { 
              // Tab bar height (~70px) + safe area bottom + extra space
              bottom: 70 + Math.max(insets.bottom, 5) + 16 
            }
          ]}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/cart');
          }}
        >
          <View style={styles.cartIconContainer}>
            <ShoppingBag size={24} color="white" strokeWidth={2.5} />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
            </View>
          </View>
          <Text style={styles.floatingCartText}>Ver Carrito</Text>
        </TouchableOpacity>
      )}

      {/* Admin Modal */}
      <Modal
        visible={showAdminModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeAdminModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</Text>
            <TouchableOpacity onPress={closeAdminModal}>
              <X size={24} color="#1f2937" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm} contentContainerStyle={styles.modalFormContent}>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Hamburguesa Clásica"
              value={formName}
              onChangeText={setFormName}
            />

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe el producto..."
              value={formDescription}
              onChangeText={setFormDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Precio (COP) *</Text>
            <TextInput
              style={styles.input}
              placeholder="12000"
              value={formPrice}
              onChangeText={setFormPrice}
              keyboardType="numeric"
            />

            <Text style={styles.label}>URL de Imagen</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              value={formImageUrl}
              onChangeText={setFormImageUrl}
              autoCapitalize="none"
            />

            <Text style={styles.label}>URL de Video (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://... (mp4, webm)"
              value={formVideoUrl}
              onChangeText={setFormVideoUrl}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              <TouchableOpacity
                style={[styles.categoryChip, !formCategoryId && styles.categoryChipActive]}
                onPress={() => setFormCategoryId('')}
              >
                <Text style={[styles.categoryChipText, !formCategoryId && styles.categoryChipTextActive]}>
                  Sin categoría
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, formCategoryId === cat.id && styles.categoryChipActive]}
                  onPress={() => setFormCategoryId(cat.id)}
                >
                  <Text
                    style={[styles.categoryChipText, formCategoryId === cat.id && styles.categoryChipTextActive]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProduct}>
              <Text style={styles.saveButtonText}>{editingProduct ? 'Actualizar' : 'Crear Producto'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fef2e7' },
  
  // Header
  header: {
    backgroundColor: '#f97316',
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  logo: { width: 80, height: 54, alignSelf: 'center', marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '900', color: 'white', letterSpacing: 0.5 },
  subtitle: { textAlign: 'center', color: '#fed7aa', fontSize: 15, fontWeight: '600' },

  // Actions Bar
  actionsBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  pdfButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fde6d3',
  },
  pdfButtonText: { fontSize: 15, fontWeight: '700', color: '#f97316' },
  addProductButton: {
    flexDirection: 'row',
    backgroundColor: '#f97316',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  addProductText: { fontSize: 15, fontWeight: '700', color: 'white' },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 },

  // Product Card
  productCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  mediaContainer: {
    width: '100%',
    height: 240,
    backgroundColor: '#f3f4f6',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  placeholderMedia: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  videoWrapper: { position: 'relative', width: '100%', height: '100%' },
  videoPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  playIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },

  // Card Content
  cardContent: { padding: 20 },
  cardHeader: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  productName: { fontSize: 22, fontWeight: '800', color: '#1f2937', marginBottom: 6, letterSpacing: 0.3 },
  productDescription: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  priceTag: {
    backgroundColor: '#fef2e7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fed7aa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600', marginBottom: 2 },
  productPrice: { fontSize: 20, fontWeight: '900', color: '#f97316', letterSpacing: 0.5 },

  // Card Actions
  cardActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  adminActions: { flexDirection: 'row', gap: 8 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f97316',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addToCartText: { fontSize: 16, fontWeight: '700', color: 'white', letterSpacing: 0.3 },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#9ca3af', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#d1d5db', marginTop: 8, textAlign: 'center' },

  // Floating Cart
  floatingCart: {
    position: 'absolute',
    right: 24,
    backgroundColor: '#1f2937',
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  cartIconContainer: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1f2937',
  },
  cartBadgeText: { fontSize: 11, fontWeight: '900', color: 'white' },
  floatingCartText: { fontSize: 16, fontWeight: '800', color: 'white', letterSpacing: 0.3 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#fef2e7' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1f2937' },
  modalForm: { flex: 1 },
  modalFormContent: { padding: 24, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  categoriesScroll: { marginTop: 8, marginBottom: 16 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  categoryChipText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  categoryChipTextActive: { color: 'white' },
  saveButton: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: { fontSize: 16, fontWeight: '800', color: 'white', letterSpacing: 0.5 },
});

export default MenuScreen;
