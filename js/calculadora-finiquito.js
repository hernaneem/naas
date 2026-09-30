// Interfaz de la calculadora de finiquito: lee el formulario, llama al motor y pinta.
// Toda la lógica de dinero vive en calculos-laborales.js. Aquí solo hay DOM.
// Regla: los datos se pintan con textContent o nodos creados; nunca con innerHTML.
import { anioDeServicio, calcularFiniquito, diasVacacionesLey, MINIMOS_LEY } from './calculos-laborales.js';

const $ = (id) => document.getElementById(id);

const form = $('calcForm');
const campos = {
  sueldo: $('sueldo'),
  fechaAntiguedad: $('fechaAntiguedad'),
  fechaBaja: $('fechaBaja'),
  vacacionesTomadas: $('vacacionesTomadas'),
  vacacionesPendientes: $('vacacionesPendientes'),
  prestacionesSuperiores: $('prestacionesSuperiores'),
  diasAguinaldo: $('diasAguinaldo'),
  primaVacacional: $('primaVacacional'),
  diasVacaciones: $('diasVacaciones'),
};

// Campo del motor → input al que se ancla el mensaje de error.
const INPUT_DE_CAMPO = {
  salarioDiario: campos.sueldo,
  fechaAntiguedad: campos.fechaAntiguedad,
  fechaBaja: campos.fechaBaja,
  periodicidad: form.querySelector('fieldset[data-campo="periodicidad"]'),
  vacacionesTomadas: campos.vacacionesTomadas,
  vacacionesPendientes: campos.vacacionesPendientes,
  diasAguinaldo: campos.diasAguinaldo,
  primaVacacional: campos.primaVacacional,
  diasVacaciones: campos.diasVacaciones,
};

// Solo mostramos errores de campos que la persona ya tocó. Los que vienen
// precargados (fecha de baja, periodicidad, opcionales, prestaciones) cuentan como tocados.
const tocados = new Set([
  'fechaBaja', 'periodicidad', 'vacacionesTomadas', 'vacacionesPendientes',
  'diasAguinaldo', 'primaVacacional', 'diasVacaciones',
]);
const CAMPO_DE_INPUT = { sueldo: 'salarioDiario' };

let diasVacacionesEditado = false;

// ---- Formatos ----

const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const dosDecimales = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const hastaDosDecimales = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });

const fmtMonto = (x) => moneda.format(x);
const fmtDias = (x) => dosDecimales.format(x);
const fmtNum = (x) => hastaDosDecimales.format(x);

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Fechas 'YYYY-MM-DD' como texto: sin pasar por Date local, para no mover el día por zona horaria.

/** 'YYYY-MM-DD' → { anio, mes, dia }, o null si no tiene ese formato. */
function leerFechaIso(texto) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto || '');
  return partes ? { anio: Number(partes[1]), mes: Number(partes[2]), dia: Number(partes[3]) } : null;
}

/** (2026, 9, 3) → '2026-09-03'. */
function aFechaIso(anio, mes, dia) {
  return `${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** 'YYYY-MM-DD' → '15 de septiembre de 2026'. */
function fmtFecha(texto) {
  const fecha = leerFechaIso(texto);
  return fecha ? `${fecha.dia} de ${MESES[fecha.mes - 1]} de ${fecha.anio}` : texto;
}

/** Suma n días a 'YYYY-MM-DD' en calendario UTC. */
function sumarDias(texto, n) {
  const { anio, mes, dia } = leerFechaIso(texto);
  const suma = new Date(Date.UTC(anio, mes - 1, dia + n));
  return aFechaIso(suma.getUTCFullYear(), suma.getUTCMonth() + 1, suma.getUTCDate());
}

function hoyLocal() {
  const hoy = new Date();
  return aFechaIso(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());
}

// ---- Nodos ----

function el(tag, opciones = {}, hijos = []) {
  const nodo = document.createElement(tag);
  if (opciones.clase) nodo.className = opciones.clase;
  if (opciones.texto !== undefined) nodo.textContent = opciones.texto;
  for (const [nombre, valor] of Object.entries(opciones.attrs || {})) nodo.setAttribute(nombre, valor);
  for (const hijo of [].concat(hijos)) if (hijo) nodo.append(hijo);
  return nodo;
}

const icono = (nombre) => el('i', { clase: `bx ${nombre}`, attrs: { 'aria-hidden': 'true' } });

// ---- Lectura del formulario ----

/** Texto capturado → número. Acepta "15,000", "$ 15000.50". Vacío → NaN. */
function leerNumero(texto) {
  const limpio = String(texto).replace(/[\s$,]/g, '');
  if (limpio === '') return NaN;
  return /^-?\d*\.?\d+$/.test(limpio) || /^-?\d+\.$/.test(limpio) ? Number(limpio) : NaN;
}

function leerOpcional(input) {
  return input.value.trim() === '' ? 0 : leerNumero(input.value);
}

const valorRadio = (nombre) => form.querySelector(`input[name="${nombre}"]:checked`)?.value;

function leerSueldo() {
  const tipo = valorRadio('tipoSueldo');
  const capturado = leerNumero(campos.sueldo.value);
  if (tipo === 'mensual') {
    // D7: mensual ÷ 30, redondeado a centavos para que la fórmula mostrada cuadre.
    const diario = Number.isFinite(capturado) ? Math.round((capturado / 30) * 100) / 100 : NaN;
    return { tipo, capturado, diario };
  }
  return { tipo, capturado, diario: capturado };
}

function sincronizarDiasVacacionesLey() {
  const anio = anioDeServicio(campos.fechaAntiguedad.value, campos.fechaBaja.value);
  if (anio === null) return;
  const minimo = diasVacacionesLey(anio);
  $('diasVacacionesHint').textContent = `Mínimo de ley para tu año de servicio ${anio}: ${minimo}.`;
  campos.diasVacaciones.min = String(minimo);
  if (!diasVacacionesEditado) campos.diasVacaciones.value = String(minimo);
}

function leerEntrada() {
  const sueldo = leerSueldo();
  const conPrestaciones = campos.prestacionesSuperiores.checked;
  return {
    sueldo,
    entrada: {
      salarioDiario: sueldo.diario,
      fechaAntiguedad: campos.fechaAntiguedad.value,
      fechaBaja: campos.fechaBaja.value,
      periodicidad: valorRadio('periodicidad'),
      vacacionesTomadas: leerOpcional(campos.vacacionesTomadas),
      vacacionesPendientes: leerOpcional(campos.vacacionesPendientes),
      prestaciones: conPrestaciones
        ? {
          diasAguinaldo: leerNumero(campos.diasAguinaldo.value),
          primaVacacional: leerNumero(campos.primaVacacional.value),
          diasVacaciones: leerNumero(campos.diasVacaciones.value),
        }
        : null,
    },
  };
}

// ---- Pintado del formulario ----

function pintarSueldo(sueldo) {
  const mensual = sueldo.tipo === 'mensual';
  $('sueldoLabel').textContent = mensual ? 'Sueldo mensual' : 'Salario diario';
  const derivado = $('diarioDerivado');
  const mostrar = mensual && Number.isFinite(sueldo.diario) && sueldo.diario > 0;
  derivado.hidden = !mostrar;
  derivado.textContent = mostrar ? `Salario diario: ${fmtMonto(sueldo.diario)}` : '';
}

function pintarErrores(errores) {
  const visibles = new Map();
  for (const { campo, mensaje } of errores) {
    if (tocados.has(campo) && !visibles.has(campo)) visibles.set(campo, mensaje);
  }

  for (const [campo, control] of Object.entries(INPUT_DE_CAMPO)) {
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

  // Un error dentro de un panel colapsado tiene que verse.
  if (visibles.has('vacacionesTomadas') || visibles.has('vacacionesPendientes')) {
    $('vacacionesOpcionales').open = true;
  }
  return visibles.size;
}

// ---- Pintado del resultado ----

function filaConcepto(nombre, detalle, monto) {
  return el('li', { clase: 'calc-line' }, [
    el('span', { clase: 'calc-line-name' }, [
      el('span', { texto: nombre }),
      el('span', { clase: 'calc-line-detail', texto: detalle }),
    ]),
    el('span', { clase: 'calc-line-amount', texto: fmtMonto(monto) }),
  ]);
}

function nota(tipo, texto) {
  const nombreIcono = tipo === 'aviso' ? 'bx-error' : 'bx-info-circle';
  return el('p', { clase: `calc-note calc-note-${tipo}` }, [icono(nombreIcono), el('span', { texto })]);
}

function paso(titulo, lineas) {
  return el('div', { clase: 'calc-how-step' }, [
    el('h4', { texto: titulo }),
    ...lineas.map(([tipo, texto]) => el('p', { clase: tipo === 'f' ? 'calc-formula' : undefined, texto })),
  ]);
}

/** Las fechas 'YYYY-MM-DD' se comparan bien como texto. */
const sinPagoDesdeAntiguedad = (pagadoHasta, fechaAntiguedad) => pagadoHasta < fechaAntiguedad;

/**
 * La suposición del sueldo pendiente (D1). Si el periodo pagado termina después de la baja, se dice así;
 * si es anterior a la fecha de antigüedad (D11), no se muestra esa fecha.
 */
function textoPagadoHasta(pagadoHasta, fechaAntiguedad, fechaBaja) {
  if (sinPagoDesdeAntiguedad(pagadoHasta, fechaAntiguedad)) {
    return `Suponemos que aún no te han pagado nada desde tu fecha de antigüedad (${fmtFecha(fechaAntiguedad)}), ` +
      'así que se cuentan todos los días que trabajaste.';
  }
  if (pagadoHasta > fechaBaja) {
    return `Suponemos que tu último pago ya cubrió tu fecha de baja (su periodo termina el ${fmtFecha(pagadoHasta)}).`;
  }
  return `Suponemos que tu último pago cubrió hasta el ${fmtFecha(pagadoHasta)}.`;
}

function pintarComoSeCalculo(entrada, resultado) {
  const { sueldoPendiente, vacaciones, primaVacacional, aguinaldo } = resultado.conceptos;
  const salarioDiario = fmtMonto(entrada.salarioDiario);
  const origen = entrada.prestaciones ? 'lo que da tu empresa' : 'la ley';
  const nomina = `Con nómina ${entrada.periodicidad}`;
  const { pagadoHasta } = sueldoPendiente;

  const suposicion = sinPagoDesdeAntiguedad(pagadoHasta, entrada.fechaAntiguedad)
    ? 'suponemos que aún no te han pagado nada desde tu fecha de antigüedad.'
    : `suponemos que tu último pago cubrió hasta el ${fmtFecha(pagadoHasta)}.`;
  const lineasSueldo = sueldoPendiente.dias > 0
    ? [
      ['t', `${nomina}, ${suposicion} Del ${fmtFecha(sumarDias(pagadoHasta, 1))} ` +
        `al ${fmtFecha(entrada.fechaBaja)} van ${fmtNum(sueldoPendiente.dias)} días.`],
      ['f', `${fmtNum(sueldoPendiente.dias)} días × ${salarioDiario} = ${fmtMonto(sueldoPendiente.monto)}`],
    ]
    : [['t', `${nomina}: ${textoPagadoHasta(pagadoHasta, entrada.fechaAntiguedad, entrada.fechaBaja)} ` +
      'No hay sueldo pendiente.']];

  const brutas = (vacaciones.diasAnio * vacaciones.diasTranscurridos) / 365;
  const lineasVacaciones = [
    ['t', `Vas en tu año de servicio ${vacaciones.anioServicio}; según ${origen} te tocan ` +
      `${fmtNum(vacaciones.diasAnio)} días de vacaciones. De tu último aniversario, el ` +
      `${fmtFecha(vacaciones.ultimoAniversario)}, a tu baja van ${fmtNum(vacaciones.diasTranscurridos)} días.`],
    ['f', `Proporcionales: ${fmtNum(vacaciones.diasAnio)} × ${fmtNum(vacaciones.diasTranscurridos)} ÷ 365 = ` +
      `${fmtDias(brutas)} días`],
  ];
  if (vacaciones.tomadas > 0) {
    lineasVacaciones.push(['f', `Menos las que ya tomaste: ${fmtDias(brutas)} − ${fmtDias(vacaciones.tomadas)} = ` +
      `${fmtDias(vacaciones.proporcionales)} días${vacaciones.notaNegativo ? ' (no baja de 0)' : ''}`]);
  }
  if (vacaciones.pendientes > 0) {
    lineasVacaciones.push(['f', `Más las pendientes: ${fmtDias(vacaciones.proporcionales)} + ` +
      `${fmtDias(vacaciones.pendientes)} = ${fmtDias(vacaciones.dias)} días`]);
  }
  lineasVacaciones.push(['f', `${fmtDias(vacaciones.dias)} días × ${salarioDiario} = ${fmtMonto(vacaciones.monto)}`]);

  const lineasPrima = [
    ['f', `${fmtNum(primaVacacional.porcentaje)} % × ${fmtDias(primaVacacional.dias)} días × ${salarioDiario} = ` +
      `${fmtMonto(primaVacacional.monto)}`],
  ];

  const lineasAguinaldo = [
    ['t', `Del ${fmtFecha(aguinaldo.desde)} a tu baja trabajaste ${fmtNum(aguinaldo.diasTrabajados)} días de este año. ` +
      `Según ${origen}, el aguinaldo es de ${fmtNum(aguinaldo.diasAguinaldo)} días.`],
    ['f', `${fmtNum(aguinaldo.diasAguinaldo)} × ${fmtNum(aguinaldo.diasTrabajados)} ÷ 365 = ${fmtDias(aguinaldo.dias)} días`],
    ['f', `${fmtDias(aguinaldo.dias)} días × ${salarioDiario} = ${fmtMonto(aguinaldo.monto)}`],
  ];

  const sumandos = [sueldoPendiente, vacaciones, primaVacacional, aguinaldo].map((concepto) => fmtMonto(concepto.monto));
  const lineasTotal = [
    ['f', `${sumandos.join(' + ')} = ${fmtMonto(resultado.total)}`],
    ['t', 'Los días se muestran con 2 decimales pero se calculan completos; cada concepto se redondea a centavos ' +
      'y el total es la suma de esos montos.'],
  ];

  $('comoSeCalculoCuerpo').replaceChildren(
    paso('Sueldo pendiente', lineasSueldo),
    paso('Vacaciones', lineasVacaciones),
    paso('Prima vacacional', lineasPrima),
    paso('Aguinaldo proporcional', lineasAguinaldo),
    paso('Total', lineasTotal),
  );
}

function pintarDatosCapturados(entrada, sueldo) {
  const filas = [];
  if (sueldo.tipo === 'mensual') filas.push(['Sueldo mensual', fmtMonto(sueldo.capturado)]);
  filas.push(
    ['Salario diario', fmtMonto(entrada.salarioDiario)],
    ['Fecha de antigüedad', fmtFecha(entrada.fechaAntiguedad)],
    ['Fecha de baja', fmtFecha(entrada.fechaBaja)],
    ['Periodicidad', entrada.periodicidad.charAt(0).toUpperCase() + entrada.periodicidad.slice(1)],
    ['Vacaciones ya tomadas en tu año actual', `${fmtDias(entrada.vacacionesTomadas)} días`],
    ['Vacaciones pendientes de años anteriores', `${fmtDias(entrada.vacacionesPendientes)} días`],
  );
  const prestaciones = entrada.prestaciones;
  filas.push(['Prestaciones', prestaciones
    ? `Superiores: ${fmtNum(prestaciones.diasAguinaldo)} días de aguinaldo, ` +
      `${fmtNum(prestaciones.primaVacacional)} % de prima vacacional, ${fmtNum(prestaciones.diasVacaciones)} días de vacaciones`
    : `De ley: ${MINIMOS_LEY.diasAguinaldo} días de aguinaldo, ${MINIMOS_LEY.primaVacacional} % de prima vacacional`]);
  filas.push(['Calculado el', fmtFecha(hoyLocal())]);

  $('datosCapturados').replaceChildren(
    el('h3', { clase: 'calc-datos-title', texto: 'Datos capturados' }),
    el('dl', {}, filas.map(([etiqueta, valor]) => el('div', {}, [el('dt', { texto: etiqueta }), el('dd', { texto: valor })]))),
  );
}

function pintarResultado(entrada, sueldo, resultado, erroresVisibles) {
  const hayResultado = resultado.valido;
  $('resultado').hidden = !hayResultado;
  $('estadoVacio').hidden = hayResultado || erroresVisibles > 0;
  $('estadoError').hidden = hayResultado || erroresVisibles === 0;
  document.querySelector('.calc-result').classList.toggle('is-ready', hayResultado);

  if (!hayResultado) {
    $('total').textContent = '—';
    $('totalAnuncio').textContent = '';
    for (const id of ['desglose', 'notas', 'comoSeCalculoCuerpo', 'datosCapturados']) $(id).replaceChildren();
    return;
  }

  const { sueldoPendiente, vacaciones, primaVacacional, aguinaldo } = resultado.conceptos;
  $('total').textContent = fmtMonto(resultado.total);
  $('totalAnuncio').textContent = `Finiquito estimado: ${fmtMonto(resultado.total)}`;

  const detalleVac = vacaciones.pendientes > 0
    ? `${fmtDias(vacaciones.dias)} días (${fmtDias(vacaciones.proporcionales)} proporcionales + ${fmtDias(vacaciones.pendientes)} pendientes)`
    : `${fmtDias(vacaciones.dias)} días proporcionales`;

  $('desglose').replaceChildren(
    filaConcepto('Sueldo pendiente', `${fmtDias(sueldoPendiente.dias)} días`, sueldoPendiente.monto),
    filaConcepto('Vacaciones', detalleVac, vacaciones.monto),
    filaConcepto('Prima vacacional', `${fmtNum(primaVacacional.porcentaje)} % sobre ${fmtDias(primaVacacional.dias)} días`, primaVacacional.monto),
    filaConcepto('Aguinaldo proporcional', `${fmtDias(aguinaldo.dias)} días`, aguinaldo.monto),
  );

  const notas = [nota('info', textoPagadoHasta(sueldoPendiente.pagadoHasta, entrada.fechaAntiguedad, entrada.fechaBaja))];
  if (vacaciones.notaNegativo) notas.push(nota('info', vacaciones.notaNegativo));
  for (const aviso of resultado.avisos) notas.push(nota('aviso', aviso.mensaje));
  $('notas').replaceChildren(...notas);

  pintarComoSeCalculo(entrada, resultado);
  pintarDatosCapturados(entrada, sueldo);
}

// ---- Ciclo ----

function actualizar() {
  sincronizarDiasVacacionesLey();
  const { sueldo, entrada } = leerEntrada();
  pintarSueldo(sueldo);
  const resultado = calcularFiniquito(entrada);
  const visibles = pintarErrores(resultado.errores);
  pintarResultado(entrada, sueldo, resultado, visibles);
}

function marcarTocado(evento) {
  const nombre = evento.target.name;
  if (!nombre) return;
  tocados.add(CAMPO_DE_INPUT[nombre] || nombre);
}

form.addEventListener('input', (e) => {
  if (e.target === campos.diasVacaciones) diasVacacionesEditado = true;
  actualizar();
});
form.addEventListener('change', (e) => {
  marcarTocado(e);
  if (e.target === campos.prestacionesSuperiores) {
    $('prestacionesCampos').hidden = !campos.prestacionesSuperiores.checked;
  }
  actualizar();
});
form.addEventListener('focusout', (e) => {
  if (e.target.matches('input[type="text"], input[type="date"], input[type="number"]')) {
    marcarTocado(e);
    actualizar();
  }
});
form.addEventListener('submit', (e) => e.preventDefault());

// Al imprimir, el desglose de fórmulas va abierto; al volver, como estaba.
let comoEstabaAbierto = false;
window.addEventListener('beforeprint', () => {
  comoEstabaAbierto = $('comoSeCalculo').open;
  $('comoSeCalculo').open = true;
});
window.addEventListener('afterprint', () => {
  $('comoSeCalculo').open = comoEstabaAbierto;
});
$('imprimir').addEventListener('click', () => window.print());

// Estado inicial: fecha de baja = hoy (fecha local) y quincenal.
campos.fechaBaja.value = hoyLocal();
campos.prestacionesSuperiores.checked = false;
$('prestacionesCampos').hidden = true;
actualizar();
