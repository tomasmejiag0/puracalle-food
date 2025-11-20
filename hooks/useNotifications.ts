/**
 * HOOK: useNotifications
 * 
 * Hook personalizado para manejar notificaciones push
 * - Registro automático de push token
 * - Listeners de notificaciones
 * - Manejo de notificaciones recibidas
 */

import { registerForPushNotifications, setupNotificationListeners } from '@/services/pushNotifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from './useAuth';

export function useNotifications() {
    const { user, role } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) return;

        // Registrar token de push notifications
        registerForPushNotifications(user.id);

        // Configurar listeners
        const cleanup = setupNotificationListeners(
            // Cuando se recibe una notificación (app en foreground)
            (notification) => {
                console.log('Notification received:', notification);
                // Aquí puedes mostrar un toast o actualizar UI
            },
            // Cuando el usuario toca la notificación
            (response) => {
                console.log('Notification tapped:', response);
                const data = response.notification.request.content.data;

                // Navegar a la orden si hay orderId en data
                if (data?.orderId) {
                    // Determinar ruta según el rol
                    // Si es driver, ir a la pantalla de driver
                    // Si es cliente, por ahora ir a pedidos (o crear pantalla de detalle de orden cliente)
                    if (role === 'worker') {
                        router.push(`/driver/order/${data.orderId}`);
                    } else {
                        // TODO: Crear pantalla de detalle de orden para cliente o navegar a pedidos
                        router.push('/(tabs)/pedidos');
                    }
                }
            }
        );

        return cleanup;
    }, [user]);

    return {
        // Puedes exportar funciones útiles aquí si lo necesitas
    };
}
