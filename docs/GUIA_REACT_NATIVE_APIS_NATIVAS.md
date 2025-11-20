# 📱 Guía Completa: React Native y APIs Nativas en Pura Calle

## 🎯 ¿Qué es React Native?

React Native es un **framework** que te permite crear aplicaciones móviles (iOS y Android) usando **JavaScript/TypeScript** y **React**. 

### ¿Cómo funciona?

```
┌─────────────────────────────────────────┐
│   TU CÓDIGO JAVASCRIPT (React)          │
│   - Componentes, hooks, lógica          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   BRIDGE (Puente JavaScript ↔ Nativo)   │
│   - Comunica JS con código nativo       │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌─────────────┐  ┌─────────────┐
│   iOS       │  │   Android   │
│   (Swift/   │  │   (Java/    │
│   Objective-C)     │   Kotlin)   │
└─────────────┘  └─────────────┘
```

**En el celular:**
- Tu código JavaScript se ejecuta en un **motor JavaScript** (similar a Chrome)
- El **Bridge** traduce las llamadas a APIs nativas del sistema operativo
- El sistema operativo (iOS/Android) ejecuta las funciones nativas (GPS, vibración, notificaciones, etc.)

---

## 🔌 APIs Nativas Usadas en Este Proyecto

### 1. 📳 **HAPTICS (Vibración Táctil)**

**¿Qué hace?** Hace vibrar el celular cuando el usuario toca botones o realiza acciones.

**¿Cómo funciona en el celular?**
- En iOS: Usa el motor Taptic Engine (vibración suave)
- En Android: Usa el vibrador del dispositivo

**Ejemplos en el código:**

#### Ejemplo 1: Vibración al tocar botones del carrito
**Archivo:** `app/cart.tsx`

```typescript
// Línea 18: Importar la librería
import * as Haptics from 'expo-haptics';

// Línea 101-102: Vibración al cambiar cantidad
const handleQuantityChange = async (productId: string, delta: number) => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // 👈 VIBRA AQUÍ
  // ... resto del código
};

// Línea 110: Vibración al obtener ubicación
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // 👈 VIBRA MÁS FUERTE

// Línea 162: Vibración de éxito
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // 👈 VIBRA "ÉXITO"

// Línea 166: Vibración de error
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); // 👈 VIBRA "ERROR"
```

**Tipos de vibración:**
- `Light` - Vibración suave (botones normales)
- `Medium` - Vibración media (acciones importantes)
- `Heavy` - Vibración fuerte (acciones críticas)
- `Success` - Patrón de "éxito" (dos vibraciones cortas)
- `Error` - Patrón de "error" (vibración larga)

#### Ejemplo 2: Vibración en las pestañas de navegación
**Archivo:** `components/haptic-tab.tsx`

```typescript
// Líneas 1-18: Componente que agrega vibración a los tabs
import * as Haptics from 'expo-haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // 👇 VIBRA cuando presionas una pestaña (solo en iOS)
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
```

---

### 2. 📍 **LOCATION (GPS/Ubicación)**

**¿Qué hace?** Obtiene la ubicación GPS del celular (latitud, longitud).

**¿Cómo funciona en el celular?**
- Usa el GPS del dispositivo (satélites)
- También puede usar WiFi y torres de celular para ubicación aproximada
- Requiere **permisos** del usuario (privacidad)

**Ejemplos en el código:**

#### Ejemplo 1: Obtener ubicación actual al agregar dirección
**Archivo:** `app/addresses.tsx`

```typescript
// Línea 2: Importar la librería
import * as Location from 'expo-location';

// Líneas 100-106: Solicitar permiso
const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    // 👆 Pregunta al usuario: "¿Permitir acceso a ubicación?"
    return status === 'granted';
  } catch (error) {
    return false;
  }
};

// Líneas 108-170: Obtener ubicación actual
const getCurrentLocation = async () => {
  setLoadingLocation(true);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  try {
    // 1. Verificar permiso
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      Alert.alert('Permiso de Ubicación', 'Necesitamos acceso...');
      return;
    }

    // 2. Obtener coordenadas GPS 👇
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced, // Precisión balanceada (no consume mucha batería)
    });
    // 👆 Esto activa el GPS del celular y obtiene lat/lng

    setCurrentLocation(location);

    // 3. Convertir coordenadas a dirección legible (Reverse Geocoding) 👇
    const [address] = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,   // Ej: 4.6097
      longitude: location.coords.longitude,  // Ej: -74.0817
    });
    // 👆 Convierte "4.6097, -74.0817" → "Calle 123, Bogotá, Colombia"

    if (address) {
      const fullAddress = [
        address.street,        // "Calle 123"
        address.streetNumber,  // "45"
        address.district,      // "Chapinero"
        address.city,          // "Bogotá"
      ].filter(Boolean).join(', ');
      
      setAddressLine(fullAddress);
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    Alert.alert('Error', 'No se pudo obtener tu ubicación');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};
```

**¿Qué pasa en el celular?**
1. La app solicita permiso → Sistema operativo muestra diálogo
2. Si el usuario acepta → Se activa el GPS
3. El GPS obtiene coordenadas (puede tardar 5-30 segundos)
4. Se convierte a dirección usando servicios de mapas

#### Ejemplo 2: Rastreo continuo de ubicación (para repartidores)
**Archivo:** `services/locationTracker.ts`

```typescript
// Líneas 1-63: Servicio para rastrear ubicación en tiempo real
import * as Location from 'expo-location';

let locationSubscription: Location.LocationSubscription | null = null;

export const startTracking = async (driverId: string, orderId?: string) => {
  try {
    // 1. Solicitar permiso
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se requiere acceso a la ubicación');
      return;
    }

    // 2. Iniciar rastreo continuo 👇
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,  // Alta precisión (más batería)
        timeInterval: 5000,                 // Actualizar cada 5 segundos
        distanceInterval: 10,               // O cada 10 metros
      },
      async (location) => {
        // 👆 Esta función se ejecuta cada vez que cambia la ubicación
        
        const { latitude, longitude, accuracy, heading, speed } = location.coords;
        
        // Guardar en base de datos (Supabase)
        await supabase.from('driver_locations').insert({
          driver_id: driverId,
          order_id: orderId || null,
          latitude,      // 👈 Coordenada actual
          longitude,     // 👈 Coordenada actual
          accuracy,      // 👈 Precisión en metros
          heading,       // 👈 Dirección (0-360°)
          speed,         // 👈 Velocidad en m/s
        });
      }
    );
    // 👆 Esto sigue rastreando hasta que llames stopTracking()
  } catch (error) {
    console.error('Error starting tracking:', error);
  }
};

// Líneas 57-62: Detener rastreo
export const stopTracking = () => {
  if (locationSubscription) {
    locationSubscription.remove(); // 👈 Detiene el GPS
    locationSubscription = null;
  }
};
```

**¿Qué pasa en el celular?**
- El GPS se activa y **permanece activo**
- Cada 5 segundos (o cada 10 metros), obtiene nueva ubicación
- Se envía a la base de datos
- **Consume batería** (por eso se detiene cuando termina el viaje)

---

### 3. 🔔 **NOTIFICATIONS (Notificaciones Push)**

**¿Qué hace?** Envía notificaciones al celular incluso cuando la app está cerrada.

**¿Cómo funciona en el celular?**
- El celular se registra con un servicio de notificaciones (Expo Push Service)
- Recibe un **token único** (como un número de teléfono)
- Cuando hay un evento (pedido listo, repartidor asignado), el servidor envía notificación
- El sistema operativo muestra la notificación en la pantalla

**Ejemplos en el código:**

#### Ejemplo 1: Registrar el dispositivo para recibir notificaciones
**Archivo:** `services/pushNotifications.ts`

```typescript
// Líneas 1-85: Registro de notificaciones push
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// Líneas 14-23: Configurar cómo se muestran las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // 👈 Mostrar alerta
    shouldPlaySound: true,   // 👈 Reproducir sonido
    shouldSetBadge: true,    // 👈 Mostrar número en el ícono
    shouldShowBanner: true, // 👈 Mostrar banner
    shouldShowList: true,    // 👈 Mostrar en lista de notificaciones
  }),
});

// Líneas 33-85: Función para registrar el token
export async function registerForPushNotifications(userId: string) {
  try {
    // 1. Solo funciona en dispositivos físicos (no en emulador)
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // 2. Verificar permisos 👇
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      // 👇 Pregunta al usuario: "¿Permitir notificaciones?"
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token!');
      return null;
    }

    // 3. Obtener token único del dispositivo 👇
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    // 👆 Ejemplo: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
    // Este token es único para cada dispositivo

    // 4. Guardar token en base de datos 👇
    await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId);
    // 👆 Ahora el servidor sabe cómo enviar notificaciones a este usuario

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}
```

**¿Qué pasa en el celular?**
1. La app solicita permiso → Sistema muestra diálogo
2. Si acepta → Se genera un token único
3. El token se guarda en la base de datos
4. El servidor puede enviar notificaciones usando ese token

#### Ejemplo 2: Enviar notificación a un usuario
**Archivo:** `services/pushNotifications.ts`

```typescript
// Líneas 90-136: Función para enviar notificación
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: any
) {
  try {
    // 1. Obtener el token del usuario desde la base de datos
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', userId)
      .single();

    if (!profile?.push_token) {
      return; // Usuario no tiene token registrado
    }

    // 2. Preparar el mensaje 👇
    const message = {
      to: profile.push_token,  // 👈 Token del dispositivo
      sound: 'default',        // 👈 Sonido de notificación
      title,                   // 👈 "¡Pedido Listo!"
      body,                    // 👈 "Tu pedido está listo para recoger"
      data,                    // 👈 Datos adicionales (orderId, etc.)
    };

    // 3. Enviar a Expo Push Service 👇
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    // 👆 Expo Push Service envía la notificación al dispositivo

    const result = await response.json();
    console.log('Push notification sent:', result);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
```

**¿Qué pasa en el celular?**
1. El servidor envía notificación a Expo Push Service
2. Expo Push Service la envía al dispositivo usando el token
3. El sistema operativo muestra la notificación
4. Si el usuario toca la notificación, se abre la app

#### Ejemplo 3: Escuchar notificaciones recibidas
**Archivo:** `hooks/useNotifications.ts`

```typescript
// Líneas 15-58: Hook que escucha notificaciones
import { setupNotificationListeners } from '@/services/pushNotifications';

export function useNotifications() {
  const { user, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    // Registrar token
    registerForPushNotifications(user.id);

    // Configurar listeners 👇
    const cleanup = setupNotificationListeners(
      // 👇 Se ejecuta cuando llega una notificación (app abierta)
      (notification) => {
        console.log('Notification received:', notification);
        // Puedes mostrar un toast aquí
      },
      // 👇 Se ejecuta cuando el usuario TOCA la notificación
      (response) => {
        console.log('Notification tapped:', response);
        const data = response.notification.request.content.data;

        // Navegar a la orden si hay orderId
        if (data?.orderId) {
          if (role === 'worker') {
            router.push(`/driver/order/${data.orderId}`); // 👈 Abre pantalla de repartidor
          } else {
            router.push('/(tabs)/pedidos'); // 👈 Abre pantalla de pedidos
          }
        }
      }
    );

    return cleanup; // Limpiar listeners al desmontar
  }, [user]);
}
```

**Archivo:** `services/pushNotifications.ts` (continuación)

```typescript
// Líneas 141-160: Configurar listeners
export function setupNotificationListeners(
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationTapped: (response: Notifications.NotificationResponse) => void
) {
  // 👇 Listener cuando se recibe notificación (app en primer plano)
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    onNotificationReceived
  );

  // 👇 Listener cuando el usuario toca la notificación
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    onNotificationTapped
  );

  // Retornar función de limpieza
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
```

---

### 4. 🎨 **SYSTEM UI (Interfaz del Sistema)**

**¿Qué hace?** Controla elementos del sistema operativo (barra de estado, colores, etc.)

**Ejemplo en el código:**
**Archivo:** `app/_layout.tsx`

```typescript
// Línea 19: Importar
import * as SystemUI from 'expo-system-ui';

// Líneas 43-45: Configurar color de fondo del sistema
useEffect(() => {
  SystemUI.setBackgroundColorAsync('#f97316'); // 👈 Color naranja para la barra de estado
}, []);

// Línea 63: Configurar estilo de la barra de estado
<StatusBar style="dark" backgroundColor="#f97316" />
// 👆 Iconos oscuros (se ven bien sobre fondo naranja)
```

**¿Qué pasa en el celular?**
- Cambia el color de la barra de estado (donde está la hora, batería, etc.)
- En Android, cambia el color de la barra de navegación

---

### 5. 🖼️ **IMAGE (Optimización de Imágenes)**

**¿Qué hace?** Carga y muestra imágenes de forma optimizada.

**Ejemplo en el código:**
**Archivo:** `app/(tabs)/menu.tsx`

```typescript
// Línea 20: Importar
import { Image } from 'expo-image';

// Uso en el componente:
<Image
  source={{ uri: product.image_url }}
  style={styles.productImage}
  contentFit="cover"
  transition={200} // 👈 Animación suave al cargar
/>
```

**¿Qué pasa en el celular?**
- Descarga la imagen de internet
- La cachea localmente (no vuelve a descargar)
- La muestra con animación suave
- Optimiza el tamaño para no consumir mucha memoria

---

## 🔄 Flujo Completo: Ejemplo Real

### Escenario: Usuario agrega producto al carrito

```
1. Usuario toca botón "Agregar al carrito"
   ↓
2. app/(tabs)/menu.tsx línea ~200
   - addItem(product) del CartContext
   ↓
3. Haptics.impactAsync() - VIBRA el celular
   ↓
4. CartContext actualiza el estado
   ↓
5. UI se actualiza (muestra badge con cantidad)
```

### Escenario: Repartidor inicia entrega

```
1. Repartidor toca "Iniciar Entrega"
   ↓
2. services/locationTracker.ts línea 7
   - startTracking(driverId, orderId)
   ↓
3. Solicita permiso de ubicación
   - Sistema muestra diálogo
   ↓
4. Si acepta:
   - GPS se activa
   - watchPositionAsync() inicia rastreo
   ↓
5. Cada 5 segundos:
   - Obtiene nueva ubicación
   - Guarda en Supabase (driver_locations)
   ↓
6. Cliente ve ubicación en tiempo real en el mapa
```

### Escenario: Pedido cambia de estado

```
1. Admin marca pedido como "Listo"
   ↓
2. Backend actualiza estado en Supabase
   ↓
3. Backend llama sendPushNotification()
   ↓
4. services/pushNotifications.ts línea 90
   - Obtiene push_token del usuario
   - Envía a Expo Push Service
   ↓
5. Expo Push Service envía al dispositivo
   ↓
6. Sistema operativo muestra notificación:
   "🍕 Listo para Recoger - Tu pedido está listo"
   ↓
7. Usuario toca notificación
   ↓
8. hooks/useNotifications.ts línea 33
   - Listener detecta el tap
   - Navega a pantalla de pedidos
```

---

## 📚 Resumen de APIs Nativas

| API | Librería | ¿Qué hace? | Archivos donde se usa |
|-----|----------|------------|----------------------|
| **Haptics** | `expo-haptics` | Vibración táctil | `cart.tsx`, `addresses.tsx`, `haptic-tab.tsx` |
| **Location** | `expo-location` | GPS/Ubicación | `addresses.tsx`, `locationTracker.ts`, `AddressMapPicker.tsx` |
| **Notifications** | `expo-notifications` | Notificaciones push | `pushNotifications.ts`, `useNotifications.ts` |
| **System UI** | `expo-system-ui` | Control de UI del sistema | `_layout.tsx` |
| **Image** | `expo-image` | Imágenes optimizadas | `menu.tsx`, múltiples pantallas |
| **Status Bar** | `expo-status-bar` | Barra de estado | `_layout.tsx` |
| **Device** | `expo-device` | Info del dispositivo | `pushNotifications.ts` |

---

## 🎓 Conceptos Clave

### 1. **Permisos**
Todas las APIs nativas requieren **permisos del usuario**:
- Ubicación → `Location.requestForegroundPermissionsAsync()`
- Notificaciones → `Notifications.requestPermissionsAsync()`
- Cámara → `Camera.requestPermissionsAsync()`

### 2. **Async/Await**
Las APIs nativas son **asíncronas** (toman tiempo):
```typescript
const location = await Location.getCurrentPositionAsync(); // ⏳ Espera respuesta
```

### 3. **Manejo de Errores**
Siempre maneja errores:
```typescript
try {
  const location = await Location.getCurrentPositionAsync();
} catch (error) {
  Alert.alert('Error', 'No se pudo obtener ubicación');
}
```

### 4. **Limpieza de Recursos**
Algunas APIs necesitan limpieza:
```typescript
useEffect(() => {
  const subscription = Location.watchPositionAsync(...);
  return () => subscription.remove(); // 👈 Limpiar al desmontar
}, []);
```

---

## 🚀 Próximos Pasos

1. **Prueba en dispositivo físico**: Muchas APIs no funcionan en emulador
2. **Revisa permisos**: Asegúrate de que el usuario acepte los permisos
3. **Optimiza batería**: El GPS consume mucha batería, úsalo solo cuando sea necesario
4. **Maneja errores**: Siempre maneja casos donde el usuario niega permisos

---

¿Tienes preguntas sobre alguna API específica? ¡Pregunta y te explico con más detalle! 🎯

