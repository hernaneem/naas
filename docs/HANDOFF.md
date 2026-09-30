# HANDOFF — sitio NaaS (nominaas.com)

## Qué es
Sitio público de NaaS: HTML + CSS + JS sin build, publicado con GitHub Pages desde `main` (push a `main` = producción; tarda ~10 min por caché). Glosario en `CONTEXT.md`, specs en `docs/specs/`, tracker en GitHub Issues (`hernaneem/naas`).

## Infra
- Hosting: GitHub Pages, dominio `nominaas.com` (CNAME), HTTPS + HSTS.
- `_config.yml` excluye de la publicación: package.json, tests/, docs/, CLAUDE.md, CONTEXT.md, README.md.
- Pruebas: `npm test` (node --test, sin dependencias) sobre el motor `js/calculos-laborales.js`.
- Ver en local: `python3 -m http.server 8000`.

## Hecho
- Ola 1 calculadora de finiquito (rama `feature/calculadora-finiquito`, issues #1–#4): motor probado (85 pruebas), página `calculadora-finiquito.html`, columna "Herramientas" en el footer. Spec: `docs/specs/2026-09-29-calculadora-finiquito.md`. QA: `docs/qa/checklist-calculadora-finiquito.md`.

## Pendiente
- Ola 2: calculadora de aguinaldo reutilizando el motor.
- Olas futuras: prima de antigüedad + motivo de baja, liquidación, ISR/neto.
- Auditoría: #5 (`NaaS Info/` se publica), #6 (CSP), #7 (versionar assets).
- Sin favicon ni imagen OG 1200×630 en el sitio.

## Depende de Hernán
| Qué | Estado |
|---|---|
| Correr la checklist de QA en local | pendiente |
| Merge/push de `feature/calculadora-finiquito` a `main` (= deploy) | pendiente |
| Decidir #5: ¿`NaaS Info/` debe seguir público? | pendiente |
| Validar copy legal y CTA de la página | pendiente |

## Cómo retomar
`claude --continue` en este repo, o leer este archivo + el spec.
