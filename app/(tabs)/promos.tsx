import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Percent, Calendar, Clock, Sparkles, Tag, Gift, X, Plus, Trash2 } from 'lucide-react-native';
import { listPromotions, createPromotion, deletePromotion } from '@/services/promotions';
import { useAuth } from '@/hooks/useAuth';
import * as Haptics from 'expo-haptics';

const PromosScreen = () => {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [promos, setPromos] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discount, setDiscount] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listPromotions(true);
      setPromos(data);
    } catch (e:any) {
      Alert.alert('Error', e.message ?? 'No se pudieron cargar las promociones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Eliminar promoción',
      '¿Estás seguro de que quieres eliminar esta promoción?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deletePromotion(id);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            load();
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!title) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }
    try {
      await createPromotion({
        title,
        description,
        discount_percent: discount ? parseInt(discount, 10) : undefined,
        is_active: true,
      });
      setTitle('');
      setDescription('');
      setDiscount('');
      setShowAdminModal(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      load();
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', e.message ?? 'No se pudo crear la promoción');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f97316']} />}
      >
        {/* Hero Header */}
        <View style={styles.heroContainer}>
          <View style={styles.heroContent}>
            <View style={styles.heroIconContainer}>
              <Gift size={32} color="white" strokeWidth={2.5} />
            </View>
            <View style={styles.sparklesRow}>
              <Sparkles size={20} color="#fed7aa" fill="#fed7aa" />
              <Text style={styles.heroTitle}>Ofertas Especiales</Text>
              <Sparkles size={20} color="#fed7aa" fill="#fed7aa" />
            </View>
            <Text style={styles.heroSubtitle}>¡Ahorra con nuestras promociones!</Text>
          </View>

          {/* Admin Button */}
          {role === 'admin' && (
            <TouchableOpacity
              style={styles.addPromoBtn}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAdminModal(true);
              }}
            >
              <Plus size={20} color="white" strokeWidth={3} />
              <Text style={styles.addPromoBtnText}>Nueva Promoción</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color="#f97316" style={styles.loader} />
          ) : promos.length === 0 ? (
            <View style={styles.emptyState}>
              <Tag size={60} color="#d1d5db" />
              <Text style={styles.emptyText}>No hay promociones disponibles</Text>
              <Text style={styles.emptySubtext}>Vuelve pronto para ver nuevas ofertas</Text>
            </View>
          ) : (
            promos.map((promo, index) => (
              <View
                key={promo.id}
                style={[
                  styles.promoCard,
                  index === 0 && styles.featuredPromo,
                ]}
              >
                {/* Discount Badge - Top Left */}
                {promo.discount_percent && (
                  <View style={styles.discountBadge}>
                    <Percent size={18} color="white" strokeWidth={3} />
                    <Text style={styles.discountText}>{promo.discount_percent}%</Text>
                    <Text style={styles.discountLabel}>OFF</Text>
                  </View>
                )}

                {/* Featured Badge */}
                {index === 0 && (
                  <View style={styles.featuredBadge}>
                    <Sparkles size={14} color="#fbbf24" fill="#fbbf24" />
                    <Text style={styles.featuredText}>Destacado</Text>
                  </View>
                )}

                {/* Content */}
                <View style={styles.promoContent}>
                  <View style={styles.promoIconContainer}>
                    <Gift size={40} color="#f97316" strokeWidth={1.5} />
                  </View>

                  <View style={styles.promoInfo}>
                    <Text style={styles.promoTitle} numberOfLines={2}>
                      {promo.title}
                    </Text>
                    {!!promo.description && (
                      <Text style={styles.promoDescription} numberOfLines={3}>
                        {promo.description}
                      </Text>
                    )}

                    {/* Validity */}
                    <View style={styles.validityRow}>
                      <Calendar size={14} color="#9ca3af" />
                      <Text style={styles.validityText}>
                        {promo.ends_at
                          ? `Válido hasta ${new Date(promo.ends_at).toLocaleDateString('es-CO')}`
                          : 'Siempre disponible'}
                      </Text>
                    </View>
                  </View>

                  {/* Admin Actions */}
                  {role === 'admin' && (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={async () => {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleDelete(promo.id);
                      }}
                    >
                      <Trash2 size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <Clock size={24} color="#f97316" strokeWidth={2} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>¡No te pierdas!</Text>
              <Text style={styles.infoText}>
                Todas las promociones están sujetas a disponibilidad. Pregunta por ofertas especiales del día.
              </Text>
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Admin Modal */}
      <Modal
        visible={showAdminModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAdminModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nueva Promoción</Text>
            <TouchableOpacity
              onPress={() => setShowAdminModal(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={28} color="#1f2937" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.formLabel}>Título *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Ej: 2x1 en Hamburguesas"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.formLabel}>Descripción</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              placeholder="Describe la promoción..."
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.formLabel}>Descuento (%)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Ej: 50"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={discount}
              onChangeText={setDiscount}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Gift size={20} color="white" strokeWidth={2.5} />
              <Text style={styles.saveButtonText}>Guardar Promoción</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef2e7',
  },

  // Hero
  heroContainer: {
    backgroundColor: '#f97316',
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  sparklesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#fed7aa',
    fontWeight: '600',
  },
  addPromoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  addPromoBtnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 15,
  },

  // Content
  content: {
    padding: 20,
    paddingTop: 24,
  },
  loader: {
    marginTop: 40,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9ca3af',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#d1d5db',
    marginTop: 8,
  },

  // Promo Card
  promoCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  featuredPromo: {
    borderWidth: 2,
    borderColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOpacity: 0.2,
  },
  discountBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomRightRadius: 16,
    zIndex: 10,
  },
  discountText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  discountLabel: {
    color: 'white',
    fontWeight: '800',
    fontSize: 12,
  },
  featuredBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1f2937',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 16,
    zIndex: 10,
  },
  featuredText: {
    color: '#fbbf24',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  promoContent: {
    padding: 20,
    paddingTop: 64,
    flexDirection: 'row',
    gap: 16,
  },
  promoIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#ffedd5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoInfo: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 26,
  },
  promoDescription: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 22,
  },
  validityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  validityText: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '600',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#fef3c7',
    padding: 20,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fde68a',
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ffedd5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
    fontWeight: '500',
  },

  // Modal
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
  formLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  formInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 2,
    borderColor: '#fde6d3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
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
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

export default PromosScreen;