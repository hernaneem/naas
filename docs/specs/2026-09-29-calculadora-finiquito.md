# Calculadora de finiquito — Spec
> 2026-09-29 · Estado: aprobado (VoBo Hernán 2026-09-29; arranque sin revisión del spec por instrucción de Hernán)

## Problema

Un cliente de NaaS (y cualquier RH o dueño de pyme) necesita estimar rápido el finiquito de una persona que se va, sin tener que pedírselo a Hernán cada vez. Hoy no hay herramienta en nominaas.com: hacerlo a mano exige saber la tabla de vacaciones de la LFT, contar días por aniversario y por año calendario y cuidar los días de corte de la nómina, y ahí se cometen errores.

## Solución

Una página pública y gratuita, `calculadora-finiquito`, dentro de nominaas.com. La persona captura su sueldo, su fecha de antigüedad, su fecha de baja y la periodicidad de su nómina, y ve al instante un **monto estimado** de su **finiquito** desglosado en: sueldo pendiente, vacaciones proporcionales y pendientes, prima vacacional y aguinaldo proporcional. Si su empresa da **prestaciones superiores**, las activa con un interruptor. El resultado explica cómo se calculó, se puede imprimir o guardar en PDF y termina con una invitación a conocer NaaS.

## Historias de usuario

1. Como persona de RH, quiero capturar sueldo, fecha de antigüedad y fecha de baja, para obtener el finiquito estimado de alguien de mi equipo en segundos.
2. Como persona trabajadora, quiero calcular mi propio finiquito, para saber si lo que me ofrecen es razonable.
3. Como usuaria, quiero capturar mi sueldo mensual si no conozco el diario, para no tener que dividirlo yo.
4. Como usuaria, quiero ver el salario diario que resulta de mi sueldo mensual, para confirmar que el sistema entendió bien.
5. Como usuaria, quiero que la fecha de baja venga con la fecha de hoy, para no capturarla cuando calculo el día de la salida.
6. Como usuaria, quiero elegir si mi nómina es semanal, quincenal o mensual, para que se estimen los días trabajados que no me han pagado.
7. Como usuaria, quiero ver hasta qué fecha se supone que me pagaron, para entender de dónde salen los días de sueldo pendiente.
8. Como usuaria, quiero ver mis días de vacaciones proporcionales del año de servicio en curso, para saber cuánto me toca por lo que ya trabajé.
9. Como usuaria, quiero indicar los días de vacaciones que ya tomé en mi año actual, para que se resten del proporcional.
10. Como usuaria, quiero indicar días de vacaciones pendientes de años anteriores, para que se sumen completos.
11. Como usuaria, quiero ver la prima vacacional calculada sobre todos mis días de vacaciones a pagar, para no olvidarla.
12. Como usuaria, quiero ver mi aguinaldo proporcional del año calendario, para saber cuánto me corresponde aunque no llegue a diciembre.
13. Como usuaria cuya empresa da más que la ley, quiero activar "prestaciones superiores" y capturar días de aguinaldo, % de prima y días de vacaciones de mi año actual, para que el cálculo refleje lo que realmente tengo.
14. Como usuaria, quiero que los campos de prestaciones superiores vengan con el mínimo de ley, para solo cambiar lo que difiere.
15. Como usuaria, quiero que el sistema no acepte prestaciones por debajo de la ley, para no calcular algo ilegal por error.
16. Como usuaria, quiero ver un total grande y el desglose por concepto (días y monto), para entender la composición.
17. Como usuaria, quiero desplegar "¿Cómo se calculó?" con mis propios números en la fórmula, para verificarlo o explicarlo.
18. Como usuaria, quiero que el resultado se actualice mientras escribo, sin botón de calcular.
19. Como persona de RH, quiero imprimir o guardar el resultado en PDF, para tener soporte al entregar el finiquito.
20. Como usuaria, quiero un mensaje claro si la fecha de baja es anterior a la de antigüedad, para corregirlo.
21. Como usuaria, quiero un mensaje claro si falta el sueldo o es cero, en vez de un resultado vacío o absurdo.
22. Como usuaria, quiero un aviso (sin bloqueo) si mi salario diario está por debajo del salario mínimo 2026, para revisar si capturé mal.
23. Como usuaria, quiero leer que los montos son brutos, estimados y no son asesoría legal, para no tomarlos como definitivos.
24. Como usuaria, quiero saber que las faltas se descuentan del aguinaldo y que, si ya recibí el aguinaldo de este año, no se suma, para interpretar bien la cifra.
25. Como visitante de cualquier página de NaaS, quiero encontrar la calculadora en la columna "Herramientas" del footer.
26. Como NaaS, quiero que al final del resultado haya una invitación a la demo, para convertir a RH en prospectos.
27. Como usuaria en celular, quiero usar la calculadora cómodamente en pantalla angosta.
28. Como usuaria de teclado o lector de pantalla, quiero que el formulario y el resultado sean accesibles.

## Decisiones

**D1 (VoBo Hernán 2026-09-29) · Sueldo pendiente por periodicidad fija.** Se supone hasta qué día cubrió el último pago:
- Semanal (periodo lunes–domingo, pago en viernes): baja de lunes a jueves → pagado hasta el domingo anterior; baja viernes, sábado o domingo → pagado hasta ese domingo (0 días pendientes).
- Quincenal: pagado hasta el último día 15 o último día de mes que sea igual o anterior a la baja.
- Mensual: pagado hasta el último día del mes anterior; si la baja es el último día del mes, 0 días pendientes.

Días pendientes = días calendario después de la fecha pagada hasta la baja (incluida). Monto = días × salario diario. Se muestra la suposición ("Suponemos que tu último pago cubrió hasta el …"). Descartado: capturar la fecha del último pago, porque agrega variables que la gente no conoce con precisión.

**D2 (VoBo Hernán 2026-09-29) · Vacaciones con tabla LFT 2023.** Días por año de servicio: 1→12, 2→14, 3→16, 4→18, 5→20, 6–10→22, 11–15→24, 16–20→26, 21–25→28, 26–30→30, 31–35→32 (y +2 por cada 5 años siguientes). Año de servicio en curso = años cumplidos + 1. Días transcurridos = desde el último aniversario hasta la baja, ambos incluidos, tope 365. Vacaciones proporcionales = días del año en curso × días transcurridos ÷ 365 − días ya tomados; si da negativo se muestra 0 con nota y no se descuenta de otros conceptos. Se suman completas las vacaciones pendientes de años anteriores. Monto = días × salario diario. Aniversario de un 29 de febrero en año no bisiesto: 28 de febrero.

**D3 (VoBo Hernán 2026-09-29) · Prima vacacional.** % de prima × (vacaciones proporcionales + pendientes) × salario diario. Mínimo 25 %.

**D4 (VoBo Hernán 2026-09-29) · Aguinaldo.** Días de aguinaldo × días trabajados en el año calendario ÷ 365. Días trabajados = del 1 de enero del año de la baja (o de la fecha de antigüedad, si es posterior) a la baja, ambos incluidos, tope 365; divisor siempre 365. Las faltas no se capturan: solo se advierte que se descuentan. Descartado: campo de faltas, porque la gente no las sabe.

**D5 (VoBo Hernán 2026-09-29) · Validaciones.** Bloquean el cálculo: sueldo vacío o ≤ 0, fechas inválidas, baja anterior a la antigüedad, días de vacaciones tomados o pendientes negativos, y prestaciones por debajo de la ley (aguinaldo < 15 días, prima < 25 %, vacaciones < las de ley del año en curso). Avisan sin bloquear: salario diario menor al salario mínimo 2026 ($315.04 general; $440.87 zona libre de la frontera norte).

**D6 (VoBo Hernán 2026-09-29) · Motor puro + página estática.** Un módulo de cálculo sin DOM (ES module) que recibe una entrada y devuelve el resultado completo (conceptos, total, errores, avisos y datos para explicar la fórmula); una página HTML con su JS de interfaz que solo lee el formulario, llama al motor y pinta. El mismo motor se reutilizará en la calculadora de aguinaldo (ola 2). Sin build ni framework: el sitio sigue siendo estático en GitHub Pages. Descartado: JS inline en un solo HTML (lógica de dinero sin pruebas y duplicada en la ola 2) y React/Vite (rompe el sitio estático).

**D7 · Sueldo mensual.** Salario diario = mensual ÷ 30, redondeado a centavos (como aparece en un recibo) antes de calcular.

**D8 · Redondeo.** Los cálculos usan días sin redondear; cada monto de concepto se redondea a centavos y el total es la suma de los montos redondeados. Los días se muestran con 2 decimales.

**D9 · Prestaciones superiores.** Interruptor que despliega tres campos precargados con la ley: días de aguinaldo (15), % de prima vacacional (25) y días de vacaciones del año de servicio en curso (según tabla D2, se recalcula al cambiar fechas mientras el usuario no lo haya editado). Sin parámetros en URL.

**D10 · Ubicación.** No va en el menú principal: columna "Herramientas" en el footer de todas las páginas. CTA final a la demo (`cal.com/hernaneem/reunion-naas`). Sin analytics ni captura de datos.

**D11 · Ingreso dentro del último periodo.** El sueldo pendiente nunca cuenta días anteriores a la fecha de antigüedad: si la fecha supuesta de pago (D1) es anterior al ingreso, los días pendientes van desde la fecha de antigüedad. Si el pago supuesto ya cubre la baja, son 0 aunque la persona haya entrado a mitad del periodo (ese pago incluye lo que trabajó). En pantalla, en ese caso no se muestra una fecha de pago anterior al ingreso sino "se cuentan desde tu fecha de antigüedad".

**D12 · Aviso de salario mínimo.** Como no se captura zona, solo avisa por debajo del mínimo general; el mensaje menciona también el de la frontera norte.

### Interfaz del motor

```js
calcularFiniquito({
  salarioDiario,           // number > 0
  fechaAntiguedad,         // 'YYYY-MM-DD'
  fechaBaja,               // 'YYYY-MM-DD'
  periodicidad,            // 'semanal' | 'quincenal' | 'mensual'
  vacacionesTomadas = 0,   // días ya tomados en el año de servicio en curso
  vacacionesPendientes = 0,// días de años anteriores
  prestaciones = null,     // null = ley; o { diasAguinaldo, primaVacacional /* % ej. 25 */, diasVacaciones }
}) → {
  valido, errores: [{ campo, mensaje }], avisos: [{ campo, mensaje }],
  conceptos: {
    sueldoPendiente: { pagadoHasta, dias, monto },
    vacaciones: { anioServicio, diasAnio, ultimoAniversario, diasTranscurridos,
                  proporcionales, tomadas, pendientes, dias, monto, notaNegativo },
    primaVacacional: { porcentaje, dias, monto },
    aguinaldo: { diasAguinaldo, desde, diasTrabajados, dias, monto },
  },
  total,
}
```

Además exporta `diasVacacionesLey(anioServicio)`, `anioDeServicio(fechaAntiguedad, fechaBaja)` (año de servicio en curso, o `null` si alguna fecha no es válida o la baja es anterior a la antigüedad; la interfaz lo usa para precargar los días de vacaciones de ley), `SALARIO_MINIMO_2026` y `MINIMOS_LEY`. Las fechas se manejan como días calendario (sin horas ni zona horaria).

## Testing

Seam único: la función pública del motor (`calcularFiniquito`, `diasVacacionesLey` y `anioDeServicio`) probada con `node --test`, sin dependencias. Casos: tabla de vacaciones en cada escalón, aniversarios (incluido 29 de feb), baja el día del aniversario y el día anterior, ingreso en el año de la baja, año bisiesto con baja el 31 de dic, los tres cortes de periodicidad (cada día de la semana, días 14/15/16/fin de mes, mensual último día), prestaciones superiores, validaciones y avisos, redondeo del total. La interfaz se verifica en navegador (Playwright) sin pruebas automatizadas propias. No hay pruebas previas en el repo que imitar.

## Producción

Sitio estático sin backend: no hay auth, datos, endpoints, rate limits ni secretos. Capas que aplican: validación de entrada (D5, en el motor), seguridad (nada de `innerHTML` con texto capturado por el usuario) y build (sin archivos que no deban publicarse; `NAASV2/` sigue ignorado).

## Fuera de alcance

- Prima de antigüedad y selector de motivo de baja → ola futura.
- Liquidación / indemnización → ola futura.
- Cálculo de ISR y montos netos → ola futura ("versión pro").
- Calculadora de aguinaldo → ola 2, con el mismo motor.
- Captura de leads, PDF propio, analytics → explícitamente fuera por ahora.
- Links con prestaciones precargadas por URL → explícitamente nunca (decisión de Hernán).

## Plan de olas

| Ola | Contenido | Deploy |
|---|---|---|
| 1 | Motor + calculadora de finiquito + columna "Herramientas" en footer | Merge a `main` (compuerta de Hernán) |
| 2 | Calculadora de aguinaldo reutilizando el motor | Siguiente merge |

## Criterios de aceptación

1. Sueldo diario $500, antigüedad 2024-05-10, baja 2026-09-29, quincenal, sin prestaciones superiores: año de servicio 3 (16 días), días transcurridos 143, vacaciones ≈ 6.27 días, prima 25 % sobre esos días, aguinaldo 15 × 272/365, sueldo pendiente 14 días (pagado hasta 15 sep).
2. Sueldo mensual $15,000 muestra salario diario $500.00.
3. Baja anterior a la antigüedad muestra error y no muestra total.
4. Con prestaciones superiores (30 días de aguinaldo, 50 % de prima, 20 días de vacaciones) los montos cambian; valores por debajo de ley muestran error.
5. Sueldo diario $200 muestra aviso de salario mínimo pero calcula.
6. Semanal con baja en miércoles → 3 días pendientes; en viernes → 0.
7. El desglose "¿Cómo se calculó?" muestra las fórmulas con los números capturados.
8. Imprimir muestra solo el resultado legible, sin navegación.
9. Aparecen las leyendas: bruto antes de ISR, estimación sin asesoría legal, faltas descuentan aguinaldo, aguinaldo ya pagado no se suma.
10. La columna "Herramientas" con el enlace a la calculadora aparece en el footer de todas las páginas públicas.
11. Funciona a 375 px de ancho sin scroll horizontal y es operable con teclado.
12. `node --test` pasa.

## Preguntas abiertas

Ninguna.
