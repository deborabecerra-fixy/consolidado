/* Fixy — Home: "Revisar cobertura" lleva a la persona hasta el formulario de contacto.

   Provisorio y a propósito mínimo. El objetivo original de esta sección es precargar
   el formulario con lo que la persona cargó acá, pero el formulario de contacto es un
   iframe de forms.kommo.com (otro origen): el navegador no permite escribir en sus
   campos desde la página, y la API de webforms de Kommo no expone ningún método de
   prefill (sólo amo_forms_loaded, resizeForm y onFormSubmit). Hasta resolver eso por
   otra vía, el botón al menos lleva al formulario en vez de no hacer nada.

   No modifica ningún texto, ni el mensaje de WhatsApp, ni agrega elementos a la página.
   Evento: coverage_check, para saber cuánta gente usa realmente este botón. */
(function initCoverageCheck() {
  'use strict';

  var card = document.querySelector('#cobertura .coverage-form-card');
  var btn = card ? card.querySelector('.btn.btn-primary') : null;
  var contacto = document.getElementById('contacto');
  if (!btn || !contacto) return;

  btn.addEventListener('click', function (e) {
    e.preventDefault();

    if (typeof window.track === 'function') window.track('coverage_check', '', 'cobertura');

    /* Compensa el header fijo para que el formulario no quede debajo de la barra. */
    var header = document.querySelector('header.nav');
    var offset = header ? header.getBoundingClientRect().height : 0;
    var top = contacto.getBoundingClientRect().top + window.pageYOffset - offset - 12;

    try {
      window.scrollTo({ top: top, behavior: 'smooth' });
    } catch (err) {
      window.scrollTo(0, top);
    }
  });
}());
