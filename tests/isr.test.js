import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calcularIsrPeriodo } from '../js/calculos-laborales.js';

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
