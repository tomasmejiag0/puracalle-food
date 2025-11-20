# 🎤 Guía para Presentar el Proyecto Pura Calle

## 📋 Agenda de Presentación (15-20 minutos)

### 1. Introducción (2 min)
**"Buenos días/tardes. Hoy presentaré Pura Calle, una aplicación móvil para un negocio de comida callejera."**

**Problema que resuelve:**
- Los clientes no conocen el menú completo
- Dificultad para gestionar pedidos manualmente
- Falta de visibilidad de promociones
- No hay historial de compras

**Solución:**
- App móvil multiplataforma (iOS + Android)
- Menú digital interactivo
- Sistema de pedidos automatizado
- Panel de administración

---

### 2. Demo en Vivo (8 min)

#### A. Experiencia del Usuario (4 min)
1. **Pantalla Home**
   - "Al abrir la app, el usuario ve una bienvenida con información destacada"
   - Mostrar botón "Entrar"
   
2. **Registro/Login**
   - "El usuario puede crear cuenta con email y contraseña"
   - Mencionar que Supabase maneja la autenticación de forma segura

3. **Pantalla Menú**
   - "Aquí vemos productos cargados desde la base de datos"
   - Agregar productos al carrito
   - Mostrar botón "Menú Físico (PDF)"

4. **Carrito y Checkout**
   - "El usuario puede revisar su pedido"
   - Simular pago (mencionar que se puede integrar pasarela real)
   - Orden se guarda en la base de datos

5. **Historial de Pedidos**
   - "En la pestaña Pedidos, el usuario ve su historial completo"

6. **Perfil**
   - "El usuario puede editar su información personal"
   - Mostrar opción de cerrar sesión

#### B. Experiencia del Administrador (4 min)
1. **Login como Admin**
   - "Iniciamos sesión con cuenta de administrador"
   - Aparece botón "Panel Admin" en Home

2. **Gestión de Promociones**
   - "En Promos, el admin ve un formulario para crear nuevas promociones"
   - Crear una promo de ejemplo
   - Eliminar una promo

3. **Panel de Administración**
   - "Aquí el admin gestiona usuarios y sus roles"
   - Buscar usuarios
   - Cambiar rol de usuario a admin (o viceversa)

---

### 3. Arquitectura Técnica (5 min)

#### Stack Tecnológico:
**Frontend:**
- ✅ React Native + Expo SDK 54
- ✅ TypeScript (tipado estático)
- ✅ Expo Router (navegación basada en archivos)

**Backend:**
- ✅ Supabase (PostgreSQL + Auth)
- ✅ Row Level Security (RLS) para seguridad

**Patrón de Navegación:**
```
Root (_layout.tsx)
├── Providers (SafeArea, Theme, Cart)
└── Stack Navigator
    ├── Tabs Navigator (5 pestañas)
    │   ├── Home
    │   ├── Menú
    │   ├── Pedidos
    │   ├── Promos
    │   └── Nosotros
    └── Modals
        ├── Auth (Login/Registro)
        ├── Profile
        ├── Admin
        ├── Cart
        └── Menu PDF
```

#### Base de Datos (mostrar diagrama si es posible):
```
profiles → users (auth)
products → categories
orders → profiles (user_id)
order_items → orders + products
promotions
```

---

### 4. Características Destacadas (3 min)

#### Seguridad:
- ✅ Autenticación con Supabase Auth
- ✅ Roles de usuario (user/admin)
- ✅ Row Level Security en PostgreSQL
- ✅ Tokens JWT manejados automáticamente

#### UX/UI:
- ✅ Diseño moderno con paleta naranja (identidad de marca)
- ✅ Feedback háptico (vibraciones al tocar botones)
- ✅ Pull-to-refresh en listas
- ✅ Safe Area para dispositivos con notch
- ✅ Estados de carga y errores informativos

#### Estado Global:
- ✅ React Context API para carrito de compras
- ✅ Custom Hooks (useAuth, useCart)
- ✅ Persistencia de sesión con AsyncStorage

#### Funcionalidades Avanzadas:
- ✅ Visor de PDF integrado (menú físico)
- ✅ CRUD completo de promociones para admins
- ✅ Gestión de usuarios y roles
- ✅ Historial de pedidos por usuario

---

### 5. Código Destacable (2 min)

**Mostrar snippets de:**

1. **Tab Navigator** (`app/(tabs)/_layout.tsx`)
   ```typescript
   // Configuración file-based routing con Expo Router
   <Tabs screenOptions={...}>
     <Tabs.Screen name="index" options={{ title: 'Home' }} />
     ...
   </Tabs>
   ```

2. **useAuth Hook** (`hooks/useAuth.ts`)
   ```typescript
   // Hook personalizado que escucha cambios de autenticación
   supabase.auth.onAuthStateChange((event, session) => {
     setUser(session?.user ?? null);
   });
   ```

3. **CartContext** (`context/CartContext.tsx`)
   ```typescript
   // Estado global del carrito accesible desde cualquier pantalla
   const { addItem, items, totalCents } = useCart();
   ```

4. **RLS Policy** (SQL)
   ```sql
   -- Los usuarios solo ven sus propios pedidos
   CREATE POLICY "select own orders" ON orders
   FOR SELECT USING (auth.uid() = user_id);
   ```

---

### 6. Próximos Pasos / Mejoras Futuras (1 min)

**Implementaciones Sugeridas:**
1. ✅ **Pasarela de pagos real** (Wompi, PayU, MercadoPago)
2. ✅ **Notificaciones Push** (Expo Notifications)
3. ✅ **Mapa de ubicación** (React Native Maps)
4. ✅ **Sistema de ratings** (calificar productos)
5. ✅ **Chat de soporte** (Firebase/Twilio)
6. ✅ **Programa de fidelización** (puntos por compra)
7. ✅ **Integración con delivery** (Rappi, Uber Eats)

---

### 7. Preguntas Frecuentes Anticipadas

**P: ¿Por qué React Native y no nativo?**
R: React Native permite desarrollar para iOS y Android simultáneamente con un solo código base, reduciendo tiempo y costos de desarrollo.

**P: ¿Es segura la app?**
R: Sí, usamos Supabase Auth con JWT tokens, Row Level Security en la BD, y HTTPS para todas las comunicaciones.

**P: ¿Qué pasa si no hay internet?**
R: Actualmente requiere conexión. Una mejora futura sería caché local con sincronización offline.

**P: ¿Cuánto cuesta hospedar esto?**
R: Supabase tiene plan gratuito hasta 500MB BD + 50,000 usuarios/mes. Escalable según crezca el negocio.

**P: ¿Se puede integrar con otras plataformas?**
R: Sí, Supabase expone APIs REST que pueden integrarse con cualquier sistema (web, POS, etc).

---

## 🎯 Tips para la Presentación

### Antes de Presentar:
1. ✅ Tener la app corriendo en un emulador/dispositivo
2. ✅ Tener 2 cuentas: una user y una admin
3. ✅ Cargar algunos productos y promos de ejemplo en la BD
4. ✅ Probar el flujo completo antes de presentar
5. ✅ Tener backup de screenshots por si falla el demo

### Durante la Presentación:
- 🎤 Habla claro y pausado
- 👁️ Mantén contacto visual con la audiencia
- 📱 Muestra la app en pantalla grande (proyector/TV)
- 🐛 Si hay un bug, no entres en pánico: "Esto es un prototipo funcional"
- ❓ Invita preguntas durante o al final

### Estructura de Respuestas:
1. Escucha la pregunta completa
2. Parafrasea para confirmar ("Si entiendo bien, preguntas sobre...")
3. Responde de forma concisa
4. Pregunta "¿Responde eso tu pregunta?"

---

## 📊 Métricas de Éxito del Proyecto

**Técnicas:**
- ✅ 100% TypeScript (type-safe)
- ✅ 0 errores de linter
- ✅ Arquitectura escalable
- ✅ Código documentado y comentado

**Funcionales:**
- ✅ Usuario puede registrarse y hacer pedidos
- ✅ Admin puede gestionar contenido dinámico
- ✅ Datos persisten en base de datos real
- ✅ Sesiones se mantienen entre reinicios

**UX:**
- ✅ Diseño consistente con identidad de marca
- ✅ Feedback visual y háptico en acciones
- ✅ Tiempos de carga optimizados
- ✅ Navegación intuitiva

---

## 📞 Contacto y Recursos

**Repositorio:** [Tu GitHub]  
**Documentación Completa:** Ver `DOCUMENTACION.md`  
**Demo Video:** [Opcional: grabar un video demo]  

**Stack Docs:**
- React Native: https://reactnative.dev
- Expo: https://docs.expo.dev
- Supabase: https://supabase.com/docs
- Expo Router: https://docs.expo.dev/router/introduction

---

## ✨ Cierre de Presentación

**"En resumen, Pura Calle es una solución completa que digitaliza el proceso de venta de comida callejera, mejorando la experiencia del cliente y facilitando la gestión del negocio. El proyecto está listo para escalar y agregar nuevas funcionalidades según las necesidades del negocio. ¿Preguntas?"**

🎉 **¡Mucha suerte en tu presentación!** 🎉

