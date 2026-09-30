// Piezas de interfaz compartidas por las calculadoras laborales (finiquito y aguinaldo).
// Solo DOM y formatos; la lógica de dinero vive en calculos-laborales.js.
// Regla: los datos se pintan con textContent o nodos creados; nunca con innerHTML.
//
// Contrato con el HTML: cada página de calculadora debe tener estos elementos.
//   Formulario: radios name="tipoSueldo" (diario | mensual), #sueldo, #sueldoLabel, #diarioDerivado,
//     radios name="periodicidad" (semanal | quincenal | mensual) en un fieldset[data-campo="periodicidad"],
//     y una caja #err-<campo> por cada campo del motor que se pase a pintarErrores.
//   Resultado: .calc-result, .calc-result-top, #resultado, #estadoVacio, #estadoError, #total (neto estimado),
//     #totalSub (bruto − ISR estimado), #totalAnuncio, #desglose, #notas, #comoSeCalculo (<details>),
//     #comoSeCalculoCuerpo, #datosCapturados, #imprimir.
//   Barra fija en móvil: #barraTotal y #barraTotalMonto.
//
// Caché entre deploys: los módulos se cargan con ?v=AAAAMMDD en los <script type="module">, en el
// <link> de calculadora.css y en TODOS los imports relativos entre módulos. Al cambiar cualquier módulo
// (o calculadora.css), sube la versión en todos esos lugares a la vez para que nunca se mezclen
// un módulo nuevo y uno viejo en caché.

import { UMA_2026, SALARIO_MINIMO_2026, DIAS_PERIODO_ISR } from './calculos-laborales.js?v=20260930b';

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

/** Fila del desglose: nombre, detalle en gris y un valor ya formateado a la derecha. */
export function filaValor(nombre, detalle, valor) {
  return el('li', { clase: 'calc-line' }, [
    el('span', { clase: 'calc-line-name' }, [
      el('span', { texto: nombre }),
      el('span', { clase: 'calc-line-detail', texto: detalle }),
    ]),
    el('span', { clase: 'calc-line-amount', texto: valor }),
  ]);
}

/** Fila del desglose con un monto en pesos. */
export const filaConcepto = (nombre, detalle, monto) => filaValor(nombre, detalle, fmtMonto(monto));

/** Nota bajo el resultado: 'info' o 'aviso'. */
export function nota(tipo, texto) {
  const nombreIcono = tipo === 'aviso' ? 'bx-error' : 'bx-info-circle';
  return el('p', { clase: `calc-note calc-note-${tipo}` }, [icono(nombreIcono), el('span', { texto })]);
}

const CLASE_LINEA = { t: 'calc-how-text', f: 'calc-formula', r: 'calc-formula calc-formula-result' };

/**
 * Paso de "¿Cómo se calculó?": líneas [['t', texto] | ['f', fórmula] | ['r', fórmula con el resultado del paso]].
 * `nivel`: etiqueta del título.
 */
export function paso(titulo, lineas, nivel = 'h4') {
  return el('div', { clase: 'calc-how-step' }, [
    el(nivel, { texto: titulo }),
    ...lineas.map(([tipo, texto]) => el('p', { clase: CLASE_LINEA[tipo], texto })),
  ]);
}

/**
 * Líneas de "¿Cómo se calculó?" del aguinaldo proporcional, iguales en las dos calculadoras.
 * `aguinaldo`: salida del motor; `salarioDiario`: número; `deEmpresa`: los días los da la empresa (si no, la ley).
 * Devuelve { origen, dias, monto }: el texto "Según …" y las fórmulas ['f', …] de días y de monto.
 */
export function lineasAguinaldo(aguinaldo, salarioDiario, deEmpresa) {
  const { diasAguinaldo, diasTrabajados, dias, monto } = aguinaldo;
  return {
    origen: `Según ${deEmpresa ? 'lo que da tu empresa' : 'la ley'}, el aguinaldo es de ${fmtNum(diasAguinaldo)} días.`,
    dias: ['f', `${fmtNum(diasAguinaldo)} × ${fmtNum(diasTrabajados)} ÷ 365 = ${fmtDias(dias)} días`],
    monto: ['f', `${fmtDias(dias)} días × ${fmtMonto(salarioDiario)} = ${fmtMonto(monto)}`],
  };
}

// ---- ISR estimado y neto (spec ISR, I6–I7) ----

const redondear = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
const fmtPorcentaje = (x) => `${dosDecimales.format(x)} %`;

/**
 * Número grande = neto estimado; debajo, bruto − ISR estimado; el anuncio para lectores de pantalla
 * dice el neto. `nombre`: "Finiquito" o "Aguinaldo".
 */
export function pintarTotales(nombre, bruto, isr, neto) {
  $('total').textContent = fmtMonto(neto);
  $('totalSub').textContent = `Bruto ${fmtMonto(bruto)} − ISR estimado ${fmtMonto(isr.isr)}`;
  $('totalAnuncio').textContent = `${nombre}: recibirías aprox. ${fmtMonto(neto)} después de ISR. ` +
    `Bruto ${fmtMonto(bruto)}, ISR estimado ${fmtMonto(isr.isr)}.`;
}

/** Nota del salario mínimo (I7), o null si no aplica. */
export function notaSalarioMinimo(isr) {
  return isr.salarioMinimo
    ? nota('info', 'A quien gana el salario mínimo no se le retiene ISR, así que recibirías el monto bruto completo.')
    : null;
}

/** "Base …: $X. Renglón …" + fórmula del ISR de una base con su renglón de la tarifa. */
function lineasBase(etiqueta, calculo) {
  if (!calculo.renglon) {
    return [['t', `${etiqueta}: ${fmtMonto(calculo.base)}. Es menor al primer renglón de la tarifa, así que su ISR es $0.00.`]];
  }
  const { limiteInferior, cuotaFija, porcentaje } = calculo.renglon;
  return [
    ['t', `${etiqueta}: ${fmtMonto(calculo.base)}. Renglón de la tarifa: límite inferior ${fmtMonto(limiteInferior)}, ` +
      `cuota fija ${fmtMonto(cuotaFija)} y ${fmtPorcentaje(porcentaje)} sobre el excedente.`],
    ['f', `${fmtMonto(cuotaFija)} + (${fmtMonto(calculo.base)} − ${fmtMonto(limiteInferior)}) × ${fmtPorcentaje(porcentaje)} = ` +
      `${fmtMonto(redondear(calculo.isr))}`],
  ];
}

/**
 * Bloque "ISR estimado" de "¿Cómo se calculó?", igual en las dos calculadoras.
 * `isr`: salida del motor; `montos`: { concepto: monto bruto }; `nombres`: { concepto: etiqueta };
 * `topes`: { concepto: tope de exención } para los conceptos con parte exenta.
 * Devuelve un nodo con el título del bloque y sus pasos.
 */
export function bloqueIsr({ isr, salarioDiario, bruto, neto, montos, nombres, topes }) {
  const pasos = [];
  const tarifa = `tarifa ${isr.periodicidad} 2026`;

  if (isr.salarioMinimo) {
    pasos.push(paso('Salario mínimo', [
      ['t', `Tu salario diario (${fmtMonto(salarioDiario)}) no pasa del salario mínimo general 2026 ` +
        `(${fmtMonto(SALARIO_MINIMO_2026.general)}). A quien gana el salario mínimo no se le retiene ISR, ` +
        'así que el ISR estimado es $0.00.'],
    ], 'h5'));
  } else {
    // Parte exenta y parte gravada por concepto (I4).
    const conTope = Object.keys(montos).filter((c) => topes[c] !== undefined);
    const sinTope = Object.keys(montos).filter((c) => topes[c] === undefined);
    const topesTexto = conTope.map((c) =>
      `${nombres[c].toLowerCase()} hasta ${fmtNum(Math.round(topes[c] / UMA_2026))} UMA (${fmtMonto(topes[c])})`);
    const intro = [`Parte exenta de ISR: ${topesTexto.join(' y ')} al año (UMA 2026: ${fmtMonto(UMA_2026)} diarios).`];
    if (sinTope.length > 0) {
      const lista = sinTope.map((c, i) => (i === 0 ? nombres[c] : nombres[c].toLowerCase())).join(' y ');
      intro.push(`${lista} ${sinTope.length > 1 ? 'pagan' : 'paga'} ISR completo.`);
    }
    intro.push('Suponemos que este año no has usado esa exención.');
    const lineasExencion = [['t', intro.join(' ')]];
    for (const [concepto, monto] of Object.entries(montos)) {
      const { exento, gravado } = isr.conceptos[concepto];
      let texto;
      if (topes[concepto] === undefined) texto = `${nombres[concepto]}: ${fmtMonto(monto)} gravado completo`;
      else if (gravado === 0) texto = `${nombres[concepto]}: ${fmtMonto(monto)} exento completo`;
      else texto = `${nombres[concepto]}: ${fmtMonto(monto)} = ${fmtMonto(exento)} exento + ${fmtMonto(gravado)} gravado`;
      lineasExencion.push(['f', texto]);
    }
    const gravados = Object.keys(montos).map((c) => isr.conceptos[c].gravado);
    if (gravados.length > 1) {
      lineasExencion.push(['f', `Parte gravada total: ${gravados.map(fmtMonto).join(' + ')} = ${fmtMonto(isr.gravadoTotal)}`]);
    }
    pasos.push(paso('Parte exenta y parte gravada', lineasExencion, 'h5'));

    // Sueldo del periodo (I2).
    const dias = DIAS_PERIODO_ISR[isr.periodicidad];
    pasos.push(paso('Sueldo del periodo', [
      ['t', `Con nómina ${isr.periodicidad}, tu sueldo del periodo es tu salario diario por ${fmtNum(dias)} días.`],
      ['f', `${fmtMonto(salarioDiario)} × ${fmtNum(dias)} = ${fmtMonto(isr.sueldoPeriodo)}`],
    ], 'h5'));

    // ISR incremental con la tarifa del periodo (I1).
    let lineasTarifa;
    if (isr.gravadoTotal === 0) {
      lineasTarifa = [['t', 'Todo lo que recibes está exento, así que no se suma nada a tu sueldo del periodo ' +
        'y el ISR estimado es $0.00.']];
    } else {
      const isrOrdinario = redondear(isr.ordinario.isr);
      const isrConExtra = redondear(isr.conExtra.isr);
      const ajuste = redondear(isrConExtra - isrOrdinario) === isr.isr ? '' : ' (con todos los decimales)';
      lineasTarifa = [
        ['t', 'Se calcula el ISR de tu sueldo del periodo solo y con la parte gravada sumada; ' +
          'la diferencia es el ISR de este pago.'],
        ...lineasBase('Base ordinaria (tu sueldo del periodo)', isr.ordinario),
        ...lineasBase(`Base con la parte gravada (${fmtMonto(isr.sueldoPeriodo)} + ${fmtMonto(isr.gravadoTotal)})`, isr.conExtra),
        ['r', `ISR estimado: ${fmtMonto(isrConExtra)} − ${fmtMonto(isrOrdinario)} = ${fmtMonto(isr.isr)}${ajuste}`],
      ];
    }
    pasos.push(paso(`ISR con la ${tarifa}`, lineasTarifa, 'h5'));
  }

  pasos.push(paso('Neto estimado', [['r', `${fmtMonto(bruto)} − ${fmtMonto(isr.isr)} = ${fmtMonto(neto)}`]], 'h5'));

  return el('section', { clase: 'calc-how-group', attrs: { 'aria-labelledby': 'comoIsrTitulo' } }, [
    el('h4', { clase: 'calc-how-group-title', texto: 'ISR estimado', attrs: { id: 'comoIsrTitulo' } }),
    ...pasos,
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

const VACIAR_SIN_RESULTADO = ['desglose', 'notas', 'comoSeCalculoCuerpo', 'datosCapturados'];
const TOTAL_SUB_VACIO = 'Neto después de ISR estimado';

/**
 * Alterna estado vacío, estado de error y resultado; limpia el resultado si no hay.
 * `vaciar`: ids de contenedores que se limpian sin resultado (por defecto, los del contrato de arriba).
 */
export function pintarEstado({ hayResultado, erroresVisibles, vaciar = VACIAR_SIN_RESULTADO }) {
  $('resultado').hidden = !hayResultado;
  $('estadoVacio').hidden = hayResultado || erroresVisibles > 0;
  $('estadoError').hidden = hayResultado || erroresVisibles === 0;
  document.querySelector('.calc-result').classList.toggle('is-ready', hayResultado);
  if (!hayResultado) {
    $('total').textContent = '—';
    $('totalSub').textContent = TOTAL_SUB_VACIO;
    $('totalAnuncio').textContent = '';
    for (const id of vaciar) $(id).replaceChildren();
  }
}

// ---- Barra fija con el neto estimado (solo con el resultado apilado) ----
// Visible si hay total válido y el encabezado del resultado no está en pantalla.
// Sin live region: el anuncio del total ya lo hace #totalAnuncio.

/** Devuelve mostrarTotal(textoMonto | null); se le pasa el neto estimado ya formateado. */
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
