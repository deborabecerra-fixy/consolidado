(function initHomeKommoForm() {
  'use strict';

  var container = document.getElementById('home-kommo-form');
  if (!container) return;

  var panel = container.closest('.contact-form-panel');
  var loading = container.querySelector('.home-kommo-loading');
  var observer;

  function markReady() {
    var iframe = container.querySelector('#amoforms_iframe_1722124.amoforms_iframe');
    if (!iframe) return false;

    iframe.setAttribute('title', 'Formulario de contacto de Fixy');
    if (panel) {
      panel.classList.remove('is-kommo-loading', 'is-kommo-error');
      panel.classList.add('is-kommo-ready');
    }
    if (observer) observer.disconnect();
    return true;
  }

  if (!markReady()) {
    observer = new MutationObserver(function () {
      markReady();
    });
    observer.observe(container, { childList: true });
  }

  var script = document.getElementById('amoforms_script_1722124');
  if (script) {
    script.addEventListener('error', function () {
      if (observer) observer.disconnect();
      if (panel) {
        panel.classList.remove('is-kommo-loading');
        panel.classList.add('is-kommo-error');
      }
      if (loading) loading.textContent = 'No pudimos cargar el formulario. Por favor, intentá nuevamente.';
    }, { once: true });
  }
}());
