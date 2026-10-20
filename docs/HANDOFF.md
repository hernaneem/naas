# HANDOFF — sitio NaaS (nominaas.com)

## Qué es
Sitio público de NaaS: HTML + CSS + JS sin build, publicado con GitHub Pages desde `main` (push a `main` = producción; tarda ~10 min por caché). Glosario en `CONTEXT.md`, specs en `docs/specs/`, tracker en GitHub Issues (`hernaneem/naas`).

## Infra
- Hosting: GitHub Pages, dominio `nominaas.com` (CNAME), HTTPS + HSTS.
- `_config.yml` excluye de la publicación: package.json, tests/, docs/, leads/, CLAUDE.md, CONTEXT.md, README.md y `NaaS Info/`.
- Función de leads: carpeta `leads/`, proyecto Vercel `naas-leads` (equipo Hernan Echeverria's projects) → `https://naas-leads.vercel.app/api/lead`. Se publica a mano: `cd leads && vercel deploy --prod` (no se despliega con el push a `main`). Variables: `NOTION_TOKEN` (Sensitive, integración "Leads nominaas.com") y `NOTION_DATABASE_ID` (base Leads web, NaaS → Leads).
- Pruebas: `npm test` (node --test, sin dependencias) sobre el motor `js/calculos-laborales.js`, la función de leads y la validación del formulario.
- Ver en local: `python3 -m http.server 8000`.

## Hecho
- Ola 1 calculadora de finiquito (rama `feature/calculadora-finiquito`, issues #1–#4): motor probado (85 pruebas), página `calculadora-finiquito.html`, columna "Herramientas" en el footer. Spec: `docs/specs/2026-09-29-calculadora-finiquito.md`. QA: `docs/qa/checklist-calculadora-finiquito.md`. En producción desde 2026-09-30.
- Ola 2 calculadora de aguinaldo (rama `feature/calculadora-aguinaldo`, issues #8–#9): `calcularAguinaldo` en el motor (una sola regla de aguinaldo con el finiquito), módulo compartido `js/ui-calculadoras.js`, página `calculadora-aguinaldo.html`, enlaces cruzados. 140 pruebas. Spec: `docs/specs/2026-09-30-calculadora-aguinaldo.md`. QA: `docs/qa/checklist-calculadora-aguinaldo.md`.
- Ola 3 ISR y neto estimado (rama `feature/isr-neto`, issues #10–#12): tarifas ISR 2026 (Anexo 8), UMA 2026, exenciones de aguinaldo/prima; neto en grande en ambas calculadoras. 227 pruebas. Spec: `docs/specs/2026-09-30-isr-neto-calculadoras.md`. Investigación: `docs/research/2026-09-30-isr-finiquito-aguinaldo.md`. QA: `docs/qa/checklist-isr-neto.md`.
- Captura de leads (rama `feature/captura-leads`, issues #13–#16): formulario en la sección final de inicio, precios y partners → función en Vercel → base Leads web de Notion (Estado Nuevo). 257 pruebas; prueba de punta a punta contra Notion real hecha el 2026-10-20. Spec: `docs/specs/2026-10-20-captura-leads-notion.md`. Assets del formulario: `leads.css`, `js/formulario-lead.js`, `js/lead-validacion.js` con `?v=20261020b`.
- Mantenimiento anual: cada enero/febrero actualizar el bloque "vigente 2026" de `js/calculos-laborales.js` (tarifas Anexo 8, UMA, salario mínimo) y subir `?v=`.
- Caché: los módulos y `calculadora.css` llevan `?v=AAAAMMDD`; al cambiar cualquiera se sube la versión en todos los tags e imports.

## Pendiente
- Olas futuras: prima de antigüedad + motivo de baja, liquidación, ISR/neto.
- Auditoría: #5 (`NaaS Info/` se publica), #6 (CSP), #7 (versionar assets: resuelto para las calculadoras; falta `style.css`/`script.js`).
- Sin favicon ni imagen OG 1200×630 en el sitio.

## Depende de Hernán
| Qué | Estado |
|---|---|
| Correr la checklist de QA en local | pendiente |
| Merge/push de `feature/calculadora-finiquito` a `main` | hecho 2026-09-30 |
| Merge/push de `feature/calculadora-aguinaldo` a `main` | hecho 2026-09-30 |
| Merge/push de `feature/isr-neto` a `main` (= deploy) | pendiente |
| Revisar decisiones A1–A3 y copy de aguinaldo | pendiente |
| Decidir #5: ¿`NaaS Info/` debe seguir público? | pendiente |
| Validar copy legal y CTA de la página | pendiente |
| Regla de límite por IP en el firewall de `naas-leads` (la API no la dejó crear) | pendiente |
| Aprobar el cambio en las instrucciones de Hermes para leer Leads web (#16) | pendiente |
| Borrar la fila "PRUEBA – borrar" de Leads web | pendiente |

## Cómo retomar
`claude --continue` en este repo, o leer este archivo + el spec.
