import { armarMailto, armarUtm, validarLead } from './lead-validacion.js?v=20261020';

const API_LEAD = 'https://naas-leads.vercel.app/api/lead';
const MENSAJES_ERROR = {
  nombre: 'Escribe tu nombre (máximo 100 caracteres).',
  empresa: 'Escribe el nombre de tu empresa (máximo 150 caracteres).',
  correo: 'Escribe un correo válido, por ejemplo ana@empresa.com (máximo 254 caracteres).',
  whatsapp: 'Escribe un WhatsApp con lada y de 10 a 15 dígitos; puedes usar espacios, guiones y paréntesis.',
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

  formulario.addEventListener('input', (evento) => {
    const nombre = evento.target.name;
    if (tocados.has(nombre)) pintarError(nombre, validarLead(datosFormulario()).includes(nombre));
  });

  formulario.addEventListener('change', (evento) => {
    const nombre = evento.target.name;
    if (tocados.has(nombre)) pintarError(nombre, validarLead(datosFormulario()).includes(nombre));
  });

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const datos = {
      ...datosFormulario(),
      pagina: window.location.pathname === '/index.html' ? '/' : (window.location.pathname || '/'),
      utm: armarUtm(window.location.search),
    };
    const invalidos = validarYMostrar(datos);
    if (invalidos.size) {
      const primero = campos.find((campo) => invalidos.has(campo));
      if (primero) formulario.elements.namedItem(primero)?.focus();
      else mostrarAlerta('No pudimos validar el origen de la solicitud. Revisa la dirección e inténtalo de nuevo.');
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
        titulo.textContent = `¡Gracias, ${datos.nombre.trim()}! Te contactaremos en menos de un día hábil.`;
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
          mostrarAlerta('Revisa tus datos e inténtalo de nuevo.');
        } else {
          for (const campo of campos) pintarError(campo, recibidos.includes(campo));
          const primero = campos.find((campo) => recibidos.includes(campo));
          if (primero) formulario.elements.namedItem(primero)?.focus();
          else mostrarAlerta('Revisa tus datos e inténtalo de nuevo.');
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

  function mostrarAlerta(texto, href) {
    const alerta = document.createElement('p');
    alerta.className = 'lead-alerta';
    alerta.setAttribute('role', 'alert');
    if (href) {
      alerta.append(document.createTextNode('No pudimos enviar tus datos. Escríbenos a '));
      const enlace = document.createElement('a');
      enlace.href = href;
      enlace.textContent = 'hernan@nominaas.com';
      alerta.append(enlace);
    } else {
      alerta.textContent = texto;
    }
    formulario.querySelector('.lead-alerta')?.remove();
    boton.insertAdjacentElement('afterend', alerta);
  }

  function mostrarFalla(datos) {
    mostrarAlerta('', armarMailto(datos));
  }
}
