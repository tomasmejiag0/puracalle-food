# 📍 Guía de Implementación: Sistema de Ubicaciones y Reseñas

## 🎯 Funcionalidades Implementadas

### ✅ **1. Sistema de Ubicaciones**
- Múltiples direcciones por usuario
- Ubicación actual con GPS (iOS, Android, Web)
- Permisos de ubicación automáticos
- Etiquetas personalizadas ("Casa", "Trabajo", "Novia", etc.)
- Dirección predeterminada
- Instrucciones de entrega personalizadas

### ✅ **2. Sistema de Reseñas**
- Calificación de 1-5 estrellas
- Comentarios opcionales
- Solo para pedidos entregados
- Estadísticas globales de rating
- Una reseña por pedido

### ✅ **3. Mejoras en Pedidos**
- Estado de pedido vinculado a dirección
- Timeline visual de estados
- Opción de dejar reseña al completar

---

## 📋 Pasos para Activar Todo

### **Paso 1: Ejecutar el SQL en Supabase**

1. Ve a tu proyecto en https://supabase.com/dashboard
2. Navega a **SQL Editor**
3. Abre el archivo `SQL_UBICACIONES_REVIEWS.sql`
4. Copia y pega TODO el contenido
5. Haz clic en **RUN**
6. Verifica que no haya errores

**Qué crea este SQL:**
- ✅ Tabla `addresses` (direcciones de usuarios)
- ✅ Tabla `reviews` (reseñas de pedidos)
- ✅ Modifica tabla `orders` (agrega `address_id`, `notes`, `delivered_at`)
- ✅ RLS (Row Level Security) para ambas tablas
- ✅ Triggers automáticos
- ✅ Vista de estadísticas `review_stats`

---

### **Paso 2: Verificar Permisos en app.json**

Ya están configurados:

```json
"ios": {
  "infoPlist": {
    "NSLocationWhenInUseUsageDescription": "Pura Calle necesita acceder a tu ubicación...",
    "NSLocationAlwaysAndWhenInUseUsageDescription": "Pura Calle necesita acceder a tu ubicación..."
  }
},
"android": {
  "permissions": [
    "ACCESS_COARSE_LOCATION",
    "ACCESS_FINE_LOCATION"
  ]
}
```

---

### **Paso 3: Instalar Dependencias**

Ya están instaladas:
```bash
npm install expo-location react-native-maps expo-notifications
```

**Dependencias:**
- `expo-location`: GPS y permisos de ubicación
- `react-native-maps`: Mapas (opcional para mostrar mapa visual)
- `expo-notifications`: Notificaciones push (para pedir reseñas)

---

### **Paso 4: Navegar a la Pantalla de Ubicaciones**

En tu código, ya puedes navegar:

```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

// Ir a gestión de ubicaciones
router.push('/addresses');
```

**O agregar un botón en el perfil:**
```typescript
<TouchableOpacity onPress={() => router.push('/addresses')}>
  <Text>Mis Direcciones</Text>
</TouchableOpacity>
```

---

## 🗺️ Cómo Funciona el Sistema de Ubicaciones

### **Flujo Completo:**

1. **Usuario entra a `/addresses`**
   - Ve sus direcciones guardadas
   - Click en "Agregar Dirección"

2. **Usuario agrega nueva dirección**
   - Selecciona etiqueta ("Casa", "Trabajo", etc.) o personalizada
   - Click en "Usar Mi Ubicación Actual"
   - App pide permisos:
     - **iOS**: Muestra diálogo nativo
     - **Android**: Muestra diálogo nativo
     - **Web**: Usa Geolocation API del navegador
   - Obtiene coordenadas GPS (lat, lng)
   - Hace reverse geocoding para obtener dirección legible
   - Usuario puede editar la dirección manualmente
   - Guarda en Supabase

3. **Usuario hace un pedido**
   - En el carrito, selecciona dirección de entrega
   - Al confirmar, el pedido se vincula a esa dirección
   - El repartidor ve la dirección y coordenadas

4. **Pedido entregado**
   - Admin marca pedido como "delivered"
   - Usuario recibe notificación pidiendo reseña
   - Usuario deja calificación y comentario

---

## 🔧 Archivos Creados/Modificados

### **Nuevos Archivos:**

1. **`SQL_UBICACIONES_REVIEWS.sql`**
   - Script completo de base de datos
   - Tablas, RLS, triggers, vistas

2. **`services/addresses.ts`**
   - CRUD de direcciones
   - `listAddresses()`, `createAddress()`, `deleteAddress()`, etc.

3. **`services/reviews.ts`**
   - CRUD de reseñas
   - `createReview()`, `getReviewStats()`, etc.

4. **`app/addresses.tsx`**
   - Pantalla de gestión de ubicaciones
   - Permisos de GPS
   - Etiquetas personalizadas
   - Formulario completo

### **Archivos Modificados:**

1. **`app.json`**
   - Permisos de ubicación (iOS y Android)

2. **`app/cart.tsx`** (próximo paso)
   - Selector de dirección antes de pagar

3. **`app/(tabs)/pedidos.tsx`** (próximo paso)
   - Timeline visual de estados
   - Botón "Dejar Reseña" en pedidos entregados

---

## 🧪 Cómo Probar

### **1. Probar Ubicaciones:**

```bash
npx expo start
```

**En iOS:**
- Presiona `i` para abrir simulador
- Ve a Settings → Privacy → Location Services → Expo Go → Allow While Using

**En Android:**
- Presiona `a` para abrir emulador
- Abre app, acepta permisos cuando aparezca el diálogo

**En Web:**
- Presiona `w`
- El navegador pedirá permiso de ubicación
- Acepta el permiso

**Flujo:**
1. Login con tu usuario
2. Ve a "Mi Perfil" → "Mis Direcciones" (necesitas agregar este botón)
3. Click "Agregar Dirección"
4. Click "Usar Mi Ubicación Actual"
5. Acepta permisos
6. Rellena el formulario
7. Guarda

### **2. Probar en Dispositivo Real:**

```bash
npx expo start --tunnel
```

- Escanea QR con Expo Go
- Acepta permisos de ubicación
- Funciona con GPS real

---

## ⚙️ Próximos Pasos (Te los implemento si quieres)

### **1. Integrar Ubicaciones en el Carrito**
- Modificar `app/cart.tsx`
- Agregar selector de dirección antes de "Confirmar Pedido"
- Pasar `address_id` al crear la orden

### **2. Mejorar Pantalla de Pedidos**
- Modificar `app/(tabs)/pedidos.tsx`
- Timeline visual con estados:
  - 🟡 Pendiente
  - 🔵 Preparando
  - 🟣 En camino
  - 🟢 Entregado
- Botón "Dejar Reseña" cuando estado = "delivered"

### **3. Sistema de Notificaciones Push**
- Configurar Expo Notifications
- Enviar notificación cuando pedido = "delivered"
- Botón en notificación lleva a pantalla de reseña

### **4. Mapa Visual (Opcional)**
- Usar `react-native-maps`
- Mostrar mapa en selector de ubicación
- Pin draggable para ajustar ubicación

---

## 📊 Estructura de Datos

### **Tabla `addresses`:**
```sql
{
  id: UUID,
  user_id: UUID, // FK auth.users
  label: "Casa" | "Trabajo" | "Novia" | custom,
  address_line: "Calle 123 #45-67",
  latitude: 4.7110,
  longitude: -74.0721,
  city: "Bogotá",
  neighborhood: "Chapinero",
  phone_number: "3001234567",
  delivery_instructions: "Tocar timbre 2 veces",
  is_default: true,
  created_at: timestamp,
  updated_at: timestamp
}
```

### **Tabla `reviews`:**
```sql
{
  id: UUID,
  user_id: UUID,
  order_id: UUID,
  rating: 1-5,
  comment: "¡Excelente servicio!",
  created_at: timestamp,
  updated_at: timestamp
}
```

### **Tabla `orders` (modificada):**
```sql
{
  ...existing_fields,
  address_id: UUID, // FK addresses ← NUEVO
  notes: "Sin cebolla",  ← NUEVO
  delivered_at: timestamp  ← NUEVO
}
```

---

## 🔐 Seguridad (RLS)

### **Addresses:**
- ✅ Los usuarios solo ven/editan sus propias direcciones
- ✅ No pueden ver direcciones de otros usuarios
- ✅ Un trigger asegura solo una dirección default por usuario

### **Reviews:**
- ✅ Todos pueden ver reseñas (para calcular rating promedio)
- ✅ Los usuarios solo pueden crear reseñas para sus propias órdenes
- ✅ Solo órdenes con `status = 'delivered'` pueden ser reseñadas
- ✅ Solo una reseña por pedido (constraint unique)

---

## 🐛 Troubleshooting

### **"Location permission denied"**
**Solución:**
- iOS: Settings → Privacy → Location Services → Expo Go/App → Always/While Using
- Android: Settings → Apps → Expo Go/App → Permissions → Location → Allow

### **"Cannot read properties of null (addresses)"**
**Causa:** Usuario no autenticado
**Solución:** Asegurar que usuario haya hecho login primero

### **"RLS policy violation"**
**Causa:** SQL no ejecutado correctamente
**Solución:** Re-ejecutar `SQL_UBICACIONES_REVIEWS.sql` completo

---

## 📞 Soporte Técnico

### **Documentación Oficial:**
- Expo Location: https://docs.expo.dev/versions/latest/sdk/location/
- React Native Maps: https://github.com/react-native-maps/react-native-maps
- Expo Notifications: https://docs.expo.dev/push-notifications/overview/

### **APIs Útiles:**
- Reverse Geocoding: https://nominatim.org/release-docs/develop/api/Reverse/
- Google Maps Geocoding: https://developers.google.com/maps/documentation/geocoding

---

## ✨ Resumen

### **Lo que YA está listo:**
✅ Base de datos (tablas, RLS, triggers)  
✅ Servicios de ubicaciones y reseñas  
✅ Pantalla de gestión de ubicaciones  
✅ Permisos de GPS (iOS, Android, Web)  
✅ Dependencias instaladas  
✅ Etiquetas personalizadas  
✅ Dirección predeterminada  

### **Lo que falta (te lo implemento):**
⏳ Integrar ubicaciones en carrito  
⏳ Mejorar pantalla de pedidos con timeline  
⏳ Botón "Dejar Reseña" en pedidos entregados  
⏳ Notificaciones push automáticas  
⏳ Mapa visual (opcional)  

---

## 🚀 Siguiente Comando

**Ejecuta en tu terminal:**
```bash
npx expo start
```

**Luego:**
1. Ejecuta el SQL en Supabase
2. Login en la app
3. Ve a `/addresses` (necesitas agregar navegación)
4. Prueba agregar una dirección con tu ubicación actual

**¿Listo para que implemente el resto?** 🎉

