// Motor de cálculos laborales (México). Módulo puro: sin DOM ni dependencias.
// Spec: docs/specs/2026-09-29-calculadora-finiquito.md

export const SALARIO_MINIMO_2026 = Object.freeze({ general: 315.04, fronteraNorte: 440.87 });
export const MINIMOS_LEY = Object.freeze({ diasAguinaldo: 15, primaVacacional: 25 });

/** Días de vacaciones de ley (LFT 2023) para un año de servicio (1, 2, 3…). */
export function diasVacacionesLey(anioServicio) {
  if (anioServicio <= 5) return 10 + 2 * anioServicio;
  return 22 + 2 * Math.floor((anioServicio - 6) / 5);
}

// ---- Fechas como números de día (días desde 1970-01-01, UTC) ----

const MS_DIA = 86400000;

function aDia(anio, mes, dia) {
  return Math.round(Date.UTC(anio, mes - 1, dia) / MS_DIA);
}

function partes(numDia) {
  const f = new Date(numDia * MS_DIA);
  return { anio: f.getUTCFullYear(), mes: f.getUTCMonth() + 1, dia: f.getUTCDate() };
}

function aTexto(numDia) {
  const { anio, mes, dia } = partes(numDia);
  return `${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function ultimoDiaDelMes(anio, mes) {
  return aDia(anio, mes + 1, 0);
}

const formatoDias = (x) => x.toFixed(2);

const redondear = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

const esNumero = (x) => typeof x === 'number' && Number.isFinite(x);

const PERIODICIDADES = ['semanal', 'quincenal', 'mensual'];

/** 'YYYY-MM-DD' → número de día, o null si no es una fecha real. */
function leerFecha(texto) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof texto === 'string' ? texto : '');
  if (!m) return null;
  const [anio, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const numDia = aDia(anio, mes, dia);
  const p = partes(numDia);
  return p.anio === anio && p.mes === mes && p.dia === dia ? numDia : null;
}

// ---- Conceptos ----

function calcularPagadoHasta(baja, periodicidad) {
  const { anio, mes, dia } = partes(baja);
  if (periodicidad === 'quincenal') {
    if (baja === ultimoDiaDelMes(anio, mes)) return baja;
    if (dia >= 15) return aDia(anio, mes, 15);
    return aDia(anio, mes, 0);
  }
  if (periodicidad === 'mensual') {
    if (baja === ultimoDiaDelMes(anio, mes)) return baja;
    return aDia(anio, mes, 0);
  }
  // semanal: periodo lunes–domingo, pago en viernes
  const diaSemana = (((baja + 4) % 7) + 7) % 7; // 0 = domingo (1970-01-01 fue jueves)
  if (diaSemana >= 1 && diaSemana <= 4) return baja - diaSemana; // lun–jue → domingo anterior
  return baja + ((7 - diaSemana) % 7); // vie, sáb, dom → ese domingo
}

function ultimoAniversarioYAnios(antiguedad, baja) {
  const a = partes(antiguedad);
  const { anio: anioBaja } = partes(baja);
  const aniversario = (anio) => {
    // 29 de feb en año no bisiesto → 28 de feb
    const dia = Math.min(a.dia, partes(ultimoDiaDelMes(anio, a.mes)).dia);
    return aDia(anio, a.mes, dia);
  };
  let anios = anioBaja - a.anio;
  if (aniversario(anioBaja) > baja) anios -= 1;
  return { anios, ultimoAniversario: aniversario(a.anio + anios) };
}

export function calcularFiniquito({
  salarioDiario,
  fechaAntiguedad,
  fechaBaja,
  periodicidad,
  vacacionesTomadas = 0,
  vacacionesPendientes = 0,
  prestaciones = null,
} = {}) {
  const errores = [];
  const avisos = [];
  const error = (campo, mensaje) => errores.push({ campo, mensaje });

  if (!esNumero(salarioDiario) || salarioDiario <= 0) {
    error('salarioDiario', 'Captura tu salario diario (o tu sueldo mensual); debe ser mayor a cero.');
  } else if (salarioDiario < SALARIO_MINIMO_2026.general) {
    avisos.push({
      campo: 'salarioDiario',
      mensaje: `Tu salario diario es menor al salario mínimo 2026 ($${SALARIO_MINIMO_2026.general.toFixed(2)} ` +
        `general; $${SALARIO_MINIMO_2026.fronteraNorte.toFixed(2)} en la zona libre de la frontera norte). ` +
        'Revisa que lo hayas capturado bien.',
    });
  }

  const antiguedad = leerFecha(fechaAntiguedad);
  const baja = leerFecha(fechaBaja);
  if (antiguedad === null) error('fechaAntiguedad', 'Captura una fecha de antigüedad válida.');
  if (baja === null) error('fechaBaja', 'Captura una fecha de baja válida.');
  const ordenInvalido = antiguedad !== null && baja !== null && baja < antiguedad;
  if (ordenInvalido) error('fechaBaja', 'La fecha de baja no puede ser anterior a la fecha de antigüedad.');
  const fechasValidas = antiguedad !== null && baja !== null && !ordenInvalido;

  if (!PERIODICIDADES.includes(periodicidad)) {
    error('periodicidad', 'Elige la periodicidad de tu nómina: semanal, quincenal o mensual.');
  }

  if (!esNumero(vacacionesTomadas) || vacacionesTomadas < 0) {
    error('vacacionesTomadas', 'Los días de vacaciones que ya tomaste deben ser cero o más.');
  }
  if (!esNumero(vacacionesPendientes) || vacacionesPendientes < 0) {
    error('vacacionesPendientes', 'Los días de vacaciones pendientes de años anteriores deben ser cero o más.');
  }

  let anios = 0;
  let ultimoAniversario = null;
  if (fechasValidas) ({ anios, ultimoAniversario } = ultimoAniversarioYAnios(antiguedad, baja));
  const anioServicio = anios + 1;

  if (prestaciones) {
    const { diasAguinaldo: ag, primaVacacional: pv, diasVacaciones: dv } = prestaciones;
    if (!esNumero(ag) || ag < MINIMOS_LEY.diasAguinaldo) {
      error('diasAguinaldo', `Los días de aguinaldo no pueden ser menos de ${MINIMOS_LEY.diasAguinaldo}, el mínimo de ley.`);
    }
    if (!esNumero(pv) || pv < MINIMOS_LEY.primaVacacional) {
      error('primaVacacional', `La prima vacacional no puede ser menor a ${MINIMOS_LEY.primaVacacional} %, el mínimo de ley.`);
    }
    if (fechasValidas && (!esNumero(dv) || dv < diasVacacionesLey(anioServicio))) {
      error('diasVacaciones', `Los días de vacaciones no pueden ser menos de ${diasVacacionesLey(anioServicio)}, ` +
        `lo que marca la ley para tu año de servicio ${anioServicio}.`);
    }
  }

  if (errores.length > 0) return { valido: false, errores, avisos, conceptos: null, total: null };

  const diasAnio = prestaciones ? prestaciones.diasVacaciones : diasVacacionesLey(anioServicio);
  const porcentajePrima = prestaciones ? prestaciones.primaVacacional : MINIMOS_LEY.primaVacacional;
  const diasAguinaldo = prestaciones ? prestaciones.diasAguinaldo : MINIMOS_LEY.diasAguinaldo;

  // Sueldo pendiente (D1)
  // Si el periodo supuesto empezó antes del ingreso, aún no se le había pagado nada.
  const pagadoHasta = Math.max(calcularPagadoHasta(baja, periodicidad), antiguedad - 1);
  const diasPendientesSueldo = Math.max(0, baja - pagadoHasta);

  // Vacaciones (D2)
  const diasTranscurridos = Math.min(baja - ultimoAniversario + 1, 365);
  const proporcionalesBrutas = (diasAnio * diasTranscurridos) / 365;
  const saldo = proporcionalesBrutas - vacacionesTomadas;
  const proporcionales = Math.max(0, saldo);
  const notaNegativo = saldo < 0
    ? `Ya tomaste ${formatoDias(vacacionesTomadas)} días de vacaciones en tu año de servicio actual y ` +
      `solo te corresponden ${formatoDias(proporcionalesBrutas)} días proporcionales. ` +
      'Por eso las vacaciones proporcionales se muestran en 0; la diferencia no se descuenta de los demás conceptos.'
    : null;
  const diasVacaciones = proporcionales + vacacionesPendientes;

  // Aguinaldo (D4)
  const desde = Math.max(aDia(partes(baja).anio, 1, 1), antiguedad);
  const diasTrabajados = Math.min(baja - desde + 1, 365);
  const diasAguinaldoProp = (diasAguinaldo * diasTrabajados) / 365;

  const conceptos = {
    sueldoPendiente: {
      pagadoHasta: aTexto(pagadoHasta),
      dias: diasPendientesSueldo,
      monto: redondear(diasPendientesSueldo * salarioDiario),
    },
    vacaciones: {
      anioServicio,
      diasAnio,
      ultimoAniversario: aTexto(ultimoAniversario),
      diasTranscurridos,
      proporcionales,
      tomadas: vacacionesTomadas,
      pendientes: vacacionesPendientes,
      dias: diasVacaciones,
      monto: redondear(diasVacaciones * salarioDiario),
      notaNegativo,
    },
    primaVacacional: {
      porcentaje: porcentajePrima,
      dias: diasVacaciones,
      monto: redondear((porcentajePrima / 100) * diasVacaciones * salarioDiario),
    },
    aguinaldo: {
      diasAguinaldo,
      desde: aTexto(desde),
      diasTrabajados,
      dias: diasAguinaldoProp,
      monto: redondear(diasAguinaldoProp * salarioDiario),
    },
  };

  const total = redondear(
    conceptos.sueldoPendiente.monto + conceptos.vacaciones.monto +
    conceptos.primaVacacional.monto + conceptos.aguinaldo.monto,
  );

  return { valido: true, errores, avisos, conceptos, total };
}
