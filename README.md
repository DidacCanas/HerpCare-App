# HerpCare

Dashboard web para el monitoreo de reptiles y anfibios. Incluye:

- Diagnóstico visual simulado con IA.
- Colección de ejemplares y filtros.
- Evolución de peso con gráfico interactivo.
- Veterinarios especializados cercanos.
- Diseño responsive para móvil y escritorio.

## Ejecutar localmente

No necesita instalación ni dependencias:

```powershell
python -m http.server 3000
```

Después abre [http://localhost:3000](http://localhost:3000).

También puedes abrir `index.html` directamente en el navegador.

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
