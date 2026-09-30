# Checklist de pruebas — ISR y neto estimado (ola 3)
> Para Hernán, 2026-09-30. Cubre la ola 3: ISR estimado y neto en las calculadoras de finiquito y de aguinaldo.
> Antes del merge: `python3 -m http.server 8000` en el repo y abre http://localhost:8000/calculadora-finiquito.html. Después del merge: https://nominaas.com (espera ~10 min tras el push).
> Es un ISR **aproximado**, calculado con las tarifas 2026 del Anexo 8. No resta el subsidio para el empleo (decisión I3) ni IMSS/INFONAVIT.
> Para retomar con Claude: `claude --continue`

## 0. Preparación
- [ ] Abre la calculadora de finiquito. El recorrido toma unos 10 minutos.

## 1. Finiquito
- [ ] Captura diario 500, antigüedad 10/05/2024, baja 29/09/2026, quincenal → en grande, **$13,891.03** con la etiqueta "Neto estimado, después de ISR".
- [ ] Debajo del número grande → "Bruto $16,506.85 − ISR estimado $2,615.82".
- [ ] Al final del desglose → Total bruto $16,506.85, ISR estimado −$2,615.82 y Neto estimado $13,891.03. La suma cuadra.
- [ ] Abre "¿Cómo se calculó?" → en el bloque ISR, la prima está exenta completa y el aguinaldo se divide en $3,519.30 exento y $2,069.74 gravado. Usa la tarifa quincenal, fila de límite inferior $17,448.76 (decisiones I1 e I2).
- [ ] Cambia a **mensual** → el ISR cambia porque ahora se usa la tarifa mensual.
- [ ] Pon diario 300 → ISR $0.00, con la nota de salario mínimo; el neto es igual al bruto (decisión I7).

## 2. Aguinaldo
- [ ] Abre la calculadora de aguinaldo → hay un selector de periodicidad y viene en quincenal (decisión I5).
- [ ] Captura diario 500, antigüedad 01/03/2020, calcular al 31/12/2026 → neto **$6,689.32** (ISR $810.68).
- [ ] Cambia a **mensual** → neto **$6,730.01** (ISR $769.99).
- [ ] Revisa el desglose → Aguinaldo bruto $7,500.00, ISR estimado −$810.68 y Neto estimado $6,689.32 (en quincenal).

## 3. Leyendas y celular
- [ ] Revisa las leyendas → mencionan las tarifas ISR 2026, que no incluye IMSS/INFONAVIT, que el ISR puede ser menor (por el subsidio y por el método opcional art. 174) y que se supone que tu exención anual está completa.
- [ ] A 375 px → la barra fija muestra el neto con "Neto estimado, después de ISR".
- [ ] Imprimir → aparecen el bruto, el ISR estimado, el neto y el bloque de ISR.

## 4. Revisión fiscal (tu criterio)
- [ ] Compara el ISR de un caso real que conozcas de NaaS con lo que da la calculadora. Debe coincidir cuando el sueldo mensual pasa de ~$11,500, porque arriba de ese monto no aplica subsidio.

## Qué NO está construido aún
- Subsidio para el empleo (decisión I3, fuera a propósito).
- Método opcional art. 174 RLISR: solo se menciona en una nota.
- Exención anual ya usada en el año: se supone completa (decisión I4).
- Cuotas IMSS e INFONAVIT.
- Actualización anual de tarifas y UMA: cada enero y febrero hay que actualizar el bloque "vigente 2026" del motor.
