# Pricing modular con simulador — Diseño

Fecha: 2026-07-14
Página afectada: `precios.html` (más ajustes en `partners.html`, `style.css`, `script.js`)

## Problema

`precios.html` vende hoy una tarjeta única: "$75 por colaborador / mes + IVA, todo incluido".
No existe simulador ni selección de módulos. El producto ya no se vende así: se vende un
módulo base de Nómina más dos add-ons opcionales.

Referencia de UX: https://www.worky.mx/precios-y-planes — base obligatoria, add-ons con
toggle, slider de empleados y resumen con total en vivo.

## Modelo de precios

Precios por colaborador, por mes, más IVA.

| Módulo | Precio | Obligatorio |
|---|---|---|
| 1. Nómina | $45 | Sí — es el piso del sistema |
| 2. Turnos y asistencias | $25 | No |
| 3. Onboarding + Gestión de talento | $35 | No |

Suite completa: **$105 por colaborador**.

### Features por módulo

**Módulo 1 — Nómina ($45)**
Cálculos de nómina y timbrado; conexión IDSE; confrontas IMSS y SAT; SUA; layouts de pago;
directorio de empleados; expediente digital; organigrama; gestión de vacaciones y permisos;
solicitudes e incidencias; reportes de nómina y especiales; módulo de comunicados;
portal del colaborador.

**Módulo 2 — Turnos y asistencias ($25)**
Conexión a reloj checador; reloj checador virtual; reloj checador con geolocalización;
plantilla de entradas y salidas con valor legal; gestión de horas extras a solicitud;
conexión directa a nómina.

**Módulo 3 — Onboarding + Gestión de talento ($35)**
Solicitud de documentación por link de WhatsApp; prueba de vida; revisión de documentos;
revisión de antecedentes; ATS; reclutamiento apoyado con IA; firma digital con NOM-151.

## Sección de pricing

Reemplaza por completo el bloque `.pricing-wrapper` actual. Tres pasos, con un resumen
sticky a la derecha en escritorio.

**Paso 1 — Tu base.** Tarjeta de Nómina marcada "Siempre incluida", sin toggle. Lista sus
features. Visualmente activa desde la carga.

**Paso 2 — Agrega lo que necesites.** Dos tarjetas con toggle, apagadas por defecto. Al
encenderse toman borde `--accent` y entran al resumen. Cada una lista sus features.

**Paso 3 — Tamaño de tu empresa.** Slider de 50 a 1,000 empleados, paso de 10, valor inicial
100. Reutiliza la clase `.calc-slider` ya existente.

**Resumen.** Precio por colaborador como número grande ($45 a $105 según selección), total
mensual, desglose línea por línea de los módulos activos, nota "+ IVA" y CTA a
`https://cal.com/hernaneem/reunion-naas`.

En escritorio el resumen es una columna sticky a la derecha que acompaña el scroll de los
tres pasos. En el breakpoint de 1024px —el que ya usa el sistema— la sección colapsa a una
sola columna y el resumen deja de ser sticky: se coloca al final, después del slider.

La nota actual "Precio especial disponible para +100 colaboradores" desaparece junto con la
tarjeta vieja. Su promesa la absorbe el tope del slider, que invita a contactar ventas.

### Cálculo

```
precioPorPersona = 45 + (asistencias ? 25 : 0) + (talento ? 35 : 0)
totalMensual     = precioPorPersona × empleados
```

Totales con `toLocaleString('es-MX')`, igual que la calculadora de partners.

En el tope del slider (1,000) el resumen sustituye el total por "Contactar ventas", porque
arriba de ese volumen el precio se cotiza.

### Implementación

HTML en `precios.html`, estilos en `style.css`, lógica en `script.js`. Sin dependencias
nuevas. El bloque de JS va guardado tras un `if (el)` como el de la calculadora de partners,
para no romper las páginas que no tienen el simulador. Los precios viven en un objeto de
configuración al inicio del bloque, para que un cambio de tarifa sea una sola línea.

Las tarjetas de módulo usan `<div class="pb-module-head">`, no `<header>`: `style.css` estiliza
`header` con un selector de tipo (`position: fixed; width: 100%`), que se filtraría a cualquier
`<header>` anidado y sacaría la cabecera de la tarjeta fuera de la pantalla.

## Cambios colaterales

### ROI

El ROI compara contra Aspel NOI usando la suite completa. Con 100 empleados:

- NaaS: $10,500 de plataforma + $15,000 de auxiliar = **$25,500/mes** ($306,000/año)
- Aspel NOI: **$25,852/mes** ($310,224/año)
- Ahorro: $352/mes, **$4,224/año**

El costo queda casi empatado, así que el argumento cambia de "es más barato" a "por el mismo
dinero obtienes mucho más". Ajustes:

- Ribbon: de "Ahorra $40,224/ano" a **"Mismo costo, el doble de plataforma"**.
- Línea "Plataforma NaaS": $7,500 → $10,500.
- Totales NaaS: $22,500 → $25,500 mensual; $270,000 → $306,000 anual.
- Subtítulo de sección: enfatiza que Aspel exige dos personas y no cubre asistencias,
  onboarding, ATS, IA legal ni firma NOM-151.

**Se elimina la gráfica** de ahorro acumulado: con líneas de $25,852 y $25,500 quedarían
encimadas y comunicarían lo contrario del mensaje. Se retiran el `<canvas id="roiChart">`,
`.roi-chart-wrapper`, la leyenda, el CSS asociado y el bloque de dibujo en `script.js`.
El ROI conserva las dos tarjetas comparativas y los cuatro beneficios.

### Partners

`pricePerEmployee` en `script.js` pasa de 75 a 105: la comisión se estima sobre la suite
completa.

### .gitignore

`NAASV2/` (pantallas de la nueva versión) y `.DS_Store` quedan ignorados. `.DS_Store` ya
estaba versionado, así que se saca del índice con `git rm --cached`.

## Fuera de alcance

- Tabla comparativa vs Aspel NOI: no cambia.
- Cobro real, checkout o self-serve: el CTA sigue llevando a agendar demo.
- Descuento por volumen automático: arriba de 1,000 se cotiza a mano.
- Precio anualizado en el resumen: solo mensual.
