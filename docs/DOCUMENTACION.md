# 📱 Pura Calle - Documentación del Proyecto

## 🎯 Descripción General
Aplicación móvil de comida callejera desarrollada con **React Native** y **Expo**, que permite a los usuarios explorar el menú, realizar pedidos, ver promociones y gestionar su perfil. Incluye un panel de administración para gestionar contenido dinámico.

---

## 🏗️ Arquitectura del Proyecto

```
puracalle-food-nav-mobile/
├── app/                          # Pantallas de la aplicación (Expo Router)
│   ├── _layout.tsx              # Layout raíz con providers globales
│   ├── (tabs)/                  # Navegación por pestañas (Tab Navigator)
│   │   ├── _layout.tsx          # Configuración del Tab Navigator
│   │   ├── index.tsx            # 🏠 Pantalla Home
│   │   ├── menu.tsx             # 🍽️ Pantalla Menú
│   │   ├── pedidos.tsx          # 🛒 Pantalla Pedidos
│   │   ├── promos.tsx           # 🎁 Pantalla Promociones
│   │   └── nosotros.tsx         # ℹ️ Pantalla Nosotros
│   ├── auth.tsx                 # 🔐 Login/Registro
│   ├── profile.tsx              # 👤 Perfil del usuario
│   ├── admin.tsx                # 👑 Panel de administración
│   ├── cart.tsx                 # 🛍️ Carrito de compras
│   └── menu-pdf.tsx             # 📄 Menú físico en PDF
├── hooks/                        # Custom React Hooks
│   ├── useAuth.ts               # Hook de autenticación
│   └── useCart.ts               # Hook del carrito (deprecated, ahora es Context)
├── context/                      # React Context API
│   └── CartContext.tsx          # Estado global del carrito
├── services/                     # Servicios de API (Supabase)
│   ├── products.ts              # CRUD de productos
│   ├── promotions.ts            # CRUD de promociones
│   └── users.ts                 # CRUD de usuarios/perfiles
├── lib/                          # Configuraciones
│   └── supabase.ts              # Cliente de Supabase
├── assets/                       # Recursos estáticos
│   └── images/                  # Imágenes y logos
└── components/                   # Componentes reutilizables
```

---

## 🔑 Tecnologías Principales

- **React Native**: Framework para desarrollo móvil multiplataforma
- **Expo SDK 54**: Herramientas y APIs para React Native
- **Expo Router**: Sistema de navegación basado en archivos
- **Supabase**: Backend as a Service (PostgreSQL + Auth + Storage)
- **TypeScript**: Tipado estático para mayor seguridad
- **Lucide React Native**: Librería de iconos moderna
- **React Native Reanimated**: Animaciones de alto rendimiento

---

## 🗂️ Navegación: Tab Navigator

### ¿Qué es un Tab Navigator?
Es un patrón de navegación con pestañas en la parte inferior de la pantalla (típico de apps móviles como Instagram, Twitter, etc.).

### Implementación en este proyecto:

```
app/(tabs)/_layout.tsx → Define las 5 pestañas principales
```

**Características:**
- 🏠 **Home**: Bienvenida y destacados
- 🍽️ **Menú**: Productos desde Supabase + "Agregar al carrito"
- 🛒 **Pedidos**: Historial de pedidos del usuario autenticado
- 🎁 **Promos**: Promociones activas (CRUD para admins)
- ℹ️ **Nosotros**: Información de contacto y redes sociales

**Navegación Stack (fuera de tabs):**
- `/auth`: Modal de login/registro
- `/profile`: Pantalla de perfil del usuario
- `/admin`: Panel exclusivo para administradores
- `/cart`: Carrito de compras con checkout
- `/menu-pdf`: Visor del menú físico en PDF

---

## 🔐 Sistema de Autenticación

### Flujo de Autenticación:

1. **Usuario crea cuenta** → Supabase Auth crea usuario
2. **Trigger de BD** → Crea perfil automático en tabla `profiles`
3. **Hook `useAuth`** → Escucha cambios de sesión
4. **Context global** → Propaga `user`, `role`, `signIn`, `signOut`

### Roles de Usuario:
- **`user`**: Usuario común (ver menú, hacer pedidos)
- **`admin`**: Administrador (CRUD de promos, productos, gestión de usuarios)

---

## 🗄️ Base de Datos (Supabase)

### Tablas Principales:

#### `profiles`
```sql
- id (UUID, PK) → Relacionado con auth.users
- email (TEXT)
- full_name (TEXT)
- phone (TEXT)
- avatar_url (TEXT)
- role (ENUM: 'user', 'admin')
- created_at, updated_at
```

#### `categories`
```sql
- id (SERIAL, PK)
- name (TEXT)
- created_at
```

#### `products`
```sql
- id (SERIAL, PK)
- name (TEXT)
- description (TEXT)
- price_cents (INTEGER) → Precio en centavos
- category_id (FK → categories)
- image_url (TEXT)
- available (BOOLEAN)
- created_at, updated_at
```

#### `promotions`
```sql
- id (SERIAL, PK)
- title (TEXT)
- description (TEXT)
- discount_percentage (INTEGER)
- valid_until (TIMESTAMP)
- image_url (TEXT)
- created_at, updated_at
```

#### `orders`
```sql
- id (SERIAL, PK)
- user_id (UUID, FK → profiles)
- total_cents (INTEGER)
- status (ENUM: 'pending', 'confirmed', 'delivered', 'cancelled')
- created_at, updated_at
```

#### `order_items`
```sql
- id (SERIAL, PK)
- order_id (FK → orders)
- product_id (FK → products)
- quantity (INTEGER)
- price_cents_snapshot (INTEGER) → Precio al momento del pedido
```

### Row Level Security (RLS):
- ✅ Usuarios solo ven sus propios pedidos
- ✅ Admins pueden modificar productos/promos
- ✅ Menú y promos son públicos (lectura)

---

## 🎨 Paleta de Colores

```javascript
Primary: #f97316    // Naranja vibrante (Orange-500)
Background: #fef2e7 // Naranja muy claro (Orange-50)
Accent: #fed7aa     // Naranja claro (Orange-200)
Dark: #c2410c       // Naranja oscuro (Orange-700)
Text: #1f2937       // Gris oscuro (Gray-800)
Muted: #6b7280      // Gris medio (Gray-600)
```

---

## 📦 Componentes Clave

### 1. **CartContext** (`context/CartContext.tsx`)
Estado global del carrito usando Context API.

**Funciones:**
- `addItem(product)`: Agrega producto al carrito
- `removeItem(productId)`: Elimina producto
- `updateQuantity(productId, quantity)`: Actualiza cantidad
- `clearCart()`: Vacía el carrito
- `getTotalPrice()`: Calcula total

### 2. **useAuth Hook** (`hooks/useAuth.ts`)
Hook personalizado para gestionar autenticación.

**Retorna:**
- `user`: Usuario actual (o null)
- `role`: Rol del usuario ('user' | 'admin' | null)
- `loading`: Estado de carga
- `signIn(email, password)`: Iniciar sesión
- `signUp(email, password)`: Registrarse
- `signOut()`: Cerrar sesión

### 3. **Services** (`services/`)
Funciones para interactuar con Supabase.

**Ejemplos:**
```typescript
// products.ts
listProducts() → Obtiene todos los productos
listCategories() → Obtiene categorías

// promotions.ts
listPromotions() → Lista promociones activas
createPromotion(data) → Crea nueva promo (admin)
deletePromotion(id) → Elimina promo (admin)

// users.ts
listProfiles() → Lista usuarios (admin)
updateProfileRole(id, role) → Cambia rol de usuario (admin)
getOwnProfile() → Obtiene perfil del usuario actual
updateOwnProfile(data) → Actualiza perfil propio
```

---

## 🚀 Flujo de Uso

### Usuario Común:
1. Abre la app → Ve Home con bienvenida
2. Toca "Entrar" → Login/Registro
3. Navega a "Menú" → Agrega productos al carrito
4. Toca "Ver Carrito" → Revisa pedido
5. "Pagar con PSE" (simulado) → Crea orden en BD
6. Va a "Pedidos" → Ve historial de compras
7. "Mi Perfil" → Edita nombre/teléfono

### Administrador:
1. Inicia sesión con cuenta admin
2. Home muestra botón "Panel Admin"
3. En "Promos" → Ve formulario para crear/eliminar
4. En "Admin Panel" → Gestiona roles de usuarios
5. Puede hacer pedidos como usuario normal

---

## 🔥 Características Especiales

### 1. **Feedback Háptico**
```typescript
import * as Haptics from 'expo-haptics';
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
```
Vibración al tocar botones (mejora UX).

### 2. **Pull to Refresh**
```typescript
<ScrollView refreshControl={<RefreshControl refreshing={...} onRefresh={...} />}>
```
Deslizar hacia abajo para recargar datos.

### 3. **PDF Viewer Integrado**
```typescript
<WebView source={{ uri: 'https://...' }} />
```
Abre el menú físico sin salir de la app.

### 4. **Safe Area Context**
```typescript
<SafeAreaProvider> en raíz
<SafeAreaView> en cada pantalla
```
Respeta notch, status bar y navegación de gestos.

---

## 🛠️ Comandos Útiles

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npx expo start

# Limpiar caché
npx expo start -c

# Construir para producción
eas build --platform android
eas build --platform ios
```

---

## 📝 Variables de Entorno (para producción)

```env
EXPO_PUBLIC_SUPABASE_URL=https://xeptmpgseemvjdhlsfla.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

⚠️ **Nota**: Actualmente están hardcodeadas en `lib/supabase.ts` para pruebas.

---

## 🔮 Próximas Mejoras Sugeridas

1. ✅ **Pasarela de pagos real** (Wompi, PayU, MercadoPago)
2. ✅ **Notificaciones push** (cuando cambia estado del pedido)
3. ✅ **Mapa interactivo** (ubicación del puesto)
4. ✅ **Sistema de ratings** (calificar productos)
5. ✅ **Chat de soporte** (atención al cliente)
6. ✅ **Programa de fidelización** (puntos por compra)

---

## 📞 Contacto del Proyecto

**Desarrollador**: [Tu Nombre]  
**Email**: [Tu Email]  
**GitHub**: [Tu GitHub]  
**Versión**: 1.0.0  
**Última actualización**: Octubre 2024

---

## 📄 Licencia

Este proyecto es de uso educativo/comercial para **Pura Calle**.

