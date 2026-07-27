/* ============================================================
   Mapa 360° de la operación — espina conectada
   El expand/collapse de cada etapa es <details> nativo: funciona
   sin este script (progressive enhancement). Este script solo
   agrega, en mobile, la convención ya usada en #hyp-detail
   (constructor.js): mantener un solo acordeón abierto a la vez
   para que el recorrido con el pulgar no se vuelva interminable.
   En desktop se permite tener más de una etapa abierta a la vez
   (por ejemplo, para comparar dos etapas contiguas).
   ============================================================ */
document.querySelectorAll('.map-rail details.map-acc').forEach(dt => {
  dt.addEventListener('toggle', () => {
    if (dt.open && window.matchMedia('(max-width:700px)').matches) {
      document.querySelectorAll('.map-rail details.map-acc').forEach(o => { if (o !== dt) o.open = false; });
    }
  });
});
