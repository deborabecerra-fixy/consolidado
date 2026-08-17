/* Fixy — formulario Kommo embebido: estados, timeout, fallback y medición.
   Presente en el home, las 7 landings de servicio, tecnología y operar-en-argentina.

   Estados: is-kommo-loading → is-kommo-ready | is-kommo-error
   El estado de error ofrece los canales que ya existen en la propia página
   (agendar + WhatsApp con el mensaje prellenado de ese servicio), clonados del DOM.

   Eventos: form_loaded, form_load_failed y form_submitted (este último lo dispara
   el hook onFormSubmit de Kommo en el HTML, vía window.fixyKommoTrack).
   Reusa el global SERVICE que ya define cada página, para no cambiar la
   nomenclatura con la que GA4/Meta vienen registrando los eventos. */
(function initHomeKommoForm() {
  'use strict';

  /* Margen para que aparezca el iframe de Kommo antes de mostrar el fallback.
     Al vencer NO se deja de observar: si el iframe llega tarde, el formulario gana. */
  var TIMEOUT_MS = 9000;

  /* ---------- Medición ---------- */
  function track(ev, val) {
    if (!ev) return;
    var service = (typeof window.SERVICE === 'string' && window.SERVICE) || 'home';
    var params = {
      service: service,
      cta_location: 'contacto',
      value: val || '',
      fixy_page: service
    };
    if (window.dataLayer) window.dataLayer.push(Object.assign({ event: ev }, params));
    if (window.gtag) window.gtag('event', ev, params);
    if (window.fbq) window.fbq('trackCustom', ev, params);
  }

  /* Lo usa el hook onFormSubmit de Kommo, definido en el HTML de cada página. */
  window.fixyKommoTrack = track;

  var container = document.getElementById('home-kommo-form');
  if (!container) return;

  var panel = container.closest('.contact-form-panel');
  var loading = container.querySelector('.home-kommo-loading');
  var observer = null;
  var timer = null;
  var ready = false;
  var degraded = false;

  function stopWatching() {
    if (observer) { observer.disconnect(); observer = null; }
    if (timer) { clearTimeout(timer); timer = null; }
  }

  /* ---------- Estado: formulario listo ---------- */
  function markReady() {
    if (ready) return true;
    var iframe = container.querySelector('#amoforms_iframe_1722124.amoforms_iframe');
    if (!iframe) return false;

    ready = true;
    stopWatching();

    iframe.setAttribute('title', 'Formulario de contacto de Fixy');

    /* Si el fallback ya se había mostrado por demora, el formulario lo reemplaza. */
    var stale = container.querySelector('.home-kommo-fallback');
    if (stale && stale.parentNode) stale.parentNode.removeChild(stale);

    if (panel) {
      panel.classList.remove('is-kommo-loading', 'is-kommo-error');
      panel.classList.add('is-kommo-ready');
    }
    track('form_loaded', degraded ? 'late' : 'ok');
    return true;
  }

  /* ---------- Fallback: clona los CTA que ya existen en la sección de contacto ---------- */
  function buildFallbackActions() {
    var scope = (panel && panel.closest('section')) || document;
    var sources = [
      scope.querySelector('.contact-agenda a.btn'),
      scope.querySelector('.cta-row a.btn-wa')
    ];

    var row = document.createElement('div');
    row.className = 'home-kommo-fallback-actions';

    sources.forEach(function (src) {
      if (!src) return;
      var link = src.cloneNode(true);
      link.removeAttribute('id');
      link.setAttribute('data-cta', 'form_fallback');
      row.appendChild(link);
    });

    return row.children.length ? row : null;
  }

  /* ---------- Estado: no se pudo cargar ---------- */
  function markDegraded(reason, keepWatching) {
    if (ready || degraded) return;
    degraded = true;

    if (timer) { clearTimeout(timer); timer = null; }
    if (!keepWatching) stopWatching();

    if (panel) {
      panel.classList.remove('is-kommo-loading', 'is-kommo-ready');
      panel.classList.add('is-kommo-error');
    }

    if (!container.querySelector('.home-kommo-fallback')) {
      var box = document.createElement('div');
      box.className = 'home-kommo-fallback';
      box.setAttribute('role', 'alert');

      var msg = document.createElement('p');
      msg.className = 'home-kommo-fallback-msg';
      msg.textContent = 'No pudimos cargar el formulario. Por favor, intentá nuevamente.';
      box.appendChild(msg);

      var actions = buildFallbackActions();
      if (actions) box.appendChild(actions);

      container.appendChild(box);
    }

    /* El mensaje de carga queda oculto por CSS: no debe seguir anunciándose. */
    if (loading) loading.removeAttribute('role');

    track('form_load_failed', reason || 'unknown');
  }

  /* ---------- Arranque ---------- */
  if (markReady()) return;

  observer = new MutationObserver(function () { markReady(); });
  observer.observe(container, { childList: true, subtree: true });

  timer = setTimeout(function () {
    if (!markReady()) markDegraded('timeout', true);
  }, TIMEOUT_MS);

  var script = document.getElementById('amoforms_script_1722124');
  if (!script) {
    markDegraded('script_missing', false);
  } else {
    script.addEventListener('error', function () {
      markDegraded('script_error', false);
    }, { once: true });
  }
}());
