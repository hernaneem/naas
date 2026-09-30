// Interfaz de la calculadora de finiquito: lee el formulario, llama al motor y pinta.
// Toda la lógica de dinero vive en calculos-laborales.js; las piezas comunes de UI, en ui-calculadoras.js.
// Regla: los datos se pintan con textContent o nodos creados; nunca con innerHTML.
import { anioDeServicio, calcularFiniquito, diasVacacionesLey, MINIMOS_LEY } from './calculos-laborales.js';
import {
  $, fmtMonto, fmtDias, fmtNum, fmtFecha, sumarDias, hoyLocal, filaConcepto, nota, paso, lineasAguinaldo,
  leerNumero, valorRadio, leerSueldo, pintarSueldo, pintarErrores, pintarDatosCapturados,
  pintarEstado, conectarFormulario, crearBarraTotal, conectarImpresion,
} from './ui-calculadoras.js';

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

// ---- Lectura del formulario ----

function leerOpcional(input) {
  return input.value.trim() === '' ? 0 : leerNumero(input.value);
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
  const sueldo = leerSueldo(form);
  const conPrestaciones = campos.prestacionesSuperiores.checked;
  return {
    sueldo,
    entrada: {
      salarioDiario: sueldo.diario,
      fechaAntiguedad: campos.fechaAntiguedad.value,
      fechaBaja: campos.fechaBaja.value,
      periodicidad: valorRadio(form, 'periodicidad'),
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

function pintarErroresFiniquito(errores) {
  const visibles = pintarErrores(errores, INPUT_DE_CAMPO, tocados);
  // Un error dentro de un panel colapsado tiene que verse.
  if (visibles.has('vacacionesTomadas') || visibles.has('vacacionesPendientes')) {
    $('vacacionesOpcionales').open = true;
  }
  return visibles.size;
}

// ---- Pintado del resultado ----

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

  const formulaAguinaldo = lineasAguinaldo(aguinaldo, entrada.salarioDiario, Boolean(entrada.prestaciones));
  const lineasAguinaldoFiniquito = [
    ['t', `Del ${fmtFecha(aguinaldo.desde)} a tu baja trabajaste ${fmtNum(aguinaldo.diasTrabajados)} días de este año. ` +
      formulaAguinaldo.origen],
    formulaAguinaldo.dias,
    formulaAguinaldo.monto,
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
    paso('Aguinaldo proporcional', lineasAguinaldoFiniquito),
    paso('Total', lineasTotal),
  );
}

function pintarDatos(entrada, sueldo) {
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
  pintarDatosCapturados(filas);
}

function pintarResultado(entrada, sueldo, resultado, erroresVisibles) {
  const hayResultado = resultado.valido;
  pintarEstado({ hayResultado, erroresVisibles });
  mostrarTotal(hayResultado ? fmtMonto(resultado.total) : null);
  if (!hayResultado) return;

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
  pintarDatos(entrada, sueldo);
}

// Barra fija en móvil con el total (ver ui-calculadoras.js).
const mostrarTotal = crearBarraTotal();

// ---- Ciclo ----

function actualizar() {
  sincronizarDiasVacacionesLey();
  const { sueldo, entrada } = leerEntrada();
  pintarSueldo(sueldo);
  const resultado = calcularFiniquito(entrada);
  const visibles = pintarErroresFiniquito(resultado.errores);
  pintarResultado(entrada, sueldo, resultado, visibles);
}

conectarFormulario({
  form,
  tocados,
  campoDeInput: CAMPO_DE_INPUT,
  actualizar,
  alEscribir: (e) => {
    if (e.target === campos.diasVacaciones) diasVacacionesEditado = true;
  },
  alCambiar: (e) => {
    if (e.target === campos.prestacionesSuperiores) {
      $('prestacionesCampos').hidden = !campos.prestacionesSuperiores.checked;
    }
  },
});
conectarImpresion();

// Estado inicial: fecha de baja = hoy (fecha local) y quincenal.
campos.fechaBaja.value = hoyLocal();
campos.prestacionesSuperiores.checked = false;
$('prestacionesCampos').hidden = true;
actualizar();
