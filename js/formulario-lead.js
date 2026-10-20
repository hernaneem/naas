import { armarMailto, armarUtm, LONGITUDES, validarLead } from './lead-validacion.js?v=20261020b';

const API_LEAD = 'https://naas-leads.vercel.app/api/lead';
const MENSAJES_ERROR = {
  nombre: 'Escribe tu nombre.',
  empresa: 'Escribe el nombre de tu empresa.',
  correo: 'Escribe un correo válido, por ejemplo ana@empresa.com.',
  whatsapp: 'Escribe un WhatsApp de 10 a 15 dígitos (máximo 30 caracteres).',
  colaboradores: 'Selecciona un rango de colaboradores.',
  mensaje: 'Escribe un mensaje de máximo 2000 caracteres.',
};

const formulario = document.querySelector('#formulario-lead');

if (formulario) {
  const boton = formulario.querySelector('[type="submit"]');
  const campos = ['nombre', 'empresa', 'correo', 'whatsapp', 'colaboradores', 'mensaje'];
  const tocados = new Set();

  function datosFormulario() {
    return Object.fromEntries([...new FormData(formulario)].map(([clave, valor]) => [clave, String(valor)]));
  }

  function pintarError(campo, invalido) {
    const control = formulario.elements.namedItem(campo);
    if (!control) return;
    const idError = `error-${campo}`;
    let mensaje = formulario.querySelector(`#${idError}`);
    if (invalido) {
      if (!mensaje) {
        mensaje = document.createElement('span');
        mensaje.id = idError;
        mensaje.className = 'lead-error';
        control.insertAdjacentElement('afterend', mensaje);
      }
      mensaje.textContent = MENSAJES_ERROR[campo] || 'Revisa este dato.';
      control.setAttribute('aria-invalid', 'true');
      control.setAttribute('aria-describedby', idError);
    } else {
      mensaje?.remove();
      control.removeAttribute('aria-invalid');
      control.removeAttribute('aria-describedby');
    }
  }

  function validarYMostrar(datos = datosFormulario()) {
    const invalidos = new Set(validarLead(datos));
    for (const campo of campos) pintarError(campo, invalidos.has(campo));
    return invalidos;
  }

  formulario.addEventListener('focusout', (evento) => {
    const nombre = evento.target.name;
    if (!campos.includes(nombre)) return;
    tocados.add(nombre);
    pintarError(nombre, validarLead(datosFormulario()).includes(nombre));
  });

  function revalidarAlCambiar(evento) {
    const nombre = evento.target.name;
    if (tocados.has(nombre)) pintarError(nombre, validarLead(datosFormulario()).includes(nombre));
  }
  formulario.addEventListener('input', revalidarAlCambiar);
  formulario.addEventListener('change', revalidarAlCambiar);

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const datos = {
      ...datosFormulario(),
      // recortados al límite del servidor: una URL de campaña larga no debe impedir el envío
      pagina: (window.location.pathname === '/index.html' ? '/' : (window.location.pathname || '/')).slice(0, LONGITUDES.pagina),
      utm: armarUtm(window.location.search).slice(0, LONGITUDES.utm),
    };
    const invalidos = validarYMostrar(datos);
    if (invalidos.size) {
      const primero = campos.find((campo) => invalidos.has(campo));
      if (primero) formulario.elements.namedItem(primero)?.focus();
      return;
    }

    const alertaAnterior = formulario.querySelector('[role="alert"]');
    alertaAnterior?.remove();
    boton.disabled = true;
    boton.textContent = 'Enviando…';

    try {
      const respuesta = await fetch(API_LEAD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...datos,
        }),
      });

      if (respuesta.status === 201) {
        const confirmacion = document.createElement('div');
        confirmacion.className = 'lead-confirmacion';
        confirmacion.setAttribute('role', 'status');
        confirmacion.setAttribute('tabindex', '-1');
        const titulo = document.createElement('h3');
        titulo.textContent = `¡Gracias, ${datos.nombre.trim()}! Te contactaremos muy pronto.`;
        const agenda = document.createElement('a');
        agenda.className = 'btn-primary btn-primary-lg';
        agenda.href = 'https://cal.com/hernaneem/reunion-naas';
        agenda.target = '_blank';
        agenda.rel = 'noopener';
        agenda.textContent = 'Agenda tu demo ahora';
        confirmacion.append(titulo, agenda);
        formulario.replaceWith(confirmacion);
        confirmacion.focus();
        return;
      }

      if (respuesta.status === 400) {
        const resultado = await respuesta.json().catch(() => ({}));
        const recibidos = Array.isArray(resultado.campos) ? resultado.campos : [];
        if (!recibidos.length) {
          mostrarFalla(datos);
        } else {
          for (const campo of campos) pintarError(campo, recibidos.includes(campo));
          const primero = campos.find((campo) => recibidos.includes(campo));
          if (primero) formulario.elements.namedItem(primero)?.focus();
          else mostrarFalla(datos);
        }
      } else {
        mostrarFalla(datos);
      }
    } catch {
      mostrarFalla(datos);
    } finally {
      if (formulario.isConnected) {
        boton.disabled = false;
        boton.textContent = 'Quiero que me contacten';
      }
    }
  });

  function insertarAlerta(alerta) {
    formulario.querySelector('.lead-alerta')?.remove();
    boton.insertAdjacentElement('afterend', alerta);
  }

  function mostrarAlerta(texto) {
    const alerta = crearAlertaTexto(texto);
    insertarAlerta(alerta);
  }

  function mostrarFalla(datos) {
    const alerta = crearAlertaTexto('No pudimos enviar tus datos. Escríbenos a ');
    const enlace = document.createElement('a');
    enlace.href = armarMailto(datos);
    enlace.textContent = 'hernan@nominaas.com';
    alerta.append(enlace);
    insertarAlerta(alerta);
  }

  function crearAlertaTexto(texto) {
    const alerta = document.createElement('p');
    alerta.className = 'lead-alerta';
    alerta.setAttribute('role', 'alert');
    alerta.textContent = texto;
    return alerta;
  }
}
