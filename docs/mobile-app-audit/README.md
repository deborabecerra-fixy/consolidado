# Fixy — Rediseño mobile app V11

Fecha de QA: 27 de julio de 2026

## Correcciones de esta entrega

- Navbar canónico aplicado a los 18 HTML.
- Los 18 headers tienen exactamente la misma estructura y navegación.
- El único logo del header es la imagen oficial `/img/Logo%20Fixy.png`.
- No quedan SVG, texto reconstruido ni otra variante de marca dentro del header.
- Estado activo de navegación según ruta o sección.
- Menú móvil de pantalla completa con el mismo orden y destinos en todo el sitio.
- Footer móvil reorganizado en una grilla compacta, sin eliminar enlaces, redes ni partners.
- Constructor con controles táctiles de 58 px, estados seleccionado, pressed y focus visibles.
- Informe del constructor convertido en bottom sheet modal en mobile.
- La bottom sheet incluye backdrop, bloqueo de scroll, foco inicial, focus trap, cierre por botón, backdrop y Escape, restauración de foco, scroll interno y safe area.
- El menú móvil queda anclado al viewport aunque se abra desde mitad de página o desde el footer.
- Al cerrar el menú se restaura exactamente la posición de scroll y el foco vuelve al botón de apertura.
- Las secciones móviles dejaron de superponerse como hojas redondeadas y ahora forman un canvas continuo.
- Las frases de dolor son controles accesibles con affordance, foco y estado seleccionado.
- El mapa 360° se compactó en una grilla de dos columnas con una única etapa expandida.
- Cotización usa tres tarjetas alineadas; las comparaciones operativas usan flujos verticales inequívocos.
- El cierre comercial de servicios tiene contraste accesible y jerarquía clara entre agenda, formulario y WhatsApp.

## Resultados medidos

- HTML del proyecto: 18
- Headers encontrados: 18
- Estructuras de header únicas: 1
- Headers con logo oficial: 18
- SVG dentro de headers: 0
- HTML usando la versión V11 del sistema: 18
- Footer mobile antes de la compactación: 1244 px de alto
- Footer mobile final a 390 px: 681,5 px de alto
- Reducción de altura del footer: 45,2 %

Los SVG que permanecen en el proyecto corresponden a iconos de redes o gráficos funcionales; no se usan para imitar el logo de Fixy.

## Preservación del contenido

La comparación automatizada contra el ZIP original dio:

- HTML comparados: 18
- Cuerpos de página sin cambios de texto visible: 18
- Diferencias de texto visible: 0

El header global se excluye deliberadamente de esta comparación porque fue normalizado. Se preservaron el contenido de cada página, IDs, metadatos, datos estructurados, canonicals, rutas, `data-ev` y scripts funcionales.

## QA funcional y responsive

- Rutas y assets internos: 30/30.
- Matriz responsive: 45/45 verificaciones sin overflow horizontal ni imágenes rotas.
- Rutas representativas: Home, FixyFull, FixyPay, Recursos y Tecnología.
- Viewports: 320×568, 360×800, 390×844, 412×915, 430×932, 768×1024, 820×1180, 1024×768 y 1440×900.
- Las 18 rutas principales se verificaron además a 390×844.
- En las 18: logo oficial presente, 0 SVG en el header, sin overflow y sin imágenes rotas.
- Apertura desde el final de Home, FixyFull y Tecnología: panel visible en `top: 0` y cubriendo todo el viewport.
- Cierre con Escape: posición de scroll restaurada y foco devuelto al botón.
- Nueva capa profesional comprobada en las 18 rutas a 412×915: 18/18 sin overflow ni imágenes rotas.
- Matriz adicional Home, FixyFull y Flex en 320×568, 390×844, 412×915 y 768×1024: 12/12.
- JavaScript validado sintácticamente: `app-shell.js` y `constructor.js`.
- CSS validado con balance correcto de llaves.

## Evidencia principal

- `screenshots/navbar-canonical-v4-390x844.png`
- `screenshots/navbar-menu-v4-390x844.png`
- `screenshots/constructor-selector-v4-390x844.png`
- `screenshots/constructor-result-sheet-v6-390x844.png`
- `screenshots/footer-compact-v6-390x844.png`
- `screenshots/menu-from-footer-v8-412x915.png`
- `screenshots/v9-pain-selector-412x915.png`
- `screenshots/v11-operation-map-open-412x915.png`
- `screenshots/v9-quote-steps-412x915.png`
- `screenshots/v9-fixyfull-comparison-412x915.png`
- `screenshots/v9-service-contact-412x915.png`
- `screenshots/v9-flex-heading-412x915.png`

## Archivos centrales

- `css/app-mobile.css`
- `css/app-professional-v9.css`
- `js/app-shell.js`
- `js/constructor.js`
- `scripts/normalize-header.mjs`
- `scripts/wire-app-shell.mjs`
- `scripts/compare-visible-text.mjs`

## Limitaciones

- El proyecto no incluye los archivos de Filson Pro; se conserva el fallback de sistema previsto.
- Los formularios mantienen sus integraciones existentes y no se enviaron datos reales durante QA.
- El proyecto no incluye repositorio Git; la validación de contenido se hizo contra el ZIP original.
