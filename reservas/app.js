const API = document.querySelector('meta[name="fixy-calendar-api"]')?.content.replace(/\/$/, '');
if (!API) throw new Error('Falta configurar la API de reservas.');
const services = [
  { id: 'diagnostico', title: 'Diagnóstico logístico', detail: 'Revisamos tu operación y detectamos el mejor punto de partida.', duration: 20 },
  { id: 'fulfillment', title: 'FixyFull', detail: 'Stock, preparación y despacho para tu e-commerce.', duration: 15 },
  { id: 'envios', title: 'Envíos y distribución', detail: 'Same Day, Next Day, Flex e interior.', duration: 15 },
];
const advisors = {
  gonzalo: { id: 'gonzalo', name: 'Gonzalo Jácome', role: 'Ejecutivo de cuentas', image: 'assets/gonzalo.webp?v=2' },
  micaela: { id: 'micaela', name: 'Micaela Pucheta', role: 'Ejecutiva de cuentas', image: 'assets/micaela.webp?v=2' },
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}
function iso(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(date);
}
function businessDays() {
  const output = [];
  const buenosAiresToday = new Date(`${iso(new Date())}T12:00:00-03:00`);
  for (let offset = 0; output.length < 4; offset += 1) {
    const candidate = new Date(buenosAiresToday);
    candidate.setUTCDate(candidate.getUTCDate() + offset);
    if (![0, 6].includes(candidate.getUTCDay())) output.push(candidate);
  }
  return output;
}
function safeMeetUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'meet.google.com' ? url.href : '';
  } catch {
    return '';
  }
}

const dates = businessDays();
let state = {
  step: 1,
  service: 'diagnostico',
  date: iso(dates[0]),
  slot: null,
  advisor: '',
  slots: [],
  loading: false,
  error: '',
  result: null,
  showAllTimes: false,
  requestId: null,
};
const panel = document.querySelector('#panel');
const selectedService = () => services.find(service => service.id === state.service);

let recaptchaScript;
const publicConfig = fetch(`${API}/public-config`).then(response => {
  if (!response.ok) throw new Error('Configuración no disponible.');
  return response.json();
});

function loadRecaptcha(siteKey) {
  if (recaptchaScript) return recaptchaScript;
  recaptchaScript = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('No pudimos cargar la verificación anti-spam.'));
    document.head.append(script);
  });
  return recaptchaScript;
}

async function captchaToken() {
  const config = await publicConfig;
  if (!config.recaptchaSiteKey) throw new Error('Verificación anti-spam no disponible.');
  await loadRecaptcha(config.recaptchaSiteKey);
  return new Promise((resolve, reject) => {
    window.grecaptcha.enterprise.ready(() => {
      window.grecaptcha.enterprise.execute(config.recaptchaSiteKey, { action: 'book' }).then(resolve, reject);
    });
  });
}

function progress() {
  document.querySelectorAll('.progress-row span').forEach((element, index) => {
    element.classList.toggle('active', index < state.step);
  });
}
async function loadSlots() {
  state.loading = true;
  state.error = '';
  state.slot = null;
  state.advisor = '';
  state.requestId = null;
  state.showAllTimes = false;
  render();
  try {
    const response = await fetch(`${API}/availability?date=${encodeURIComponent(state.date)}&service=${encodeURIComponent(state.service)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No pudimos consultar los calendarios.');
    state.slots = data.slots || [];
    if (data.partial) state.error = 'Algunos ejecutivos no están disponibles temporalmente.';
  } catch (error) {
    state.slots = [];
    state.error = error.message || 'No pudimos consultar los calendarios. Probá nuevamente.';
  } finally {
    state.loading = false;
    render();
  }
}
function go(step) {
  state.step = step;
  if (step === 2) loadSlots();
  else render();
  scrollTo({ top: 0, behavior: 'smooth' });
}
function serviceCard(service) {
  return `<button class="service ${state.service === service.id ? 'selected' : ''}" data-service="${service.id}"><span class="radio"></span><span><strong>${service.title}</strong><small>${service.detail}</small></span><b>${service.duration} min</b></button>`;
}
function advisorCard(id) {
  const advisor = advisors[id];
  if (!advisor) return '';
  return `<button class="advisor ${state.advisor === id ? 'selected' : ''}" data-advisor="${id}"><img src="${advisor.image}" alt="${advisor.name}"><span><strong>${advisor.name}</strong><small>${advisor.role}</small></span><span class="radio"></span></button>`;
}
function timeGroups() {
  return [
    { label: 'Mañana', slots: state.slots.filter(slot => Number(slot.time.slice(0, 2)) < 13) },
    { label: 'Tarde', slots: state.slots.filter(slot => Number(slot.time.slice(0, 2)) >= 13) },
  ].filter(group => group.slots.length);
}
function groupedTimes() {
  const groups = timeGroups();
  if (!groups.length) return '<p class="sub">No quedan horarios disponibles para este día.</p>';
  const hidden = groups.some(group => group.slots.length > 3);
  return `<div class="time-groups">${groups.map(group => `<section class="time-group"><h3>${group.label}</h3><div class="times">${(state.showAllTimes ? group.slots : group.slots.slice(0, 3)).map(slot => `<button class="${state.slot?.start === slot.start ? 'selected' : ''}" data-start="${escapeHtml(slot.start)}">${escapeHtml(slot.time)}</button>`).join('')}</div></section>`).join('')}${hidden ? `<button class="show-times" data-expand>${state.showAllTimes ? 'Ver menos horarios' : 'Ver todos los horarios'}</button>` : ''}</div>`;
}

function render() {
  progress();
  const service = selectedService();
  if (state.result) {
    const confirmedAdvisor = advisors[state.advisor];
    const confirmedDate = new Date(state.slot.start);
    const meetLink = safeMeetUrl(state.result.meetLink);
    panel.innerHTML = `<div class="success"><div class="success-icon">✓</div><span class="eyebrow">REUNIÓN CONFIRMADA</span><h2>¡Tu reunión quedó agendada!</h2><p>La invitación de Google Calendar con el Meet fue enviada por email.</p><div class="confirmed-advisor"><img src="${confirmedAdvisor.image}" alt="${confirmedAdvisor.name}"><span><small>Tu ejecutivo</small><strong>${confirmedAdvisor.name}</strong></span></div><div class="summary details"><div><span>Servicio</span><strong>${service.title}</strong></div><div><span>Fecha</span><strong>${confirmedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</strong></div><div><span>Horario</span><strong>${confirmedDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</strong></div><div><span>Duración</span><strong>${service.duration} minutos</strong></div></div>${meetLink ? `<a class="primary" href="${meetLink}" rel="noreferrer">Abrir Google Meet</a>` : ''}</div>`;
    return;
  }
  if (state.step === 1) panel.innerHTML = `<div class="panel"><span class="step-label">PASO 1 DE 4</span><h2>¿Sobre qué querés conversar?</h2><p class="sub">Seleccioná el punto de partida.</p><div class="option-list">${services.map(serviceCard).join('')}</div><button class="primary" data-next="2">Elegir día y horario →</button></div>`;
  if (state.step === 2) panel.innerHTML = `<div class="panel"><button class="back" data-next="1">← Volver</button><span class="step-label">PASO 2 DE 4</span><h2>Elegí cuándo te queda mejor</h2><p class="sub">Disponibilidad real · Horario de Buenos Aires.</p><div class="dates">${dates.map(date => `<button class="${state.date === iso(date) ? 'selected' : ''}" data-date="${iso(date)}"><small>${date.toLocaleDateString('es-AR', { weekday: 'short', timeZone: 'America/Argentina/Buenos_Aires' }).toUpperCase()}</small><strong>${Number(iso(date).slice(-2))}</strong><span>${date.toLocaleDateString('es-AR', { month: 'short', timeZone: 'America/Argentina/Buenos_Aires' }).toUpperCase()}</span></button>`).join('')}</div>${state.loading ? '<p>Cargando horarios…</p>' : groupedTimes()}${state.error ? `<p class="sub" role="alert">${escapeHtml(state.error)}</p>` : ''}<button class="primary" ${state.slot ? '' : 'disabled'} data-next="3">Ver ejecutivos disponibles →</button></div>`;
  if (state.step === 3) panel.innerHTML = `<div class="panel"><button class="back" data-next="2">← Cambiar horario</button><span class="step-label">PASO 3 DE 4</span><h2>¿Con quién querés conversar?</h2><p class="sub">Estas personas están libres en el horario seleccionado.</p><div class="advisor-grid">${state.slot.advisors.map(advisorCard).join('')}</div><button class="primary" ${state.advisor ? '' : 'disabled'} data-next="4">Completar mis datos →</button></div>`;
  if (state.step === 4) panel.innerHTML = `<div class="panel"><button class="back" data-next="3">← Cambiar ejecutivo</button><span class="step-label">PASO 4 DE 4</span><h2>¿Cómo te contactamos?</h2><p class="sub">Al confirmar crearemos la reunión de Google Meet.</p><form id="booking-form"><label>Nombre y apellido<input name="name" autocomplete="name" maxlength="120" required></label><label>Empresa<input name="company" autocomplete="organization" maxlength="160" required></label><label>WhatsApp<input name="whatsapp" type="tel" autocomplete="tel" maxlength="40" required></label><label>Email<input name="email" type="email" autocomplete="email" maxlength="254" required></label><label class="honeypot" aria-hidden="true">Sitio web<input name="website" tabindex="-1" autocomplete="off"></label><div class="mini-summary"><span>${service.title}</span><strong>${new Date(state.slot.start).toLocaleString('es-AR')}</strong><span>${advisors[state.advisor].name}</span></div><label class="consent"><input name="consent" type="checkbox" required><span>Acepto que Fixy use estos datos para contactarme y coordinar esta reunión.</span></label>${state.error ? `<p class="sub form-error" role="alert">${escapeHtml(state.error)}</p>` : ''}<button class="primary" ${state.loading ? 'disabled' : ''}>${state.loading ? 'Confirmando…' : 'Confirmar reunión →'}</button></form></div>`;
  panel.querySelectorAll('[data-service]').forEach(button => { button.onclick = () => { state.service = button.dataset.service; state.requestId = null; render(); }; });
  panel.querySelectorAll('[data-date]').forEach(button => { button.onclick = () => { state.date = button.dataset.date; loadSlots(); }; });
  panel.querySelectorAll('[data-start]').forEach(button => { button.onclick = () => { state.slot = state.slots.find(slot => slot.start === button.dataset.start); state.advisor = ''; state.requestId = null; render(); }; });
  panel.querySelectorAll('[data-expand]').forEach(button => { button.onclick = () => { state.showAllTimes = !state.showAllTimes; render(); }; });
  panel.querySelectorAll('[data-advisor]').forEach(button => { button.onclick = () => { state.advisor = button.dataset.advisor; state.requestId = null; render(); }; });
  panel.querySelectorAll('[data-next]').forEach(button => { button.onclick = () => !button.disabled && go(Number(button.dataset.next)); });
  const form = panel.querySelector('#booking-form');
  if (form) form.onsubmit = book;
}

async function book(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  state.loading = true;
  state.error = '';
  state.requestId ||= crypto.randomUUID();
  render();
  try {
    const verification = await captchaToken();
    const response = await fetch(`${API}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: state.requestId,
        advisor: state.advisor,
        start: state.slot.start,
        service: state.service,
        name: formData.get('name'),
        company: formData.get('company'),
        whatsapp: formData.get('whatsapp'),
        email: formData.get('email'),
        website: formData.get('website'),
        consent: formData.get('consent') === 'on',
        captchaToken: verification,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No pudimos confirmar la reunión.');
    state.result = data;
  } catch (error) {
    state.error = error.message || 'No pudimos confirmar la reunión.';
  } finally {
    state.loading = false;
    render();
  }
}

render();
