# 📋 Resumen Técnico - Pura Calle

## 🎯 ¿Qué es este Proyecto?

Aplicación móvil de **comida callejera** con sistema de pedidos, carrito de compras y panel de administración. Desarrollada con **React Native + Expo + Supabase**.

---

## 🔑 Conceptos Clave Explicados

### 1. **¿Qué es React Native?**
Framework de JavaScript para crear aplicaciones **nativas** (no web) para iOS y Android con un solo código.

**Ventaja:** Escribes una vez, funciona en ambas plataformas.

### 2. **¿Qué es Expo?**
Herramientas y servicios que facilitan el desarrollo con React Native (sin necesidad de Xcode o Android Studio para desarrollar).

**Ventaja:** Desarrollo más rápido, menos configuración.

### 3. **¿Qué es Supabase?**
**Backend as a Service**: Base de datos + autenticación + storage, todo en uno, sin necesidad de programar un servidor.

**Ventaja:** No necesitas crear un backend desde cero.

### 4. **¿Qué es TypeScript?**
JavaScript con "tipos" (como decir "esta variable es un número, no texto"). Evita muchos errores.

**Ventaja:** Código más seguro y fácil de mantener.

### 5. **¿Qué es Expo Router?**
Sistema de navegación basado en **archivos** (como Next.js). Cada archivo en `app/` se convierte automáticamente en una ruta.

**Ventaja:** No necesitas configurar rutas manualmente.

---

## 🏗️ Arquitectura Simplificada

```
┌─────────────────────────────────────────────┐
│           USUARIO (Celular)                 │
│  ┌──────────────────────────────────────┐  │
│  │   App React Native (Frontend)        │  │
│  │   - Pantallas (UI)                   │  │
│  │   - Lógica de negocio (JS)           │  │
│  │   - Estado (Context API)             │  │
│  └──────────────┬───────────────────────┘  │
└─────────────────┼───────────────────────────┘
                  │ HTTPS
                  ▼
┌─────────────────────────────────────────────┐
│        SUPABASE (Backend en la nube)        │
│  ┌──────────────────────────────────────┐  │
│  │   PostgreSQL (Base de Datos)         │  │
│  │   - profiles (usuarios)              │  │
│  │   - products (menú)                  │  │
│  │   - orders (pedidos)                 │  │
│  │   - promotions (promos)              │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │   Supabase Auth (Autenticación)      │  │
│  │   - Login/Registro                   │  │
│  │   - Roles (user/admin)               │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

**En palabras simples:**
1. El usuario abre la app en su celular (Frontend)
2. La app se comunica con Supabase por internet (API REST)
3. Supabase guarda/lee datos de PostgreSQL (Base de Datos)
4. Todo es en tiempo real

---

## 📱 Flujo de Navegación

### Tab Navigator (Pestañas Inferiores)
```
┌─────────────────────────────────────────┐
│         [Barra Superior]                │
│                                         │
│         [Contenido Principal]           │
│                                         │
│                                         │
├─────┬─────┬─────┬─────┬─────────────────┤
│ 🏠  │ 🍽️  │ 🛒  │ 🎁  │ ℹ️              │
│Home │Menu │Pedi │Prom │Nosot            │
│     │     │dos  │os   │ros              │
└─────┴─────┴─────┴─────┴─────────────────┘
```

### Pantallas Modales (se abren sobre las pestañas)
- `/auth` → Login/Registro
- `/profile` → Perfil del usuario
- `/admin` → Panel de administración
- `/cart` → Carrito de compras
- `/menu-pdf` → Menú en PDF

---

## 🔐 Sistema de Autenticación

### Flujo de Login:

```
1. Usuario ingresa email + password
   ↓
2. App envía credenciales a Supabase Auth
   ↓
3. Supabase verifica y devuelve un TOKEN (JWT)
   ↓
4. App guarda el token en AsyncStorage (memoria del celular)
   ↓
5. App busca el ROL del usuario en tabla 'profiles'
   ↓
6. Muestra pantallas según el rol:
   - user: Ve Home, Menú, Pedidos
   - admin: Ve todo + Panel Admin
```

**Importante:** El token se guarda en el celular, por eso no tienes que iniciar sesión cada vez que abres la app.

---

## 🗄️ Base de Datos Simplificada

### Tabla: `profiles`
```
id    | email              | full_name  | role  
------|--------------------|-----------|---------
123   | juan@gmail.com     | Juan Pérez | user
456   | admin@pura.com     | Admin      | admin
```

### Tabla: `products`
```
id | name          | price_cents | category_id
---|---------------|-------------|-----------
1  | Hamburguesa   | 12000       | 1
2  | Perro Caliente| 8000        | 1
```

### Tabla: `orders`
```
id | user_id | total_cents | status    | created_at
---|---------|-------------|-----------|------------
1  | 123     | 20000       | pending   | 2024-10-30
2  | 123     | 12000       | delivered | 2024-10-29
```

### Tabla: `order_items` (items de cada pedido)
```
id | order_id | product_id | quantity | price_cents_snapshot
---|----------|------------|----------|---------------------
1  | 1        | 1          | 1        | 12000
2  | 1        | 2          | 1        | 8000
```

**Relaciones:**
- `orders` → pertenece a un `user` (via `user_id`)
- `order_items` → pertenece a un `order` (via `order_id`)
- `order_items` → referencia un `product` (via `product_id`)

---

## 🧩 Componentes Clave

### 1. **Providers (Contextos Globales)**
Son como "cajas mágicas" que contienen datos accesibles desde cualquier parte de la app.

**Ejemplo: CartProvider**
```typescript
// En _layout.tsx (raíz)
<CartProvider>
  {/* Toda la app */}
</CartProvider>

// En cualquier pantalla
const { addItem, items } = useCart();
// Ya tienes acceso al carrito sin pasar props!
```

### 2. **Custom Hooks**
Funciones reutilizables que encapsulan lógica compleja.

**Ejemplo: useAuth**
```typescript
const { user, role, signIn, signOut } = useAuth();

if (role === 'admin') {
  // Mostrar panel admin
}
```

### 3. **Services (Servicios)**
Funciones que se comunican con Supabase (como una "capa de API").

**Ejemplo:**
```typescript
// services/products.ts
export async function listProducts() {
  const { data } = await supabase
    .from('products')
    .select('*');
  return data;
}

// En cualquier pantalla
const products = await listProducts();
```

---

## 🎨 Cómo Funcionan los Estilos

React Native usa un sistema similar a CSS pero con camelCase:

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,                    // Ocupa todo el espacio
    backgroundColor: '#fef2e7', // Color de fondo
  },
  title: {
    fontSize: 24,               // Tamaño de fuente (no necesita 'px')
    fontWeight: 'bold',
    color: '#f97316',           // Color naranja
  },
});
```

**Diferencias con CSS web:**
- `backgroundColor` en vez de `background-color`
- No hay `margin: 0 auto`, se usa `alignItems: 'center'`
- `flexDirection` por defecto es `column` (no `row` como en web)

---

## 🔥 Características Avanzadas Implementadas

### 1. **Feedback Háptico**
```typescript
import * as Haptics from 'expo-haptics';
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
```
Hace vibrar el celular cuando tocas un botón (mejora UX).

### 2. **Pull to Refresh**
```typescript
<ScrollView 
  refreshControl={
    <RefreshControl refreshing={loading} onRefresh={reload} />
  }
>
```
Deslizar hacia abajo para recargar datos (como Instagram).

### 3. **Safe Area**
```typescript
<SafeAreaView>
  {/* Contenido */}
</SafeAreaView>
```
Respeta el "notch" (muesca) de iPhone X+ y barra de navegación Android.

### 4. **WebView (PDF Viewer)**
```typescript
<WebView source={{ uri: 'https://menu.pdf' }} />
```
Abre PDFs dentro de la app sin salir a un navegador.

---

## 🚀 Flujo de Desarrollo

### 1. **Desarrollo Local**
```bash
npx expo start
```
- Abre Metro Bundler (servidor de desarrollo)
- Escaneas QR con Expo Go (app en tu celular)
- Cambios se reflejan en tiempo real (Hot Reload)

### 2. **Build para Producción**
```bash
eas build --platform android
eas build --platform ios
```
- Genera APK (Android) o IPA (iOS)
- Se puede publicar en Play Store / App Store

---

## 📊 Métricas de Performance

### Tiempo de Carga Inicial
- ~2-3 segundos en WiFi
- ~5-8 segundos en 4G

### Tamaño de la App
- APK Android: ~50-60 MB
- IPA iOS: ~60-70 MB

### Consumo de Batería
- Bajo (solo consume al estar en uso)

---

## 🔒 Seguridad

### Row Level Security (RLS)
Políticas en la base de datos que limitan qué datos puede ver cada usuario.

**Ejemplo:**
```sql
-- Un usuario solo puede ver SUS propios pedidos
CREATE POLICY "select own orders" ON orders
FOR SELECT USING (auth.uid() = user_id);
```

**Resultado:** 
- Juan con `user_id=123` solo ve órdenes donde `user_id=123`
- No puede ver pedidos de otros usuarios
- Se valida en el servidor (Supabase), no en la app

---

## 🐛 Debugging

### Ver logs en tiempo real:
```bash
npx expo start
# Presiona 'j' para abrir Chrome DevTools
```

### Errores comunes:
1. **"Cannot connect to Metro"** → Reiniciar: `npx expo start -c`
2. **"Module not found"** → Reinstalar: `rm -rf node_modules && npm install`
3. **"Supabase error"** → Verificar credenciales en `lib/supabase.ts`

---

## 📚 Recursos para Aprender Más

### Documentación Oficial:
- React Native: https://reactnative.dev
- Expo: https://docs.expo.dev
- Supabase: https://supabase.com/docs
- TypeScript: https://www.typescriptlang.org

### Tutoriales Recomendados:
- **React Native for Beginners** (YouTube)
- **Expo Router Tutorial** (Expo Docs)
- **Supabase Crash Course** (freeCodeCamp)

---

## ❓ Preguntas Frecuentes (FAQ)

**P: ¿Puedo usar esta app sin internet?**  
R: No actualmente. Necesitas conexión para cargar datos de Supabase. Se podría agregar caché offline como mejora futura.

**P: ¿Cómo agrego más productos al menú?**  
R: Inserta filas en la tabla `products` en Supabase o crea un panel admin para eso.

**P: ¿Cómo cambio los colores de la app?**  
R: Edita los `StyleSheet` en cada archivo `.tsx` o crea un archivo de tema centralizado.

**P: ¿Se puede integrar con pasarelas de pago reales?**  
R: Sí, puedes integrar Wompi, PayU o MercadoPago. Hay SDKs para React Native.

**P: ¿Funciona en tablets?**  
R: Sí, pero el diseño está optimizado para celulares. Necesitarías ajustar los estilos para pantallas grandes.

---

## 🎓 Glosario de Términos

- **Component**: Pieza reutilizable de UI (como un botón o una tarjeta)
- **Hook**: Función que permite usar estado y efectos en componentes
- **Context**: Estado global accesible desde cualquier componente
- **Provider**: Componente que provee un contexto a sus hijos
- **State**: Datos que cambian y causan re-render del componente
- **Props**: Datos que se pasan de un componente padre a hijo
- **JWT**: Token de autenticación (JSON Web Token)
- **RLS**: Row Level Security (seguridad a nivel de fila en BD)
- **API**: Interfaz para comunicarse con el backend
- **Async/Await**: Forma de manejar código asíncrono (promesas)

---

**¿Dudas? Consulta `DOCUMENTACION.md` para detalles técnicos completos.**

