export const RANGOS_COLABORADORES = Object.freeze(['1–50', '51–200', '201–1000', 'Más de 1000']);

const ORIGENES_PERMITIDOS = new Set([
  'https://nominaas.com',
  'https://www.nominaas.com',
  'http://localhost:8000',
]);
const ORDEN_CAMPOS = ['empresa', 'nombre', 'correo', 'whatsapp', 'colaboradores', 'mensaje', 'pagina', 'utm'];
const LONGITUDES = { empresa: 150, nombre: 100, correo: 254, mensaje: 2000, pagina: 200, utm: 300 };
const encabezadosJson = { 'Content-Type': 'application/json; charset=utf-8' };

function respuesta(status, headers, body) {
  return { status, headers: body === null ? headers : { ...headers, ...encabezadosJson }, body };
}

function camposInvalidos(cuerpo) {
  return ORDEN_CAMPOS.filter((campo) => {
    const presente = Object.hasOwn(cuerpo, campo);
    const valor = presente ? cuerpo[campo] : '';
    if (typeof valor !== 'string') return true;
    const texto = valor.trim();
    if (campo === 'empresa' || campo === 'nombre' || campo === 'correo' || campo === 'whatsapp' || campo === 'colaboradores') {
      if (!texto) return true;
    }
    if (LONGITUDES[campo] && texto.length > LONGITUDES[campo]) return true;
    if (campo === 'correo' && texto && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto)) return true;
    if (campo === 'whatsapp' && texto) {
      const normalizado = texto.replace(/[\s\-()]/g, '').replace(/^\+/, '');
      if (!/^\d{10,15}$/.test(normalizado)) return true;
    }
    if (campo === 'colaboradores' && texto && !RANGOS_COLABORADORES.includes(texto)) return true;
    return false;
  });
}

export async function manejarLead({ metodo, origen, cuerpo }, { crearLead }) {
  const headers = {};
  if (ORIGENES_PERMITIDOS.has(origen)) {
    headers['Access-Control-Allow-Origin'] = origen;
    headers.Vary = 'Origin';
  }

  if (metodo === 'OPTIONS') {
    if (!ORIGENES_PERMITIDOS.has(origen)) return respuesta(403, headers, { ok: false, error: 'origen' });
    return respuesta(204, {
      ...headers,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }, null);
  }
  if (metodo !== 'POST') return respuesta(405, { ...headers, Allow: 'POST, OPTIONS' }, { ok: false, error: 'metodo' });
  if (!ORIGENES_PERMITIDOS.has(origen)) return respuesta(403, headers, { ok: false, error: 'origen' });
  if (cuerpo === null || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) {
    return respuesta(400, headers, { ok: false, error: 'validacion', campos: [] });
  }
  if (typeof cuerpo.sitio_web === 'string' && cuerpo.sitio_web.trim()) return respuesta(201, headers, { ok: true });

  const campos = camposInvalidos(cuerpo);
  if (campos.length) return respuesta(400, headers, { ok: false, error: 'validacion', campos });

  const lead = Object.fromEntries(ORDEN_CAMPOS.map((campo) => [campo, (cuerpo[campo] ?? '').trim()]));
  try {
    await crearLead(lead);
    return respuesta(201, headers, { ok: true });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    const resumen = mensaje.match(/notion\s+(\d{3})(?:\s+([a-z_]+))?/i);
    console.error(resumen ? `notion ${resumen[1]}${resumen[2] ? ` ${resumen[2]}` : ''}` : 'Error al crear lead en Notion');
    return respuesta(502, headers, { ok: false, error: 'notion' });
  }
}
