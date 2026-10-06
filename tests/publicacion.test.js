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
  for (const e of ['docs/', 'tests/', 'CLAUDE.md', 'CONTEXT.md', 'README.md', 'package.json']) {
    assert.ok(excluidos.includes(e), `falta ${e}`);
  }
});
