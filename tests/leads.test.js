import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { manejarLead, RANGOS_COLABORADORES } from '../leads/lib/manejar-lead.js';
import { propiedadesNotion, crearCreadorDeLeads } from '../leads/lib/notion.js';

const origen = 'https://nominaas.com';
const leadValido = {
  empresa: '  Acme  ', nombre: '  Ana Pérez ', correo: ' ana@example.com ',
  whatsapp: ' +52 (55) 1234-5678 ', colaboradores: ' 51–200 ',
};
const llamada = () => {
  const llamadas = [];
  const crearLead = async (lead) => { llamadas.push(lead); };
  return { llamadas, ejecutar: (datos = {}) => manejarLead({ metodo: 'POST', origen, cuerpo: { ...leadValido, ...datos } }, { crearLead }) };
};

describe('manejarLead: transporte y CORS', () => {
  test('OPTIONS permitido responde 204 con headers CORS', async () => {
    const r = await manejarLead({ metodo: 'OPTIONS', origen, cuerpo: null }, { crearLead() {} });
    assert.equal(r.status, 204);
    assert.equal(r.headers['Access-Control-Allow-Origin'], origen);
    assert.equal(r.headers.Vary, 'Origin');
    assert.equal(r.headers['Access-Control-Allow-Methods'], 'POST, OPTIONS');
    assert.equal(r.headers['Access-Control-Allow-Headers'], 'Content-Type');
    assert.equal(r.headers['Access-Control-Max-Age'], '86400');
    assert.equal(r.body, null);
  });
  test('OPTIONS de origen ajeno responde 403', async () => {
    assert.equal((await manejarLead({ metodo: 'OPTIONS', origen: 'https://evil.com' }, { crearLead() {} })).status, 403);
  });
  test('GET responde 405 y permite POST y OPTIONS', async () => {
    const r = await manejarLead({ metodo: 'GET', origen, cuerpo: null }, { crearLead() {} });
    assert.equal(r.status, 405);
    assert.equal(r.headers.Allow, 'POST, OPTIONS');
  });
  test('POST desde origen ajeno y sin origen responde 403 sin guardar', async () => {
    const { llamadas } = llamada();
    for (const noPermitido of ['https://evil.com', undefined]) {
      const r = await manejarLead({ metodo: 'POST', origen: noPermitido, cuerpo: leadValido }, { crearLead: async (l) => llamadas.push(l) });
      assert.equal(r.status, 403);
      assert.deepEqual(r.body, { ok: false, error: 'origen' });
    }
    assert.equal(llamadas.length, 0);
  });
});

describe('manejarLead: validación y creación', () => {
  test('cuerpo null responde 400 con campos vacíos', async () => {
    const { llamadas } = llamada();
    const r = await manejarLead({ metodo: 'POST', origen, cuerpo: null }, { crearLead: async (l) => llamadas.push(l) });
    assert.equal(r.status, 400);
    assert.deepEqual(r.body, { ok: false, error: 'validacion', campos: [] });
    assert.equal(llamadas.length, 0);
  });
  test('lead válido se normaliza, conserva WhatsApp escrito y opcionales vacíos', async () => {
    const { llamadas, ejecutar } = llamada();
    const r = await ejecutar();
    assert.equal(r.status, 201);
    assert.deepEqual(llamadas, [{ empresa: 'Acme', nombre: 'Ana Pérez', correo: 'ana@example.com', whatsapp: '+52 (55) 1234-5678', colaboradores: '51–200', mensaje: '', pagina: '', utm: '' }]);
  });
  test('cada obligatorio vacío aparece en campos y varios mantienen el orden del contrato', async () => {
    const { ejecutar } = llamada();
    for (const campo of ['empresa', 'nombre', 'correo', 'whatsapp', 'colaboradores']) {
      const r = await ejecutar({ [campo]: '   ' });
      assert.equal(r.status, 400, campo);
      assert.ok(r.body.campos.includes(campo), campo);
    }
    const r = await ejecutar({ empresa: '', nombre: '', correo: '', whatsapp: '', colaboradores: '' });
    assert.deepEqual(r.body.campos, ['empresa', 'nombre', 'correo', 'whatsapp', 'colaboradores']);
  });
  test('correo inválido, WhatsApp corto o con letras y rango fuera de lista fallan', async () => {
    const { ejecutar } = llamada();
    for (const [datos, campo] of [[{ correo: 'ana@invalido' }, 'correo'], [{ whatsapp: '123456789' }, 'whatsapp'], [{ whatsapp: '12345abcde' }, 'whatsapp'], [{ colaboradores: '1-50' }, 'colaboradores']]) {
      const r = await ejecutar(datos);
      assert.equal(r.status, 400);
      assert.ok(r.body.campos.includes(campo));
    }
    assert.deepEqual(RANGOS_COLABORADORES, ['1–50', '51–200', '201–1000', 'Más de 1000']);
  });
  test('mensaje de 2001 caracteres y campo presente no string fallan', async () => {
    const { ejecutar } = llamada();
    assert.ok((await ejecutar({ mensaje: 'x'.repeat(2001) })).body.campos.includes('mensaje'));
    assert.ok((await ejecutar({ nombre: 4 })).body.campos.includes('nombre'));
  });
  test('campo trampa lleno responde éxito sin guardar', async () => {
    const { llamadas, ejecutar } = llamada();
    const r = await ejecutar({ sitio_web: 'bot' });
    assert.equal(r.status, 201);
    assert.deepEqual(r.body, { ok: true });
    assert.equal(llamadas.length, 0);
  });
  test('error de creación responde 502 y registra error sin datos personales', async () => {
    const errores = [];
    const original = console.error;
    console.error = (...args) => errores.push(args.join(' '));
    try {
      const r = await manejarLead({ metodo: 'POST', origen, cuerpo: leadValido }, { crearLead: async () => { throw new Error('notion 500 ana@example.com Ana Pérez'); } });
      assert.equal(r.status, 502);
      assert.deepEqual(r.body, { ok: false, error: 'notion' });
      assert.ok(errores.length > 0);
      assert.ok(!errores.join(' ').includes('ana@example.com'));
      assert.ok(!errores.join(' ').includes('Ana Pérez'));
    } finally { console.error = original; }
  });
  test('todas las respuestas con cuerpo declaran JSON UTF-8', async () => {
    const r = await manejarLead({ metodo: 'GET', origen, cuerpo: null }, { crearLead() {} });
    assert.equal(r.headers['Content-Type'], 'application/json; charset=utf-8');
  });
});

describe('Notion: mapeo y cliente', () => {
  const lead = { empresa: 'Acme', nombre: 'Ana', correo: 'ana@example.com', whatsapp: '+52 55 1234 5678', colaboradores: '51–200', mensaje: '', pagina: '/precios', utm: '' };
  test('propiedadesNotion produce el mapeo exacto, Estado Nuevo y texto vacío como []', () => {
    assert.deepEqual(propiedadesNotion(lead), {
      Empresa: { title: [{ text: { content: 'Acme' } }] },
      Nombre: { rich_text: [{ text: { content: 'Ana' } }] },
      Correo: { email: 'ana@example.com' }, WhatsApp: { phone_number: '+52 55 1234 5678' },
      Colaboradores: { select: { name: '51–200' } }, Mensaje: { rich_text: [] },
      Página: { rich_text: [{ text: { content: '/precios' } }] }, UTM: { rich_text: [] },
      Estado: { status: { name: 'Nuevo' } },
    });
  });
  test('crearCreadorDeLeads manda URL, POST, headers y body correctos', async () => {
    let solicitud;
    const crear = crearCreadorDeLeads({ token: 'secret', databaseId: 'db-1', fetch: async (...args) => { solicitud = args; return { ok: true, status: 200 }; } });
    await crear(lead);
    assert.equal(solicitud[0], 'https://api.notion.com/v1/pages');
    assert.equal(solicitud[1].method, 'POST');
    assert.deepEqual(solicitud[1].headers, { Authorization: 'Bearer secret', 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' });
    assert.deepEqual(JSON.parse(solicitud[1].body), { parent: { database_id: 'db-1' }, properties: propiedadesNotion(lead) });
  });
  test('error 400 de Notion lanza mensaje con status y code', async () => {
    const crear = crearCreadorDeLeads({ token: 'secret', databaseId: 'db-1', fetch: async () => ({ ok: false, status: 400, json: async () => ({ code: 'validation_error' }) }) });
    await assert.rejects(crear(lead), /400.*validation_error/);
  });
});
