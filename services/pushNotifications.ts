/**
 * SERVICE: Push Notifications
 * 
 * Maneja el sistema de notificaciones push usando expo-notifications
 * - Registro de tokens
 * - Envío de notificaciones
 * - Listeners de notificaciones recibidas
 */

import { supabase } from '@/lib/supabase';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// Configurar cómo se muestran las notificaciones cuando la app está en foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface PushToken {
    token: string;
    userId: string;
}

/**
 * Registra el token de push notifications en Supabase
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
    try {
        // Solo funciona en dispositivos físicos
        if (!Device.isDevice) {
            console.log('Push notifications only work on physical devices');
            return null;
        }

        // Verificar permisos
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return null;
        }

        // Obtener token
        let tokenData;
        try {
            tokenData = await Notifications.getExpoPushTokenAsync();
        } catch (error: any) {
            // Si falla por falta de Project ID, intentamos usar uno hardcoded si existe, o avisamos
            if (error.message.includes('No "projectId" found')) {
                console.warn('⚠️ Push Notifications: No Project ID found in app.json.');
                // Opcional: Retornar null para no bloquear la app
                return null;
            }
            throw error;
        }

        const token = tokenData.data;

        // Guardar token en Supabase (users table)
        const { error } = await supabase
            .from('profiles')
            .update({ push_token: token })
            .eq('id', userId);

        if (error) throw error;

        console.log('Push token registered:', token);
        return token;
    } catch (error) {
        console.error('Error registering for push notifications:', error);
        return null;
    }
}

/**
 * Enviar notificación a un usuario específico
 */
export async function sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: any
) {
    try {
        // Obtener el push token del usuario desde Supabase
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('push_token')
            .eq('id', userId)
            .single();

        if (error || !profile?.push_token) {
            // Solo mostrar en desarrollo, no es un error crítico
            if (__DEV__) {
                console.log('ℹ️ No push token found for user:', userId, '- Notifications will not be sent');
            }
            return;
        }

        // Enviar notificación via Expo Push Service
        const message = {
            to: profile.push_token,
            sound: 'default',
            title,
            body,
            data,
        };

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        const result = await response.json();
        console.log('Push notification sent:', result);
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}

/**
 * Configurar listeners para notificaciones
 */
export function setupNotificationListeners(
    onNotificationReceived: (notification: Notifications.Notification) => void,
    onNotificationTapped: (response: Notifications.NotificationResponse) => void
) {
    // Listener cuando se recibe una notificación (app en foreground)
    const receivedSubscription = Notifications.addNotificationReceivedListener(
        onNotificationReceived
    );

    // Listener cuando el usuario toca la notificación
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
        onNotificationTapped
    );

    // Limpiar listeners
    return () => {
        receivedSubscription.remove();
        responseSubscription.remove();
    };
}

/**
 * Notificar al cliente cuando su orden cambia de estado
 */
export async function notifyOrderStatusChange(
    userId: string,
    orderId: string,
    status: string
) {
    let title = '📦 Actualización de Pedido';
    let body = '';

    switch (status) {
        case 'pending':
            title = '🎉 ¡Pedido Recibido!';
            body = 'Tu orden ha sido recibida y está siendo preparada';
            break;
        case 'confirmed':
            title = '✅ Pedido Confirmado';
            body = 'El restaurante confirmó tu pedido';
            break;
        case 'preparing':
            title = '👨‍🍳 Preparando Tu Orden';
            body = 'Tu comida está siendo preparada';
            break;
        case 'ready_for_pickup':
            title = '🍕 Listo para Recoger';
            body = 'Tu pedido está listo y esperando al repartidor';
            break;
        case 'assigned_to_driver':
            title = '🚗 Repartidor Asignado';
            body = 'Un repartidor ha sido asignado a tu pedido';
            break;
        case 'out_for_delivery':
            title = '🚀 ¡En Camino!';
            body = 'Tu pedido está en camino';
            break;
        case 'delivered':
            title = '✨ ¡Entregado!';
            body = '¡Tu pedido ha sido entregado! Disfruta tu comida';
            break;
        case 'cancelled':
            title = '❌ Pedido Cancelado';
            body = 'Tu pedido ha sido cancelado';
            break;
    }

    await sendPushNotification(userId, title, body, { orderId, status });
}
