import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const htmlFiles = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'docs' || entry.name === 'scripts') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}

await walk(root);
let changed = 0;
for (const file of htmlFiles) {
  let html = await readFile(file, 'utf8');
  if (!html.includes('/css/app-mobile.css')) {
    html = html.replace('</head>', '<link rel="stylesheet" href="/css/app-mobile.css?v=11">\n<link rel="stylesheet" href="/css/app-professional-v9.css?v=11">\n<script src="/js/app-shell.js?v=11" defer></script>\n</head>');
  } else {
    html = html
      .replace(/\/css\/app-mobile\.css(?:\?v=\d+)?/g, '/css/app-mobile.css?v=11')
      .replace(/\/css\/app-professional-v9\.css(?:\?v=\d+)?/g, '/css/app-professional-v9.css?v=11')
      .replace(/\/js\/app-shell\.js(?:\?v=\d+)?/g, '/js/app-shell.js?v=11')
      .replace(/(?:\.\/|\/)js\/constructor\.js(?:\?v=\d+)?/g, '/js/constructor.js?v=11');
    if (!html.includes('/css/app-professional-v9.css')) {
      html = html.replace(
        /(<link rel="stylesheet" href="\/css\/app-mobile\.css\?v=11">)/,
        '$1\n<link rel="stylesheet" href="/css/app-professional-v9.css?v=11">'
      );
    }
  }
  await writeFile(file, html, 'utf8');
  changed++;
}
console.log(JSON.stringify({ scanned: htmlFiles.length, changed }));
