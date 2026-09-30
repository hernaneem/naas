# Checklist de pruebas — Calculadora de finiquito (ola 1)
> Para Hernán, 2026-09-29. Cubre la ola 1: motor de cálculo, página `calculadora-finiquito.html` y columna "Herramientas" en el footer.
> Puedes seguirla de corrido **antes del merge**, en local: desde la carpeta del repo corre `python3 -m http.server 8000` y abre http://localhost:8000/calculadora-finiquito.html. **Después del merge**, repítela en producción: https://nominaas.com/calculadora-finiquito.html (tras el push, GitHub Pages tarda unos 10 minutos en actualizar).
> Todos los montos son estimados y brutos, antes de ISR. No tienen validez legal y así lo dice la página.
> Tip: abre una ventana normal en escritorio y otra con el celular (o con las herramientas de desarrollador a 375 px).
> Para retomar con Claude: `claude --continue`

## 0. Preparación
- [ ] Ten a mano una calculadora o una hoja de cálculo para comprobar un caso. Todo el recorrido toma unos 15 minutos.
- [ ] Abre la página → ves "Calculadora de finiquito", el formulario y, a la derecha, "Tu finiquito aparecerá aquí".

## 1. Caso base (ley)
- [ ] Captura sueldo **diario** 500, antigüedad **10/05/2024**, baja **29/09/2026** y periodicidad **Quincenal** → el total dice **$16,506.85** sin que tengas que presionar ningún botón.
- [ ] Revisa el desglose → sueldo pendiente $7,000.00 (14 días), vacaciones $3,134.25 (6.27 días), prima vacacional $783.56 y aguinaldo $5,589.04 (11.18 días).
- [ ] Lee la nota del sueldo pendiente → "Suponemos que tu último pago cubrió hasta el 15 de septiembre de 2026" (decisión D1).
- [ ] Abre "¿Cómo se calculó?" → ves "16 × 143 ÷ 365" en vacaciones y "15 × 272 ÷ 365" en aguinaldo, con tus números.
- [ ] Revisa las leyendas → aparecen: montos brutos antes de ISR, estimación sin asesoría legal, las faltas injustificadas se descuentan del aguinaldo y si ya recibiste el aguinaldo de este año no se suma.

## 2. Sueldo mensual
- [ ] Cambia a **Mensual** y captura 15,000 → debajo aparece "Salario diario: $500.00" y el total sigue en $16,506.85 (decisión D7).

## 3. Periodicidad
- [ ] Selecciona **Semanal** con baja el **miércoles 30/09/2026** → el sueldo pendiente es de 3 días.
- [ ] Cambia la baja al **viernes 02/10/2026** → el sueldo pendiente es de 0 días, porque el pago del viernes cubre la semana (decisión D1).
- [ ] Selecciona **Quincenal** con antigüedad **03/09/2026** y baja **10/09/2026** → la nota dice que aún no te han pagado desde tu fecha de antigüedad y se cuentan todos los días (decisión D11).

## 4. Vacaciones tomadas y pendientes
- [ ] Vuelve al caso base y abre "Vacaciones tomadas o pendientes". Pon 2 días tomados → las vacaciones bajan a 4.27 días.
- [ ] Pon 10 días tomados → las vacaciones quedan en 0 con una nota, y el aguinaldo no cambia (decisión D2).
- [ ] Pon 0 tomados y 5 pendientes → las vacaciones suben a 11.27 días y la prima también sube.

## 5. Prestaciones superiores
- [ ] Activa "Mi empresa da prestaciones superiores" → aparecen 15 días de aguinaldo, 25 % de prima y 16 días de vacaciones ya llenos.
- [ ] Cambia a 30 / 50 / 20 → el total dice **$24,054.79**.
- [ ] Pon 10 días de aguinaldo → aparece un error junto al campo y el total desaparece (decisión D5).
- [ ] Apaga el interruptor → el total regresa a $16,506.85.

## 6. Errores y avisos
- [ ] Pon una fecha de baja anterior a la de antigüedad → aparece un mensaje claro y no hay total.
- [ ] Borra el sueldo → aparece el error del sueldo y no hay total.
- [ ] Pon sueldo diario 200 → aparece el aviso de salario mínimo, pero **sí** calcula (decisiones D5 y D12).

## 7. Imprimir
- [ ] Presiona "Imprimir / Guardar PDF" → la vista previa muestra solo el resultado, los datos que capturaste, las fórmulas y las leyendas. No aparecen el menú ni el footer.

## 8. Celular (375 px)
- [ ] Llena el caso base → aparece una barra fija abajo con "Finiquito estimado $16,506.85".
- [ ] Toca "Ver desglose" → la página baja al resultado y la barra se oculta.
- [ ] Recorre toda la página → no hay scroll horizontal.

## 9. Footer y navegación
- [ ] En index, precios, partners y aviso de privacidad → el footer tiene la columna "Herramientas" con "Calculadora de finiquito" y el enlace abre la página.
- [ ] En la calculadora, "Agenda una demo" → se abre cal.com en otra pestaña.

## 10. Revisión de contenido (tu criterio)
- [ ] Lee "Qué incluye y qué no" y las preguntas frecuentes → confirma que el tono y las afirmaciones legales te parecen bien. Por ejemplo: la indemnización es de "3 meses y, en algunos casos, 20 días por año", y la prima de antigüedad aplica en despido o en renuncia con 15 años o más.
- [ ] Lee el CTA "Esto lo hace NaaS solo en cada baja" → confirma que es una promesa que NaaS cumple hoy.

## Qué NO está construido aún
- Prima de antigüedad, motivo de baja y liquidación/indemnización (ola futura).
- Cálculo de ISR y montos netos (ola futura, la "versión pro").
- Calculadora de aguinaldo (ola 2, reutilizando el mismo motor).
- Campo de faltas: no se capturan a propósito, solo se advierte (decisión D4).
- Zona frontera norte: el aviso de salario mínimo usa el general (decisión D12).
- Analytics, captura de datos y PDF propio (decidido fuera por ahora).
- Favicon del sitio e imagen para compartir en redes (1200×630): no existen todavía.
