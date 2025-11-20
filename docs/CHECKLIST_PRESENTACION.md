# ✅ Checklist de Presentación - Pura Calle

## 📅 1 Día Antes de la Presentación

### Preparación Técnica
- [ ] Verificar que la app corre sin errores (`npx expo start`)
- [ ] Limpiar caché si hay problemas (`npx expo start -c`)
- [ ] Probar el flujo completo: registro → login → pedido → checkout
- [ ] Verificar que la base de datos tiene datos de prueba:
  - [ ] Al menos 5 productos en el menú
  - [ ] 2-3 promociones activas
  - [ ] 2 usuarios: uno normal y uno admin
- [ ] Tomar screenshots de las pantallas principales (backup si falla demo)
- [ ] Cargar el logo correctamente en `assets/images/logo.png`
- [ ] Verificar que el PDF del menú carga correctamente

### Cuentas de Prueba
Crear y anotar credenciales:
```
Usuario Normal:
- Email: usuario@test.com
- Password: password123

Usuario Admin:
- Email: admin@pura.com
- Password: admin123
```

### Equipamiento
- [ ] Laptop con batería al 100%
- [ ] Cable HDMI/adaptador para proyector
- [ ] Celular con Expo Go instalado
- [ ] Celular con batería al 100%
- [ ] Internet estable (WiFi o datos móviles)
- [ ] Pantalla/proyector funcional
- [ ] Backup: screenshots en caso de fallo técnico

### Documentación
- [ ] Imprimir o tener abierto: `GUIA_PRESENTACION.md`
- [ ] Tener `DOCUMENTACION.md` abierto para consulta rápida
- [ ] Preparar diagrama de arquitectura (opcional: en papel o digital)

---

## ⏰ 1 Hora Antes de Presentar

### Setup Final
- [ ] Llegar 15 minutos antes
- [ ] Conectar laptop al proyector y probar
- [ ] Abrir la app en el celular (escanear QR de Expo)
- [ ] Verificar que la proyección se ve bien
- [ ] Cerrar sesión en la app (empezar demo desde cero)
- [ ] Cerrar todas las pestañas del navegador innecesarias
- [ ] Poner celular en modo "No Molestar"
- [ ] Conectar celular y laptop a la misma red WiFi
- [ ] Hacer una prueba rápida del flujo completo

### Backup Plan
- [ ] Tener screenshots en carpeta `screenshots/` listos
- [ ] Saber qué decir si la app crashea: "Este es un prototipo funcional..."
- [ ] Tener video de demo pregrabado (opcional pero recomendado)

---

## 🎤 Durante la Presentación

### Introducción (2 min) ✅
```
"Buenos días/tardes. Hoy presentaré Pura Calle, una aplicación móvil 
multiplataforma para un negocio de comida callejera que resuelve..."
```

- [ ] Presentar el problema
- [ ] Explicar la solución
- [ ] Mencionar tecnologías: React Native, Expo, Supabase

### Demo Usuario (4 min) ✅
- [ ] Mostrar pantalla Home
- [ ] Registrar nuevo usuario (o usar usuario@test.com)
- [ ] Navegar a Menú
- [ ] Agregar 2-3 productos al carrito
- [ ] Ir al carrito y revisar
- [ ] Simular checkout
- [ ] Ver historial en "Pedidos"
- [ ] Ir a "Mi Perfil" y editar datos
- [ ] Cerrar sesión

### Demo Admin (3 min) ✅
- [ ] Login con cuenta admin
- [ ] Mostrar botón "Panel Admin" que aparece
- [ ] Ir a "Promos" y crear una nueva promoción
- [ ] Eliminar una promoción
- [ ] Ir a "Panel Admin"
- [ ] Buscar un usuario
- [ ] Cambiar rol de usuario a admin

### Explicación Técnica (5 min) ✅
- [ ] Mostrar estructura de carpetas en VSCode
- [ ] Explicar Tab Navigator (`app/(tabs)/_layout.tsx`)
- [ ] Mostrar `useAuth` hook
- [ ] Explicar CartContext
- [ ] Mostrar tabla de Supabase (opcional)
- [ ] Mencionar RLS para seguridad

### Características Destacadas (2 min) ✅
- [ ] Feedback háptico (mencionar, no necesariamente mostrar)
- [ ] Pull-to-refresh en listas
- [ ] PDF del menú integrado
- [ ] Safe Area para dispositivos modernos
- [ ] Roles de usuario (user/admin)

### Próximos Pasos (1 min) ✅
- [ ] Pasarela de pagos real (Wompi, PayU)
- [ ] Notificaciones push
- [ ] Mapa de ubicación
- [ ] Sistema de ratings

### Cierre y Preguntas (3 min) ✅
```
"En resumen, Pura Calle digitaliza el proceso de venta de comida 
callejera, mejorando la UX del cliente y facilitando la gestión. 
¿Preguntas?"
```

---

## 🐛 Plan de Contingencia

### Si el WiFi falla:
1. Usar datos móviles del celular
2. Crear hotspot desde el celular
3. Usar screenshots de backup

### Si la app crashea:
1. No entrar en pánico
2. Decir: "Este es un prototipo, déjenme reiniciar..."
3. Reiniciar Expo (`r` en terminal)
4. Si no funciona, usar screenshots

### Si Supabase está caído:
1. Mostrar código en VSCode
2. Explicar cómo funcionaría normalmente
3. Usar diagrama de arquitectura

### Si el proyector no funciona:
1. Compartir pantalla por Meet/Zoom
2. Circular el celular (si la audiencia es pequeña)
3. Usar laptop para mostrar código

---

## 📝 Notas Importantes

### Qué NO decir:
- ❌ "No sé por qué no funciona..."
- ❌ "Esto debería funcionar..."
- ❌ "Funcionó ayer..."
- ❌ "Es culpa de Supabase/Expo..."

### Qué SÍ decir si hay problemas:
- ✅ "Este es un prototipo funcional, exploremos el código mientras..."
- ✅ "Déjenme mostrarles el diagrama de arquitectura..."
- ✅ "Tengo screenshots del flujo completo aquí..."
- ✅ "La implementación está completa, veamos el código..."

### Postura y Lenguaje Corporal:
- 👁️ Mantener contacto visual
- 🗣️ Hablar claro y pausado
- 👐 Usar manos para enfatizar puntos importantes
- 😊 Sonreír y mostrar confianza
- 🚶 Moverse ligeramente (no quedarse estático)

### Manejo de Preguntas:
1. **Escuchar completamente** la pregunta
2. **Parafrasear**: "Si entiendo bien, preguntas sobre..."
3. **Responder concisamente**
4. **Confirmar**: "¿Responde eso tu pregunta?"
5. **Si no sabes**: "Excelente pregunta, no lo implementé pero podría hacerse con..."

---

## 🎯 Objetivos de la Presentación

### Demostrar:
- ✅ Competencia técnica (React Native, TypeScript, Supabase)
- ✅ Arquitectura limpia y escalable
- ✅ UI/UX bien diseñada
- ✅ Funcionalidad completa (CRUD, Auth, Roles)
- ✅ Pensamiento crítico (seguridad, performance)

### Impresionar con:
- 🔥 Feedback háptico
- 🔥 PDF integrado
- 🔥 Roles y permisos (admin vs user)
- 🔥 Código limpio y comentado
- 🔥 Base de datos real (no mockups)

---

## 📊 Después de la Presentación

### Autoevaluación:
- [ ] ¿Qué salió bien?
- [ ] ¿Qué salió mal?
- [ ] ¿Qué preguntas no pude responder?
- [ ] ¿Qué mejoraría para la próxima?

### Seguimiento:
- [ ] Enviar link del repo a profesores/evaluadores (si aplica)
- [ ] Enviar documentación por email
- [ ] Agradecer el tiempo de la audiencia

---

## 🎓 Tips Finales

1. **Practica en voz alta** al menos 2 veces antes
2. **Cronometra** tu presentación (no te pases del tiempo)
3. **Ten agua cerca** (para no quedarte con la boca seca)
4. **Respira profundo** antes de empezar
5. **Disfruta el momento**: has trabajado duro, muéstralo con orgullo

---

## ✨ Frases de Confianza

Repite estas antes de presentar:
- "Estoy preparado/a"
- "Conozco mi proyecto"
- "Puedo explicar cualquier parte del código"
- "Esto va a salir bien"
- "Estoy listo/a para las preguntas"

---

**¡Mucha suerte! Vas a hacerlo increíble. 🚀**

