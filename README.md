# HerpCare — feature/ui-tabs-maps

## 1. Resumen
- La rama `feat/ui-tabs-maps` implementa: navegación por pestañas (IA/Colección/Peso/Vets), CRUD de ejemplares con `localStorage`, evoluciones de peso por ejemplar con gráficos en Chart.js, panel Vets preparado para Google Maps/Places (fallback simulado), perfil editable y modales de cámara/login/ubicación.

## 2. Cómo ejecutar localmente
- Clona y cambia a la rama:
  - `git fetch`
  - `git checkout feat/ui-tabs-maps`
- Sirve el directorio `stitch_reptilroom_monitoreo_con_ia` con un servidor estático y abre `http://localhost:8080`:
  - `npx http-server -p 8080`

## 3. Archivos modificados / añadidos
- `stitch_reptilroom_monitoreo_con_ia/index.html`: estructura de UI con pestañas, paneles y modales.
- `stitch_reptilroom_monitoreo_con_ia/app.js`: lógica de navegación, colección, pesajes, perfil, GSI y Maps con fallback.
- `stitch_reptilroom_monitoreo_con_ia/styles.css`: estilos de layout, estados vacíos, tarjetas, modales y panel Vets.

## 4. Configuración de claves de Google (instrucciones seguras)
- Crea `config.local.js` en la raíz con estas líneas exactas de ejemplo:

```javascript
// config.local.js (NO subir al repo)
window.HERPCARE_GOOGLE_CLIENT_ID = "TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
window.HERPCARE_GOOGLE_MAPS_API_KEY = "TU_GOOGLE_MAPS_API_KEY";
```

- Añade `config.local.js` a `.gitignore`.
- Incluye `config.local.js` en `index.html` antes de `app.js`:

```html
<script src="../config.local.js"></script>
```

- Para Maps: habilita Maps JavaScript API y Places API en Google Cloud, restringe la key por HTTP referrer y por API.
- Para GSI: crea OAuth Client ID (Web) y añade origen autorizado (ej. `http://localhost:8080`).

## 5. Qué hace el código con las claves
- Si no hay key, se muestra mapa simulado; si hay key la app inyecta el script Maps con callback `initMap` y usa Places Nearby Search para buscar `veterinarian` alrededor de la ubicación del usuario.
- GSI se inicializa si hay `window.HERPCARE_GOOGLE_CLIENT_ID` y el cliente decodifica el JWT para rellenar perfil local (MVP).

## 6. Cómo probar los flujos (sin claves)
- Registrar ejemplar desde modal de cámara (o galería), comprobar que aparece en Colección.
- Ver Evolución de peso: añadir peso y ver gráfico Chart.js.
- Vets: ver mapa simulado (pins estáticos).

## 7. Notas de seguridad / despliegue
- No subir `config.local.js` ni claves al repo.
- Restringir la Maps API key por HTTP referrer y API.
- Para proteger Places API o validar GSI, se recomienda backend que verifique credenciales y haga llamadas sensibles.

## 8. Checklist pendiente (opcional)
- Pulir UX, validaciones, pruebas móviles, sincronización servidor (opcional).
