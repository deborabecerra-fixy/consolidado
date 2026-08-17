/* Fixy — auditoría de enlaces internos.
   Recorre todos los .html del repo y comprueba cada destino interno contra una
   base URL (local o producción).

   Resuelve rutas RELATIVAS además de absolutas: el sitio entero usa enlaces del
   tipo "../../servicios/flex/", que la versión anterior de este script ignoraba
   —sólo miraba los que empiezan con "/"— y por eso siempre reportaba
   "checked: 1, passed: 1": un verde que no comprobaba nada.

   Uso:
     node scripts/local-server.mjs &        (en otra terminal, PORT=5500)
     node scripts/audit-internal-links.mjs
     node scripts/audit-internal-links.mjs https://fixy.com.ar
*/
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, posix } from 'node:path';

const root = process.cwd();
const base = process.argv[2] || 'http://127.0.0.1:5500';
const IGNORAR = ['scripts', 'test-results', '.git', 'node_modules', 'docs'];
const files = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (IGNORAR.includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
}
await walk(root);

/* destino → páginas que lo enlazan */
const destinos = new Map();
for (const file of files) {
  const pagina = '/' + relative(root, file).split('\\').join('/');
  const dir = posix.dirname(pagina);
  const html = await readFile(file, 'utf8');
  for (const m of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    let v = m[1];
    if (/^(https?:|mailto:|tel:|javascript:|data:|#|\/\/)/i.test(v)) continue;
    v = v.split('#')[0].split('?')[0];
    if (!v) continue;
    const abs = v.startsWith('/') ? v : posix.normalize(posix.join(dir, v));
    if (!destinos.has(abs)) destinos.set(abs, new Set());
    destinos.get(abs).add(pagina);
  }
}

const resultados = [];
for (const [url, origenes] of [...destinos].sort()) {
  let status = 0, location = '';
  try {
    const r = await fetch(new URL(url, base), { redirect: 'manual' });
    status = r.status;
    location = r.headers.get('location') || '';
  } catch (e) {
    status = 0;
    location = e.message;
  }
  resultados.push({ url, status, location, origenes: [...origenes] });
}

const rotos = resultados.filter(r => r.status === 0 || r.status >= 400);
const redirecciones = resultados.filter(r => r.status >= 300 && r.status < 400);

console.log(JSON.stringify({
  base,
  paginas: files.length,
  destinos: resultados.length,
  ok: resultados.length - rotos.length - redirecciones.length,
  rotos,
  redirecciones
}, null, 2));

if (rotos.length) process.exitCode = 1;
