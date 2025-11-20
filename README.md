# 🍔 Pura Calle - App de Comida Callejera

<div align="center">
  <img src="./assets/images/logo.png" alt="Pura Calle Logo" width="200"/>
  
  **Aplicación móvil para gestión de pedidos de comida callejera**
  
  [![React Native](https://img.shields.io/badge/React%20Native-0.81-blue)](https://reactnative.dev)
  [![Expo](https://img.shields.io/badge/Expo-54-black)](https://expo.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org)
  [![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com)
</div>

---

## 📱 Descripción

**Pura Calle** es una aplicación móvil multiplataforma (iOS + Android) que permite a los clientes explorar el menú, realizar pedidos y ver promociones de un negocio de comida callejera. Incluye un panel de administración para gestionar contenido dinámico.

### ✨ Características Principales

**Para Usuarios:**
- 🍽️ Menú interactivo con productos desde base de datos
- 🛒 Carrito de compras con checkout simulado
- 📜 Historial de pedidos personalizado
- 🎁 Vista de promociones activas
- 👤 Perfil editable (nombre, teléfono)
- 📄 Menú físico en PDF integrado

**Para Administradores:**
- 👑 Panel de administración de usuarios y roles
- ➕ CRUD completo de promociones
- 🔍 Búsqueda y filtrado de usuarios
- 📊 Gestión de contenido dinámico

---

## 🏗️ Arquitectura

### Stack Tecnológico

```
Frontend:
├── React Native 0.81
├── Expo SDK 54
├── TypeScript
├── Expo Router (navegación)
└── Lucide Icons

Backend:
├── Supabase (BaaS)
├── PostgreSQL
├── Supabase Auth
└── Row Level Security (RLS)

Estado:
├── React Context API (Cart)
└── Custom Hooks (useAuth)
```

### Estructura de Navegación

```
Root Layout
├── SafeAreaProvider
├── ThemeProvider
├── CartProvider
└── Tab Navigator
    ├── Home
    ├── Menú
    ├── Pedidos
    ├── Promos
    └── Nosotros
```

---

## 🚀 Instalación y Uso

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Expo CLI (`npm install -g expo-cli`)
- Cuenta de Supabase (para base de datos)

### Instalación

```bash
# 1. Clonar el repositorio
git clone <tu-repo>
cd puracalle-food-nav-mobile

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npx expo start
```

### Opciones de Ejecución

```bash
# Ejecutar en emulador Android
npx expo start --android

# Ejecutar en simulador iOS (solo macOS)
npx expo start --ios

# Ejecutar en navegador web
npx expo start --web

# Limpiar caché y reiniciar
npx expo start -c
```

---

## 📂 Estructura del Proyecto

```
puracalle-food-nav-mobile/
├── app/                      # Pantallas (Expo Router)
│   ├── _layout.tsx          # Layout raíz
│   ├── (tabs)/              # Tab Navigator
│   │   ├── _layout.tsx      # Config de tabs
│   │   ├── index.tsx        # Home
│   │   ├── menu.tsx         # Menú
│   │   ├── pedidos.tsx      # Pedidos
│   │   ├── deliveries.tsx   # Dashboard repartidor
│   │   ├── promos.tsx       # Promociones
│   │   └── profile.tsx      # Perfil
│   ├── driver/              # Pantallas repartidor
│   │   ├── order/[id].tsx   # Detalle orden
│   │   └── complete/[id].tsx # Completar entrega
│   ├── order/[id].tsx       # Tracking cliente
│   ├── auth.tsx             # Login/Registro
│   ├── admin.tsx            # Panel admin
│   ├── cart.tsx             # Carrito
│   ├── addresses.tsx        # Direcciones
│   ├── review.tsx           # Reseñas
│   └── menu-pdf.tsx         # PDF menú
├── components/              # Componentes reutilizables
│   ├── RealTimeDeliveryMap.tsx # Mapa tiempo real
│   ├── AddressMapPicker.tsx    # Selector direcciones
│   └── ui/                     # Componentes UI
├── hooks/                    # Custom Hooks
│   ├── useAuth.ts           # Hook autenticación
│   └── useNotifications.ts  # Hook notificaciones
├── context/                  # React Context
│   └── CartContext.tsx      # Estado carrito
├── services/                 # Servicios y APIs
│   ├── products.ts          # CRUD productos
│   ├── promotions.ts        # CRUD promos
│   ├── users.ts             # CRUD usuarios
│   ├── locationTracker.ts   # Tracking ubicación
│   └── pushNotifications.ts # Notificaciones push
├── lib/                      # Configuraciones
│   └── supabase.ts          # Cliente Supabase
├── database/                 # Scripts SQL
│   ├── SQL_*.sql            # Scripts de configuración
│   └── README.md            # Documentación SQL
├── docs/                     # Documentación
│   └── *.md                  # Archivos de documentación
└── assets/                   # Recursos estáticos
```

---

## 🗄️ Base de Datos

### Tablas Principales

- `profiles`: Perfiles de usuario con roles
- `categories`: Categorías de productos
- `products`: Productos del menú
- `promotions`: Promociones activas
- `orders`: Órdenes de compra
- `order_items`: Items de cada orden

### Configurar Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ejecutar los scripts SQL en orden (ver `database/README.md`)
3. Actualizar `lib/supabase.ts` con tus credenciales:

```typescript
const SUPABASE_URL = 'tu-url';
const SUPABASE_ANON_KEY = 'tu-key';
```

**Nota:** Los scripts SQL están organizados en la carpeta `database/`. Consulta `database/README.md` para el orden de ejecución recomendado.

---

## 👥 Roles de Usuario

### Usuario Común (`user`)
- Ver menú y promociones
- Hacer pedidos
- Ver historial de pedidos
- Editar perfil

### Administrador (`admin`)
- Todo lo de usuario común +
- Crear/eliminar promociones
- Gestionar usuarios y roles
- Acceso al panel admin

---

## 🎨 Paleta de Colores

```css
--primary: #f97316;      /* Naranja principal */
--background: #fef2e7;   /* Fondo claro */
--accent: #fed7aa;       /* Acento */
--dark: #c2410c;         /* Oscuro */
--text: #1f2937;         /* Texto */
--muted: #6b7280;        /* Texto secundario */
```

---

## 📚 Documentación Adicional

Toda la documentación está disponible en la carpeta `docs/`:

- 📖 **Documentación Completa**: `docs/DOCUMENTACION.md`
- 🎤 **Guía de Presentación**: `docs/GUIA_PRESENTACION.md`
- 🗄️ **Scripts de Base de Datos**: `database/README.md`

---

## 🔧 Scripts Disponibles

```bash
npm start              # Iniciar Expo
npm run android        # Correr en Android
npm run ios            # Correr en iOS
npm run web            # Correr en Web
npm run lint           # Verificar código
```

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es de uso educativo/comercial para **Pura Calle**.

---

## 👨‍💻 Autor

Desarrollado con ❤️ para Pura Calle

---

## 📞 Soporte

¿Problemas o preguntas? Abre un issue en GitHub o contacta al desarrollador.

---

**¡Gracias por usar Pura Calle!** 🍔🔥
