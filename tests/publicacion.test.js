// Qué publica GitHub Pages: nada interno (brief, precios internos, tokens) llega a nominaas.com.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = readFileSync(new URL('../_config.yml', import.meta.url), 'utf8');
const excluidos = config.split('\n').filter((l) => /^\s*-\s/.test(l)).map((l) => l.replace(/^\s*-\s*/, '').replace(/\s+#.*$/, '').trim().replace(/^["']|["']$/g, ''));

test('_config.yml excluye la carpeta interna "NaaS Info" (precios.yaml, brief, tokens)', () => {
  assert.ok(excluidos.some((e) => e.replace(/\/$/, '') === 'NaaS Info'), `excluidos: ${excluidos.join(', ')}`);
});

test('_config.yml sigue excluyendo docs, pruebas y archivos del repo', () => {
  for (const e of ['docs/', 'tests/', 'leads/', 'CLAUDE.md', 'CONTEXT.md', 'README.md', 'package.json']) {
    assert.ok(excluidos.includes(e), `falta ${e}`);
  }
});

test('inicio, precios y partners publican el formulario de leads y el aviso', () => {
  for (const pagina of ['index.html', 'precios.html', 'partners.html']) {
    const html = readFileSync(new URL(`../${pagina}`, import.meta.url), 'utf8');
    assert.match(html, /id="formulario-lead"/, `${pagina}: falta formulario`);
    assert.match(html, /name="sitio_web"/, `${pagina}: falta honeypot`);
    assert.match(html, /href="aviso-privacidad\.html"/, `${pagina}: falta enlace al aviso`);
  }
});
