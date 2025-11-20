# ✅ Verificación de Conexión a Base de Datos

## 🔗 Estado de Conexión

### Configuración Actual
- **URL Supabase**: `https://xeptmpgseemvjdhlsfla.supabase.co`
- **Anon Key**: ✅ Configurada
- **AsyncStorage**: ✅ Implementado (persiste sesión)
- **Auto Refresh Token**: ✅ Activado

---

## 📊 Tablas Conectadas

### ✅ Productos (`products`)
- **Archivo**: `services/products.ts`
- **Operaciones**:
  - ✅ `listProducts()` - Listar todos los productos
  - ✅ `createProduct()` - Crear producto (Admin)
  - ✅ `updateProduct()` - Actualizar producto (Admin)
  - ✅ `deleteProduct()` - Eliminar producto (Admin)
- **Pantallas**: `app/(tabs)/menu.tsx`
- **Estado**: 🟢 **CONECTADO**

### ✅ Categorías (`categories`)
- **Archivo**: `services/products.ts`
- **Operaciones**:
  - ✅ `listCategories()` - Listar categorías
- **Pantallas**: `app/(tabs)/menu.tsx`
- **Estado**: 🟢 **CONECTADO**

### ✅ Promociones (`promotions`)
- **Operaciones**: CRUD completo con RLS
- **Pantallas**: `app/(tabs)/promos.tsx`
- **Permisos**:
  - 👁️ Lectura: Todos los usuarios
  - ✏️ Escritura: Solo admins
- **Estado**: 🟢 **CONECTADO**

### ✅ Órdenes (`orders`)
- **Operaciones**: Crear y listar órdenes
- **Pantallas**: `app/cart.tsx`, `app/(tabs)/pedidos.tsx`
- **RLS**: Solo el usuario propietario ve sus órdenes
- **Estado**: 🟢 **CONECTADO**

### ✅ Items de Orden (`order_items`)
- **Operaciones**: Crear items al checkout
- **Relación**: `orders` → `order_items` (1:N)
- **Estado**: 🟢 **CONECTADO**

### ✅ Autenticación (`auth.users`)
- **Archivo**: `hooks/useAuth.ts`
- **Operaciones**:
  - ✅ `signUp()` - Registro
  - ✅ `signIn()` - Login
  - ✅ `signOut()` - Logout
  - ✅ Role checking (admin/user)
- **Pantallas**: `app/auth.tsx`, `app/profile.tsx`
- **Estado**: 🟢 **CONECTADO**

---

## 🔐 Row Level Security (RLS)

### Políticas Activas

#### 1. Productos
```sql
-- Todos pueden leer
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);

-- Solo admins pueden crear/editar/eliminar
CREATE POLICY "Only admins can insert products" ON products FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'user_role' = 'admin');
```

#### 2. Promociones
```sql
-- Todos pueden leer
CREATE POLICY "Anyone can view promotions" ON promotions FOR SELECT USING (true);

-- Solo admins pueden CRUD
CREATE POLICY "Only admins can manage promotions" ON promotions FOR ALL 
  USING (auth.jwt() ->> 'user_role' = 'admin');
```

#### 3. Órdenes
```sql
-- Usuarios solo ven sus propias órdenes
CREATE POLICY "Users view own orders" ON orders FOR SELECT 
  USING (auth.uid() = user_id);

-- Usuarios pueden crear sus propias órdenes
CREATE POLICY "Users can create own orders" ON orders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

---

## 🧪 Cómo Verificar la Conexión

### 1. Verificar en Supabase Dashboard
1. Ve a: https://supabase.com/dashboard/project/xeptmpgseemvjdhlsfla
2. Navega a **Table Editor**
3. Verifica que existan las tablas:
   - ✅ `products`
   - ✅ `categories`
   - ✅ `promotions`
   - ✅ `orders`
   - ✅ `order_items`
   - ✅ `user_roles`

### 2. Verificar en la App
```typescript
// Ejemplo: Test de conexión desde cualquier componente
import { supabase } from '@/lib/supabase';

const testConnection = async () => {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) {
    console.error('❌ Error de conexión:', error);
  } else {
    console.log('✅ Conexión exitosa:', data);
  }
};
```

### 3. Verificar Logs en Tiempo Real
- En la consola del simulador/dispositivo verás:
  - ✅ Requests exitosos: `200 OK`
  - ❌ Errores: Mensajes de Supabase detallados

---

## 📝 SQL Inicial (Si necesitas recrear tablas)

Ya tienes el archivo `SQL_MIGRATION_VIDEO.sql` con:
- ✅ Tabla `products` con campo `video_url`
- ✅ Índices optimizados
- ✅ RLS configurado

**Para aplicarlo:**
1. Ve a Supabase Dashboard → SQL Editor
2. Copia el contenido de `SQL_MIGRATION_VIDEO.sql`
3. Ejecuta el script

---

## 🔑 Admin por Defecto

```
Email: admin@puracalle.com
Password: admin123
Role: admin
```

Este usuario puede:
- ✅ Crear/editar/eliminar productos
- ✅ Crear/editar/eliminar promociones
- ✅ Ver panel de admin

---

## 🚀 Siguiente Paso: Pasarela de Pago Real

Actualmente el checkout es **simulado** (crea órdenes con status `pending`).

**Para implementar Wompi (Colombia):**
1. Registrarte en https://wompi.com
2. Obtener Public/Private Keys
3. Integrar SDK: https://docs.wompi.co/docs/en/integracion-checkout-web
4. Cambiar `app/cart.tsx` para usar Wompi Widget

**Para implementar Stripe (Internacional):**
1. Registrarte en https://stripe.com
2. Instalar: `expo install @stripe/stripe-react-native`
3. Seguir: https://stripe.com/docs/payments/accept-a-payment

---

## 📊 Resumen

| Componente | Estado | Notas |
|-----------|--------|-------|
| Base de Datos | 🟢 | Supabase PostgreSQL conectado |
| Autenticación | 🟢 | Email/Password + Roles |
| Productos | 🟢 | CRUD + Videos + Imágenes |
| Carrito | 🟢 | Context API + Local State |
| Checkout | 🟡 | Simulado (sin pasarela real) |
| Órdenes | 🟢 | Persistidas en BD |
| RLS | 🟢 | Políticas activas |
| Admin Panel | 🟢 | Solo para role='admin' |

---

## ⚠️ Importante para Producción

### 1. Mover Credenciales a Variables de Entorno
```typescript
// lib/supabase.ts
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
```

### 2. Crear `.env` (no commitear)
```
EXPO_PUBLIC_SUPABASE_URL=https://xeptmpgseemvjdhlsfla.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

### 3. Backup de BD
- Ve a Supabase → Settings → Database → Backups
- Configura backups automáticos

---

## 🆘 Troubleshooting

### Error: "relation does not exist"
- **Causa**: Tabla no creada en Supabase
- **Solución**: Ejecutar SQL de migración

### Error: "permission denied for table"
- **Causa**: RLS bloqueando operación
- **Solución**: Verificar políticas en Supabase Dashboard

### Error: "Invalid JWT"
- **Causa**: Token expirado
- **Solución**: Hacer logout/login nuevamente

---

## 📞 Soporte

- **Documentación Supabase**: https://supabase.com/docs
- **Comunidad Discord**: https://discord.supabase.com
- **Status Supabase**: https://status.supabase.com

