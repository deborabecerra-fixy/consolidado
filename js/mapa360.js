/* ============================================================
   Mapa 360° de la operación — espina conectada
   El expand/collapse de cada etapa es <details> nativo: funciona
   sin este script (progressive enhancement). Este script solo
   agrega, en mobile, la convención ya usada en #hyp-detail
   (constructor.js): mantener un solo acordeón abierto a la vez
   para que el recorrido con el pulgar no se vuelva interminable.
   En desktop se permite tener más de una etapa abierta a la vez
   (por ejemplo, para comparar dos etapas contiguas).

   Desde el 18/8/2026 también mide la apertura de los acordeones del home
   —las 10 etapas del mapa y las 5 preguntas del FAQ—, que hasta entonces
   no registraban nada. Ver la nota sobre el conteo al final del archivo.
   ============================================================ */
const mapDetails = [...document.querySelectorAll('.map-rail details.map-acc')];
const desktopMap = window.matchMedia('(min-width:901px)');

function syncMapDetails() {
  mapDetails.forEach(dt => {
    dt.open = desktopMap.matches;
  });
}

syncMapDetails();
desktopMap.addEventListener('change', syncMapDetails);

mapDetails.forEach(dt => {
  dt.addEventListener('toggle', () => {
    if (dt.open && window.matchMedia('(max-width:700px)').matches) {
      mapDetails.forEach(o => { if (o !== dt) o.open = false; });
    }
  });
});


/* ============================================================
   Medición de acordeones del home (agregado 18/8/2026)

   Se escucha el CLICK en el <summary>, no el evento `toggle` del <details>.
   Motivo: syncMapDetails() abre y cierra las 10 etapas por programa según el
   viewport, así que `toggle` dispararía 10 eventos falsos en cada carga de
   escritorio y otros tantos al cambiar el ancho. El click, en cambio, sólo
   ocurre por acción de una persona.

   OJO al leer los datos: en escritorio las etapas del mapa YA ESTÁN ABIERTAS
   (syncMapDetails), así que ahí un click es un CIERRE y no se cuenta. Es
   esperable que mapa_open venga casi todo de mobile. Para saber si en
   escritorio la sección se ve, el dato es scroll_depth, no éste.
   ============================================================ */
(function medirAcordeones() {
  const grupos = [
    ['mapa_open', '.map-rail details.map-acc', '.map-title'],
    ['faq_open', '#faq details', 'summary']
  ];

  grupos.forEach(([evento, selector, etiqueta]) => {
    document.querySelectorAll(selector).forEach(dt => {
      const sum = dt.querySelector('summary');
      if (!sum) return;
      sum.addEventListener('click', () => {
        /* El click llega ANTES de que <details> cambie de estado: si ahora
           está abierto, este click lo va a cerrar y no interesa. */
        if (dt.open) return;
        if (typeof track !== 'function') return;
        const el = dt.querySelector(etiqueta);
        const nombre = el ? el.textContent.trim().slice(0, 60) : '';
        track(evento, nombre, 'acordeon');
      });
    });
  });
}());
