# Captura de leads en Notion — Spec
> 2026-10-20 · Estado: aprobado (VoBo Hernán 2026-10-20)

## Problema
Los CTAs de nominaas.com solo abren cal.com o un `mailto:`. Quien no agenda ni escribe se va sin dejar rastro: no hay ningún formulario y ningún registro de quién mostró interés.

## Solución
Un formulario con el estilo del sitio en la sección final ("¿Listo para modernizar tu nómina?") de inicio, precios y partners. Cada envío crea un **lead** en la base **Leads web** de Notion (página NaaS → Leads), con Estado "Nuevo". Hernán los ve en Notion y Hermes los incluye en el brief de la mañana. Tras enviar, la persona ve un agradecimiento con la opción de agendar su demo en cal.com.

## Historias de usuario
1. Como visitante interesado, quiero dejar mis datos sin salir del sitio, para que NaaS me contacte.
2. Como visitante, quiero saber qué campos faltan o están mal antes de enviar, para corregirlos sin perder lo escrito.
3. Como visitante, quiero ver una confirmación clara al enviar, para saber que mis datos llegaron.
4. Como visitante que ya envió, quiero poder agendar mi demo de inmediato, para no esperar a que me contacten.
5. Como visitante, si el envío falla, quiero una alternativa (correo ya redactado), para no perder mi solicitud.
6. Como visitante, quiero ver que mis datos se tratan conforme al aviso de privacidad, para confiar en dejar mis datos.
7. Como visitante con teclado o lector de pantalla, quiero poder llenar y enviar el formulario y escuchar los errores y la confirmación.
8. Como Hernán, quiero ver cada lead en Notion con empresa, nombre, correo, WhatsApp, rango de colaboradores, mensaje, página de origen, UTM y fecha, para calificarlo.
9. Como Hernán, quiero que los leads nuevos entren con Estado "Nuevo", para trabajar la bandeja y pasar los buenos a CRM NaaS.
10. Como Hernán, quiero que los bots no llenen la base, para no limpiar basura.
11. Como Hernán, quiero que Hermes me liste los leads nuevos en el brief de la mañana, para no tener que revisar Notion a mano.
12. Como Hernán, quiero que la llave de Notion no esté en el navegador ni en el repo, para que nadie pueda usarla.

## Decisiones
**D1 (VoBo Hernán 2026-10-20):** El sitio sigue en GitHub Pages; solo la función de leads vive en Vercel (equipo "Hernan Echeverria's projects") en su dominio `*.vercel.app`. Descartado: mudar todo el sitio a Vercel, porque obliga a cambiar DNS sin aportar nada a esta ola; se reconsidera en la Ola B (rediseño).
**D2:** eliminada (cubría las exclusiones al mudar todo el sitio a Vercel; ya no aplica por D1).
**D3 (VoBo Hernán 2026-10-20):** El formulario va en la sección final de inicio, precios y partners; la confirmación ofrece cal.com y el `mailto:` se conserva. Las calculadoras quedan fuera.
**D4 (VoBo Hernán 2026-10-20):** Campos: empresa, nombre, correo y WhatsApp obligatorios; rango de colaboradores obligatorio (1–50, 51–200, 201–1000, Más de 1000); mensaje opcional. Se agregan solos: página de origen y UTM. La fecha la pone Notion.
**D5 (VoBo Hernán 2026-10-20):** Base nueva "Leads web" en NaaS → Leads, con Estado Nuevo → Contactado → Pasó a CRM / Descartado. "CRM NaaS" no se toca. Descartado: escribir directo en CRM NaaS, porque la basura y los leads flojos ensuciarían el embudo.
**D6 (VoBo Hernán 2026-10-20):** Integración propia de Notion "Leads nominaas.com" (insertar y leer contenido) conectada solo a la página Leads. La llave vive solo como variable secreta en Vercel. Descartado: reutilizar la integración de Hermes, porque tiene acceso a todo el workspace.
**D7 (VoBo Hernán 2026-10-20):** Si Notion falla, el formulario muestra un error con un `mailto:` ya redactado con los datos y el error queda en los logs de Vercel; sin cola de reintentos.
**D8 (VoBo Hernán 2026-10-20):** Antispam: campo trampa oculto (si viene lleno se responde éxito sin guardar), validación de longitudes y formato en la función, solo se aceptan orígenes de nominaas.com, y una regla de límite de envíos por IP en el firewall de Vercel.
**D9 (VoBo Hernán 2026-10-20):** El aviso de privacidad agrega la finalidad "atender solicitudes de información y contacto comercial", y bajo el botón va "Al enviar aceptas el aviso de privacidad" con enlace. Notion y Vercel son encargados (remisión), no transferencias: la sección de transferencias no cambia.
**D10 (VoBo Hernán 2026-10-20):** Hermes revisa "Leads web" con Estado = Nuevo en cada brief de la mañana; Claude ajusta sus instrucciones y Hernán aprueba el cambio.
**D11 (VoBo Hernán 2026-10-20):** Antes del merge a `main`, prueba de punta a punta desde el sitio en local contra la base real de Notion.
**D12 (VoBo Hernán 2026-10-20):** El rediseño del sitio es la Ola B, con su propio flujo y `website-creator`.

**D13 (VoBo Hernán 2026-10-20):** La función vive en una carpeta propia del repo; el proyecto de Vercel publica solo esa carpeta y GitHub Pages la excluye.

Contrato de la función (`POST /api/lead`, JSON):

| Respuesta | Cuándo |
|---|---|
| 201 `{ ok: true }` | Lead creado en Notion, o campo trampa lleno (no se guarda) |
| 400 `{ ok: false, error: 'validacion', campos: [...] }` | Falta un obligatorio o un campo no cumple formato/longitud |
| 403 `{ ok: false, error: 'origen' }` | El `Origin` no es nominaas.com, www.nominaas.com ni el servidor local de pruebas |
| 405 | Método distinto de POST/OPTIONS |
| 502 `{ ok: false, error: 'notion' }` | Notion respondió error o no respondió |

## Testing
Un seam: el módulo que recibe la petición y decide la respuesta, con el cliente de Notion inyectado (simulado en pruebas). Se prueba con `node --test`, como el motor de las calculadoras (`tests/calculos-laborales.test.js`). Casos: validación por campo, campo trampa, origen, mapeo exacto a las propiedades de Leads web, error de Notion → 502, CORS en OPTIONS. `tests/publicacion.test.js` verifica que GitHub Pages excluye la carpeta de la función. El formulario se prueba a mano y en la prueba de punta a punta (D11).

## Producción
- **Validación y abuso:** la función es pública; valida todo, limita longitudes, revisa origen, campo trampa y límite por IP en el firewall (D8).
- **Secretos:** `NOTION_TOKEN` solo en Vercel, marcado Sensitive; el ID de la base no es secreto.
- **Monitoreo:** errores de Notion a los logs de Vercel con el código de error, sin datos personales.
- **Datos personales:** no se registran en logs; el aviso de privacidad cubre la finalidad (D9).

## Fuera de alcance
- Formularios en las calculadoras: ola posterior.
- Rediseño del sitio y mudanza del hosting: Ola B (D12).
- Notificación por correo o WhatsApp al llegar un lead: explícitamente nunca en esta ola (Hermes cubre el aviso).
- Detección de duplicados: cada envío es una fila; Hernán los descarta a mano.

## Criterios de aceptación
1. En inicio, precios y partners, la sección final muestra el formulario con los campos de D4 y la leyenda del aviso.
2. Enviar con datos válidos crea una fila en Leads web con todos los campos, Estado "Nuevo", la página de origen y las UTM si venían.
3. Tras enviar se ve la confirmación con el botón para agendar en cal.com.
4. Con un campo obligatorio vacío o un correo/WhatsApp inválido, el formulario marca el campo y no envía.
5. Si la función responde error, se muestra el mensaje con el `mailto:` redactado.
6. Un envío con el campo trampa lleno no crea fila.
7. Un POST desde otro origen recibe 403.
8. La llave de Notion no aparece en el repo ni en el navegador.
9. El aviso de privacidad incluye la finalidad de contacto comercial.
10. `npm test` pasa completo.

## Preguntas abiertas
Ninguna.
