# ISR y neto estimado en las calculadoras — Spec
> 2026-09-30 · Estado: aprobado (VoBo Hernán 2026-09-30, Q1–Q9)
> Extiende `2026-09-29-calculadora-finiquito.md` y `2026-09-30-calculadora-aguinaldo.md`. Cifras fiscales: `docs/research/2026-09-30-isr-finiquito-aguinaldo.md`.

## Problema

Las dos calculadoras muestran montos brutos. La persona no sabe cuánto le va a llegar realmente, porque parte del aguinaldo y de la prima vacacional está exenta, y lo demás paga ISR según su periodo de nómina.

## Solución

Ambas calculadoras muestran en grande el **neto estimado** y debajo "Bruto − ISR estimado". "¿Cómo se calculó?" separa la **parte exenta** y la **parte gravada** de cada concepto y muestra el ISR paso a paso con la tarifa 2026 del periodo de la persona.

## Historias de usuario

1. Como persona trabajadora, quiero ver cuánto recibiré después de ISR, para saber qué me va a llegar.
2. Como RH, quiero una estimación del ISR a retener en el finiquito o el aguinaldo, para anticipar el pago.
3. Como usuaria, quiero ver qué parte de mi aguinaldo y de mi prima vacacional está exenta, para entender por qué no todo paga impuesto.
4. Como usuaria, quiero que se use la tarifa de mi periodicidad (semanal, quincenal o mensual).
5. Como usuaria de la calculadora de aguinaldo, quiero elegir mi periodicidad de pago.
6. Como usuaria que gana el salario mínimo, quiero ver que no se me retiene ISR.
7. Como usuaria, quiero saber que es una aproximación: sin subsidio para el empleo, sin IMSS ni otras deducciones, y que mi empresa podría usar un método que retiene menos.

## Decisiones

**I1 (VoBo 2026-09-30, Q1) · Método art. 96 incremental.** ISR estimado = ISR(sueldo del periodo + parte gravada total) − ISR(sueldo del periodo), cada uno con la tarifa 2026 de la periodicidad (Anexo 8 RMF 2026: semanal 7 días, quincenal 15 días, mensual). Nunca negativo. El sueldo del periodo y las dos bases se redondean a centavos antes de aplicar la tarifa (diferencias de ≤ $0.01 frente a no redondearlos); el ISR de cada base queda sin redondear y la diferencia se redondea a centavos al final. Descartado: art. 174 RLISR (opcional para la empresa); se menciona en una nota.

**I2 (Q2) · Sueldo del periodo.** Salario diario × 7 / 15 / 30.4. En el finiquito, el sueldo pendiente se suma completo a la parte gravada: se supone que todo el finiquito se paga junto con un periodo ordinario.

**I3 (Q3, Q9) · Sin subsidio para el empleo.** No se calcula. Nota: "si ganas menos de ~$11,500 al mes, tu ISR real puede ser menor por el subsidio para el empleo".

**I4 (Q4) · Exenciones completas.** UMA 2026 = $117.31. Aguinaldo exento hasta 30 UMA ($3,519.30); prima vacacional exenta hasta 15 UMA ($1,759.65); sueldo pendiente y vacaciones gravan completos. Parte exenta = mínimo(monto del concepto redondeado, tope); gravada = monto − exenta. Se supone que la persona no ha usado su exención anual; nota que lo aclara. Se usa la UMA 2026 para cualquier fecha (sin distinguir enero).

**I5 (Q5) · Periodicidad en aguinaldo.** La calculadora de aguinaldo agrega el selector semanal / quincenal / mensual (quincenal por default). En el motor, `periodicidad` es opcional con default `'quincenal'`, para no romper su interfaz.

**I6 (Q6) · Qué se muestra.** Número grande = neto estimado. Debajo: bruto y ISR estimado. En "¿Cómo se calculó?": exenta/gravada por concepto, sueldo del periodo, las dos bases, el renglón de tarifa usado (límite inferior, cuota fija, %) y el ISR de cada una. La barra fija en móvil y el anuncio para lectores de pantalla muestran el neto. Impresión incluye bruto, ISR y neto.

**I7 (Q7) · Salario mínimo y deducciones.** Si el salario diario ≤ $315.04 (mínimo general 2026), ISR = 0 con nota ("a quien gana el salario mínimo no se le retiene ISR"). Leyenda: "No incluye cuotas IMSS, INFONAVIT ni otras deducciones".

**I8 (Q8) · Cifras fiscales en un solo bloque.** Tarifas, UMA y topes de exención viven en un solo bloque del motor marcado "vigente 2026", con fuente (DOF/Anexo 8) en comentario. La página dice "Cálculo con tarifas ISR 2026".

### Interfaz del motor (aditiva)

```js
calcularIsrPeriodo(base, periodicidad) → { base, renglon: { limiteInferior, cuotaFija, porcentaje }, isr }  // isr sin redondear

// calcularFiniquito(...) y calcularAguinaldo({ ..., periodicidad = 'quincenal' }) agregan, cuando valido:
isr: {
  periodicidad, sueldoPeriodo,
  conceptos: { <concepto>: { monto, exento, gravado, topeExento, topeUma } },   // finiquito: sueldoPendiente, vacaciones, primaVacacional, aguinaldo; aguinaldo: aguinaldo
                                                                                // topeExento/topeUma: aguinaldo 3,519.30/30; prima 1,759.65/15; null si grava completo
  exentoTotal, gravadoTotal,
  ordinario: { base, renglon, isr },   // ISR(sueldo del periodo)
  conExtra:  { base, renglon, isr },   // ISR(sueldo del periodo + gravado)
  salarioMinimo,                        // true → isr = 0
  isr,                                  // redondeado a centavos
},
neto,                                   // total (o aguinaldo.monto) − isr.isr
```

Los campos existentes no cambian de valor.

## Testing

Seam: `calcularIsrPeriodo`, `calcularFiniquito`, `calcularAguinaldo` con `node --test`. Casos: cada tarifa en límites de renglón, ejemplo de la investigación (mensual: ISR de $15,200 = $1,438.66; de $19,180.70 = $2,208.65), exenciones por debajo y por encima del tope, prestaciones superiores, salario mínimo, periodicidad por default en aguinaldo, ISR incremental nunca negativo, criterios de abajo. Las pruebas existentes no cambian sus aserciones de valores (solo se permite ajustar comparaciones de objeto completo para aceptar los campos nuevos).

## Producción

Sin cambios de infraestructura. Al cambiar módulos se sube `?v=` en todas las etiquetas e imports (regla del spec de aguinaldo).

## Fuera de alcance

- Subsidio para el empleo → explícitamente fuera (decisión de Hernán).
- Art. 174 RLISR como opción de cálculo → solo nota.
- Exención ya usada en el año, IMSS/INFONAVIT → solo leyenda.
- Actualización anual de cifras → tarea de cada enero/febrero (bloque I8).

## Criterios de aceptación

1. Aguinaldo: diario $500, año completo (antigüedad 2020-03-01, al 2026-12-31), 15 días, **mensual** → exento $3,519.30, gravado $3,980.70, ISR $769.99, neto $6,730.01.
2. Mismo caso **quincenal** → sueldo del periodo $7,500, ISR($7,500) = 709.86, ISR($11,480.70) = 1,520.54, ISR estimado $810.68, neto $6,689.32.
3. Finiquito caso base (diario $500, 2024-05-10 → 2026-09-29, quincenal): prima $783.56 exenta completa; aguinaldo $5,589.04 = exento $3,519.30 + gravado $2,069.74; gravado total $12,203.99; base con extra $19,703.99; ISR estimado $2,615.82; neto $13,891.03.
4. Diario $300 → ISR $0 con nota de salario mínimo; neto = bruto.
5. Número grande = neto; se ven bruto e ISR; barra móvil muestra neto.
6. "¿Cómo se calculó?" muestra exenta/gravada, bases, renglón de tarifa e ISR.
7. Leyendas: tarifas 2026, sin subsidio, sin IMSS/INFONAVIT, método opcional que puede retener menos, exención anual supuesta completa.
8. Calculadora de aguinaldo tiene selector de periodicidad (quincenal por default).
9. `npm test` pasa; consola sin errores; 375 px sin scroll horizontal.
