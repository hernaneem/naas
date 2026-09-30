# Calculadora de aguinaldo — Spec
> 2026-09-30 · Estado: aprobado (Hernán pidió construirla de inmediato; decisiones A1–A3 propuestas en el chat, sujetas a su revisión)
> Ola 2 de `2026-09-29-calculadora-finiquito.md`: reutiliza su motor y sus decisiones D4, D7, D8 y D12.

## Problema

La pregunta laboral más buscada del año en México es "¿cuánto aguinaldo me toca?". Hoy nominaas.com solo tiene la calculadora de finiquito, que muestra el aguinaldo pero exige fecha de baja y periodicidad, datos que no aplican a quien sigue trabajando.

## Solución

Una página pública `calculadora-aguinaldo` en la que la persona captura su sueldo, su fecha de antigüedad y (opcional) sus días de aguinaldo, y ve al instante su **aguinaldo proporcional** estimado del año en curso, con la fórmula y las mismas leyendas de **monto estimado**. Mismo diseño, footer y CTA que la calculadora de finiquito, y enlaces cruzados entre las dos.

## Historias de usuario

1. Como persona trabajadora, quiero saber cuánto aguinaldo me toca este año, para planear mis gastos de diciembre.
2. Como persona de RH, quiero calcular el aguinaldo de alguien del equipo en segundos, para presupuestar la nómina de diciembre.
3. Como usuaria, quiero capturar mi sueldo mensual si no conozco el diario (D7).
4. Como usuaria que entró este año, quiero que el cálculo sea proporcional desde mi fecha de antigüedad.
5. Como usuaria cuya empresa da más de 15 días, quiero capturar mis días de aguinaldo, sin poder poner menos de 15.
6. Como usuaria que sale antes de diciembre, quiero cambiar la fecha "Calcular al", para saber el proporcional a mi salida.
7. Como usuaria, quiero ver la fórmula con mis números ("15 × 272 ÷ 365 × $500").
8. Como usuaria, quiero saber que el monto es bruto, estimado, que las faltas injustificadas se descuentan y que la ley obliga a pagarlo antes del 20 de diciembre.
9. Como usuaria, quiero imprimir o guardar el resultado en PDF.
10. Como visitante, quiero encontrar la calculadora en la columna "Herramientas" del footer y pasar de una calculadora a la otra.
11. Como usuaria en celular o con teclado/lector de pantalla, quiero usarla cómodamente (mismos estándares que la de finiquito).

## Decisiones

**A1 · Qué calcula.** Aguinaldo proporcional = días de aguinaldo × días trabajados ÷ 365 × salario diario, con días trabajados = del 1 de enero del año de la fecha "Calcular al" (o de la fecha de antigüedad, si es posterior) a esa fecha, ambos incluidos, tope 365 (misma regla que D4). La fecha "Calcular al" viene en el 31 de diciembre del año actual y es editable. Días de aguinaldo visibles desde el inicio (no detrás de interruptor), 15 por default, mínimo 15.

**A2 · Igual que finiquito.** Sin campo de faltas (solo leyenda), montos brutos antes de ISR, salario mensual ÷ 30 redondeado a centavos (D7), redondeo a centavos del monto (D8), aviso sin bloqueo por debajo del salario mínimo general (D12).

**A3 · Navegación.** La columna "Herramientas" del footer suma "Calculadora de aguinaldo" en todas las páginas; cada calculadora enlaza a la otra de forma visible.

**A4 · Motor.** El módulo de cálculo expone `calcularAguinaldo` y `calcularFiniquito` usa la misma regla interna de aguinaldo (una sola implementación de D4).

```js
calcularAguinaldo({
  salarioDiario,        // number > 0
  fechaAntiguedad,      // 'YYYY-MM-DD'
  fechaCorte,           // 'YYYY-MM-DD' ("Calcular al")
  diasAguinaldo = 15,   // >= 15
}) → {
  valido, errores: [{ campo, mensaje }], avisos: [{ campo, mensaje }],
  aguinaldo: {
    diasAguinaldo, desde, hasta, diasTrabajados, dias, monto,
    topado,           // bool: los días del periodo pasaban de 365 (año bisiesto completo) y se toparon
    desdeAntiguedad,  // bool: el conteo empieza en la fecha de antigüedad y no en el 1 de enero
  } | null,
}
```

La interfaz solo explica el resultado con `topado` y `desdeAntiguedad`; no recalcula reglas de negocio.

Validaciones que bloquean: salario vacío o ≤ 0, fechas inválidas, fecha de corte anterior a la antigüedad, días de aguinaldo vacíos ("Captura tus días de aguinaldo (mínimo 15).") o < 15 (mensaje del mínimo de ley).

Implementación (ticket #9): la regla vive en una función interna `aguinaldoProporcional(antiguedad, hasta, diasAguinaldo, salarioDiario)` que usan `calcularAguinaldo` y `calcularFiniquito`; `calcularFiniquito` sigue devolviendo su aguinaldo sin `hasta`, `topado` ni `desdeAntiguedad` (su salida no cambió). Tras el code review se agregaron `topado` y `desdeAntiguedad` para que la página no duplique esas reglas. La validación del salario y el aviso de salario mínimo también son internos y compartidos (`validarSalario`), así que el aviso es el mismo texto en las dos calculadoras. Pruebas en `tests/calcular-aguinaldo.test.js`.

## Testing

Seam: `calcularAguinaldo` con `node --test`. Casos: año completo (15 días exactos), ingreso a mitad de año, corte antes de diciembre, año bisiesto al 31 de diciembre (tope 365), antigüedad de años anteriores, días superiores, validaciones y aviso de salario mínimo, y que `calcularFiniquito` siga dando lo mismo (las pruebas existentes no cambian). UI verificada en navegador.

## Producción

Igual que la ola 1: sitio estático, sin datos ni endpoints. Nada de `innerHTML` con datos capturados; `rel="noopener"` en `target="_blank"`.

## Fuera de alcance

- ISR del aguinaldo (exención de 30 UMA) → ola futura "versión pro", junto con el finiquito.
- Faltas e incapacidades → explícitamente fuera (solo leyenda).

## Criterios de aceptación

1. Diario $500, antigüedad 2020-03-01, calcular al 2026-12-31, 15 días → 365 días trabajados, 15.00 días, $7,500.00.
2. Diario $500, antigüedad 2026-06-01, calcular al 2026-12-31 → 214 días, 15 × 214 ÷ 365 = 8.79 días, $4,397.26.
3. Diario $500, antigüedad 2024-05-10, calcular al 2026-09-29 → $5,589.04 (igual que el aguinaldo del finiquito).
4. Mensual $15,000 → "Salario diario: $500.00".
5. 30 días de aguinaldo en el caso 1 → $15,000.00; 10 días → error sin monto.
6. Calcular al anterior a la antigüedad → error sin monto.
7. Leyendas: bruto antes de ISR, estimación sin asesoría legal, faltas injustificadas se descuentan, se paga antes del 20 de diciembre.
8. Imprimir muestra solo el resultado.
9. "Herramientas" en el footer de todas las páginas con ambas calculadoras; enlaces cruzados entre calculadoras.
10. 375 px sin scroll horizontal, operable con teclado, consola sin errores.
11. `npm test` pasa.
