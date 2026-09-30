// Piezas de interfaz compartidas por las calculadoras laborales (finiquito y aguinaldo).
// Solo DOM y formatos; la lógica de dinero vive en calculos-laborales.js.
// Regla: los datos se pintan con textContent o nodos creados; nunca con innerHTML.

export const $ = (id) => document.getElementById(id);

// ---- Formatos ----

const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const dosDecimales = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const hastaDosDecimales = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });

export const fmtMonto = (x) => moneda.format(x);
export const fmtDias = (x) => dosDecimales.format(x);
export const fmtNum = (x) => hastaDosDecimales.format(x);

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Fechas 'YYYY-MM-DD' como texto: sin pasar por Date local, para no mover el día por zona horaria.

/** 'YYYY-MM-DD' → { anio, mes, dia }, o null si no tiene ese formato. */
export function leerFechaIso(texto) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto || '');
  return partes ? { anio: Number(partes[1]), mes: Number(partes[2]), dia: Number(partes[3]) } : null;
}

/** (2026, 9, 3) → '2026-09-03'. */
export function aFechaIso(anio, mes, dia) {
  return `${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** 'YYYY-MM-DD' → '15 de septiembre de 2026'. */
export function fmtFecha(texto) {
  const fecha = leerFechaIso(texto);
  return fecha ? `${fecha.dia} de ${MESES[fecha.mes - 1]} de ${fecha.anio}` : texto;
}

/** Suma n días a 'YYYY-MM-DD' en calendario UTC. */
export function sumarDias(texto, n) {
  const { anio, mes, dia } = leerFechaIso(texto);
  const suma = new Date(Date.UTC(anio, mes - 1, dia + n));
  return aFechaIso(suma.getUTCFullYear(), suma.getUTCMonth() + 1, suma.getUTCDate());
}

/** Fecha local de hoy como 'YYYY-MM-DD'. */
export function hoyLocal() {
  const hoy = new Date();
  return aFechaIso(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());
}

// ---- Nodos ----

export function el(tag, opciones = {}, hijos = []) {
  const nodo = document.createElement(tag);
  if (opciones.clase) nodo.className = opciones.clase;
  if (opciones.texto !== undefined) nodo.textContent = opciones.texto;
  for (const [nombre, valor] of Object.entries(opciones.attrs || {})) nodo.setAttribute(nombre, valor);
  for (const hijo of [].concat(hijos)) if (hijo) nodo.append(hijo);
  return nodo;
}

export const icono = (nombre) => el('i', { clase: `bx ${nombre}`, attrs: { 'aria-hidden': 'true' } });

/** Fila del desglose: nombre, detalle en gris y monto a la derecha. */
export function filaConcepto(nombre, detalle, monto) {
  return el('li', { clase: 'calc-line' }, [
    el('span', { clase: 'calc-line-name' }, [
      el('span', { texto: nombre }),
      el('span', { clase: 'calc-line-detail', texto: detalle }),
    ]),
    el('span', { clase: 'calc-line-amount', texto: fmtMonto(monto) }),
  ]);
}

/** Nota bajo el resultado: 'info' o 'aviso'. */
export function nota(tipo, texto) {
  const nombreIcono = tipo === 'aviso' ? 'bx-error' : 'bx-info-circle';
  return el('p', { clase: `calc-note calc-note-${tipo}` }, [icono(nombreIcono), el('span', { texto })]);
}

/** Paso de "¿Cómo se calculó?": líneas [['t', texto] | ['f', fórmula]]. */
export function paso(titulo, lineas) {
  return el('div', { clase: 'calc-how-step' }, [
    el('h4', { texto: titulo }),
    ...lineas.map(([tipo, texto]) => el('p', { clase: tipo === 'f' ? 'calc-formula' : undefined, texto })),
  ]);
}

/** "Datos capturados" (solo se ve al imprimir): filas [[etiqueta, valor]]. */
export function pintarDatosCapturados(filas) {
  $('datosCapturados').replaceChildren(
    el('h3', { clase: 'calc-datos-title', texto: 'Datos capturados' }),
    el('dl', {}, filas.map(([etiqueta, valor]) => el('div', {}, [el('dt', { texto: etiqueta }), el('dd', { texto: valor })]))),
  );
}

// ---- Lectura del formulario ----

/** Texto capturado → número. Acepta "15,000", "$ 15000.50". Vacío → NaN. */
export function leerNumero(texto) {
  const limpio = String(texto).replace(/[\s$,]/g, '');
  if (limpio === '') return NaN;
  return /^-?\d*\.?\d+$/.test(limpio) || /^-?\d+\.$/.test(limpio) ? Number(limpio) : NaN;
}

export const valorRadio = (form, nombre) => form.querySelector(`input[name="${nombre}"]:checked`)?.value;

/**
 * Sueldo del bloque "Tu sueldo" (radios name="tipoSueldo" + input #sueldo).
 * D7: mensual ÷ 30, redondeado a centavos para que la fórmula mostrada cuadre.
 */
export function leerSueldo(form) {
  const tipo = valorRadio(form, 'tipoSueldo');
  const capturado = leerNumero($('sueldo').value);
  if (tipo === 'mensual') {
    const diario = Number.isFinite(capturado) ? Math.round((capturado / 30) * 100) / 100 : NaN;
    return { tipo, capturado, diario };
  }
  return { tipo, capturado, diario: capturado };
}

/** Etiqueta del sueldo y "Salario diario: $…" cuando se captura mensual. */
export function pintarSueldo(sueldo) {
  const mensual = sueldo.tipo === 'mensual';
  $('sueldoLabel').textContent = mensual ? 'Sueldo mensual' : 'Salario diario';
  const derivado = $('diarioDerivado');
  const mostrar = mensual && Number.isFinite(sueldo.diario) && sueldo.diario > 0;
  derivado.hidden = !mostrar;
  derivado.textContent = mostrar ? `Salario diario: ${fmtMonto(sueldo.diario)}` : '';
}

// ---- Errores por campo ----

/**
 * Pinta junto a cada control el primer error del motor para su campo, si la persona ya lo tocó.
 * `controles`: campo del motor → input o fieldset. Cada campo tiene su caja #err-<campo>.
 * Devuelve el Map campo → mensaje de los errores visibles.
 */
export function pintarErrores(errores, controles, tocados) {
  const visibles = new Map();
  for (const { campo, mensaje } of errores) {
    if (tocados.has(campo) && !visibles.has(campo)) visibles.set(campo, mensaje);
  }

  for (const [campo, control] of Object.entries(controles)) {
    const caja = $(`err-${campo}`);
    const mensaje = visibles.get(campo);
    caja.hidden = !mensaje;
    caja.replaceChildren(...(mensaje ? [icono('bx-error-circle'), document.createTextNode(` ${mensaje}`)] : []));

    const hint = control.getAttribute('aria-describedby')?.split(' ').find((id) => !id.startsWith('err-'));
    const ids = [hint];
    if (campo === 'salarioDiario' && !$('diarioDerivado').hidden) ids.push('diarioDerivado');
    if (mensaje) ids.push(`err-${campo}`);
    control.setAttribute('aria-describedby', ids.filter(Boolean).join(' '));
    if (control.tagName === 'INPUT') {
      if (mensaje) control.setAttribute('aria-invalid', 'true');
      else control.removeAttribute('aria-invalid');
    }
    control.closest('.calc-field, fieldset')?.classList.toggle('has-error', Boolean(mensaje));
  }
  return visibles;
}

/**
 * Recalcula en vivo. Un campo cuenta como "tocado" (y muestra su error) al cambiar o perder el foco.
 * `campoDeInput`: name del input → campo del motor, cuando no coinciden.
 * `alEscribir` / `alCambiar`: ganchos opcionales que corren antes de recalcular.
 */
export function conectarFormulario({ form, tocados, campoDeInput = {}, actualizar, alEscribir, alCambiar }) {
  const marcarTocado = (evento) => {
    const nombre = evento.target.name;
    if (nombre) tocados.add(campoDeInput[nombre] || nombre);
  };
  form.addEventListener('input', (e) => {
    alEscribir?.(e);
    actualizar();
  });
  form.addEventListener('change', (e) => {
    marcarTocado(e);
    alCambiar?.(e);
    actualizar();
  });
  form.addEventListener('focusout', (e) => {
    if (e.target.matches('input[type="text"], input[type="date"], input[type="number"]')) {
      marcarTocado(e);
      actualizar();
    }
  });
  form.addEventListener('submit', (e) => e.preventDefault());
}

// ---- Resultado: estados vacío / error / listo ----

/**
 * Alterna estado vacío, estado de error y resultado; limpia el resultado si no hay.
 * `vaciar`: ids de contenedores que se limpian sin resultado.
 */
export function pintarEstado({ hayResultado, erroresVisibles, vaciar }) {
  $('resultado').hidden = !hayResultado;
  $('estadoVacio').hidden = hayResultado || erroresVisibles > 0;
  $('estadoError').hidden = hayResultado || erroresVisibles === 0;
  document.querySelector('.calc-result').classList.toggle('is-ready', hayResultado);
  if (!hayResultado) {
    $('total').textContent = '—';
    $('totalAnuncio').textContent = '';
    for (const id of vaciar) $(id).replaceChildren();
  }
}

// ---- Barra fija con el total (solo con el resultado apilado) ----
// Visible si hay total válido y el encabezado del resultado no está en pantalla.
// Sin live region: el anuncio del total ya lo hace #totalAnuncio.

/** Devuelve mostrarTotal(textoMonto | null). */
export function crearBarraTotal() {
  const estado = { hayTotal: false, totalEnPantalla: true };
  const apilado = window.matchMedia('(max-width: 60rem)');
  const nodo = $('barraTotal');

  function actualizarBarra() {
    const visible = apilado.matches && estado.hayTotal && !estado.totalEnPantalla;
    nodo.hidden = !visible;
    // Espacio para que la barra no tape el final de la página (footer, CTA).
    document.body.style.paddingBottom = visible ? `${nodo.offsetHeight}px` : '';
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entrada]) => {
      estado.totalEnPantalla = entrada.isIntersecting;
      actualizarBarra();
    }, { rootMargin: '-64px 0px 0px 0px' }).observe(document.querySelector('.calc-result-top')); // 64px: header fijo
  }
  apilado.addEventListener('change', actualizarBarra);

  return function mostrarTotal(monto) {
    estado.hayTotal = monto !== null;
    $('barraTotalMonto').textContent = monto ?? '';
    actualizarBarra();
  };
}

// ---- Impresión ----

/** Botón #imprimir; al imprimir, "¿Cómo se calculó?" va abierto y al volver queda como estaba. */
export function conectarImpresion() {
  const como = $('comoSeCalculo');
  let comoEstabaAbierto = false;
  window.addEventListener('beforeprint', () => {
    comoEstabaAbierto = como.open;
    como.open = true;
  });
  window.addEventListener('afterprint', () => {
    como.open = comoEstabaAbierto;
  });
  $('imprimir').addEventListener('click', () => window.print());
}
