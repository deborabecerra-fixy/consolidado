import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const files = [];

const header = `<header class="nav">
  <div class="wrap nav-inner">
    <a class="brand" href="/"><img src="/img/Logo%20Fixy.png" alt="Fixy Logística" width="606" height="188"></a>
    <button class="nav-toggle" aria-label="Abrir menú" aria-expanded="false"><span></span><span></span><span></span></button>
    <nav class="nav-links" aria-label="Navegación principal">
      <a href="/#mapa" data-nav="como">Cómo funciona</a>
      <a href="/#constructor" data-nav="constructor">Armá tu operación</a>
      <a href="/tecnologia" data-nav="tecnologia">Tecnología</a>
      <a href="/recursos" data-nav="recursos">Recursos</a>
      <a href="/#cobertura" data-nav="cobertura">Cobertura</a>
      <a href="/#faq" data-nav="faq">Preguntas</a>
      <div class="dd">
        <a class="dd-toggle" href="/#soluciones" aria-haspopup="true" data-nav="soluciones">Soluciones ▾</a>
        <div class="dd-menu">
          <a href="/servicios/fixyfull">FixyFull</a>
          <a href="/servicios/flex">Flex</a>
          <a href="/servicios/same-day">Same Day</a>
          <a href="/servicios/next-day">Next Day</a>
          <a href="/servicios/fixypoints">FixyPoints</a>
          <a href="/servicios/fixypay">FixyPay</a>
          <a href="/servicios/interior">Envíos al Interior</a>
          <a href="/operar-en-argentina">Operá en Argentina</a>
        </div>
      </div>
    </nav>
    <a href="https://wa.me/5491125426386" class="btn btn-wa" target="_blank" rel="noopener">WhatsApp</a>
  </div>
</header>`;

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'docs' || entry.name === 'scripts') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
}

await walk(root);
let changed = 0;
for (const file of files) {
  const html = await readFile(file, 'utf8');
  const next = html.replace(/<header class="nav">[\s\S]*?<\/header>/, header);
  if (next !== html) {
    await writeFile(file, next, 'utf8');
    changed++;
  }
}
console.log(JSON.stringify({ scanned: files.length, changed }));
