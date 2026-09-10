# HerpCare — feature/ui-tabs-maps

## 1. Resumen
- Esta rama `feat/ui-tabs-maps` implementa: navegación por pestañas (IA / Colección / Peso / Vets), CRUD de ejemplares con localStorage, evoluciones de peso por ejemplar con gráficos en Chart.js, panel Vets preparado para Google Maps / Places (fallback simulado), perfil editable y modales de cámara/login/ubicación.

## 2. Cómo ejecutar localmente
1. Clona el repo y cambia a la rama:
   - `git fetch`
   - `git checkout feat/ui-tabs-maps`
2. Sirve el directorio con un servidor estático (no uses `file://`):
   - `cd stitch_reptilroom_monitoreo_con_ia`
   - `npx http-server -p 8080`
   - Abre: `http://localhost:8080`

## 3. Archivos modificados / añadidos
- `stitch_reptilroom_monitoreo_con_ia/index.html` — Reestructuración de la UI (pestañas), modales y variables globales para claves.
- `stitch_reptilroom_monitoreo_con_ia/app.js` — Lógica: navegación, CRUD de ejemplares (localStorage), gestión de pesajes, gráficos con Chart.js, perfil y mapa condicional.
- `stitch_reptilroom_monitoreo_con_ia/styles.css` — Estilos base y añadidos (empty-state, modales, listas dinámicas, responsive).

## 4. Configuración de claves de Google (instrucciones seguras)
Crea un archivo local `config.local.js` en la raíz (NO subir al repo) con este contenido exacto:

```javascript
// config.local.js (NO subir al repo)
window.HERPCARE_GOOGLE_CLIENT_ID = "TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
window.HERPCARE_GOOGLE_MAPS_API_KEY = "TU_GOOGLE_MAPS_API_KEY";
```

- Añade `config.local.js` a `.gitignore`.
- Incluye `config.local.js` en `index.html` antes de `app.js`:
  `<script src="./config.local.js"></script>`
- Para Maps: habilita en Google Cloud **Maps JavaScript API** y **Places API**; restringe la key por HTTP referrer (ej. `http://localhost:8080`) y por API.
- Para GSI: crea un **OAuth Client ID (Web)** y añade el origen autorizado (ej. `http://localhost:8080`).

## 5. Qué hace el código con las claves
- Si no hay key, la app muestra un mapa simulado (pins estáticos) en `#map`.
- Si hay key, la app inyecta el script de Maps con callback `initMap` y usa Places Nearby Search para buscar `veterinarian` alrededor de la ubicación del usuario (si el usuario consiente).
- GSI: si `window.HERPCARE_GOOGLE_CLIENT_ID` está definido, `app.js` inicializa GSI y decodifica el JWT cliente para rellenar el perfil local (MVP). Para producción valida credenciales en servidor.

## 6. Cómo probar los flujos (sin claves)
- Registrar ejemplar:
  - Abrir modal de cámara → elegir foto o activar cámara → escribir nombre/especie → Guardar.
  - El ejemplar aparecerá en Colección.
- Evolución de peso:
  - En la tarjeta del ejemplar, pulsar Ver → Peso → Añadir (introduce valor) → el gráfico Chart.js se actualizará.
- Vets:
  - Sin clave: verás mapa simulado con pins estáticos.
  - Con clave: el mapa real cargará y listará clínicas con Places (si se concede ubicación).

## 7. Notas de seguridad / despliegue
- No subas `config.local.js` ni claves al repositorio.
- Restringe la Maps API key por HTTP referrer y por API.
- Para proteger llamadas a Places o validar GSI en producción, considera un backend que verifique credenciales y haga las llamadas sensibles.

## 8. Checklist pendiente (opcional)
- Pulir UX y validaciones (formato de peso, límites, mensajes).
- Pruebas en móvil y ajuste responsive.
- Integración con backend para sincronización y verificación de tokens (opcional).
