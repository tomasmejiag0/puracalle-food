/**
 * PANTALLA: COMPLETAR ENTREGA + FOTO DE EVIDENCIA
 * 
 * Permite al driver:
 * - Tomar foto de evidencia de entrega
 * - Confirmar que la orden fue entregada
 * - Actualizar estado a "delivered"
 * - Enviar notificación al cliente
 */

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { notifyOrderStatusChange } from '@/services/pushNotifications';
import { decode } from 'base64-arraybuffer';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Camera as CameraIcon, Check, FlipHorizontal, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CompleteDeliveryScreen() {
    const { id: orderId } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const cameraRef = useRef<CameraView>(null);

    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<'front' | 'back'>('back');
    const [photo, setPhoto] = useState<string | null>(null);
    const [photoBase64, setPhotoBase64] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [deliveryCode, setDeliveryCode] = useState('');
    const [orderCode, setOrderCode] = useState<string | null>(null);

    // Solicitar permisos de cámara al montar si no están determinados
    React.useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, [permission]);

    // Cargar código de la orden
    React.useEffect(() => {
        const loadOrderCode = async () => {
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select('delivery_code')
                    .eq('id', orderId)
                    .single();

                if (!error && data) {
                    setOrderCode(data.delivery_code);
                }
            } catch (error) {
                console.error('Error loading order code:', error);
            }
        };
        loadOrderCode();
    }, [orderId]);

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.7, // Comprimir imagen
                    base64: true, // Solicitar base64 directamente para subir
                });
                // En la nueva API, photo puede venir como undefined si falla, pero el tipo dice que retorna CameraCapturedPicture
                if (photo) {
                    setPhoto(photo.uri);
                    // Guardar el base64 si está disponible
                    if (photo.base64) {
                        setPhotoBase64(photo.base64);
                    }
                }
            } catch (error) {
                console.error('Error taking picture:', error);
                Alert.alert('Error', 'No se pudo capturar la foto');
            }
        }
    };

    const retakePicture = () => {
        setPhoto(null);
        setPhotoBase64(null);
    };

    const confirmDelivery = async () => {
        if (!photo) {
            Alert.alert('⚠️ Foto Requerida', 'Debes tomar una foto de evidencia de la entrega');
            return;
        }

        if (!deliveryCode || deliveryCode.trim() === '') {
            Alert.alert('⚠️ Código Requerido', 'Debes ingresar el código de entrega que te proporcionó el cliente');
            return;
        }

        if (orderCode && deliveryCode.trim() !== orderCode) {
            Alert.alert('❌ Código Incorrecto', 'El código ingresado no coincide con el código de la orden');
            return;
        }

        setUploading(true);
        try {
            // 1. Subir foto a Supabase Storage
            const photoName = `delivery-${orderId}-${Date.now()}.jpg`;

            // Usar el base64 guardado o leerlo del archivo si no está disponible
            let base64: string;
            if (photoBase64) {
                // Usar el base64 que ya tenemos de la cámara
                base64 = photoBase64;
            } else if (photo) {
                // Si no tenemos base64, leerlo del archivo (usando API legacy)
                base64 = await FileSystem.readAsStringAsync(photo, {
                    encoding: 'base64',
                });
            } else {
                throw new Error('No hay foto disponible');
            }

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('delivery-photos')
                .upload(photoName, decode(base64), {
                    contentType: 'image/jpeg',
                });

            if (uploadError) throw uploadError;

            // 2. Registrar foto en la tabla delivery_photos
            const { data: photoRecord, error: photoError } = await supabase
                .from('delivery_photos')
                .insert({
                    order_id: orderId,
                    driver_id: user!.id,
                    photo_url: uploadData.path,
                    photo_storage_path: uploadData.path, // Ruta completa en storage
                })
                .select()
                .single();

            if (photoError) throw photoError;

            // 3. Obtener usuario de la orden para notificación
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('user_id')
                .eq('id', orderId)
                .single();

            if (orderError) throw orderError;

            // 4. Actualizar estado de la orden a "delivered"
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    status: 'completed',
                    status_detailed: 'delivered',
                    delivery_photo_id: photoRecord.id,
                    delivered_at: new Date().toISOString(),
                })
                .eq('id', orderId);

            if (updateError) throw updateError;

            // 5. Enviar notificación al cliente
            await notifyOrderStatusChange(orderData.user_id, orderId, 'delivered');

            // 6. Éxito!
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            Alert.alert(
                '✅ ¡Entrega Completada!',
                'La orden ha sido marcada como entregada y el cliente fue notificado',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/deliveries'),
                    },
                ]
            );
        } catch (error: any) {
            console.error('Error completing delivery:', error);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('❌ Error', error.message || 'No se pudo completar la entrega');
        } finally {
            setUploading(false);
        }
    };

    if (!permission) {
        // Permisos cargando
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#f97316" />
            </SafeAreaView>
        );
    }

    if (!permission.granted) {
        // Permisos denegados
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ title: 'Completar Entrega', headerShown: true }} />
                <View style={styles.permissionContainer}>
                    <CameraIcon size={60} color="#d1d5db" />
                    <Text style={styles.permissionText}>Se requiere acceso a la cámara</Text>
                    <Text style={styles.permissionSubtext}>
                        Activa los permisos de cámara en la configuración de tu dispositivo
                    </Text>
                    <TouchableOpacity style={styles.actionButton} onPress={requestPermission}>
                        <Text style={styles.actionButtonText}>Permitir Acceso</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ title: 'Completar Entrega', headerShown: true }} />

            {!photo ? (
                /* VISTA CÁMARA */
                <View style={styles.cameraContainer}>
                    <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
                        <View style={styles.cameraControls}>
                            {/* Botón girar cámara */}
                            <TouchableOpacity
                                style={styles.flipButton}
                                onPress={() => {
                                    setFacing(current => (current === 'back' ? 'front' : 'back'));
                                }}
                            >
                                <FlipHorizontal size={24} color="white" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.bottomControls}>
                            <View style={styles.instructionBox}>
                                <Text style={styles.instructionText}>
                                    📸 Toma una foto de la entrega completada
                                </Text>
                            </View>

                            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                                <View style={styles.captureButtonInner} />
                            </TouchableOpacity>
                        </View>
                    </CameraView>
                </View>
            ) : (
                /* VISTA PREVIEW */
                <KeyboardAvoidingView
                    style={styles.previewContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View style={styles.previewContainer}>
                                <Image source={{ uri: photo }} style={styles.previewImage} />

                                {/* Código de entrega */}
                                <View style={styles.codeContainer}>
                                    <Text style={styles.codeLabel}>Ingresa el código de entrega:</Text>
                                    <TextInput
                                        style={styles.codeInput}
                                        value={deliveryCode}
                                        onChangeText={setDeliveryCode}
                                        placeholder="Código de 5 dígitos"
                                        placeholderTextColor="#9ca3af"
                                        keyboardType="numeric"
                                        maxLength={5}
                                        autoFocus={false}
                                        returnKeyType="done"
                                        blurOnSubmit={true}
                                        onSubmitEditing={Keyboard.dismiss}
                                    />
                                    {orderCode && (
                                        <Text style={styles.codeHint}>
                                            El cliente debe proporcionarte el código: {orderCode}
                                        </Text>
                                    )}
                                    <TouchableOpacity
                                        style={styles.dismissKeyboardButton}
                                        onPress={Keyboard.dismiss}
                                    >
                                        <Text style={styles.dismissKeyboardText}>Cerrar teclado</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.previewActions}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.retakeButton]}
                                        onPress={retakePicture}
                                        disabled={uploading}
                                    >
                                        <X size={24} color="#dc2626" />
                                        <Text style={styles.retakeText}>Volver a tomar</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.confirmButton]}
                                        onPress={() => {
                                            Keyboard.dismiss();
                                            confirmDelivery();
                                        }}
                                        disabled={uploading || !deliveryCode || deliveryCode.trim() === ''}
                                    >
                                        {uploading ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <>
                                                <Check size={24} color="white" />
                                                <Text style={styles.confirmText}>Confirmar Entrega</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </ScrollView>
                </KeyboardAvoidingView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    permissionContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        backgroundColor: '#fef2e7',
    },
    permissionText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginTop: 16,
        marginBottom: 8,
    },
    permissionSubtext: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
    cameraContainer: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    cameraControls: {
        flex: 1,
        padding: 20,
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    flipButton: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 999,
        padding: 12,
    },
    bottomControls: {
        paddingBottom: 40,
        alignItems: 'center',
        gap: 20,
    },
    instructionBox: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 999,
    },
    instructionText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'white',
        padding: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureButtonInner: {
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: '#f97316',
    },
    previewContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    previewImage: {
        flex: 1,
        resizeMode: 'contain',
    },
    previewActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
        backgroundColor: 'rgba(0,0,0,0.8)',
        flexDirection: 'row',
        gap: 12,
        zIndex: 10,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
    },
    actionButtonText: {
        color: '#1f2937',
        fontSize: 16,
        fontWeight: '600',
    },
    retakeButton: {
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#dc2626',
    },
    retakeText: {
        color: '#dc2626',
        fontWeight: '800',
        fontSize: 15,
    },
    confirmButton: {
        backgroundColor: '#10b981',
    },
    confirmText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 15,
    },
    codeContainer: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 10,
    },
    codeLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 8,
    },
    codeInput: {
        backgroundColor: '#f3f4f6',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: 4,
        color: '#1f2937',
    },
    codeHint: {
        fontSize: 11,
        color: '#6b7280',
        marginTop: 8,
        textAlign: 'center',
    },
    dismissKeyboardButton: {
        marginTop: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#f3f4f6',
        borderRadius: 6,
        alignSelf: 'center',
    },
    dismissKeyboardText: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '600',
    },
});
