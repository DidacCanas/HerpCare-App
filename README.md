# HerpCare

Dashboard web para el monitoreo de reptiles y anfibios. Incluye:

- Diagnóstico visual simulado con IA.
- Colección de ejemplares y filtros.
- Evolución de peso con gráfico interactivo.
- Veterinarios especializados cercanos.
- Inicio de sesión con Google mediante Google Identity Services.
- Geolocalización para ordenar clínicas y generar rutas.
- Aplicación instalable en Android como PWA.
- Registro fotográfico desde la cámara del móvil o la galería.
- Diseño responsive para móvil y escritorio.

## Ejecutar localmente

No necesita instalación ni dependencias:

```powershell
python -m http.server 3000
```

Después abre [http://localhost:3000](http://localhost:3000).

También puedes abrir `index.html` directamente en el navegador.

La geolocalización requiere servir la app por `localhost` o HTTPS. El navegador solicitará permiso la primera vez que abras el módulo de veterinarios.

## Cámara en Android

El flujo recomendado de alta ahora empieza desde **Home**, usando **Tomar foto** o **Elegir galería** para registrar el ejemplar. También puedes seguir entrando desde **Colección**.

Puedes:

- Pulsar **Activar cámara** para usar la cámara trasera directamente desde el navegador.
- Pulsar **Galería** para abrir la cámara o seleccionar una imagen usando el selector nativo de Android.
- Capturar una vista previa sin subir automáticamente la imagen a ningún servidor.

La cámara directa requiere HTTPS, por lo que funciona en GitHub Pages. En desarrollo también funciona en `localhost`. Android puede bloquear el acceso si la aplicación se abre desde una URL no segura.

## Estructura principal

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

## Configurar inicio de sesión con Google

1. Crea un cliente OAuth 2.0 de tipo **Web application** en Google Cloud Console.
2. Añade los dominios autorizados, incluyendo el dominio de GitHub Pages.
3. Crea `stitch_reptilroom_monitoreo_con_ia/config.local.js` con:

   ```js
   window.HERPCARE_GOOGLE_CLIENT_ID = "TU_CLIENT_ID";
   window.HERPCARE_GOOGLE_MAPS_API_KEY = "TU_MAPS_API_KEY";
   ```

4. Incluye `config.local.js` justo antes de `app.js` en `stitch_reptilroom_monitoreo_con_ia/index.html` si quieres mantener las claves fuera del HTML versionado:

   ```html
   <script src="config.local.js"></script>
   <script src="app.js"></script>
   ```

Sin Client ID la interfaz sigue funcionando, pero el botón muestra el mensaje de configuración en lugar de iniciar sesión.

## Instalar en Android

La aplicación incluye `manifest.webmanifest` y un service worker. En Android, abre la URL publicada con Chrome y pulsa **Instalar aplicación** cuando aparezca el botón de HerpCare, o usa **Menú > Instalar aplicación**.

## Publicar en GitHub

Desde esta carpeta:

```powershell
git init
git add .
git commit -m "Create HerpCare monitoring app"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

Para activar GitHub Pages:

1. Abre el repositorio en GitHub.
2. Ve a **Settings > Pages**.
3. En **Build and deployment**, selecciona **Deploy from a branch**.
4. Selecciona la rama `main` y la carpeta `/ (root)`.
5. Guarda los cambios.

## Nota

Las imágenes y fuentes actuales se cargan desde URLs externas. Para una versión de producción conviene descargar los recursos y servirlos desde el propio repositorio.
