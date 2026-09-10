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
Crea un archivo local `stitch_reptilroom_monitoreo_con_ia/config.local.js` (NO subir al repo) con este contenido exacto:

```javascript
// config.local.js (NO subir al repo)
window.HERPCARE_GOOGLE_CLIENT_ID = "TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
window.HERPCARE_GOOGLE_MAPS_API_KEY = "TU_GOOGLE_MAPS_API_KEY";
```

- Añade `stitch_reptilroom_monitoreo_con_ia/config.local.js` a `.gitignore`.
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

## 8. Cámara en Android
El flujo recomendado de alta ahora empieza desde **Home**, usando **Tomar foto** o **Elegir galería** para registrar el ejemplar. También puedes seguir entrando desde **Colección**.

Puedes:
- Pulsar **Activar cámara** para usar la cámara trasera directamente desde el navegador.
- Pulsar **Galería** para abrir la cámara o seleccionar una imagen usando el selector nativo de Android.
- Capturar una vista previa sin subir automáticamente la imagen a ningún servidor.

La cámara directa requiere HTTPS, por lo que funciona en GitHub Pages. En desarrollo también funciona en `localhost`. Android puede bloquear el acceso si la aplicación se abre desde una URL no segura.

## 9. Estructura principal
```text
.
├── index.html
├── stitch_reptilroom_monitoreo_con_ia/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── terrarium_bio_minimalism/
│       └── DESIGN.md
└── README.md
```

La página `index.html` de la raíz redirige a la aplicación principal para que el proyecto funcione correctamente al publicarlo como sitio estático, incluido GitHub Pages.

## 10. Instalar en Android
La aplicación incluye `manifest.webmanifest` y un service worker. En Android, abre la URL publicada con Chrome y pulsa **Instalar aplicación** cuando aparezca el botón de HerpCare, o usa **Menú > Instalar aplicación**.

## 11. Publicar en GitHub Pages
1. Abre el repositorio en GitHub.
2. Ve a **Settings > Pages**.
3. En **Build and deployment**, selecciona **Deploy from a branch**.
4. Selecciona la rama `main` y la carpeta `/ (root)`.
5. Guarda los cambios.

## 12. Checklist pendiente (opcional)
- Pulir UX y validaciones (formato de peso, límites, mensajes).
- Pruebas en móvil y ajuste responsive.
- Integración con backend para sincronización y verificación de tokens (opcional).
