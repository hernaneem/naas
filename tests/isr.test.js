import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularIsrPeriodo, calcularAguinaldo, calcularFiniquito, PERIODICIDADES, DIAS_PERIODO_ISR,
} from '../js/calculos-laborales.js';

// Spec: docs/specs/2026-09-30-isr-neto-calculadoras.md (I1–I8)
// Cifras: docs/research/2026-09-30-isr-finiquito-aguinaldo.md (Anexo 8 RMF 2026, UMA 2026)

/** ISR sin redondear comparado a centavos. */
const aCentavos = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

describe('calcularIsrPeriodo: ejemplo de la investigación (mensual)', () => {
  test('ISR de $15,200 mensual = $1,438.66 (renglón 5)', () => {
    const r = calcularIsrPeriodo(15200, 'mensual');
    assert.equal(r.base, 15200);
    assert.deepEqual(r.renglon, { limiteInferior: 14644.65, cuotaFija: 1339.14, porcentaje: 17.92 });
    assert.equal(aCentavos(r.isr), 1438.66);
  });
});

describe('calcularIsrPeriodo: segundo renglón del ejemplo mensual', () => {
  test('ISR de $19,180.70 mensual = $2,208.65 (renglón 6)', () => {
    const r = calcularIsrPeriodo(19180.70, 'mensual');
    assert.deepEqual(r.renglon, { limiteInferior: 17533.65, cuotaFija: 1856.84, porcentaje: 21.36 });
    assert.equal(aCentavos(r.isr), 2208.65);
  });
});

// Límite inferior y cuota fija de cada renglón, transcritos del Anexo 8 RMF 2026 (B.II, B.IV, B.V).
const TARIFAS = {
  semanal: [
    [0.01, 0.00], [194.47, 3.71], [1650.68, 96.95], [2900.88, 232.96], [3372.12, 308.35], [4037.33, 427.56],
    [8142.76, 1304.45], [12834.09, 2407.86], [24502.46, 5908.35], [32669.92, 8521.94], [98009.67, 30737.49],
  ],
  quincenal: [
    [0.01, 0.00], [416.71, 7.95], [3537.16, 207.75], [6216.16, 499.20], [7225.96, 660.75], [8651.41, 916.20],
    [17448.76, 2795.25], [27501.61, 5159.70], [52505.26, 12660.75], [70006.96, 18261.30], [210020.71, 65866.05],
  ],
  mensual: [
    [0.01, 0.00], [844.60, 16.22], [7168.52, 420.95], [12598.03, 1011.68], [14644.65, 1339.14], [17533.65, 1856.84],
    [35362.84, 5665.16], [55736.69, 10457.09], [106410.51, 25659.23], [141880.67, 37009.69], [425642.00, 133488.54],
  ],
};
const PORCENTAJES = [1.92, 6.40, 10.88, 16.00, 17.92, 21.36, 23.52, 30.00, 32.00, 34.00, 35.00];

for (const [periodicidad, renglones] of Object.entries(TARIFAS)) {
  describe(`calcularIsrPeriodo: límites de renglón, tarifa ${periodicidad}`, () => {
    renglones.forEach(([limiteInferior, cuotaFija], i) => {
      test(`renglón ${i + 1}: en su límite inferior ${limiteInferior} el ISR es la cuota fija ${cuotaFija}`, () => {
        const r = calcularIsrPeriodo(limiteInferior, periodicidad);
        assert.deepEqual(r.renglon, { limiteInferior, cuotaFija, porcentaje: PORCENTAJES[i] });
        assert.equal(aCentavos(r.isr), cuotaFija);
      });
      if (i > 0) {
        test(`renglón ${i}: un centavo antes de ${limiteInferior} sigue en el renglón anterior`, () => {
          const base = aCentavos(limiteInferior - 0.01);
          const r = calcularIsrPeriodo(base, periodicidad);
          assert.equal(r.renglon.limiteInferior, renglones[i - 1][0]);
          // Continuidad: el ISR al tope de un renglón ≈ la cuota fija del siguiente. El Anexo 8 redondea
          // cada cifra por separado y hay saltos de hasta ~$0.10; un error de transcripción daría más.
          assert.ok(Math.abs(r.isr - cuotaFija) < 0.15, `ISR ${r.isr} vs cuota ${cuotaFija}`);
        });
      }
    });
  });
}

describe('calcularIsrPeriodo: base cero', () => {
  test('base 0 → ISR 0 y sin renglón', () => {
    for (const periodicidad of ['semanal', 'quincenal', 'mensual']) {
      assert.deepEqual(calcularIsrPeriodo(0, periodicidad), { base: 0, renglon: null, isr: 0 });
    }
  });
});

describe('calcularIsrPeriodo: periodicidad desconocida', () => {
  test('lanza RangeError (el motor solo la llama con periodicidades validadas)', () => {
    assert.throws(() => calcularIsrPeriodo(1000, 'diaria'), RangeError);
  });
});

const baseAguinaldo = { salarioDiario: 500, fechaAntiguedad: '2020-03-01', fechaCorte: '2026-12-31' };

describe('periodicidades: una sola fuente', () => {
  test('las periodicidades válidas son exactamente las que tienen tarifa y días del periodo', () => {
    assert.deepEqual([...PERIODICIDADES].sort(), ['mensual', 'quincenal', 'semanal']);
    assert.deepEqual(Object.keys(DIAS_PERIODO_ISR).sort(), [...PERIODICIDADES].sort());
    for (const periodicidad of PERIODICIDADES) {
      assert.doesNotThrow(() => calcularIsrPeriodo(1000, periodicidad));
      assert.equal(calcularAguinaldo({ ...baseAguinaldo, periodicidad }).valido, true);
    }
  });
});

describe('calcularAguinaldo con ISR: criterios de aceptación', () => {
  test('criterio 1: año completo, mensual → exento 3,519.30, gravado 3,980.70, ISR 769.99, neto 6,730.01', () => {
    const r = calcularAguinaldo({ ...baseAguinaldo, periodicidad: 'mensual' });
    assert.equal(r.valido, true);
    assert.equal(r.aguinaldo.monto, 7500);
    const i = r.isr;
    assert.equal(i.periodicidad, 'mensual');
    assert.equal(i.sueldoPeriodo, 15200);
    assert.deepEqual(i.conceptos, { aguinaldo: { monto: 7500, exento: 3519.30, gravado: 3980.70, topeExento: 3519.30, topeUma: 30 } });
    assert.equal(i.exentoTotal, 3519.30);
    assert.equal(i.gravadoTotal, 3980.70);
    assert.equal(i.ordinario.base, 15200);
    assert.deepEqual(i.ordinario.renglon, { limiteInferior: 14644.65, cuotaFija: 1339.14, porcentaje: 17.92 });
    assert.equal(aCentavos(i.ordinario.isr), 1438.66);
    assert.equal(i.conExtra.base, 19180.70);
    assert.deepEqual(i.conExtra.renglon, { limiteInferior: 17533.65, cuotaFija: 1856.84, porcentaje: 21.36 });
    assert.equal(aCentavos(i.conExtra.isr), 2208.65);
    assert.equal(i.salarioMinimo, false);
    assert.equal(i.isr, 769.99);
    assert.equal(r.neto, 6730.01);
  });

  test('criterio 2: mismo caso, quincenal por default → sueldo 7,500, ISR 709.86 / 1,520.54, ISR 810.68, neto 6,689.32', () => {
    const r = calcularAguinaldo(baseAguinaldo);
    const i = r.isr;
    assert.equal(i.periodicidad, 'quincenal');
    assert.equal(i.sueldoPeriodo, 7500);
    assert.deepEqual(i.conceptos, { aguinaldo: { monto: 7500, exento: 3519.30, gravado: 3980.70, topeExento: 3519.30, topeUma: 30 } });
    assert.equal(i.ordinario.base, 7500);
    assert.deepEqual(i.ordinario.renglon, { limiteInferior: 7225.96, cuotaFija: 660.75, porcentaje: 17.92 });
    assert.equal(aCentavos(i.ordinario.isr), 709.86);
    assert.equal(i.conExtra.base, 11480.70);
    assert.deepEqual(i.conExtra.renglon, { limiteInferior: 8651.41, cuotaFija: 916.20, porcentaje: 21.36 });
    assert.equal(aCentavos(i.conExtra.isr), 1520.54);
    assert.equal(i.isr, 810.68);
    assert.equal(r.neto, 6689.32);
    assert.deepEqual(calcularAguinaldo({ ...baseAguinaldo, periodicidad: 'quincenal' }), r);
  });
});

describe('calcularAguinaldo: periodicidad (I5)', () => {
  for (const periodicidad of ['diaria', '', null, 15]) {
    test(`periodicidad ${JSON.stringify(periodicidad)} → error con el mismo mensaje que el finiquito`, () => {
      const r = calcularAguinaldo({ ...baseAguinaldo, periodicidad });
      assert.equal(r.valido, false);
      assert.equal(r.aguinaldo, null);
      assert.equal(r.isr, null);
      assert.equal(r.neto, null);
      const fin = calcularFiniquito({
        salarioDiario: 500, fechaAntiguedad: '2024-05-10', fechaBaja: '2026-09-29', periodicidad,
      });
      assert.deepEqual(r.errores, fin.errores.filter((e) => e.campo === 'periodicidad'));
      assert.equal(r.errores.length, 1);
    });
  }

  test('con otros errores también isr y neto son null', () => {
    const r = calcularAguinaldo({ ...baseAguinaldo, salarioDiario: 0 });
    assert.equal(r.isr, null);
    assert.equal(r.neto, null);
  });

  test('semanal: sueldo del periodo = diario × 7', () => {
    const i = calcularAguinaldo({ ...baseAguinaldo, periodicidad: 'semanal' }).isr;
    assert.equal(i.periodicidad, 'semanal');
    assert.equal(i.sueldoPeriodo, 3500);
    // ISR(3,500) = 308.35 + (3,500 − 3,372.12) × 17.92 % = 331.2661 (renglón 5)
    // ISR(7,480.70) = 427.56 + (7,480.70 − 4,037.33) × 21.36 % = 1,163.0638 (renglón 6)
    assert.equal(aCentavos(i.ordinario.isr), 331.27);
    assert.equal(i.conExtra.base, 7480.70);
    assert.equal(aCentavos(i.conExtra.isr), 1163.06);
    assert.equal(i.isr, 831.80); // 1,163.0638 − 331.2661 = 831.7977
  });
});

describe('calcularAguinaldo: exenciones y casos límite (I4)', () => {
  test('aguinaldo por debajo del tope: exento completo, ISR 0, neto = bruto', () => {
    // corte 2026-03-31: 90 días → $1,849.32 < $3,519.30
    const r = calcularAguinaldo({ ...baseAguinaldo, fechaAntiguedad: '2015-08-20', fechaCorte: '2026-03-31' });
    assert.deepEqual(r.isr.conceptos, { aguinaldo: { monto: 1849.32, exento: 1849.32, gravado: 0, topeExento: 3519.30, topeUma: 30 } });
    assert.equal(r.isr.exentoTotal, 1849.32);
    assert.equal(r.isr.gravadoTotal, 0);
    assert.equal(r.isr.conExtra.base, r.isr.ordinario.base);
    assert.equal(r.isr.isr, 0);
    assert.equal(r.neto, 1849.32);
  });

  test('aguinaldo exactamente en el tope: gravado 0', () => {
    // 15 × 365/365 × 234.62 = 3,519.30
    const r = calcularAguinaldo({ ...baseAguinaldo, salarioDiario: 234.62 });
    assert.equal(r.aguinaldo.monto, 3519.30);
    assert.deepEqual(r.isr.conceptos.aguinaldo, { monto: 3519.30, exento: 3519.30, gravado: 0, topeExento: 3519.30, topeUma: 30 });
  });

  test('prestaciones superiores (30 días): $15,000 → exento 3,519.30, gravado 11,480.70', () => {
    const r = calcularAguinaldo({ ...baseAguinaldo, diasAguinaldo: 30 });
    assert.deepEqual(r.isr.conceptos, { aguinaldo: { monto: 15000, exento: 3519.30, gravado: 11480.70, topeExento: 3519.30, topeUma: 30 } });
    // quincenal: ISR(7,500) = 709.8580; ISR(18,980.70) = 2,795.25 + (18,980.70 − 17,448.76) × 23.52 % = 3,155.5623
    assert.equal(r.isr.conExtra.base, 18980.70);
    assert.equal(aCentavos(r.isr.conExtra.isr), 3155.56);
    assert.equal(r.isr.isr, 2445.70); // 3,155.5623 − 709.8580 = 2,445.7043
    assert.equal(r.neto, 12554.30);
  });

  test('ISR incremental nunca negativo (salto de la tarifa quincenal en $17,448.76)', () => {
    // Sueldo quincenal 1,163.25 × 15 = 17,448.75 → ISR 2,795.3118 (renglón 6).
    // Aguinaldo 15.128 × 73/365 × 1,163.25 = 3,519.53 → gravado 0.23 → base 17,448.98 en renglón 7:
    // ISR 2,795.25 + 0.22 × 23.52 % = 2,795.3017 < 2,795.3118. La diferencia (−0.01) se lleva a 0.
    const r = calcularAguinaldo({
      salarioDiario: 1163.25, fechaAntiguedad: '2020-01-01', fechaCorte: '2026-03-14', diasAguinaldo: 15.128,
    });
    assert.equal(r.aguinaldo.monto, 3519.53);
    assert.equal(r.isr.gravadoTotal, 0.23);
    assert.ok(r.isr.conExtra.isr < r.isr.ordinario.isr);
    assert.equal(r.isr.isr, 0);
    assert.equal(r.neto, 3519.53);
  });
});

describe('calcularAguinaldo: salario mínimo (I7)', () => {
  test('criterio 4: diario $300 → ISR 0, neto = bruto; sí explica exento/gravado y bases', () => {
    const r = calcularAguinaldo({ ...baseAguinaldo, salarioDiario: 300 });
    assert.equal(r.aguinaldo.monto, 4500);
    assert.equal(r.isr.salarioMinimo, true);
    assert.deepEqual(r.isr.conceptos, { aguinaldo: { monto: 4500, exento: 3519.30, gravado: 980.70, topeExento: 3519.30, topeUma: 30 } });
    assert.equal(r.isr.sueldoPeriodo, 4500);
    assert.equal(r.isr.ordinario.base, 4500);
    assert.equal(r.isr.conExtra.base, 5480.70);
    assert.equal(r.isr.isr, 0);
    assert.equal(r.neto, 4500);
  });

  test('diario igual al mínimo general ($315.04) → salarioMinimo; un centavo más ya retiene', () => {
    assert.equal(calcularAguinaldo({ ...baseAguinaldo, salarioDiario: 315.04 }).isr.salarioMinimo, true);
    assert.equal(calcularAguinaldo({ ...baseAguinaldo, salarioDiario: 315.04 }).isr.isr, 0);
    const arriba = calcularAguinaldo({ ...baseAguinaldo, salarioDiario: 315.05 }).isr;
    assert.equal(arriba.salarioMinimo, false);
    assert.ok(arriba.isr > 0);
  });
});

const baseFiniquito = {
  salarioDiario: 500, fechaAntiguedad: '2024-05-10', fechaBaja: '2026-09-29', periodicidad: 'quincenal',
};

describe('calcularFiniquito con ISR: criterio 3', () => {
  test('caso base quincenal → gravado 12,203.99, base 19,703.99, ISR 2,615.82, neto 13,891.03', () => {
    const r = calcularFiniquito(baseFiniquito);
    assert.equal(r.total, 16506.85);
    const i = r.isr;
    assert.equal(i.periodicidad, 'quincenal');
    assert.equal(i.sueldoPeriodo, 7500);
    assert.deepEqual(i.conceptos, {
      sueldoPendiente: { monto: 7000, exento: 0, gravado: 7000, topeExento: null, topeUma: null },
      vacaciones: { monto: 3134.25, exento: 0, gravado: 3134.25, topeExento: null, topeUma: null },
      primaVacacional: { monto: 783.56, exento: 783.56, gravado: 0, topeExento: 1759.65, topeUma: 15 },
      aguinaldo: { monto: 5589.04, exento: 3519.30, gravado: 2069.74, topeExento: 3519.30, topeUma: 30 },
    });
    assert.equal(i.exentoTotal, 4302.86);
    assert.equal(i.gravadoTotal, 12203.99);
    assert.equal(i.ordinario.base, 7500);
    assert.equal(aCentavos(i.ordinario.isr), 709.86);
    assert.equal(i.conExtra.base, 19703.99);
    // 2,795.25 + (19,703.99 − 17,448.76) × 23.52 % = 3,325.6781
    assert.deepEqual(i.conExtra.renglon, { limiteInferior: 17448.76, cuotaFija: 2795.25, porcentaje: 23.52 });
    assert.equal(aCentavos(i.conExtra.isr), 3325.68);
    assert.equal(i.salarioMinimo, false);
    assert.equal(i.isr, 2615.82); // 3,325.6781 − 709.8580 = 2,615.8201
    assert.equal(r.neto, 13891.03);
  });
});

describe('calcularFiniquito con ISR: exenciones, salario mínimo y errores', () => {
  test('prima vacacional arriba de 15 UMA: exento 1,759.65 y el resto grava', () => {
    // 20 días pendientes: vacaciones 26.2685 días → $13,134.25; prima 25 % → $3,283.56
    const r = calcularFiniquito({ ...baseFiniquito, vacacionesPendientes: 20 });
    assert.equal(r.conceptos.primaVacacional.monto, 3283.56);
    assert.deepEqual(r.isr.conceptos.primaVacacional, { monto: 3283.56, exento: 1759.65, gravado: 1523.91, topeExento: 1759.65, topeUma: 15 });
    assert.deepEqual(r.isr.conceptos.vacaciones, { monto: 13134.25, exento: 0, gravado: 13134.25, topeExento: null, topeUma: null });
    assert.equal(r.isr.exentoTotal, 5278.95); // 1,759.65 + 3,519.30
    assert.equal(r.isr.gravadoTotal, 23727.90); // 7,000 + 13,134.25 + 1,523.91 + 2,069.74
    assert.equal(r.isr.conExtra.base, 31227.90);
    // renglón 8: 5,159.70 + (31,227.90 − 27,501.61) × 30 % = 6,277.587; − 709.858 = 5,567.729
    assert.equal(r.isr.conExtra.renglon.limiteInferior, 27501.61);
    assert.equal(r.isr.isr, 5567.73);
    assert.equal(r.total, 29006.85);
    assert.equal(r.neto, 23439.12);
  });

  test('mensual: sueldo del periodo = diario × 30.4', () => {
    const i = calcularFiniquito({ ...baseFiniquito, periodicidad: 'mensual' }).isr;
    assert.equal(i.periodicidad, 'mensual');
    assert.equal(i.sueldoPeriodo, 15200);
    assert.equal(aCentavos(i.ordinario.isr), 1438.66);
  });

  test('criterio 4: diario $300 → ISR 0, neto = total; sí explica exento/gravado', () => {
    const r = calcularFiniquito({ ...baseFiniquito, salarioDiario: 300 });
    assert.equal(r.isr.salarioMinimo, true);
    assert.equal(r.isr.isr, 0);
    assert.equal(r.neto, r.total);
    assert.ok(r.isr.gravadoTotal > 0);
    assert.equal(r.isr.conExtra.base, r.isr.sueldoPeriodo + r.isr.gravadoTotal);
  });

  test('con errores: isr y neto null', () => {
    const r = calcularFiniquito({ ...baseFiniquito, periodicidad: 'diaria' });
    assert.equal(r.valido, false);
    assert.equal(r.isr, null);
    assert.equal(r.neto, null);
  });
});
