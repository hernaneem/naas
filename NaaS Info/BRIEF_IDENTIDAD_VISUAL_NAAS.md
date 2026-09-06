# Brief de Identidad Visual — NaaS

**Generado:** 2026-07-23, aplicando la skill `Diseno/brief-identidad-visual` con datos reales extraídos de https://nominaas.com/ (Playwright).
**Destinatario del brief:** el futuro proyecto/agente de **generación automática de propuestas comerciales y documentos de llamadas**. Todo material generado debe verse y sonar como salido de nominaas.com.

> Archivos hermanos en esta carpeta:
> - `tokens.css` — variables CSS oficiales listas para copiar a cualquier plantilla HTML/PDF.
> - `logos/NAAS-Logo-dark.png` (para fondos claros) y `logos/NAAS-Logo-white.png` (para fondos oscuros), ambos 320×101 px (~3.17:1).
> - `capturas/naas-home-full.png` — referencia visual del sitio completo.

---

## 1. Resumen del proyecto

**Qué:** sistema de plantillas con identidad NaaS para dos tipos de documento generados en automático:
1. **Propuestas comerciales** (post-demo / cotización a prospectos).
2. **Documentos de llamadas** (minutas, resúmenes y acuerdos a partir de las grabaciones Plaud de Hernán).

**Por qué:** hoy se arman a mano; el objetivo es que un agente los produzca con marca consistente sin intervención de diseño.

**Para quién:** decisores de PyMEs mexicanas (dirección general, RRHH, operaciones) — audiencia B2B seria que necesita confianza y claridad, no adornos.

## 2. Contexto de marca

- **Posicionamiento:** "La plataforma definitiva para la nómina en México". Categoría propia: **"Nómina as a Service · Hecho para México"**.
- **Promesa central:** "Automatiza tu nómina, cumple con el SAT y gestiona a tu equipo desde un solo lugar. Diseñado por expertos en nómina mexicana."
- **Personalidad:** experta, moderna, directa, mexicana. Tecnología seria con calidez de trato (tuteo).
- **3 pilares de producto:** Nómina y Cumplimiento · Gestión de Talento · Beneficios.
- **Diferenciadores probados (usar como bullets de confianza):** Timbrado CFDI automático · Cumplimiento SAT garantizado · Soporte experto · Asistencia Legal con IA (+1,000 horas en LIMSS, LFT, LISR e Infonavit) · 100% adaptado a legislación mexicana (IMSS, ISR, Infonavit) · Seguridad empresarial (cifrado, respaldos).
- **Prueba social disponible:** logos de Cubbo, Grupo IPS, SCR México, MultiCleaners, Aplin, Alianza Corp; testimonios de Javier Vázquez (CEO, SRM Marketing: "nos ahorró más de 20 horas al mes"), Alejandro Arzate (CEO, Grupo IPS) y Reyna Vázquez (Gerente de Operaciones, MultiCleaners).
- **Contacto oficial:** hernan@nominaas.com · app: app.nominaas.com.

## 3. Dirección de estilo (extraída del sitio real)

**Sensación general:** SaaS premium oscuro-elegante. Azul marino profundo con un solo acento naranja vibrante; mucho aire, cards limpias con sombras suaves y esquinas muy redondeadas; datos duros presentados en tarjetas tipo dashboard.

Patrones de diseño observados que las plantillas deben replicar:

| Patrón | Cómo se ve en el sitio |
|---|---|
| **Eyebrow + titular** | Etiqueta corta en MAYÚSCULAS naranja precedida de guion ("— PLATAFORMA"), seguida de titular Clash Display con **una frase clave en naranja** ("Todo lo que necesitas, **en un solo lugar**"). |
| **Secciones alternadas** | Bloques oscuros (gradiente azul) para apertura/cierre; bloques claros (#FFFFFF / #F5F8FC) para contenido. |
| **Badges de estado** | Pills verdes con check para cumplimiento/éxito ("Timbrado", "CFDI timbrado"). |
| **CTA** | Botón naranja sólido, radio 12px, peso 600 ("Solicita una Demo"); secundario fantasma blanco sobre oscuro ("Conoce más"). |
| **Cards de métricas** | Fondo blanco, radio 14–22px, sombra media, cifra grande + etiqueta en MAYÚSCULAS gris ("TOTAL NÓMINA / $1.28M"). |
| **Pills de navegación/tabs** | Radio 50px, activa en azul marino con texto blanco. |

**Referencias externas del mismo espíritu:** Stripe, Linear (limpio, geométrico, data-forward). **Anti-referencias:** plantillas corporativas de Word con Times/Arial, clip-art, arcoíris de colores, PowerPoint saturado de texto.

## 4. Sistema de diseño (hoja técnica)

Fuente de verdad completa en `tokens.css`. Resumen mínimo:

| Token | Valor | Uso |
|---|---|---|
| Primario | `#142441` | Fondos oscuros, titulares sobre claro, footer |
| Primario claro | `#2D4A7A` / `#4B6CA0` | Gráficas, elementos secundarios |
| **Acento** | `#FF6B35` (hover `#E85A2A`) | CTAs, eyebrows, 1 frase por titular, hipervínculos |
| Fondos claros | `#FFFFFF` / `#F5F8FC` / `#EEF3FA` | Cuerpo de documentos |
| Gradiente hero | `linear-gradient(150deg, #101E38, #1B2A4A 45%, #294876)` | Portadas y cierres |
| Texto | `#0F1B33` (titular) / `#566179` (cuerpo) / `#616F89` (muted) | Sobre fondos claros |
| Texto sobre oscuro | `#FFFFFF` titulares, `rgba(255,255,255,0.78)` párrafos | |
| Éxito | `#16A34A` (fondo suave `#ECFDF5`) | Checks, acuerdos cerrados, "timbrado" |
| Advertencia | `#F59E0B` | Pendientes, riesgos |
| Bordes | `#E6EBF3` / `#D5DEEC` | Tablas y divisores |
| Radios | 10 / 14 / 22 / 50px (pill) | Botones, cards, badges |

**Tipografía:** Clash Display (500/600/700) solo para titulares; Satoshi (400/500/700) para todo lo demás. Carga vía Fontshare: `https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&f[]=satoshi@400,500,700&display=swap`. Fallback para Word/Docs sin fuentes: system-ui / Segoe UI — nunca Times ni Arial.
**Escala:** H1 ~55px/600 · H2 ~38px/600 · cuerpo 18px/400 (en documentos carta: H1 28–32pt, H2 18–20pt, cuerpo 10.5–11pt conservando proporciones y pesos).

## 5. Logos

| Archivo | Uso | Regla |
|---|---|---|
| `logos/NAAS-Logo-dark.png` | Sobre fondos claros (blanco, `#F5F8FC`) | Nunca sobre el gradiente oscuro |
| `logos/NAAS-Logo-white.png` | Sobre azul marino / gradiente | Nunca sobre blanco |

Proporción 320×101 (~3.17:1). No estirar, no recolorear, no agregar sombras ni contornos. Aire mínimo alrededor: la altura de la "n" del logotipo.

## 6. Voz y vocabulario

- **Tono:** directo y experto, tuteo mexicano profesional ("Automatiza tu nómina", "tu equipo"). Frases cortas. Beneficio primero, feature después.
- **Vocabulario oficial:** *colaboradores* (no "empleados"), *timbrado*, *CFDI*, *recibos*, *quincena*, *SAT*, *IMSS*, *ISR*, *Infonavit*, *finiquitos y liquidaciones*, *cumplimiento*. Español mexicano siempre; no anglicismos innecesarios (no "payroll" en texto al cliente).
- **CTAs oficiales:** "Solicita una Demo" · "Solicita una Demo Gratis" · "Agenda una reunión" · "Conoce más".
- **Fórmula de titulares:** afirmación fuerte + frase clave en naranja. Ej.: "Resultados que **hablan por sí solos**", "¿Listo para **modernizar tu nómina**?".

## 7. Especificación de entregables (para el proyecto de automatización)

### 7a. Propuesta comercial (PDF/HTML, carta)

| Sección | Especificación |
|---|---|
| Portada | Gradiente hero + logo blanco + badge pill "Nómina as a Service · Hecho para México" + nombre del prospecto + fecha |
| Resumen ejecutivo | Fondo claro; eyebrow naranja "— PROPUESTA"; dolores detectados en la llamada → solución |
| Alcance/módulos | Cards por pilar (Nómina y Cumplimiento / Talento / Beneficios) con checks verdes |
| Inversión | Card tipo pricing: cifra grande estilo métrica, desglose por colaborador/mes, radio 22px |
| Prueba social | 1–2 testimonios reales (sección 2) + fila de logos de clientes |
| Cierre | Bloque oscuro "¿Listo para modernizar tu nómina?" + CTA naranja + hernan@nominaas.com |

### 7b. Documento de llamada (minuta/resumen desde Plaud)

| Sección | Especificación |
|---|---|
| Encabezado | Fondo blanco, logo dark a la izquierda, título Clash Display, fecha/participantes en `#566179` |
| Resumen | 3–5 bullets, cuerpo Satoshi |
| Acuerdos | Badges verdes (`#16A34A` sobre `#ECFDF5`) |
| Pendientes | Badges ámbar (`#F59E0B`) con responsable y fecha |
| Siguientes pasos | Tabla con bordes `#E6EBF3`, sin zebra striping |
| Pie | Línea divisoria + "NaaS · Nómina as a Service" + contacto |

Formato más sobrio que la propuesta: nada de gradientes; el color solo en estados y acentos.

## 8. Do's y Don'ts

**SÍ:**
- Un solo acento naranja por bloque (CTA **o** frase destacada, no todo a la vez).
- Checks verdes para todo lo relacionado con cumplimiento/acuerdos cerrados.
- Cifras grandes en cards cuando haya números (ahorro, colaboradores, costo).
- Aire generoso; máximo 2 niveles tipográficos por bloque.

**NO:**
- Times/Arial, clip-art, imágenes de stock genéricas.
- Naranja como color de texto largo (solo acentos y CTAs).
- Logo dark sobre fondo oscuro o white sobre claro.
- Gradientes inventados: solo el oficial de `tokens.css`.
- Saturar de features sin beneficio; el sitio siempre da beneficio primero.

## 9. Criterios de éxito

1. Un documento generado puesto junto a nominaas.com se percibe de la misma marca sin explicación.
2. Cero colores/fuentes fuera de `tokens.css`.
3. La propuesta se genera con solo: nombre del prospecto, dolores detectados, # colaboradores y precio — todo lo demás sale de esta carpeta.
4. La minuta se genera desde el transcript de Plaud sin edición manual de estilo.

## Proceso (adaptado del marco de feedback de la skill)

Al revisar los primeros documentos generados, dar feedback específico por elemento ("la card de inversión se siente vacía") y no genérico ("no me gusta"); distinguir preferencia subjetiva de errores objetivos contra este brief; congelar el brief cuando las plantillas estén aprobadas — cambios posteriores implican actualizar esta carpeta primero.

## 10. Ampliación de paleta — propuestas comerciales (2026-07-26)

La primera corrida real del generador de propuestas salió "escuálida": se
había calcado la estructura de `referencia/Propuesta_Zamabrands.pptx` (las
12 secciones, la aritmética) pero **nunca se miró el diseño** de esa
referencia, solo se le extrajeron texto y colores aproximados. Hernán la
había pasado explícitamente como el diseño a igualar, no solo como fuente
de contenido.

Al mirar la referencia con atención (imágenes renderizadas + inspección de
`python-pptx`), aparecen tres colores que **no** están en la sección 4:
vino (`#6B1E44`), dorado (`#F59E0B`) y crema (`#FDF1E6`). No son
accidentes de esa plantilla — son parte deliberada de su sistema visual
(los badges numerados del diagnóstico, la tarjeta destacada de "mejor
valor", las bandas de remate con el ahorro). Se agregan a `tokens.css`
como tokens oficiales de pleno derecho, con su rol documentado ahí mismo:

| Token | Valor | Uso |
|---|---|---|
| `--vino` | `#6B1E44` | Badges circulares numerados (diagnóstico); tarjeta destacada del esquema anual |
| `--dorado` | `#F59E0B` | Cifras de precio sobre fondo oscuro; badge "MEJOR VALOR" |
| `--crema` | `#FDF1E6` | Bandas de remate al pie de una lámina (ahorro, consideraciones, avisos) |

**Lo que NO cambia:** el azul y el naranja siguen siendo los oficiales del
sitio, `#142441` y `#FF6B35`. Esa misma referencia usa aproximaciones de
ambos (`#0B1D5C` y `#F26A1B`) que **no** se adoptan — son la diferencia
entre "mirar el diseño" y "clonar el archivo": se toma la dirección visual
(bloques de color sólido, tarjetas con jerarquía cromática, cifras grandes
sobre fondo oscuro) y la paleta ya oficial de NaaS hace el resto, más los
tres colores nuevos donde la referencia demuestra que hacen falta.

`--dorado` coincide en hex con `--warning` (`#F59E0B`) pero es un token
aparte a propósito: mismo color, rol distinto (énfasis de precio, no
alerta), y los dos pueden divergir en el futuro sin pisarse.
