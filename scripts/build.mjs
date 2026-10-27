// Arma dist/oreja-ceo.html a partir de src/.
// Orden: shell → estilos → vistas → JS. Dentro de cada carpeta manda el prefijo numérico,
// porque el CSS depende de la cascada y el JS comparte un solo closure.
//
//   node scripts/build.mjs                 → escribe dist/oreja-ceo.html
//   node scripts/build.mjs --check <file>  → falla si el build no es idéntico a <file>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'dist', 'oreja-ceo.html');

function dir(name, ext) {
  return fs.readdirSync(path.join(SRC, name))
    .filter((f) => f.endsWith(ext) && /^\d\d-/.test(f))
    .sort()
    .map((f) => fs.readFileSync(path.join(SRC, name, f), 'utf8'));
}

export function build() {
  return [
    fs.readFileSync(path.join(SRC, 'shell', 'head.html'), 'utf8'),
    '<style>\n', ...dir('styles', '.css'), '</style>\n\n',
    '<div class="wrap">\n\n', ...dir('views', '.html'), '</div>\n\n',
    '<script>\n(function(){\n', ...dir('js', '.js'), '})();\n</script>\n\n',
    '</body></html>',
  ].join('');
}

const html = build();
const i = process.argv.indexOf('--check');
if (i > 0) {
  const ref = fs.readFileSync(path.resolve(process.argv[i + 1]), 'utf8');
  if (ref !== html) {
    const a = ref.split('\n'), b = html.split('\n');
    const n = a.findIndex((l, k) => l !== b[k]);
    console.error(`El build difiere de ${process.argv[i + 1]} en la línea ${n + 1}`);
    process.exit(1);
  }
  console.log('Build idéntico a la referencia.');
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, html);
  console.log(`${path.relative(ROOT, OUT)} · ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
}
