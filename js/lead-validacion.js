export const RANGOS_COLABORADORES = Object.freeze(['1–50', '51–200', '201–1000', 'Más de 1000']);

const ORDEN_CAMPOS = ['empresa', 'nombre', 'correo', 'whatsapp', 'colaboradores', 'mensaje', 'pagina', 'utm'];
export const LONGITUDES = Object.freeze({ empresa: 150, nombre: 100, correo: 254, whatsapp: 30, mensaje: 2000, pagina: 200, utm: 300 });

/** Devuelve, en el orden del contrato del servidor, los campos que no pasan validación. */
export function validarLead(datos = {}) {
  return ORDEN_CAMPOS.filter((campo) => {
    const presente = Object.hasOwn(datos, campo);
    const valor = presente ? datos[campo] : '';
    if (typeof valor !== 'string') return true;
    const texto = valor.trim();
    if (['empresa', 'nombre', 'correo', 'whatsapp', 'colaboradores'].includes(campo) && !texto) return true;
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

/** Forma el atributo UTM con los parámetros presentes, manteniendo el orden de la campaña. */
export function armarUtm(busqueda = '') {
  const parametros = busqueda instanceof URLSearchParams
    ? busqueda
    : new URLSearchParams(String(busqueda).replace(/^\?/, ''));
  return ['source', 'medium', 'campaign']
    .map((nombre) => {
      const clave = `utm_${nombre}`;
      return parametros.has(clave) ? `${nombre}=${parametros.get(clave)}` : '';
    })
    .filter(Boolean)
    .join(' · ');
}

/** Crea una alternativa de correo con todos los datos capturados codificados en la URL. */
export function armarMailto(datos = {}) {
  const cuerpo = [
    `Nombre: ${datos.nombre || ''}`,
    `Empresa: ${datos.empresa || ''}`,
    `Correo: ${datos.correo || ''}`,
    `WhatsApp: ${datos.whatsapp || ''}`,
    `Colaboradores: ${datos.colaboradores || ''}`,
    `Mensaje: ${datos.mensaje || ''}`,
  ].join('\n');
  return `mailto:hernan@nominaas.com?subject=${encodeURIComponent('Quiero información de NaaS')}&body=${encodeURIComponent(cuerpo)}`;
}
