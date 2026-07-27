# Fixy — Sitio (prototipo)

Sitio estático: home (`index.html`) + 7 landings de servicio, CSS de marca compartido y assets.

## Estructura
```
index.html            → home
css/                  → brand.css (marca) + home.css
js/                   → constructor.js
pages/                → servicio-*.html (7 landings)
assets/img/           → logos y favicons
assets/fonts/         → (colocar acá los .woff2 de Filson Pro)
```

## Publicar en GitHub Pages

**Importante:** `index.html` debe quedar en la RAÍZ del repositorio (no dentro de una subcarpeta).

### Opción rápida (recomendada)
1. Doble clic en `SUBIR-A-GITHUB.bat` (requiere Git instalado).
2. Cuando GitHub pida login, iniciá sesión.
3. En GitHub: **Settings → Pages → Source: Deploy from a branch → Branch: `main` → `/ (root)` → Save.**
4. Esperá 1-2 min. URL: https://maximilianosaavedra-fixy.github.io/Fixy-pagina/

### Opción manual (web)
Subí el **contenido** de esta carpeta (no la carpeta en sí) a la raíz del repo:
`index.html` + las carpetas `css`, `js`, `pages`, `assets`. Luego activá Pages (paso 3).

## Pendientes de producción
- Colocar los `.woff2` de **Filson Pro** en `assets/fonts/` (mientras tanto cae a Montserrat).
- Logo vectorial de FixyPay (el actual es raster).
- Conectar "Agendar 15 min" a Calendly y los formularios/medición a Kommo (los `data-ev` ya están listos).
- Reemplazar testimonios de ejemplo por reales.
