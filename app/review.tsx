/**
 * REVIEW SCREEN - Pantalla de Crear/Editar Reseña
 * 
 * CARACTERÍSTICAS:
 * - Sistema de calificación por estrellas
 * - Campo de texto para comentario
 * - Selección de producto a reseñar del pedido
 * - Validación de campos
 * - Feedback háptico
 * - Diseño premium
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Star, ArrowLeft, Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    image_url?: string;
  };
}

export default function ReviewScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadOrderItems();
  }, [orderId]);

  const loadOrderItems = async () => {
    if (!orderId || !user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          id,
          product_id,
          quantity,
          products (
            id,
            name,
            image_url
          )
        `)
        .eq('order_id', orderId);

      if (error) throw error;

      const items = (data || []) as any[];
      setOrderItems(items);

      // Auto-seleccionar el primer producto
      if (items.length > 0) {
        setSelectedProductId(items[0].products.id);
      }
    } catch (error: any) {
      console.error('Error loading order items:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos del pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleStarPress = async (starRating: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(starRating);
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!selectedProductId) {
      Alert.alert('Error', 'Selecciona un producto para reseñar');
      return;
    }

    if (rating === 0) {
      Alert.alert('Error', 'Selecciona una calificación');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Error', 'Escribe un comentario sobre tu experiencia');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión');
      return;
    }

    setSubmitting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { error } = await supabase.from('reviews').insert({
        user_id: user.id,
        product_id: selectedProductId,
        rating,
        comment: comment.trim(),
      });

      if (error) throw error;

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        '¡Gracias! 🎉',
        'Tu reseña ha sido publicada exitosamente',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting review:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'No se pudo enviar tu reseña. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔐</Text>
          <Text style={styles.emptyTitle}>Inicia sesión</Text>
          <Text style={styles.emptySubtitle}>
            Inicia sesión para dejar una reseña
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="white" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dejar Reseña</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#f97316" />
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        ) : (
          <>
            {/* Product Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Producto</Text>
              <Text style={styles.sectionSubtitle}>
                ¿Qué producto quieres reseñar?
              </Text>

              {orderItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.productOption,
                    selectedProductId === item.products.id &&
                      styles.productOptionSelected,
                  ]}
                  onPress={async () => {
                    await Haptics.impactAsync(
                      Haptics.ImpactFeedbackStyle.Light
                    );
                    setSelectedProductId(item.products.id);
                  }}
                >
                  <View style={styles.productOptionContent}>
                    <Text style={styles.productQuantity}>{item.quantity}x</Text>
                    <Text
                      style={[
                        styles.productName,
                        selectedProductId === item.products.id &&
                          styles.productNameSelected,
                      ]}
                    >
                      {item.products.name}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      selectedProductId === item.products.id &&
                        styles.radioCircleSelected,
                    ]}
                  >
                    {selectedProductId === item.products.id && (
                      <View style={styles.radioCircleInner} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Rating */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Calificación</Text>
              <Text style={styles.sectionSubtitle}>
                ¿Qué tal estuvo tu experiencia?
              </Text>

              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleStarPress(star)}
                    style={styles.starButton}
                  >
                    <Star
                      size={48}
                      color={star <= rating ? '#fbbf24' : '#d1d5db'}
                      fill={star <= rating ? '#fbbf24' : 'transparent'}
                      strokeWidth={2}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {rating > 0 && (
                <Text style={styles.ratingText}>
                  {rating === 1 && '😞 Muy malo'}
                  {rating === 2 && '😕 Malo'}
                  {rating === 3 && '😐 Regular'}
                  {rating === 4 && '😊 Bueno'}
                  {rating === 5 && '🤩 ¡Excelente!'}
                </Text>
              )}
            </View>

            {/* Comment */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Comentario</Text>
              <Text style={styles.sectionSubtitle}>
                Cuéntanos más sobre tu experiencia
              </Text>

              <TextInput
                style={styles.commentInput}
                placeholder="Escribe aquí tu opinión..."
                placeholderTextColor="#9ca3af"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={500}
              />

              <Text style={styles.characterCount}>
                {comment.length}/500 caracteres
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (submitting || rating === 0 || !comment.trim()) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting || rating === 0 || !comment.trim()}
            >
              {submitting ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.submitButtonText}>Enviando...</Text>
                </>
              ) : (
                <>
                  <Send size={20} color="white" strokeWidth={2.5} />
                  <Text style={styles.submitButtonText}>Publicar Reseña</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef2e7',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: 'white',
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Section
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 20,
  },

  // Product Selection
  productOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  productOptionSelected: {
    borderColor: '#f97316',
    backgroundColor: '#fff7ed',
  },
  productOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  productQuantity: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f97316',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    flex: 1,
  },
  productNameSelected: {
    color: '#1f2937',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#f97316',
  },
  radioCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f97316',
  },

  // Stars
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 8,
  },

  // Comment
  commentInput: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    textAlignVertical: 'top',
    minHeight: 140,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 8,
  },

  // Submit Button
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#f97316',
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 12,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

