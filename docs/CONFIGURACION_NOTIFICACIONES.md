# 🔔 Configuración de Notificaciones Push

## ⚠️ Estado Actual

Las notificaciones push **están implementadas** en el código, pero **requieren configuración adicional** para funcionar completamente.

## 🔍 Problema Detectado

El código de notificaciones está bien estructurado, pero falta el **`projectId`** de Expo en `app.json`, que es necesario para generar tokens de push notifications.

**Ubicación del error:** `services/pushNotifications.ts` líneas 61-64

```typescript
if (error.message.includes('No "projectId" found')) {
    console.warn('⚠️ Push Notifications: No Project ID found in app.json.');
    return null; // 👈 Las notificaciones no funcionarán sin esto
}
```

## ✅ Solución: Obtener y Configurar Project ID

### Paso 1: Obtener el Project ID

Tienes dos opciones:

#### Opción A: Usando EAS CLI (Recomendado)

```bash
# 1. Instalar EAS CLI (si no lo tienes)
npm install -g eas-cli

# 2. Iniciar sesión en Expo
npx expo login

# 3. Obtener información del proyecto
eas project:info
```

Esto mostrará el `projectId` que necesitas.

#### Opción B: Desde Expo Dashboard

1. Ve a https://expo.dev
2. Inicia sesión
3. Selecciona tu proyecto (o créalo si no existe)
4. En la configuración del proyecto, encontrarás el `projectId`

### Paso 2: Agregar Project ID a app.json

Una vez que tengas el `projectId`, agrégalo a `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "tu-project-id-aqui"
      },
      "SUPABASE_URL": "...",
      "SUPABASE_ANON_KEY": "..."
    }
  }
}
```

**Ejemplo completo:**

```json
{
  "expo": {
    "name": "Pura Calle Food",
    "slug": "puracalle-food-nav",
    "extra": {
      "eas": {
        "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      },
      "SUPABASE_URL": "https://xeptmpgseemvjdhlsfla.supabase.co",
      "SUPABASE_ANON_KEY": "..."
    }
  }
}
```

### Paso 3: Reconstruir la App

Después de agregar el `projectId`, necesitas reconstruir la app:

```bash
# Para desarrollo (Expo Go NO soporta push notifications)
npx expo prebuild

# O crear un build de desarrollo
eas build --profile development --platform android
eas build --profile development --platform ios
```

**⚠️ IMPORTANTE:** Las notificaciones push **NO funcionan en Expo Go**. Necesitas un build nativo.

## 📍 Dónde se Usan las Notificaciones

### 1. Registro Automático
**Archivo:** `hooks/useNotifications.ts` línea 23
- Se ejecuta automáticamente cuando un usuario inicia sesión
- Registra el token del dispositivo en Supabase

### 2. Envío de Notificaciones
**Archivo:** `app/driver/complete/[id].tsx` línea 187
- Cuando un repartidor completa una entrega
- Se envía notificación al cliente: "✨ ¡Entregado!"

**Función:** `services/pushNotifications.ts` línea 165
- `notifyOrderStatusChange()` - Notifica cambios de estado del pedido

### 3. Listeners (Escuchar Notificaciones)
**Archivo:** `hooks/useNotifications.ts` líneas 26-50
- Cuando llega una notificación (app abierta)
- Cuando el usuario toca una notificación (navega a la pantalla correspondiente)

## 🧪 Cómo Probar las Notificaciones

### 1. Verificar que el Token se Registró

Revisa en Supabase la tabla `profiles`:
```sql
SELECT id, push_token FROM profiles WHERE push_token IS NOT NULL;
```

Si hay tokens, el registro funcionó ✅

### 2. Enviar Notificación de Prueba

Puedes usar el Expo Push Notification Tool:
https://expo.dev/notifications

O desde código:

```typescript
import { sendPushNotification } from '@/services/pushNotifications';

// Enviar notificación de prueba
await sendPushNotification(
  'user-id-aqui',
  '🧪 Prueba',
  'Esta es una notificación de prueba'
);
```

### 3. Verificar Logs

Revisa la consola cuando la app inicia:
- ✅ `Push token registered: ExponentPushToken[...]` = Funciona
- ⚠️ `Push Notifications: No Project ID found` = Falta configurar projectId
- ⚠️ `Push notifications only work on physical devices` = Estás en emulador

## 🐛 Errores Comunes

### Error 1: "No projectId found"
**Causa:** Falta el `projectId` en `app.json`
**Solución:** Seguir Paso 1 y 2 arriba

### Error 2: "Push notifications only work on physical devices"
**Causa:** Estás probando en emulador o Expo Go
**Solución:** Usar dispositivo físico con build nativo

### Error 3: "Failed to get push token"
**Causa:** El usuario denegó permisos de notificaciones
**Solución:** Ir a Configuración del dispositivo y permitir notificaciones

### Error 4: "No push token found for user"
**Causa:** El usuario no tiene token registrado (no inició sesión o falló el registro)
**Solución:** Verificar que el usuario inició sesión y revisar logs

## 📱 Configuración Adicional por Plataforma

### iOS

Las notificaciones push en iOS requieren:
1. Certificado APNs (Apple Push Notification service)
2. Configuración en Apple Developer Portal
3. Build con EAS o Xcode

**Documentación:** https://docs.expo.dev/push-notifications/push-notifications-setup/

### Android

Las notificaciones push en Android requieren:
1. Firebase Cloud Messaging (FCM) configurado
2. Google Services JSON (google-services.json)
3. Build con EAS o Android Studio

**Documentación:** https://docs.expo.dev/push-notifications/push-notifications-setup/

## 🔄 Flujo Completo de Notificaciones

```
1. Usuario inicia sesión
   ↓
2. useNotifications() se ejecuta (app/_layout.tsx línea 40)
   ↓
3. registerForPushNotifications() solicita permisos
   ↓
4. Si acepta → Obtiene token de Expo
   ↓
5. Guarda token en Supabase (profiles.push_token)
   ↓
6. [Más tarde] Evento ocurre (pedido entregado)
   ↓
7. Backend llama notifyOrderStatusChange()
   ↓
8. sendPushNotification() obtiene token de Supabase
   ↓
9. Envía notificación a Expo Push Service
   ↓
10. Expo Push Service envía al dispositivo
   ↓
11. Sistema operativo muestra notificación
   ↓
12. Usuario toca notificación → App se abre en pantalla correcta
```

## ✅ Checklist de Configuración

- [ ] Tener cuenta de Expo
- [ ] Obtener `projectId` del proyecto
- [ ] Agregar `projectId` a `app.json`
- [ ] Configurar certificados APNs (iOS) o FCM (Android)
- [ ] Crear build nativo (no Expo Go)
- [ ] Probar en dispositivo físico
- [ ] Verificar que tokens se guardan en Supabase
- [ ] Probar envío de notificación

## 📚 Recursos

- [Documentación oficial de Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Guía de configuración](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [Expo Push Notification Tool](https://expo.dev/notifications)

---

**Nota:** El código de notificaciones está bien implementado. Solo falta la configuración del `projectId` y los certificados para producción. En desarrollo, puedes probar con un build de desarrollo una vez que tengas el `projectId`.

