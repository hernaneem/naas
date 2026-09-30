import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularFiniquito,
  diasVacacionesLey,
  anioDeServicio,
  SALARIO_MINIMO_2026,
  MINIMOS_LEY,
} from '../js/calculos-laborales.js';

describe('diasVacacionesLey (tabla LFT 2023)', () => {
  test('cada escalón de la tabla', () => {
    const esperado = {
      1: 12, 2: 14, 3: 16, 4: 18, 5: 20,
      6: 22, 10: 22, 11: 24, 15: 24, 16: 26, 20: 26,
      21: 28, 25: 28, 26: 30, 30: 30, 31: 32, 35: 32,
      36: 34, 40: 34, 41: 36,
    };
    for (const [anio, dias] of Object.entries(esperado)) {
      assert.equal(diasVacacionesLey(Number(anio)), dias, `año ${anio}`);
    }
  });
});

const base = {
  salarioDiario: 500,
  fechaAntiguedad: '2024-05-10',
  fechaBaja: '2026-09-29',
  periodicidad: 'quincenal',
};

describe('anioDeServicio (año de servicio en curso)', () => {
  const casos = [
    ['2024-05-10', '2026-09-29', 3, 'caso del criterio de aceptación 1'],
    ['2024-05-10', '2026-05-10', 3, 'baja el día del aniversario'],
    ['2024-05-10', '2026-05-09', 2, 'baja el día anterior al aniversario'],
    ['2026-09-29', '2026-09-29', 1, 'baja el mismo día de la fecha de antigüedad'],
    ['2024-02-29', '2025-02-28', 2, 'antigüedad 29 feb, aniversario en año no bisiesto'],
  ];
  for (const [antiguedad, baja, anio, desc] of casos) {
    test(desc, () => assert.equal(anioDeServicio(antiguedad, baja), anio));
  }

  test('coincide con el año de servicio de calcularFiniquito', () => {
    const r = calcularFiniquito({ ...base, fechaAntiguedad: '2020-01-15', fechaBaja: '2026-01-20' });
    assert.equal(anioDeServicio('2020-01-15', '2026-01-20'), r.conceptos.vacaciones.anioServicio);
  });

  test('null si alguna fecha no es válida o la baja es anterior a la antigüedad', () => {
    assert.equal(anioDeServicio('', '2026-09-29'), null);
    assert.equal(anioDeServicio('2026-02-30', '2026-09-29'), null);
    assert.equal(anioDeServicio('2024-05-10', undefined), null);
    assert.equal(anioDeServicio('2026-09-29', '2026-09-28'), null);
  });
});

describe('criterio de aceptación 1 (caso completo, ley)', () => {
  const r = calcularFiniquito(base);

  test('es válido, sin errores ni avisos', () => {
    assert.equal(r.valido, true);
    assert.deepEqual(r.errores, []);
    assert.deepEqual(r.avisos, []);
  });

  test('sueldo pendiente: pagado hasta el 15 de sep, 14 días', () => {
    assert.deepEqual(r.conceptos.sueldoPendiente, {
      pagadoHasta: '2026-09-15', dias: 14, monto: 7000,
    });
  });

  test('vacaciones: año 3, 16 días, 143 transcurridos', () => {
    const v = r.conceptos.vacaciones;
    assert.equal(v.anioServicio, 3);
    assert.equal(v.diasAnio, 16);
    assert.equal(v.ultimoAniversario, '2026-05-10');
    assert.equal(v.diasTranscurridos, 143);
    assert.equal(v.proporcionales, (16 * 143) / 365);
    assert.equal(v.tomadas, 0);
    assert.equal(v.pendientes, 0);
    assert.equal(v.dias, (16 * 143) / 365);
    assert.equal(v.dias.toFixed(2), '6.27');
    assert.equal(v.monto, 3134.25);
    assert.equal(v.notaNegativo, null);
  });

  test('prima vacacional 25 % sobre los días de vacaciones', () => {
    assert.deepEqual(r.conceptos.primaVacacional, {
      porcentaje: 25, dias: (16 * 143) / 365, monto: 783.56,
    });
  });

  test('aguinaldo 15 × 272 / 365', () => {
    assert.deepEqual(r.conceptos.aguinaldo, {
      diasAguinaldo: 15, desde: '2026-01-01', diasTrabajados: 272,
      dias: (15 * 272) / 365, monto: 5589.04,
    });
  });

  test('total = suma de montos redondeados', () => {
    assert.equal(r.total, 16506.85);
  });
});

const sueldoPendiente = (fechaBaja, periodicidad) =>
  calcularFiniquito({ ...base, fechaAntiguedad: '2020-01-01', fechaBaja, periodicidad })
    .conceptos.sueldoPendiente;

describe('sueldo pendiente semanal (periodo lun–dom, pago en viernes)', () => {
  const casos = [
    ['2026-09-28', 'lunes', '2026-09-27', 1],
    ['2026-09-29', 'martes', '2026-09-27', 2],
    ['2026-09-30', 'miércoles', '2026-09-27', 3],
    ['2026-10-01', 'jueves', '2026-09-27', 4],
    ['2026-10-02', 'viernes', '2026-10-04', 0],
    ['2026-10-03', 'sábado', '2026-10-04', 0],
    ['2026-10-04', 'domingo', '2026-10-04', 0],
  ];
  for (const [baja, nombre, pagadoHasta, dias] of casos) {
    test(`baja en ${nombre} (${baja}) → pagado hasta ${pagadoHasta}, ${dias} días`, () => {
      const s = sueldoPendiente(baja, 'semanal');
      assert.equal(s.pagadoHasta, pagadoHasta);
      assert.equal(s.dias, dias);
      assert.equal(s.monto, dias * 500);
    });
  }
});

describe('sueldo pendiente quincenal', () => {
  const casos = [
    ['2026-09-14', '2026-08-31', 14],
    ['2026-09-15', '2026-09-15', 0],
    ['2026-09-16', '2026-09-15', 1],
    ['2026-09-30', '2026-09-30', 0],
    ['2026-01-10', '2025-12-31', 10],
    ['2026-02-27', '2026-02-15', 12],
    ['2026-02-28', '2026-02-28', 0],
    ['2024-02-28', '2024-02-15', 13],
    ['2024-02-29', '2024-02-29', 0],
  ];
  for (const [baja, pagadoHasta, dias] of casos) {
    test(`baja ${baja} → pagado hasta ${pagadoHasta}, ${dias} días`, () => {
      const s = sueldoPendiente(baja, 'quincenal');
      assert.equal(s.pagadoHasta, pagadoHasta);
      assert.equal(s.dias, dias);
    });
  }
});

describe('sueldo pendiente mensual', () => {
  const casos = [
    ['2026-09-29', '2026-08-31', 29],
    ['2026-09-30', '2026-09-30', 0],
    ['2026-03-01', '2026-02-28', 1],
    ['2024-03-01', '2024-02-29', 1],
    ['2026-01-15', '2025-12-31', 15],
  ];
  for (const [baja, pagadoHasta, dias] of casos) {
    test(`baja ${baja} → pagado hasta ${pagadoHasta}, ${dias} días`, () => {
      const s = sueldoPendiente(baja, 'mensual');
      assert.equal(s.pagadoHasta, pagadoHasta);
      assert.equal(s.dias, dias);
    });
  }
});

describe('sueldo pendiente cuando el ingreso fue dentro del periodo', () => {
  const casos = [
    ['quincenal', '2026-09-20', '2026-09-29', '2026-09-19', 10],
    ['semanal', '2026-09-30', '2026-10-01', '2026-09-29', 2],
    ['mensual', '2026-09-10', '2026-09-29', '2026-09-09', 20],
  ];
  for (const [periodicidad, fechaAntiguedad, fechaBaja, pagadoHasta, dias] of casos) {
    test(`${periodicidad}: ingreso ${fechaAntiguedad}, baja ${fechaBaja} → ${dias} días`, () => {
      const s = calcularFiniquito({ ...base, periodicidad, fechaAntiguedad, fechaBaja })
        .conceptos.sueldoPendiente;
      assert.equal(s.pagadoHasta, pagadoHasta);
      assert.equal(s.dias, dias);
    });
  }
});

const vacaciones = (fechaAntiguedad, fechaBaja, extra = {}) =>
  calcularFiniquito({ ...base, fechaAntiguedad, fechaBaja, ...extra }).conceptos.vacaciones;

describe('vacaciones: aniversarios y año de servicio', () => {
  const casos = [
    // [antigüedad, baja, año, díasAño, últimoAniversario, transcurridos, descripción]
    ['2024-05-10', '2026-05-10', 3, 16, '2026-05-10', 1, 'baja el día del aniversario'],
    ['2024-05-10', '2026-05-09', 2, 14, '2025-05-10', 365, 'baja el día anterior al aniversario'],
    ['2026-09-29', '2026-09-29', 1, 12, '2026-09-29', 1, 'baja el mismo día del ingreso'],
    ['2024-02-29', '2025-02-28', 2, 14, '2025-02-28', 1, 'ingreso 29 feb, aniversario en año no bisiesto'],
    ['2024-02-29', '2025-02-27', 1, 12, '2024-02-29', 365, 'ingreso 29 feb, día anterior al aniversario'],
    ['2024-02-29', '2027-03-01', 4, 18, '2027-02-28', 2, 'ingreso 29 feb, 1 de marzo de año no bisiesto'],
    ['2024-02-29', '2028-02-29', 5, 20, '2028-02-29', 1, 'ingreso 29 feb, aniversario en año bisiesto'],
    ['2023-03-01', '2024-02-29', 1, 12, '2023-03-01', 365, 'año de servicio con 366 días topa en 365'],
    ['2020-01-15', '2026-01-20', 7, 22, '2026-01-15', 6, 'año 7 (escalón 6–10)'],
  ];
  for (const [ant, baja, anio, diasAnio, ultimo, transcurridos, desc] of casos) {
    test(desc, () => {
      const v = vacaciones(ant, baja);
      assert.equal(v.anioServicio, anio);
      assert.equal(v.diasAnio, diasAnio);
      assert.equal(v.ultimoAniversario, ultimo);
      assert.equal(v.diasTranscurridos, transcurridos);
      assert.equal(v.proporcionales, (diasAnio * transcurridos) / 365);
    });
  }
});

describe('vacaciones tomadas y pendientes', () => {
  test('las tomadas se restan del proporcional y las pendientes se suman completas', () => {
    const r = calcularFiniquito({ ...base, vacacionesTomadas: 2, vacacionesPendientes: 3 });
    const v = r.conceptos.vacaciones;
    assert.equal(v.tomadas, 2);
    assert.equal(v.pendientes, 3);
    assert.equal(v.proporcionales, (16 * 143) / 365 - 2);
    assert.equal(v.dias, (16 * 143) / 365 - 2 + 3);
    assert.equal(v.monto, 3634.25);
    assert.equal(v.notaNegativo, null);
    assert.equal(r.conceptos.primaVacacional.dias, v.dias);
    assert.equal(r.conceptos.primaVacacional.monto, 908.56);
  });

  test('si las tomadas superan el proporcional, se muestra 0 con nota y no se descuenta de otros conceptos', () => {
    const r = calcularFiniquito({ ...base, vacacionesTomadas: 10, vacacionesPendientes: 3 });
    const v = r.conceptos.vacaciones;
    assert.equal(r.valido, true);
    assert.equal(v.proporcionales, 0);
    assert.equal(v.dias, 3);
    assert.equal(v.monto, 1500);
    assert.equal(typeof v.notaNegativo, 'string');
    assert.match(v.notaNegativo, /0/);
    assert.equal(r.conceptos.primaVacacional.monto, 375);
    assert.equal(r.conceptos.aguinaldo.monto, 5589.04);
    assert.equal(r.conceptos.sueldoPendiente.monto, 7000);
    assert.equal(r.total, 14464.04);
  });
});

describe('aguinaldo proporcional', () => {
  const aguinaldo = (fechaAntiguedad, fechaBaja) =>
    calcularFiniquito({ ...base, fechaAntiguedad, fechaBaja }).conceptos.aguinaldo;

  test('ingreso en el año de la baja: cuenta desde la fecha de antigüedad', () => {
    const a = aguinaldo('2026-03-01', '2026-09-29');
    assert.equal(a.desde, '2026-03-01');
    assert.equal(a.diasTrabajados, 213);
    assert.equal(a.dias, (15 * 213) / 365);
    assert.equal(a.monto, 4376.71);
  });

  test('año bisiesto con baja el 31 de dic: 366 días topan en 365 (aguinaldo completo)', () => {
    const a = aguinaldo('2020-01-01', '2024-12-31');
    assert.equal(a.desde, '2024-01-01');
    assert.equal(a.diasTrabajados, 365);
    assert.equal(a.dias, 15);
    assert.equal(a.monto, 7500);
  });

  test('baja el 1 de enero: 1 día trabajado', () => {
    const a = aguinaldo('2020-01-01', '2026-01-01');
    assert.equal(a.desde, '2026-01-01');
    assert.equal(a.diasTrabajados, 1);
    assert.equal(a.monto, 20.55);
  });
});

const campos = (r) => r.errores.map((e) => e.campo);

function assertBloqueado(r, campo) {
  assert.equal(r.valido, false);
  assert.equal(r.conceptos, null);
  assert.equal(r.total, null);
  assert.ok(campos(r).includes(campo), `se esperaba error en ${campo}, hubo: ${campos(r)}`);
  for (const e of r.errores) {
    assert.equal(typeof e.mensaje, 'string');
    assert.ok(e.mensaje.length > 10);
  }
}

describe('validaciones que bloquean el cálculo', () => {
  for (const salarioDiario of [undefined, null, '', NaN, 0, -100]) {
    test(`salario diario ${String(salarioDiario)} → error`, () => {
      const r = calcularFiniquito({ ...base, salarioDiario });
      assertBloqueado(r, 'salarioDiario');
      assert.match(r.errores[0].mensaje, /salario diario/i);
    });
  }

  for (const fecha of ['', 'abc', '2026-02-30', '2026-13-01', '29/09/2026', undefined]) {
    test(`fecha de antigüedad inválida (${String(fecha)}) → error`, () => {
      assertBloqueado(calcularFiniquito({ ...base, fechaAntiguedad: fecha }), 'fechaAntiguedad');
    });
    test(`fecha de baja inválida (${String(fecha)}) → error`, () => {
      assertBloqueado(calcularFiniquito({ ...base, fechaBaja: fecha }), 'fechaBaja');
    });
  }

  test('baja anterior a la antigüedad → error en fecha de baja', () => {
    const r = calcularFiniquito({ ...base, fechaAntiguedad: '2026-09-29', fechaBaja: '2026-09-28' });
    assertBloqueado(r, 'fechaBaja');
    assert.match(r.errores[0].mensaje, /anterior/);
  });

  test('periodicidad desconocida → error', () => {
    assertBloqueado(calcularFiniquito({ ...base, periodicidad: 'diaria' }), 'periodicidad');
  });

  test('vacaciones tomadas negativas → error', () => {
    assertBloqueado(calcularFiniquito({ ...base, vacacionesTomadas: -1 }), 'vacacionesTomadas');
  });

  test('vacaciones pendientes negativas → error', () => {
    assertBloqueado(calcularFiniquito({ ...base, vacacionesPendientes: -1 }), 'vacacionesPendientes');
  });

  test('reporta todos los errores a la vez', () => {
    const r = calcularFiniquito({ ...base, salarioDiario: 0, vacacionesTomadas: -1, periodicidad: 'x' });
    assert.deepEqual(campos(r).sort(), ['periodicidad', 'salarioDiario', 'vacacionesTomadas']);
  });
});

describe('prestaciones superiores', () => {
  const ley = { diasAguinaldo: 15, primaVacacional: 25, diasVacaciones: 16 };

  test('30 días de aguinaldo, 50 % de prima y 20 días de vacaciones', () => {
    const r = calcularFiniquito({
      ...base, prestaciones: { diasAguinaldo: 30, primaVacacional: 50, diasVacaciones: 20 },
    });
    assert.equal(r.valido, true);
    assert.equal(r.conceptos.vacaciones.diasAnio, 20);
    assert.equal(r.conceptos.vacaciones.monto, 3917.81);
    assert.equal(r.conceptos.primaVacacional.porcentaje, 50);
    assert.equal(r.conceptos.primaVacacional.monto, 1958.9);
    assert.equal(r.conceptos.aguinaldo.diasAguinaldo, 30);
    assert.equal(r.conceptos.aguinaldo.monto, 11178.08);
    assert.equal(r.total, 24054.79);
  });

  test('prestaciones iguales a la ley dan el mismo resultado que sin prestaciones', () => {
    assert.deepEqual(calcularFiniquito({ ...base, prestaciones: ley }), calcularFiniquito(base));
  });

  test('aguinaldo menor a 15 días → error', () => {
    assertBloqueado(
      calcularFiniquito({ ...base, prestaciones: { ...ley, diasAguinaldo: 14 } }), 'diasAguinaldo');
  });

  test('prima vacacional menor a 25 % → error', () => {
    assertBloqueado(
      calcularFiniquito({ ...base, prestaciones: { ...ley, primaVacacional: 20 } }), 'primaVacacional');
  });

  test('vacaciones menores a las de ley del año en curso → error', () => {
    const r = calcularFiniquito({ ...base, prestaciones: { ...ley, diasVacaciones: 15 } });
    assertBloqueado(r, 'diasVacaciones');
    assert.match(r.errores[0].mensaje, /16/);
  });

  test('prestación vacía o no numérica → error', () => {
    assertBloqueado(
      calcularFiniquito({ ...base, prestaciones: { ...ley, diasAguinaldo: '' } }), 'diasAguinaldo');
  });
});

describe('aviso de salario mínimo 2026 (no bloquea)', () => {
  test('constantes', () => {
    assert.deepEqual(SALARIO_MINIMO_2026, { general: 315.04, fronteraNorte: 440.87 });
    assert.deepEqual(MINIMOS_LEY, { diasAguinaldo: 15, primaVacacional: 25 });
  });

  test('salario diario $200 avisa pero calcula', () => {
    const r = calcularFiniquito({ ...base, salarioDiario: 200 });
    assert.equal(r.valido, true);
    assert.equal(r.avisos.length, 1);
    assert.equal(r.avisos[0].campo, 'salarioDiario');
    assert.match(r.avisos[0].mensaje, /315\.04/);
    assert.match(r.avisos[0].mensaje, /440\.87/);
    assert.notEqual(r.total, null);
    assert.equal(r.conceptos.sueldoPendiente.monto, 2800);
  });

  test('salario igual al mínimo general no avisa; un centavo menos sí', () => {
    assert.equal(calcularFiniquito({ ...base, salarioDiario: 315.04 }).avisos.length, 0);
    assert.equal(calcularFiniquito({ ...base, salarioDiario: 315.03 }).avisos.length, 1);
  });
});

describe('redondeo (D8)', () => {
  test('cada monto a centavos y el total es la suma de los montos redondeados', () => {
    // Montos exactos: 4200.98 + 1880.9867 + 470.2467 + 3354.2071 = 9906.4205 (→ 9906.42 si se redondeara la suma)
    // Montos redondeados: 4200.98 + 1880.99 + 470.25 + 3354.21 = 9906.43
    const r = calcularFiniquito({ ...base, salarioDiario: 300.07 });
    const c = r.conceptos;
    assert.equal(c.sueldoPendiente.monto, 4200.98);
    assert.equal(c.vacaciones.monto, 1880.99);
    assert.equal(c.primaVacacional.monto, 470.25);
    assert.equal(c.aguinaldo.monto, 3354.21);
    assert.equal(r.total, 9906.43);
  });
});
