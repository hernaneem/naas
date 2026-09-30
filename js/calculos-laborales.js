// Motor de cálculos laborales (México). Módulo puro: sin DOM ni dependencias.
// Specs: docs/specs/2026-09-29-calculadora-finiquito.md y docs/specs/2026-09-30-calculadora-aguinaldo.md

export const SALARIO_MINIMO_2026 = Object.freeze({ general: 315.04, fronteraNorte: 440.87 });
export const MINIMOS_LEY = Object.freeze({ diasAguinaldo: 15, primaVacacional: 25 });

// ==== Cifras fiscales · VIGENTE 2026 ====
// Actualizar cada enero/febrero (spec ISR, I8). Fuentes:
// - Tarifas art. 96 LISR: Anexo 8 RMF 2026, DOF 28-12-2025, apartado B, fr. II (7 días), IV (15 días) y V (mensual).
// - UMA 2026: DOF 09-01-2026 (INEGI), $117.31 diarios, vigente desde el 01-02-2026.
// - Exenciones: art. 93 fr. XIV LISR (aguinaldo 30 UMA, prima vacacional 15 UMA por año calendario).
// Detalle: docs/research/2026-09-30-isr-finiquito-aguinaldo.md
// Renglones: [límite inferior, cuota fija, % sobre excedente del límite inferior].

export const UMA_2026 = 117.31;

const TARIFAS_ISR_2026 = Object.freeze({
  semanal: [
    [0.01, 0.00, 1.92],
    [194.47, 3.71, 6.40],
    [1650.68, 96.95, 10.88],
    [2900.88, 232.96, 16.00],
    [3372.12, 308.35, 17.92],
    [4037.33, 427.56, 21.36],
    [8142.76, 1304.45, 23.52],
    [12834.09, 2407.86, 30.00],
    [24502.46, 5908.35, 32.00],
    [32669.92, 8521.94, 34.00],
    [98009.67, 30737.49, 35.00],
  ],
  quincenal: [
    [0.01, 0.00, 1.92],
    [416.71, 7.95, 6.40],
    [3537.16, 207.75, 10.88],
    [6216.16, 499.20, 16.00],
    [7225.96, 660.75, 17.92],
    [8651.41, 916.20, 21.36],
    [17448.76, 2795.25, 23.52],
    [27501.61, 5159.70, 30.00],
    [52505.26, 12660.75, 32.00],
    [70006.96, 18261.30, 34.00],
    [210020.71, 65866.05, 35.00],
  ],
  mensual: [
    [0.01, 0.00, 1.92],
    [844.60, 16.22, 6.40],
    [7168.52, 420.95, 10.88],
    [12598.03, 1011.68, 16.00],
    [14644.65, 1339.14, 17.92],
    [17533.65, 1856.84, 21.36],
    [35362.84, 5665.16, 23.52],
    [55736.69, 10457.09, 30.00],
    [106410.51, 25659.23, 32.00],
    [141880.67, 37009.69, 34.00],
    [425642.00, 133488.54, 35.00],
  ],
});

/** Topes anuales de exención (art. 93 fr. XIV LISR): aguinaldo 30 UMA, prima vacacional 15 UMA. */
export const TOPES_EXENCION_2026 = Object.freeze({
  aguinaldo: Math.round(30 * UMA_2026 * 100) / 100, // 3,519.30
  primaVacacional: Math.round(15 * UMA_2026 * 100) / 100, // 1,759.65
});

/** Días del sueldo del periodo por periodicidad (Anexo 8: 7 y 15 días; mensual = 30.4). */
export const DIAS_PERIODO_ISR = Object.freeze({ semanal: 7, quincenal: 15, mensual: 30.4 });

// ==== Fin de cifras fiscales 2026 ====

/**
 * ISR del periodo (art. 96 LISR) con la tarifa 2026 de la periodicidad.
 * Renglón = el último cuyo límite inferior ≤ base. `isr` sin redondear. Base menor a $0.01 → ISR 0, sin renglón.
 */
export function calcularIsrPeriodo(base, periodicidad) {
  if (!Object.hasOwn(TARIFAS_ISR_2026, periodicidad)) throw new RangeError(`Periodicidad sin tarifa ISR: ${periodicidad}`);
  const tarifa = TARIFAS_ISR_2026[periodicidad];
  let fila = null;
  for (const f of tarifa) if (f[0] <= base) fila = f;
  if (!fila) return { base, renglon: null, isr: 0 };
  const [limiteInferior, cuotaFija, porcentaje] = fila;
  return {
    base,
    renglon: { limiteInferior, cuotaFija, porcentaje },
    isr: cuotaFija + ((base - limiteInferior) * porcentaje) / 100,
  };
}

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

/** Salario diario > 0 (error) y aviso sin bloqueo por debajo del mínimo general (D5, D12). */
function validarSalario(salarioDiario, error, avisos) {
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
}

function validarPeriodicidad(periodicidad, error) {
  if (!PERIODICIDADES.includes(periodicidad)) {
    error('periodicidad', 'Elige la periodicidad de tu nómina: semanal, quincenal o mensual.');
  }
}

/**
 * Aguinaldo proporcional (D4 / A1), la única implementación de la regla.
 * Días trabajados = del 1 de enero del año de `hasta` (o de la antigüedad, si es posterior) a `hasta`,
 * ambos incluidos, tope 365; divisor siempre 365. Recibe fechas ya validadas (números de día).
 * `topado`: los días del periodo pasaban de 365 (año bisiesto completo) y se toparon.
 * `desdeAntiguedad`: el conteo empieza en la fecha de antigüedad y no en el 1 de enero.
 */
function aguinaldoProporcional(antiguedad, hasta, diasAguinaldo, salarioDiario) {
  const primeroDeEnero = aDia(partes(hasta).anio, 1, 1);
  const desde = Math.max(primeroDeEnero, antiguedad);
  const diasPeriodo = hasta - desde + 1;
  const diasTrabajados = Math.min(diasPeriodo, 365);
  const dias = (diasAguinaldo * diasTrabajados) / 365;
  return {
    diasAguinaldo,
    desde: aTexto(desde),
    hasta: aTexto(hasta),
    diasTrabajados,
    dias,
    monto: redondear(dias * salarioDiario),
    topado: diasPeriodo > 365,
    desdeAntiguedad: antiguedad > primeroDeEnero,
  };
}

/**
 * Año de servicio en curso (1, 2, 3…) entre la fecha de antigüedad y la de baja ('YYYY-MM-DD').
 * null si alguna fecha no es válida o la baja es anterior a la antigüedad.
 */
export function anioDeServicio(fechaAntiguedad, fechaBaja) {
  const antiguedad = leerFecha(fechaAntiguedad);
  const baja = leerFecha(fechaBaja);
  if (antiguedad === null || baja === null || baja < antiguedad) return null;
  return ultimoAniversarioYAnios(antiguedad, baja).anios + 1;
}

/**
 * ISR estimado de pagos extraordinarios (spec ISR, I1–I4, I7). `montos`: { concepto: monto redondeado };
 * `topes`: { concepto: tope de exención } (sin tope → grava completo).
 * ISR = ISR(sueldo del periodo + gravado) − ISR(sueldo del periodo), nunca negativo, a centavos al final.
 * Salario diario ≤ mínimo general → `salarioMinimo: true` e ISR 0.
 */
function estimarIsr(salarioDiario, periodicidad, montos, topes) {
  const conceptos = {};
  let exentoTotal = 0;
  let gravadoTotal = 0;
  for (const [nombre, monto] of Object.entries(montos)) {
    const exento = Math.min(monto, topes[nombre] ?? 0);
    const gravado = redondear(monto - exento);
    conceptos[nombre] = { exento, gravado };
    exentoTotal += exento;
    gravadoTotal += gravado;
  }
  exentoTotal = redondear(exentoTotal);
  gravadoTotal = redondear(gravadoTotal);
  const sueldoPeriodo = redondear(salarioDiario * DIAS_PERIODO_ISR[periodicidad]);
  const ordinario = calcularIsrPeriodo(sueldoPeriodo, periodicidad);
  const conExtra = calcularIsrPeriodo(redondear(sueldoPeriodo + gravadoTotal), periodicidad);
  // Art. 96 LISR: no se retiene a quien gana el salario mínimo; se llenan bases para explicar el cálculo.
  const salarioMinimo = salarioDiario <= SALARIO_MINIMO_2026.general;
  return {
    periodicidad,
    sueldoPeriodo,
    conceptos,
    exentoTotal,
    gravadoTotal,
    ordinario,
    conExtra,
    salarioMinimo,
    isr: salarioMinimo ? 0 : redondear(Math.max(0, conExtra.isr - ordinario.isr)),
  };
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

  validarSalario(salarioDiario, error, avisos);

  const antiguedad = leerFecha(fechaAntiguedad);
  const baja = leerFecha(fechaBaja);
  if (antiguedad === null) error('fechaAntiguedad', 'Captura una fecha de antigüedad válida.');
  if (baja === null) error('fechaBaja', 'Captura una fecha de baja válida.');
  const ordenInvalido = antiguedad !== null && baja !== null && baja < antiguedad;
  if (ordenInvalido) error('fechaBaja', 'La fecha de baja no puede ser anterior a la fecha de antigüedad.');
  const fechasValidas = antiguedad !== null && baja !== null && !ordenInvalido;

  validarPeriodicidad(periodicidad, error);

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

  if (errores.length > 0) return { valido: false, errores, avisos, conceptos: null, total: null, isr: null, neto: null };

  const diasAnio = prestaciones ? prestaciones.diasVacaciones : diasVacacionesLey(anioServicio);
  const porcentajePrima = prestaciones ? prestaciones.primaVacacional : MINIMOS_LEY.primaVacacional;
  const diasAguinaldo = prestaciones ? prestaciones.diasAguinaldo : MINIMOS_LEY.diasAguinaldo;

  // Sueldo pendiente (D1)
  // D11: si el pago supuesto es anterior a la fecha de antigüedad, los días se cuentan desde esa fecha.
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

  // El aguinaldo del finiquito no expone `hasta` (es la fecha de baja) ni los datos de explicación.
  const { hasta, topado, desdeAntiguedad, ...aguinaldo } =
    aguinaldoProporcional(antiguedad, baja, diasAguinaldo, salarioDiario);

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
    aguinaldo,
  };

  const total = redondear(
    conceptos.sueldoPendiente.monto + conceptos.vacaciones.monto +
    conceptos.primaVacacional.monto + conceptos.aguinaldo.monto,
  );

  // I2: el sueldo pendiente y las vacaciones gravan completos (sin tope de exención).
  const isr = estimarIsr(salarioDiario, periodicidad, {
    sueldoPendiente: conceptos.sueldoPendiente.monto,
    vacaciones: conceptos.vacaciones.monto,
    primaVacacional: conceptos.primaVacacional.monto,
    aguinaldo: conceptos.aguinaldo.monto,
  }, TOPES_EXENCION_2026);

  return { valido: true, errores, avisos, conceptos, total, isr, neto: redondear(total - isr.isr) };
}

/**
 * Aguinaldo proporcional del año de la fecha de corte ("Calcular al"), sin finiquito.
 * Spec: docs/specs/2026-09-30-calculadora-aguinaldo.md (A1, A2, A4).
 */
export function calcularAguinaldo({
  salarioDiario,
  fechaAntiguedad,
  fechaCorte,
  diasAguinaldo = MINIMOS_LEY.diasAguinaldo,
  periodicidad = 'quincenal',
} = {}) {
  const errores = [];
  const avisos = [];
  const error = (campo, mensaje) => errores.push({ campo, mensaje });

  validarSalario(salarioDiario, error, avisos);

  const antiguedad = leerFecha(fechaAntiguedad);
  const corte = leerFecha(fechaCorte);
  if (antiguedad === null) error('fechaAntiguedad', 'Captura una fecha de antigüedad válida.');
  if (corte === null) error('fechaCorte', 'Captura una fecha válida en «Calcular al».');
  if (antiguedad !== null && corte !== null && corte < antiguedad) {
    error('fechaCorte', 'La fecha de «Calcular al» no puede ser anterior a tu fecha de antigüedad.');
  }

  if (!esNumero(diasAguinaldo)) {
    error('diasAguinaldo', `Captura tus días de aguinaldo (mínimo ${MINIMOS_LEY.diasAguinaldo}).`);
  } else if (diasAguinaldo < MINIMOS_LEY.diasAguinaldo) {
    error('diasAguinaldo', `Los días de aguinaldo no pueden ser menos de ${MINIMOS_LEY.diasAguinaldo}, el mínimo de ley.`);
  }

  validarPeriodicidad(periodicidad, error);

  if (errores.length > 0) return { valido: false, errores, avisos, aguinaldo: null, isr: null, neto: null };

  const aguinaldo = aguinaldoProporcional(antiguedad, corte, diasAguinaldo, salarioDiario);
  const isr = estimarIsr(salarioDiario, periodicidad, { aguinaldo: aguinaldo.monto }, TOPES_EXENCION_2026);
  return { valido: true, errores, avisos, aguinaldo, isr, neto: redondear(aguinaldo.monto - isr.isr) };
}
