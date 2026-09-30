# Checklist de pruebas — Calculadora de aguinaldo (ola 2)
> Para Hernán, 2026-09-30. Cubre la ola 2: calculadora de aguinaldo, enlaces cruzados y footer con ambas calculadoras. La calculadora de finiquito se reorganizó por dentro: la sección 5 confirma que sigue igual.
> Antes del merge: `python3 -m http.server 8000` en el repo y abre http://localhost:8000/calculadora-aguinaldo.html. Después del merge: https://nominaas.com/calculadora-aguinaldo.html (espera ~10 min tras el push).
> Montos estimados y brutos, antes de ISR; sin validez legal.
> Para retomar con Claude: `claude --continue`

## 0. Preparación
- [ ] Abre la página → ves "Calculadora de aguinaldo", "Calcular al" con el 31/12/2026 y días de aguinaldo en 15. El tiempo estimado es de 10 minutos.

## 1. Casos base
- [ ] Captura sueldo diario 500 y antigüedad 01/03/2020 → **$7,500.00** (365 días trabajados, 15 días).
- [ ] Cambia la antigüedad a 01/06/2026 → **$4,397.26**; la fórmula muestra "15 × 214 ÷ 365 = 8.79 días".
- [ ] Pon antigüedad 10/05/2024 y "Calcular al" 29/09/2026 → **$5,589.04**, el mismo aguinaldo que da el finiquito (decisión A1).
- [ ] Cambia a Mensual 15,000 → "Salario diario: $500.00".

## 2. Días de aguinaldo
- [ ] Caso 01/03/2020 con 30 días → $15,000.00 y la fórmula dice "Según lo que da tu empresa".
- [ ] Pon 10 días → error del mínimo de 15 y sin monto.
- [ ] Borra los días → aparece "Captura tus días de aguinaldo (mínimo 15)."

## 3. Errores y leyendas
- [ ] Pon "Calcular al" antes de la antigüedad → error y sin monto.
- [ ] Revisa las leyendas → dicen: bruto antes de ISR, estimación sin asesoría legal, faltas injustificadas se descuentan, se paga antes del 20 de diciembre.
- [ ] Presiona "Imprimir / Guardar PDF" → solo aparece el resultado con tus datos y la fórmula.

## 4. Celular y navegación
- [ ] A 375 px con un caso lleno → aparece la barra fija con el monto y no hay scroll horizontal.
- [ ] En el hero, el enlace "¿Dejas tu trabajo? Calcula tu finiquito completo" lleva al finiquito, y desde el finiquito, "¿Sigues trabajando? Calcula solo tu aguinaldo" regresa aquí.
- [ ] En el footer de cualquier página → "Herramientas" lista ambas calculadoras, cada una en una sola línea.

## 5. Regresión del finiquito
- [ ] Finiquito diario 500, antigüedad 10/05/2024, baja 29/09/2026, quincenal → sigue en **$16,506.85**, con el mismo desglose.

## 6. Revisión de contenido (tu criterio)
- [ ] Lee las 5 preguntas frecuentes y el CTA "Esto lo hace NaaS solo cada diciembre" → confirma el tono y que es una promesa que cumplimos.

## Qué NO está construido aún
- Cálculo de ISR del aguinaldo (exención de 30 UMA): las FAQ solo mencionan que una parte está exenta.
- Captura de faltas o incapacidades (decisión A2): solo hay leyenda.
- Prima de antigüedad, liquidación e ISR del finiquito (olas futuras).
- Favicon del sitio e imagen para redes 1200×630.
