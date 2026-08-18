/* Fixy — profundidad de scroll.

   GA4 con "medición mejorada" dispara un único evento de scroll, al 90%. Eso
   dice si alguien llegó al final, pero no DÓNDE abandona el resto — que es
   justamente el dato que hace falta para decidir si una página es demasiado
   larga o si una sección no se ve nunca.

   Envía scroll_depth con el hito (25, 50, 75, 100) en `value`, una sola vez
   por hito y por carga de página.

   Usa el global SERVICE que define cada página, igual que js/home-kommo.js,
   para no cambiar la nomenclatura con la que GA4 ya viene registrando. */
(function initScrollDepth() {
  'use strict';

  var HITOS = [25, 50, 75, 100];
  var ALTO_MINIMO = 400;   /* páginas cortas: el dato no aporta nada */

  var vistos = {};
  var pendiente = false;

  /* Las landings y tecnología definen un global SERVICE; los artículos de
     recursos no (usan otro esquema, con `page`). Sin este fallback por URL,
     el scroll de un artículo se reportaba como si fuera el del home. */
  function resolverServicio() {
    if (typeof window.SERVICE === 'string' && window.SERVICE) return window.SERVICE;
    var ruta = String(location.pathname || '/')
      .replace(/\/index\.html$/, '/')
      .replace(/^\/+|\/+$/g, '');
    return ruta ? ruta.split('/').join('_') : 'home';
  }

  function enviar(hito) {
    var service = resolverServicio();
    var params = {
      service: service,
      cta_location: 'scroll',
      value: String(hito),
      fixy_page: service
    };
    if (window.dataLayer) window.dataLayer.push(Object.assign({ event: 'scroll_depth' }, params));
    if (window.gtag) window.gtag('event', 'scroll_depth', params);
    if (window.fbq) window.fbq('trackCustom', 'scroll_depth', params);
  }

  function medir() {
    pendiente = false;
    var doc = document.documentElement;
    var recorrible = doc.scrollHeight - window.innerHeight;
    if (recorrible < ALTO_MINIMO) return;

    var pct = ((window.pageYOffset || doc.scrollTop) / recorrible) * 100;
    for (var i = 0; i < HITOS.length; i++) {
      var h = HITOS[i];
      if (pct >= h - 0.5 && !vistos[h]) {
        vistos[h] = true;
        enviar(h);
      }
    }
  }

  window.addEventListener('scroll', function () {
    if (pendiente) return;
    pendiente = true;
    if (window.requestAnimationFrame) window.requestAnimationFrame(medir);
    else setTimeout(medir, 120);
  }, { passive: true });

  /* Por si la página carga ya scrolleada (vuelta atrás, ancla en la URL). */
  medir();
}());
