/* ============================================================
   Fixy — Home: constructor de operación + medición
   Lógica del "Constructor de operación": el usuario elige
   situación / fricción / zona y se arma una hipótesis con
   servicios sugeridos, etapas cubiertas y próximo paso.
   Se carga al final de <body>, con el DOM ya disponible.
   ============================================================ */

/* ---------- Estado de selección (fuente única para desktop + wizard) ---------- */
const sel = { esc: [], fric: [], zona: [] };
let hypReturnFocus = null;

function ensureHypSheet() {
  const hyp = document.getElementById('hyp');
  const card = hyp && hyp.querySelector('.hyp-card');
  if (!hyp || !card || hyp.dataset.sheetReady === 'true') return;
  hyp.dataset.sheetReady = 'true';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'hyp-sheet-close';
  close.setAttribute('aria-label', 'Cerrar informe');
  close.addEventListener('click', () => resetB());
  card.prepend(close);
  hyp.addEventListener('click', e => { if (e.target === hyp) resetB(); });
  document.addEventListener('keydown', e => {
    if (!document.body.classList.contains('hyp-sheet-open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      resetB();
      return;
    }
    if (e.key !== 'Tab') return;
    const action = document.querySelector('.wiz-result-actions button');
    const items = [...hyp.querySelectorAll('a[href],button:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')]
      .filter(el => el.offsetParent !== null);
    if (action && action.offsetParent !== null) items.push(action);
    if (!items.length) return;
    const first = items[0], lastItem = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      lastItem.focus();
    } else if (!e.shiftKey && document.activeElement === lastItem) {
      e.preventDefault();
      first.focus();
    }
  });
}

function openHypSheet() {
  if (!window.matchMedia('(max-width:700px)').matches) return;
  ensureHypSheet();
  const hyp = document.getElementById('hyp');
  hypReturnFocus = document.activeElement;
  hyp.setAttribute('role', 'dialog');
  hyp.setAttribute('aria-modal', 'true');
  hyp.setAttribute('aria-label', 'Tu hipótesis de operación');
  document.body.classList.add('hyp-sheet-open');
  requestAnimationFrame(() => hyp.querySelector('.hyp-sheet-close')?.focus());
}

function dismissHypSheet(restoreFocus) {
  const hyp = document.getElementById('hyp');
  document.body.classList.remove('hyp-sheet-open');
  if (hyp) {
    hyp.removeAttribute('role');
    hyp.removeAttribute('aria-modal');
    hyp.removeAttribute('aria-label');
  }
  if (restoreFocus && hypReturnFocus instanceof HTMLElement) {
    requestAnimationFrame(() => hypReturnFocus.focus());
  }
}

function isOn(k, v) { return sel[k].indexOf(v) >= 0; }

/* Aplica una selección respetando single/multi y refleja el estado en toda la UI */
function pick(k, v, single) {
  if (single) {
    sel[k] = (sel[k][0] === v) ? [] : [v];
  } else {
    const i = sel[k].indexOf(v);
    if (i >= 0) sel[k].splice(i, 1); else sel[k].push(v);
  }
  reflectSelection();
  track('chip_select', k + ':' + v);
}

/* Sincroniza chips de desktop, opciones del wizard y la guía de progreso con el estado */
function reflectSelection() {
  document.querySelectorAll('#constructor .builder-desktop .chips .chip').forEach(c => {
    const on = isOn(c.parentElement.dataset.group, c.dataset.v);
    c.classList.toggle('active', on);
    c.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  document.querySelectorAll('#constructor .wiz-opt').forEach(b => {
    const on = isOn(b.dataset.group, b.dataset.v);
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  if (sel.fric.length) clearConsMsg();
  // Nota de avance de la franja inferior (desktop): "N de 3 datos"
  const note = document.querySelector('#constructor [data-cons-progress]');
  if (note) {
    const done = (sel.esc.length ? 1 : 0) + (sel.fric.length ? 1 : 0) + (sel.zona.length ? 1 : 0);
    note.innerHTML = '<b>' + done + '</b> de 3 datos';
  }
  if (typeof window.updateWizFoot === 'function') window.updateWizFoot();
}

/* ---------- Mensajes de validación inline (sin alert del navegador) ---------- */
function clearConsMsg() {
  document.querySelectorAll('#constructor .cons-msg').forEach(m => { m.hidden = true; });
}
function showConsMsg() {
  const m = document.querySelector('#constructor .cons-msg');
  if (!m) return;
  m.hidden = false;
  try { m.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { /* noop */ }
}

/* ---------- Medición (gancho único listo para GTM/dataLayer) ---------- */
function track(ev, val) {
  if (window.dataLayer) window.dataLayer.push({ event: ev, value: val || '', page: 'home' });
}

/* ---------- Wiring de chips de desktop (single/multi según data-single) ---------- */
document.querySelectorAll('#constructor .builder-desktop .chips').forEach(g => {
  const k = g.dataset.group;
  const single = g.dataset.single === 'true';
  g.querySelectorAll('.chip').forEach(c => {
    c.setAttribute('aria-pressed', 'false');
    c.addEventListener('click', () => pick(k, c.dataset.v, single));
  });
});

/* ---------- Clicks con data-ev → tracking automático ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-ev]');
  if (t) track(t.dataset.ev, t.dataset.evval || '');
});

/* ---------- Navbar: menú mobile + sombra al scrollear + link activo ---------- */
(function initNav() {
  const nav = document.querySelector('header.nav');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  // Menú mobile (abrir/cerrar hamburguesa)
  function closeMenu() {
    if (links) links.classList.remove('open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a:not(.dd-toggle)').forEach(a => a.addEventListener('click', closeMenu));
    links.querySelectorAll('.dd-toggle').forEach(t => t.addEventListener('click', e => {
      if (window.innerWidth <= 860) { e.preventDefault(); t.closest('.dd').classList.toggle('open'); }
    }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    document.addEventListener('click', e => { if (nav && !nav.contains(e.target)) closeMenu(); });
  }

  // Sombra sutil cuando la página deja de estar arriba de todo
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Scrollspy: resalta el link de la sección visible
  const anchors = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const secToLink = new Map();
  anchors.forEach(a => {
    const sec = document.getElementById(a.getAttribute('href').slice(1));
    if (sec) secToLink.set(sec, a);
  });
  if (secToLink.size && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        anchors.forEach(a => a.classList.remove('active'));
        const a = secToLink.get(en.target); if (a) a.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    secToLink.forEach((a, sec) => spy.observe(sec));
  }
})();

track('page_view');

/* ---------- Ruteo desde escenarios y banda "¿Te suena?" hacia el constructor ---------- */
function addChip(group, val) {
  const g = document.querySelector('#constructor .builder-desktop .chips[data-group="' + group + '"]');
  if (!g) return;
  const single = g.dataset.single === 'true';
  if (!isOn(group, val)) pick(group, val, single);
}
function pickScenario(v) {
  addChip('esc', v);
  if (window.matchMedia('(max-width:700px)').matches && typeof window.wizOpen === 'function') window.wizOpen(0);
  document.getElementById('constructor').scrollIntoView({ behavior: 'smooth' });
}
function pickPain(f) {
  track('pain_select', f);
  addChip('fric', f);
  build();
}

/* ============================================================
   Motor de reglas: fricción → solución
   ============================================================ */
const RULES = {
  stock:    { p: ['FixyFull'], c: [] },
  hoy:      { p: ['Same Day'], c: ['FixyPoints'], req: ['FixyFull'] },
  manana:   { p: ['Next Day'], c: ['FixyPoints'] },
  flex:     { p: ['Flex'], c: [], req: ['FixyFull'] },
  puntos:   { p: ['FixyPoints'], c: ['Next Day'], req: ['envíos 24h'], excl: 'no compatible con contraentrega' },
  cobro:    { p: ['FixyPay'], c: ['Same Day', 'Next Day'] },
  interior: { p: ['Envíos al Interior'], c: [] },
  todo:     { p: ['FixyFull', 'Same Day'], c: ['FixyPay', 'FixyPoints'] }
};

/* Etiquetas legibles por variable */
const FL = { stock: 'stock y preparación', hoy: 'entregas en el día', manana: 'entregas al día siguiente', flex: 'operación Flex', puntos: 'puntos de retiro', cobro: 'cobro contraentrega', interior: 'envíos al interior', todo: 'todo el flujo' };
const ZL = { caba: 'CABA', gba: 'GBA', amba: 'AMBA', interior: 'Interior / Nacional', def: 'zona a definir' };
const ESCL = { crece: 'estás creciendo', frustrado: 'venís de una mala experiencia con tu operador', inicia: 'estás arrancando tu e-commerce', redisena: 'estás rediseñando tu operación', exterior: 'sos una marca del exterior entrando a Argentina' };

/* Reencuadre / insight por fricción */
const REFRAME = {
  stock: 'Suele no ser falta de manos: es que el stock todavía no está listo para venderse cuando entra la venta.',
  hoy: 'El reclamo aparece en la entrega, pero la demora suele empezar antes: en la preparación y el corte horario.',
  manana: 'Llegar mañana no se decide mañana: suele definirse en cómo entra y se organiza el pedido hoy.',
  flex: 'Flex no es solo repartir en el día: es sostener la promesa de tu publicación cuando sube el volumen.',
  puntos: 'Muchas veces no entregás mal: es que el domicilio es el único destino posible, y ahí aparece la fricción.',
  cobro: 'El problema no suele ser cobrar, sino volver a unir el pago con el pedido después de la entrega.',
  interior: 'Vender al interior no es "despachar más lejos": es sostener la promesa con otra red y otras condiciones.',
  todo: 'Cuando varias etapas se tocan entre sí, el cuello de botella no está en una sola: está en cómo se conectan.'
};

/* Qué cambia en el día a día, por fricción */
const OUTCOME = {
  stock: 'Tu equipo deja de buscar productos y de depender de una sola persona; cada pedido sale listo.',
  hoy: 'Prometés hoy y cumplís, sin tener que sumar estructura propia.',
  manana: 'Cada venta de hoy sale organizada para llegar mañana, sin improvisar.',
  flex: 'Escalás tus ventas Flex sin que cada jornada dependa de coordinar a mano.',
  puntos: 'Tus compradores eligen dónde retirar; bajan los intentos fallidos por ausencias.',
  cobro: 'El cobro llega conciliado con cada entrega; nadie persigue comprobantes.',
  interior: 'Llegás a todo el país con seguimiento y evidencia, sin montar red propia.',
  todo: 'La operación deja de reabrirse cada mañana: cada venta se cierra completa.'
};

/* Etapas del Mapa 360° y qué etapas cubre cada fricción */
const STAGES = ['Stock', 'Pedido', 'Preparación', 'Promesa', 'Modalidad', 'Distribución', 'Entrega', 'Cobro', 'Evidencia', 'Cierre'];
const COVER = { stock: [1, 2, 3], hoy: [3, 4, 5, 6, 7, 9], manana: [4, 5, 6, 7, 9], flex: [3, 5, 6, 7, 9], puntos: [5, 7], cobro: [8, 9, 10], interior: [5, 6, 7, 9], todo: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] };

/* Próximo paso según el perfil clasificado */
const NEXT = {
  'Perfil Express': { line: 'Con esto ya podemos pasarte una primera propuesta.', primary: 'form' },
  'Perfil Semi-consultivo': { line: 'Revisémoslo juntos para ajustar la mejor combinación para tu operación.', primary: 'form' },
  'Perfil Consultivo': { line: 'Por lo que contás, conviene una charla de 15 minutos para diseñarlo bien.', primary: 'agenda' }
};

/* URLs de las páginas de servicio (URLs limpias, root-relativas) */
const SVCURL = {
      'FixyFull': './servicios/fixyfull/',
      'Flex': './servicios/flex/',
      'Same Day': './servicios/same-day/',
      'Next Day': './servicios/next-day/',
      'FixyPoints': './servicios/fixypoints/',
      'FixyPay': './servicios/fixypay/',
      'Envíos al Interior': './servicios/interior/'
};

let last = null;

/* Clasificación interna del lead (no se muestra al usuario) */
function classify() {
  const f = sel.fric, e = sel.esc;
  if (f.includes('todo') || f.length >= 3 || e.includes('redisena') || e.includes('exterior') || f.includes('interior')) return 'Perfil Consultivo';
  if (f.length === 1 && (e.length === 0 || e.includes('inicia')) && ['stock', 'hoy', 'manana', 'puntos', 'cobro'].includes(f[0])) return 'Perfil Express';
  return 'Perfil Semi-consultivo';
}

/* ============================================================
   Construcción de la hipótesis (output del constructor)
   ============================================================ */
function build() {
  if (!sel.fric.length) {
    // Validación inline (sin alert): mostramos el mensaje junto al paso incompleto
    showConsMsg();
    return;
  }
  clearConsMsg();
  let primary = [], conn = [], val = [];
  sel.fric.forEach(f => {
    const r = RULES[f]; if (!r) return;
    r.p.forEach(x => { if (!primary.includes(x)) primary.push(x); });
    (r.c || []).forEach(x => { if (!conn.includes(x)) conn.push(x); });
    if (r.req) r.req.forEach(x => { const t = 'Requiere ' + x; if (!val.includes(t)) val.push(t); });
    if (r.excl && !val.includes(r.excl)) val.push(r.excl);
  });
  conn = conn.filter(x => !primary.includes(x));

  // Conflicto conocido entre variables elegidas
  if (sel.fric.includes('puntos') && sel.fric.includes('cobro')) val.push('Elegiste puntos de retiro y cobro contraentrega: no conviven en el mismo envío, hay que definir cómo se combinan.');
  // Escenario (puede haber varios)
  if (sel.esc.includes('crece') && !primary.includes('FixyFull') && !conn.includes('FixyFull')) conn.unshift('FixyFull');
  if (sel.esc.includes('inicia')) val.push('Arranque acompañado paso a paso');
  if (sel.esc.includes('frustrado')) val.push('Plan de transición sin cortar tu operación');
  // Zona (puede haber varias)
  const z = sel.zona;
  if ((z.includes('gba') || z.includes('amba')) && (primary.includes('Same Day') || conn.includes('Same Day'))) val.push('Same Day se valida por zona fuera de CABA');
  if (z.includes('interior')) val.push('Envíos al interior: red, plazos y seguro según destino');
  if (!z.length || z.includes('def')) val.push('Cobertura y modalidad sujetas a validación');
  val.push('Volumen real y cortes de preparación');

  last = { primary, sol: primary[0], zona: sel.zona.filter(x => x !== 'def').map(x => ZL[x]).join(', '), cls: classify() };
  const svc = a => [...new Set(a)].map(s => { const u = SVCURL[s]; return u ? '<a href="' + u + '" class="svc" data-ev="hyp_svc_link">' + s + ' →</a>' : '<span class="svc">' + s + '</span>'; }).join(' ');

  /* ----- Datos ya calculados (misma lógica) reordenados en resumen + diagnóstico ----- */
  const cap = s => s ? (s.charAt(0).toUpperCase() + s.slice(1)) : s;
  const escTxt = sel.esc.length ? sel.esc.map(x => ESCL[x]).join(' y ') : 'estás evaluando tu logística';
  const fricTxt = sel.fric.map(x => FL[x]).join(', ');
  const zonaTxt = last.zona ? (' y operás en ' + last.zona) : '';
  const mirror = cap(escTxt) + ', necesitás ' + fricTxt + zonaTxt + '.';
  const benefit = OUTCOME[sel.fric[0]] || 'Ordenás la operación y sostenés la promesa de entrega.';
  const cov = []; sel.fric.forEach(f => (COVER[f] || []).forEach(i => { if (!cov.includes(i)) cov.push(i); }));
  const covNames = cov.slice().sort((a, b) => a - b).map(i => STAGES[i - 1]);
  const outs = [...new Set(sel.fric.map(f => OUTCOME[f]))];
  const reframe = (sel.fric.length === 1)
    ? REFRAME[sel.fric[0]]
    : 'Elegiste varias fricciones, y ahí está la clave: el cuello de botella casi nunca vive en una sola etapa, sino en cómo se conectan. Por eso conviene mirarlas juntas y no resolverlas por separado.';
  const svcPlain = a => [...new Set(a)].map(s => {
    const u = SVCURL[s];
    return u ? '<a href="' + u + '" class="hyp-svc" data-ev="hyp_svc_link">' + s + '</a>' : '<span class="hyp-svc">' + s + '</span>';
  }).join('<span class="hyp-svc-sep"> · </span>');
  const nx = NEXT[last.cls] || NEXT['Perfil Semi-consultivo'];

  /* ----- Resumen compacto (visible siempre) ----- */
  let h = '<div class="hyp-summary">';
  h += '<p class="hyp-mirror">' + mirror + '</p>';
  h += '<div class="hyp-sol">';
  h += '<div class="hyp-sol-line hyp-sol-primary"><span class="hyp-sol-lbl">Punto de partida</span><span class="hyp-sol-val">' + svcPlain(primary) + '</span></div>';
  if (conn.length) h += '<div class="hyp-sol-line hyp-sol-conn"><span class="hyp-sol-lbl">A conectar</span><span class="hyp-sol-val">' + svcPlain(conn) + '</span></div>';
  h += '</div>';
  h += '<p class="hyp-benefit">' + benefit + '</p>';
  h += '</div>';

  /* ----- CTAs: principal + "Ver diagnóstico" ----- */
  h += '<p class="hyp-next-line">' + nx.line + '</p>';
  h += '<div class="hyp-cta-row">';
  h += '<button type="button" class="btn btn-primary" onclick="toForm()" data-ev="hyp_validate">Validar con el equipo →</button>';
  h += '<button type="button" class="btn btn-ghost hyp-diag-toggle" aria-expanded="false" aria-controls="hyp-detail" onclick="toggleDiag(this)">Ver diagnóstico</button>';
  h += '</div>';

  /* ----- Opciones secundarias (WhatsApp / agenda) — menor jerarquía ----- */
  h += '<div class="hyp-secondary">';
  if (nx.primary === 'agenda') h += '<a href="/consolidado/reservas/" data-ev="hyp_schedule">Agendar 15 min</a><span class="sep">·</span>';
  h += '<a id="wa" href="#" target="_blank" rel="noopener" data-ev="hyp_whatsapp">Seguir por WhatsApp</a>';
  h += '</div>';

  /* ----- Diagnóstico completo (colapsado por defecto) ----- */
  let d = '';
  if (sel.esc.includes('exterior')) {
    d += '<div class="hyp-reframe hyp-ext"><span class="lbl">Marca del exterior</span>Para una marca de afuera el desafío no es un envío puntual: es montar tu operación local completa —fulfillment, entrega, cobro y devoluciones— sin abrir empresa propia. <b>Fixy arranca una vez que tu mercadería está nacionalizada en el país</b> (no hacemos importación ni aduana), y la zona y modalidad las definimos según tu estrategia de entrada.<div style="margin-top:12px"><a href="./operar-en-argentina/" class="btn btn-primary" data-ev="hyp_exterior_landing">Ver cómo entra tu marca →</a></div></div>';
  }
  d += '<details class="hyp-acc"><summary>El punto ciego</summary><div class="hyp-acc-body">' + reframe + '</div></details>';
  d += '<details class="hyp-acc"><summary>Qué etapas de tu venta resuelve</summary><div class="hyp-acc-body"><p class="hyp-stages-count">Resuelve <b>' + cov.length + ' de 10</b> etapas.</p><ul class="hyp-stages">' + covNames.map(n => '<li>' + n + '</li>').join('') + '</ul></div></details>';
  d += '<details class="hyp-acc"><summary>Qué cambia en tu día a día</summary><div class="hyp-acc-body">' + (outs.length === 1 ? '<p>' + outs[0] + '</p>' : '<ul class="hyp-stages">' + outs.map(o => '<li>' + o + '</li>').join('') + '</ul>') + '</div></details>';
  d += '<details class="hyp-acc"><summary>A validar con el equipo</summary><div class="hyp-acc-body"><ul class="hyp-stages">' + val.map(v => '<li>' + v + '</li>').join('') + '</ul></div></details>';
  d += '<p class="hyp-note">Es una hipótesis inicial, no una cotización. El diseño y la tarifa se definen con tu operación real.</p>';
  h += '<div id="hyp-detail" hidden>' + d + '</div>';

  document.getElementById('hyp-body').innerHTML = h;
  const tg = document.querySelector('#hyp .hyp-diag-toggle'); if (tg) tg.textContent = diagLabel(false);
  document.getElementById('hyp-next').innerHTML = '';
  // En mobile, mantener un solo acordeón abierto a la vez
  document.querySelectorAll('#hyp-detail details.hyp-acc').forEach(dt => {
    dt.addEventListener('toggle', () => {
      if (dt.open && window.matchMedia('(max-width:700px)').matches) {
        document.querySelectorAll('#hyp-detail details.hyp-acc').forEach(o => { if (o !== dt) o.open = false; });
      }
    });
  });

  // CRM (oculto) + WhatsApp con contexto
  const hidden = document.getElementById('lead-class'); if (hidden) hidden.value = last.cls;
  const msg = 'Hola Fixy, vengo del constructor. Mi caso: ' + last.primary.join(' + ') + (last.zona ? (' — zona ' + last.zona) : '') + '.';
  document.getElementById('wa').href = 'https://wa.me/5491125426386?text=' + encodeURIComponent(msg);
  track('hypothesis_built', last.sol);
  const hypEl = document.getElementById('hyp');
  hypEl.style.display = 'block';
  // En mobile, mostrar el resultado dentro del módulo (wizard → vista resultado)
  const mobileResult = window.matchMedia('(max-width:700px)').matches;
  if (mobileResult && typeof window.wizToResult === 'function') {
    window.wizToResult();
    openHypSheet();
  }
  // Scroll suave al resultado solo si queda fuera del viewport
  const r = hypEl.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  if (!mobileResult && (r.top < 0 || r.bottom > vh)) hypEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetB() {
  const restore = document.body.classList.contains('hyp-sheet-open');
  dismissHypSheet(restore);
  sel.esc = []; sel.fric = []; sel.zona = [];
  reflectSelection();
  clearConsMsg();
  document.getElementById('hyp').style.display = 'none';
  if (typeof window.wizReset === 'function') window.wizReset();
  // Devolver el scroll al inicio del constructor si quedó por encima del viewport
  const c = document.getElementById('constructor');
  if (c && c.getBoundingClientRect().top < 0) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* Etiqueta del botón según estado y breakpoint */
function diagLabel(open) {
  if (open) return 'Ocultar diagnóstico';
  return window.matchMedia('(max-width:700px)').matches ? 'Ver diagnóstico' : 'Ver diagnóstico completo';
}
/* Muestra/oculta el diagnóstico completo (sin recargar). En desktop abre las secciones; en mobile quedan como acordeones cerrados. */
function toggleDiag(btn) {
  const d = document.getElementById('hyp-detail');
  if (!d) return;
  const willOpen = d.hasAttribute('hidden');
  if (willOpen) {
    d.removeAttribute('hidden');
    const desktop = !window.matchMedia('(max-width:700px)').matches;
    d.querySelectorAll('details.hyp-acc').forEach(x => { x.open = desktop; });
  } else {
    d.setAttribute('hidden', '');
  }
  if (btn) { btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false'); btn.textContent = diagLabel(willOpen); }
}

/* Pre-carga el formulario de contacto con la hipótesis construida */
function toForm() {
  if (!last) return;
  dismissHypSheet(false);
  document.getElementById('hyp').style.display = 'none';
  const s = document.getElementById('f-sol'), z = document.getElementById('f-zona'), m = document.getElementById('f-msg');
  /* El formulario real de Kommo vive en un iframe de otro dominio. No intentamos
     escribir dentro de él: conservamos el acceso desde el constructor sin romper
     la navegación ni la analítica cuando el formulario visual anterior no existe. */
  if (!s || !z || !m) {
    track('form_open', last.sol);
    document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' });
    return;
  }
  [...s.options].forEach(o => { if (o.text === last.sol) s.value = o.value; });
  if (last.zona) [...z.options].forEach(o => { if (o.text === last.zona) z.value = o.value; });
  m.value = 'Vengo del constructor. Hipótesis: ' + last.primary.join(' + ') + (last.zona ? (' — zona ' + last.zona) : '') + '.';
  const og = document.getElementById('origen'); if (og) og.value = 'home-constructor';
  const ls = document.getElementById('lead-servicios'); if (ls) ls.value = last.primary.join(', ');
  [s, z, m].forEach(e => e.classList.add('prefill'));
  document.getElementById('prefill-banner').style.display = 'block';
  track('form_prefill', last.sol);
  document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' });
}

/* ============================================================
   Wizard mobile: una etapa por pantalla.
   Reutiliza las mismas opciones y el mismo estado `sel` que el
   layout desktop (se leen desde el DOM, sin duplicar datos).
   ============================================================ */
(function initWizard() {
  const wrap = document.querySelector('#constructor [data-wiz]');
  if (!wrap) return;
  const groups = [...document.querySelectorAll('#constructor .builder-desktop .chips')];
  if (!groups.length) return;

  const STEPS = groups.map(g => {
    const head = g.closest('.cons-step').querySelector('h3');
    return {
      key: g.dataset.group,
      single: g.dataset.single === 'true',
      q: head ? head.textContent.trim() : '',
      help: g.dataset.help || '',
      opts: [...g.querySelectorAll('.chip')].map(c => {
        const label = c.textContent.trim();
        return { v: c.dataset.v, label: label, wide: label.length > 16 };
      })
    };
  });
  const N = STEPS.length;
  let cur = 0;

  // --- Wizard: se muestra el paso 1 directamente (sin pantalla intro) ---
  const wiz = document.createElement('div');
  wiz.className = 'wiz';
  wiz.setAttribute('role', 'group');
  wiz.setAttribute('aria-label', 'Constructor de operación');
  wiz.innerHTML =
    '<div class="wiz-head">' +
      '<button type="button" class="wiz-iconbtn" data-wiz-back aria-label="Volver al paso anterior">‹</button>' +
      '<span class="wiz-step" aria-live="polite"></span>' +
    '</div>' +
    '<div class="wiz-progress"><span class="wiz-progress-fill"></span></div>' +
    '<div class="wiz-body">' +
      '<h3 class="wiz-title" tabindex="-1"></h3>' +
      '<p class="wiz-help"></p>' +
      '<div class="wiz-opts"></div>' +
    '</div>' +
    '<div class="wiz-foot"><button type="button" class="btn btn-primary wiz-cta"></button></div>';

  wrap.appendChild(wiz);
  wrap.dataset.view = 'steps';

  const elBack = wiz.querySelector('[data-wiz-back]');
  const elStep = wiz.querySelector('.wiz-step');
  const elFill = wiz.querySelector('.wiz-progress-fill');
  const elTitle = wiz.querySelector('.wiz-title');
  const elHelp = wiz.querySelector('.wiz-help');
  const elOpts = wiz.querySelector('.wiz-opts');
  const elBody = wiz.querySelector('.wiz-body');
  const elCta = wiz.querySelector('.wiz-cta');

  function renderStep(anim) {
    const s = STEPS[cur];
    elStep.textContent = 'Paso ' + (cur + 1) + ' de ' + N;
    elFill.style.width = Math.round((cur + 1) / N * 100) + '%';
    elTitle.textContent = s.q;
    elHelp.textContent = s.help;
    elBack.hidden = (cur === 0); // no hay adónde volver en el primer paso
    elOpts.className = 'wiz-opts' + ((s.key === 'fric' || s.key === 'zona') ? ' grid' : '');
    elOpts.innerHTML = s.opts.map(o =>
      '<button type="button" class="wiz-opt' + (o.wide ? ' wide' : '') + '"' +
      ' data-group="' + s.key + '" data-v="' + o.v + '" aria-pressed="false">' +
      '<span>' + o.label + '</span><span class="wiz-check" aria-hidden="true">✓</span></button>'
    ).join('');
    elOpts.querySelectorAll('.wiz-opt').forEach(b => {
      b.addEventListener('click', () => pick(b.dataset.group, b.dataset.v, s.single));
    });
    reflectSelection();
    if (anim) { elBody.classList.remove('anim'); void elBody.offsetWidth; elBody.classList.add('anim'); }
    try { elTitle.focus({ preventScroll: true }); } catch (e) { /* noop */ }
  }

  // Etiqueta y estado del CTA según el paso y la selección (única fuente: `sel`)
  window.updateWizFoot = function () {
    if (wrap.dataset.view !== 'steps') return;
    const s = STEPS[cur];
    const n = sel[s.key].length;
    let label;
    if (cur < N - 1) {
      if (s.key === 'fric') label = n > 0 ? ('Continuar con ' + n + ' ' + (n === 1 ? 'opción' : 'opciones') + ' →') : 'Siguiente paso →';
      else label = 'Siguiente paso →';
    } else {
      label = 'Construir mi hipótesis →';
    }
    elCta.textContent = label;
    elCta.disabled = n === 0;
  };

  /* La barra sticky global se oculta mientras el wizard está a la vista y en pasos;
     reaparece al llegar al resultado o al salir del módulo (scroll). */
  let wizVisible = false;
  function syncSticky() {
    const mobile = window.matchMedia('(max-width:700px)').matches;
    // Oculta la sticky global mientras el módulo (pasos, resultado o diagnóstico) está a la vista
    document.body.classList.toggle('wiz-hide-sticky', mobile && wizVisible);
  }
  const moduleEl = document.getElementById('constructor');
  if ('IntersectionObserver' in window && moduleEl) {
    new IntersectionObserver(es => { es.forEach(e => { wizVisible = e.isIntersecting; }); syncSticky(); }, { threshold: 0 }).observe(moduleEl);
  } else { wizVisible = true; }

  function setView(v) { wrap.dataset.view = v; syncSticky(); }

  window.wizOpen = function (step) {
    cur = Math.max(0, Math.min(N - 1, step || 0));
    document.getElementById('hyp').style.display = 'none';
    setView('steps');
    renderStep(false);
  };
  window.wizReset = function () {
    cur = 0;
    setView('steps');
    renderStep(false);
  };
  window.wizToResult = function () { setView('result'); };

  elBack.addEventListener('click', () => {
    if (cur > 0) { cur--; renderStep(true); }
  });
  elCta.addEventListener('click', () => {
    if (elCta.disabled) return;
    if (cur < N - 1) { cur++; renderStep(true); }
    else { build(); }
  });

  // Estado inicial: paso 1 visible directamente
  renderStep(false);
})();
