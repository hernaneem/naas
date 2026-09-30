import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calcularAguinaldo, calcularFiniquito } from '../js/calculos-laborales.js';

// Spec: docs/specs/2026-09-30-calculadora-aguinaldo.md (A1–A4)

const base = {
  salarioDiario: 500,
  fechaAntiguedad: '2020-03-01',
  fechaCorte: '2026-12-31',
};

const campos = (r) => r.errores.map((e) => e.campo);

function assertBloqueado(r, campo) {
  assert.equal(r.valido, false);
  assert.equal(r.aguinaldo, null);
  assert.ok(campos(r).includes(campo), `se esperaba error en ${campo}, hubo: ${campos(r)}`);
  for (const e of r.errores) {
    assert.equal(typeof e.mensaje, 'string');
    assert.ok(e.mensaje.length > 10);
  }
}

describe('calcularAguinaldo: criterios de aceptación', () => {
  test('criterio 1: año completo → 365 días trabajados, 15.00 días, $7,500.00', () => {
    const r = calcularAguinaldo(base);
    assert.equal(r.valido, true);
    assert.deepEqual(r.errores, []);
    assert.deepEqual(r.avisos, []);
    assert.deepEqual(r.aguinaldo, {
      diasAguinaldo: 15,
      desde: '2026-01-01',
      hasta: '2026-12-31',
      diasTrabajados: 365,
      dias: 15,
      monto: 7500,
      topado: false,
      desdeAntiguedad: false,
    });
  });

  test('criterio 2: antigüedad a mitad de año (2026-06-01) → 214 días, 8.79 días, $4,397.26', () => {
    const a = calcularAguinaldo({ ...base, fechaAntiguedad: '2026-06-01' }).aguinaldo;
    assert.equal(a.desde, '2026-06-01');
    assert.equal(a.hasta, '2026-12-31');
    assert.equal(a.diasTrabajados, 214);
    assert.equal(a.dias, (15 * 214) / 365);
    assert.equal(a.dias.toFixed(2), '8.79');
    assert.equal(a.monto, 4397.26);
    assert.equal(a.desdeAntiguedad, true);
    assert.equal(a.topado, false);
  });

  test('criterio 3: corte antes de diciembre (2026-09-29) → 272 días, $5,589.04', () => {
    const a = calcularAguinaldo({ ...base, fechaAntiguedad: '2024-05-10', fechaCorte: '2026-09-29' }).aguinaldo;
    assert.equal(a.desde, '2026-01-01');
    assert.equal(a.hasta, '2026-09-29');
    assert.equal(a.diasTrabajados, 272);
    assert.equal(a.dias, (15 * 272) / 365);
    assert.equal(a.monto, 5589.04);
  });

  test('criterio 5: 30 días de aguinaldo en el caso 1 → $15,000.00', () => {
    const a = calcularAguinaldo({ ...base, diasAguinaldo: 30 }).aguinaldo;
    assert.equal(a.diasAguinaldo, 30);
    assert.equal(a.dias, 30);
    assert.equal(a.monto, 15000);
  });

  test('criterio 5: 10 días de aguinaldo → error sin monto', () => {
    const r = calcularAguinaldo({ ...base, diasAguinaldo: 10 });
    assertBloqueado(r, 'diasAguinaldo');
    assert.match(r.errores[0].mensaje, /15/);
  });
});

describe('calcularAguinaldo: reglas de A1 / D4', () => {
  test('diasAguinaldo por defecto es 15', () => {
    assert.equal(calcularAguinaldo(base).aguinaldo.diasAguinaldo, 15);
  });

  test('año bisiesto al 31 de dic: 366 días topan en 365 (aguinaldo completo)', () => {
    const a = calcularAguinaldo({ ...base, fechaAntiguedad: '2020-01-01', fechaCorte: '2024-12-31' }).aguinaldo;
    assert.equal(a.desde, '2024-01-01');
    assert.equal(a.diasTrabajados, 365);
    assert.equal(a.dias, 15);
    assert.equal(a.monto, 7500);
    assert.equal(a.topado, true);
    assert.equal(a.desdeAntiguedad, false);
  });

  test('año no bisiesto al 31 de dic: 365 días exactos, sin tope', () => {
    assert.equal(calcularAguinaldo(base).aguinaldo.topado, false);
  });

  test('antigüedad el 1 de enero del año de corte: cuenta desde el 1 de enero, no desde la antigüedad', () => {
    const a = calcularAguinaldo({ ...base, fechaAntiguedad: '2026-01-01' }).aguinaldo;
    assert.equal(a.desde, '2026-01-01');
    assert.equal(a.desdeAntiguedad, false);
  });

  test('antigüedad en un año y corte en el siguiente: cuenta desde el 1 de enero del año de corte', () => {
    const a = calcularAguinaldo({ ...base, fechaAntiguedad: '2026-11-01', fechaCorte: '2027-03-15' }).aguinaldo;
    assert.equal(a.desde, '2027-01-01');
    assert.equal(a.hasta, '2027-03-15');
    assert.equal(a.diasTrabajados, 74);
    assert.equal(a.desdeAntiguedad, false);
  });

  test('antigüedad de años anteriores: cuenta desde el 1 de enero del año de corte', () => {
    const a = calcularAguinaldo({ ...base, fechaAntiguedad: '2015-08-20', fechaCorte: '2026-03-31' }).aguinaldo;
    assert.equal(a.desde, '2026-01-01');
    assert.equal(a.diasTrabajados, 90);
    assert.equal(a.monto, 1849.32); // 15 × 90 ÷ 365 × 500 = 1849.3150…
  });

  test('corte el mismo día de la antigüedad: 1 día trabajado', () => {
    const a = calcularAguinaldo({ ...base, fechaAntiguedad: '2026-12-31', fechaCorte: '2026-12-31' }).aguinaldo;
    assert.equal(a.diasTrabajados, 1);
    assert.equal(a.monto, 20.55);
  });

  test('días superiores no enteros se aceptan (20.5 días)', () => {
    const a = calcularAguinaldo({ ...base, diasAguinaldo: 20.5 }).aguinaldo;
    assert.equal(a.dias, 20.5);
    assert.equal(a.monto, 10250);
  });

  test('redondeo a centavos (D8)', () => {
    // 15 × 365 ÷ 365 × 300.07 = 4501.05
    assert.equal(calcularAguinaldo({ ...base, salarioDiario: 300.07 }).aguinaldo.monto, 4501.05);
    // 15 × 272 ÷ 365 × 300.07 = 3354.2071… → 3354.21 (mismo caso que el redondeo del finiquito)
    assert.equal(calcularAguinaldo({
      ...base, salarioDiario: 300.07, fechaAntiguedad: '2024-05-10', fechaCorte: '2026-09-29',
    }).aguinaldo.monto, 3354.21);
  });
});

describe('calcularAguinaldo: una sola regla con calcularFiniquito (A4)', () => {
  const casos = [
    ['2024-05-10', '2026-09-29'],
    ['2026-03-01', '2026-09-29'],
    ['2020-01-01', '2024-12-31'],
    ['2020-01-01', '2026-01-01'],
    ['2026-06-01', '2026-12-31'],
  ];
  for (const [fechaAntiguedad, fecha] of casos) {
    test(`antigüedad ${fechaAntiguedad}, corte/baja ${fecha}`, () => {
      for (const diasAguinaldo of [15, 30]) {
        const ag = calcularAguinaldo({ salarioDiario: 437.5, fechaAntiguedad, fechaCorte: fecha, diasAguinaldo }).aguinaldo;
        const fin = calcularFiniquito({
          salarioDiario: 437.5, fechaAntiguedad, fechaBaja: fecha, periodicidad: 'quincenal',
          prestaciones: { diasAguinaldo, primaVacacional: 25, diasVacaciones: 40 },
        }).conceptos.aguinaldo;
        const { hasta, topado, desdeAntiguedad, ...resto } = ag;
        assert.equal(hasta, fecha);
        assert.equal(typeof topado, 'boolean');
        assert.equal(typeof desdeAntiguedad, 'boolean');
        assert.deepEqual(resto, fin);
      }
    });
  }
});

describe('calcularAguinaldo: validaciones que bloquean', () => {
  for (const salarioDiario of [undefined, null, '', NaN, 0, -100]) {
    test(`salario diario ${String(salarioDiario)} → error`, () => {
      const r = calcularAguinaldo({ ...base, salarioDiario });
      assertBloqueado(r, 'salarioDiario');
      assert.match(r.errores[0].mensaje, /salario diario/i);
    });
  }

  for (const fecha of ['', 'abc', '2026-02-30', '2026-13-01', '29/09/2026', undefined]) {
    test(`fecha de antigüedad inválida (${String(fecha)}) → error`, () => {
      assertBloqueado(calcularAguinaldo({ ...base, fechaAntiguedad: fecha }), 'fechaAntiguedad');
    });
    test(`fecha de corte inválida (${String(fecha)}) → error`, () => {
      assertBloqueado(calcularAguinaldo({ ...base, fechaCorte: fecha }), 'fechaCorte');
    });
  }

  test('fecha de corte anterior a la antigüedad → error en fechaCorte', () => {
    const r = calcularAguinaldo({ ...base, fechaAntiguedad: '2026-06-01', fechaCorte: '2026-05-31' });
    assertBloqueado(r, 'fechaCorte');
    assert.match(r.errores[0].mensaje, /antigüedad/);
  });

  for (const diasAguinaldo of [14.99, 0, -15, '', '20', null, NaN]) {
    test(`días de aguinaldo ${JSON.stringify(diasAguinaldo)} → error`, () => {
      assertBloqueado(calcularAguinaldo({ ...base, diasAguinaldo }), 'diasAguinaldo');
    });
  }

  for (const diasAguinaldo of ['', null, NaN]) {
    test(`días de aguinaldo vacíos (${String(diasAguinaldo) || "''"}) → pide capturarlos`, () => {
      const r = calcularAguinaldo({ ...base, diasAguinaldo });
      assert.equal(r.errores[0].mensaje, 'Captura tus días de aguinaldo (mínimo 15).');
    });
  }

  test('días de aguinaldo menores a 15 → mensaje del mínimo de ley', () => {
    const r = calcularAguinaldo({ ...base, diasAguinaldo: 14.99 });
    assert.equal(r.errores[0].mensaje, 'Los días de aguinaldo no pueden ser menos de 15, el mínimo de ley.');
  });

  test('sin argumentos no truena: errores en salario y fechas', () => {
    const r = calcularAguinaldo();
    assert.equal(r.valido, false);
    assert.deepEqual(campos(r).sort(), ['fechaAntiguedad', 'fechaCorte', 'salarioDiario']);
  });

  test('varios errores a la vez se reportan todos', () => {
    const r = calcularAguinaldo({ salarioDiario: 0, fechaAntiguedad: 'x', fechaCorte: '2026-12-31', diasAguinaldo: 3 });
    assert.deepEqual(campos(r).sort(), ['diasAguinaldo', 'fechaAntiguedad', 'salarioDiario']);
  });
});

describe('calcularAguinaldo: aviso de salario mínimo (D12, no bloquea)', () => {
  test('salario diario $200 avisa pero calcula', () => {
    const r = calcularAguinaldo({ ...base, salarioDiario: 200 });
    assert.equal(r.valido, true);
    assert.equal(r.avisos.length, 1);
    assert.equal(r.avisos[0].campo, 'salarioDiario');
    assert.match(r.avisos[0].mensaje, /315\.04/);
    assert.match(r.avisos[0].mensaje, /440\.87/);
    assert.equal(r.aguinaldo.monto, 3000);
  });

  test('el aviso es el mismo texto que en el finiquito', () => {
    const ag = calcularAguinaldo({ ...base, salarioDiario: 200 }).avisos;
    const fin = calcularFiniquito({
      salarioDiario: 200, fechaAntiguedad: '2024-05-10', fechaBaja: '2026-09-29', periodicidad: 'quincenal',
    }).avisos;
    assert.deepEqual(ag, fin);
  });

  test('salario igual al mínimo general no avisa; un centavo menos sí', () => {
    assert.equal(calcularAguinaldo({ ...base, salarioDiario: 315.04 }).avisos.length, 0);
    assert.equal(calcularAguinaldo({ ...base, salarioDiario: 315.03 }).avisos.length, 1);
  });

  test('con errores también se devuelve el aviso de salario', () => {
    const r = calcularAguinaldo({ ...base, salarioDiario: 200, diasAguinaldo: 10 });
    assert.equal(r.valido, false);
    assert.equal(r.avisos.length, 1);
  });
});
