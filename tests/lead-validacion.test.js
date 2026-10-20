import { test } from 'node:test';
import assert from 'node:assert/strict';
import { manejarLead, RANGOS_COLABORADORES as rangosServidor } from '../leads/lib/manejar-lead.js';

const modulo = () => import('../js/lead-validacion.js');
const valido = {
  nombre: 'Ana Pérez', empresa: 'Acme', correo: 'ana@empresa.com',
  whatsapp: '+52 (55) 1234-5678', colaboradores: '51–200', mensaje: '',
};

test('validarLead acepta datos válidos sin errores', async () => {
  const { validarLead } = await modulo();
  assert.deepEqual(validarLead(valido), []);
});

test('validarLead marca cada obligatorio vacío', async () => {
  const { validarLead } = await modulo();
  for (const campo of ['nombre', 'empresa', 'correo', 'whatsapp', 'colaboradores']) {
    assert.ok(validarLead({ ...valido, [campo]: '  ' }).includes(campo), campo);
  }
  assert.deepEqual(validarLead({ ...valido, nombre: '', empresa: '', correo: '', whatsapp: '', colaboradores: '' }),
    ['empresa', 'nombre', 'correo', 'whatsapp', 'colaboradores']);
});

test('validarLead revisa formato de correo', async () => {
  const { validarLead } = await modulo();
  assert.deepEqual(validarLead({ ...valido, correo: 'ana@invalido' }), ['correo']);
});

test('validarLead acepta WhatsApp internacional formateado y rechaza 9 dígitos', async () => {
  const { validarLead } = await modulo();
  assert.deepEqual(validarLead(valido), []);
  assert.deepEqual(validarLead({ ...valido, whatsapp: '123456789' }), ['whatsapp']);
});

test('validarLead rechaza colaboradores fuera del catálogo', async () => {
  const { validarLead, RANGOS_COLABORADORES } = await modulo();
  assert.deepEqual(RANGOS_COLABORADORES, ['1–50', '51–200', '201–1000', 'Más de 1000']);
  assert.deepEqual(validarLead({ ...valido, colaboradores: '1-50' }), ['colaboradores']);
});

test('validarLead rechaza mensaje de 2001 caracteres', async () => {
  const { validarLead } = await modulo();
  assert.deepEqual(validarLead({ ...valido, mensaje: 'x'.repeat(2001) }), ['mensaje']);
});

test('armarUtm combina los tres parámetros en orden', async () => {
  const { armarUtm } = await modulo();
  assert.equal(armarUtm('?utm_source=google&utm_medium=cpc&utm_campaign=octubre'), 'source=google · medium=cpc · campaign=octubre');
});

test('armarUtm admite un solo parámetro o ninguno', async () => {
  const { armarUtm } = await modulo();
  assert.equal(armarUtm('?utm_campaign=lanzamiento'), 'campaign=lanzamiento');
  assert.equal(armarUtm(''), '');
});

test('armarMailto codifica asunto y cuerpo con los datos capturados', async () => {
  const { armarMailto } = await modulo();
  const url = armarMailto(valido);
  assert.match(url, /^mailto:hernan@nominaas\.com\?subject=Quiero%20informaci%C3%B3n%20de%20NaaS&body=/);
  assert.ok(url.includes(encodeURIComponent('Nombre: Ana Pérez')));
  assert.ok(url.includes(encodeURIComponent('WhatsApp: +52 (55) 1234-5678')));
});

test('las reglas y los rangos del navegador coinciden con manejarLead', async () => {
  const { validarLead, RANGOS_COLABORADORES } = await modulo();
  assert.deepEqual(RANGOS_COLABORADORES, rangosServidor);
  const casos = [
    valido,
    { ...valido, empresa: '' },
    { ...valido, nombre: 'N'.repeat(101) },
    { ...valido, correo: 'x'.repeat(250) + '@a.com' },
    { ...valido, whatsapp: '+52 (55) 1234-5678' },
    { ...valido, colaboradores: '1-50' },
    { ...valido, mensaje: 'x'.repeat(2001) },
  ];
  for (const datos of casos) {
    const respuesta = await manejarLead({
      metodo: 'POST', origen: 'https://nominaas.com',
      cuerpo: { ...datos, pagina: '/', utm: '' },
    }, { crearLead: async () => {} });
    const servidor = respuesta.status === 201 ? [] : respuesta.body.campos;
    assert.deepEqual(validarLead(datos), servidor, JSON.stringify(datos));
  }
});
