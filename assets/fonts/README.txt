TIPOGRAFÍAS DEL SITIO

Hoy el sitio usa dos tipografías gratuitas (Open Font License), cargadas desde
Google Fonts con un <link> en el <head> de cada página:

  Poppins   → títulos (h1, h2, h3, h4, .eyebrow, .metric-number)
  DM Sans   → cuerpo de texto, botones, navegación

Están definidas como variables en css/brand.css:  --font-head  y  --font-body


CÓMO PASARLAS A AUTOALOJADAS (recomendado)
------------------------------------------
Autoalojarlas es más rápido (un dominio menos que resolver) y evita que el
navegador de cada visitante le pida los archivos a Google, lo que simplifica lo
que hay que declarar en la política de privacidad.

  1. Entrar a fonts.google.com, buscar "Poppins" y "DM Sans", y bajar cada
     familia con el botón "Get font" -> "Download all".
  2. Convertir los .ttf a .woff2 (con fonttools: pyftsubset / woff2_compress, o
     cualquier conversor). Dejar sólo los pesos 400, 500, 600, 700 y 800.
  3. Poner los .woff2 en esta carpeta con estos nombres:
       DMSans-Regular.woff2    Poppins-Regular.woff2
       DMSans-Medium.woff2     Poppins-Medium.woff2
       DMSans-SemiBold.woff2   Poppins-SemiBold.woff2
       DMSans-Bold.woff2       Poppins-Bold.woff2
       DMSans-ExtraBold.woff2  Poppins-ExtraBold.woff2
  4. Agregar los @font-face correspondientes en css/brand.css (donde está el
     comentario de tipografía) y quitar los <link> a fonts.googleapis.com de
     los <head>.


SOBRE FILSON PRO (la del Manual de Marca)
-----------------------------------------
Filson Pro es la tipografía oficial de la marca, de Mostardesign Type Foundry.
NO está en el repo: usarla en un sitio web requiere una licencia webfont, que se
compra aparte de la licencia desktop (la de Illustrator / InDesign). Antes este
archivo pedía cuatro .woff2 de Filson Pro que nunca existieron, y eso provocaba
4 pedidos 404 en cada visita.

Si en algún momento se consigue la licencia web:
  - Vía Adobe Fonts (incluida en Creative Cloud; la familia figura como "Filson"):
    se agrega el <link> del proyecto web de Adobe.
  - Vía MyFonts / Fontspring: se compra la licencia webfont y mandan los .woff2.
Después alcanza con agregar sus @font-face en css/brand.css y poner "Filson Pro"
al principio de --font-head y --font-body.

No descargar Filson Pro de sitios que la ofrecen gratis: son ilegales y exponen
a Fixy a un reclamo de la foundry.
