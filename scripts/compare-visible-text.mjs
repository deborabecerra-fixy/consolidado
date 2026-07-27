import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const [beforeRoot, afterRoot = process.cwd()] = process.argv.slice(2);
if (!beforeRoot) throw new Error('Uso: node scripts/compare-visible-text.mjs <baseline> [actual]');

const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) files.push(relative(beforeRoot, full));
  }
}

function visibleText(html) {
  return html
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

await walk(beforeRoot);
const results = [];
for (const file of files.sort()) {
  const [before, after] = await Promise.all([
    readFile(join(beforeRoot, file), 'utf8'),
    readFile(join(afterRoot, file), 'utf8')
  ]);
  const a = visibleText(before);
  const b = visibleText(after);
  results.push({ file, equal: a === b, beforeChars: a.length, afterChars: b.length });
}

const changed = results.filter((item) => !item.equal);
console.log(JSON.stringify({ checked: results.length, unchanged: results.length - changed.length, changed }, null, 2));
if (changed.length) process.exitCode = 1;
