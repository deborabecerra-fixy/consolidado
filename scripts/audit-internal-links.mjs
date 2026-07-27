import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const base = process.argv[2] || 'http://127.0.0.1:5500';
const files = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'docs' || entry.name === 'scripts') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
}

await walk(root);
const paths = new Set(['/']);
for (const file of files) {
  const html = await readFile(file, 'utf8');
  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const value = match[1];
    if (!value.startsWith('/') || value.startsWith('//')) continue;
    paths.add(value.split('#')[0] || '/');
  }
}

const results = [];
for (const path of [...paths].sort()) {
  const response = await fetch(new URL(path, base), { redirect: 'manual' });
  results.push({ path, status: response.status });
}
const failed = results.filter(({ status }) => status < 200 || status >= 400);
console.log(JSON.stringify({ checked: results.length, passed: results.length - failed.length, failed }, null, 2));
if (failed.length) process.exitCode = 1;
