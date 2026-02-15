PROMPT: Generación de Módulo UI para NAAS (Frontend-Only)
Quiero que generes un nuevo módulo de interfaz de usuario (UI) llamado --- siguiendo exactamente mi arquitectura, convenciones y librerías actuales del proyecto NAAS.
No refactorices lo existente ni incluyas lógica de conexión a APIs o backend (eso lo implementará otro desarrollador).
Tu responsabilidad será entregar una UI completamente funcional e interactiva, con datos simulados (mock) y comportamientos coherentes.
 
Contexto del sistema (obligatorio)
Frontend principal:
•	Framework: Vue.js 2.6.11
•	UI Framework: Vuetify 2.2.11
•	Estado global: Vuex 3.4.0
•	Routing: Vue Router 3.2.0
•	Validación: Vuelidate 0.7.6
•	Máscaras de input: v-mask 2.2.4
•	Inputs de moneda: vue-currency-input 1.22.6
•	Iconografía: Material Design Icons 5.0.1
•	Preprocesador CSS: SASS (variables en client/src/sass/variables.scss)
•	Arquitectura de carpetas:
o	client/src/components/{MODULE_NAME}/
o	client/src/views/{MODULE_NAME}/
o	client/src/store/modules/{MODULE_NAMESPACE}.js
o	docs/{MODULE_NAMESPACE}.ui-design.md
Sistema de diseño:
•	Paleta NAAS (modo claro/oscuro con colores primary, accent, secondary, success, info, warning, error, naasBlack, naasWhite)
•	Tipografía: Roboto y Open Sans
•	Grid Vuetify de 12 columnas (responsive)
•	Espaciado estándar (pa-*, ma-*, mt-*, mb-*, etc.)
•	Transiciones fade y slide-fade ya configuradas en App.vue
•	Accesibilidad y etiquetas aria requeridas
 
Objetivo del módulo UI
•	Descripción breve: {BREVE_DESCRIPCION}
•	Casos de uso principales (bullets): {CASOS_DE_USO}
•	Componentes principales: {COMPONENTES_UI}
•	Flujo de interacción esperado: {FLUJO_UI}
•	Datos simulados (mock): {DATA_MOCK}
•	Integraciones visuales (modales, tabs, tablas, formularios, etc.): {INTERACCIONES_UI}
 
Entregables (obligatorios)
1.	Estructura de carpetas bajo {ROOT_DIR}/:
2.	client/src/components/{MODULE_NAME}/
3.	client/src/views/{MODULE_NAME}/
4.	client/src/store/modules/{MODULE_NAMESPACE}.js
5.	docs/{MODULE_NAMESPACE}.ui-design.md
6.	Frontend (Vue 2 + Vuetify 2.2.11):
o	Componentes en client/src/components/{MODULE_NAME}/:
	{COMPONENTES_REQUERIDOS} (formularios, listas, detalle, dashboard, modales, tabs, etc.)
	Interactividad básica con eventos, estados reactivos y validaciones
	Datos de ejemplo locales (data() o mockData.js)
o	Vista principal (views/{MODULE_NAME}/index.vue):
	Layout responsive con v-container, v-row, v-col
	Uso de componentes personalizados (Dialog.vue, Spinner.vue, Snackbar.vue, etc.)
	Estados de loading, empty, error, success
	Transiciones suaves (fade, slide-fade)
o	Módulo Vuex (store/modules/{MODULE_NAMESPACE}.js):
	Estado mockeado (sin conexión real)
	Acciones que simulan fetch con setTimeout o Promise.resolve()
	Mutations y getters coherentes para la UI
o	Routing sugerido (no modificar router global):
	Solo especificar las rutas sugeridas en comentario (ejemplo)
7.	Documentación (docs/{MODULE_NAMESPACE}.ui-design.md):
o	Estructura de componentes
o	Propiedades, eventos y ejemplos de uso
o	Flujo visual del módulo (mock de pantallas o descripción)
o	Referencia de colores, spacing y tipografía usados
o	Notas de testing responsive
 
Componentes Personalizados Disponibles (debes usarlos cuando aplique)
•	Dialog.vue / ConfirmDialog.vue → confirmaciones y alertas
•	DatePicker.vue → selección de fechas
•	FileUploader.vue → subida simulada de archivos
•	Spinner.vue → loading overlay
•	Snackbar.vue → notificaciones
•	PasswordValidityIndicator.vue → validación visual de contraseñas
•	VCurrencyInput.vue → entrada formateada de valores monetarios
•	FormulaEditor.vue → edición de expresiones matemáticas
•	ModalTemplate.vue → contenedor genérico para modales
 
Estándares de desarrollo UI (obligatorio)
•	Layout y grid: Basado en v-container > v-row > v-col
•	Colores: Usar la paleta NAAS (primary, accent, naasBlack, etc.)
•	Tipografía: text-h5, text-body-1, font-weight-medium
•	Espaciado: pa-4, mt-6, mb-4, mx-auto según diseño
•	Responsive: Mobile-first (cols="12" sm="6" md="4")
•	Validación: Reglas locales o Vuelidate
•	Interactividad: Mostrar/ocultar secciones con v-if o v-show
•	Accesibilidad: incluir aria-labels y textos descriptivos
•	Temas: compatible con light y dark
•	Consistencia: usar componentes Vuetify antes que HTML nativo
 
Datos simulados (mock)
•	Incluir archivos o constantes locales con datos de ejemplo (mockData.js)
•	Simular “fetch” con setTimeout o Promise.resolve
•	Mostrar estados de:
o	Loading: usando <Spinner />
o	Error: con <v-alert type="error" />
o	Empty: mensaje y botón de acción
•	Mostrar feedback con <Snackbar /> para acciones simuladas
 
Formato de salida (obligatorio)
•	Árbol de directorios propuesto
•	Por cada archivo clave, incluir el contenido en bloques de código (solo lo nuevo)
•	No incluir código backend, serverless ni conexión HTTP
•	Incluir comentarios explicativos en secciones clave
•	Checklist de aceptación al final
 
Checklist de aceptación
•	Carpeta {ROOT_DIR}/client/src/components/{MODULE_NAME}/ creada
•	Componentes Vue 2 + Vuetify funcionales e interactivos
•	Módulo Vuex {MODULE_NAMESPACE}.js creado con mock data
•	Vista principal responsive (views/{MODULE_NAME}/index.vue)
•	Documentación docs/{MODULE_NAMESPACE}.ui-design.md completa
•	Uso correcto de componentes personalizados NAAS
•	Uso de Vuetify Grid, validaciones y spacing coherente
•	Sin conexión a APIs ni dependencias nuevas
•	Probado con modo oscuro y responsive
•	Comentarios explicativos incluidos
 
Parámetros para este módulo
•	{ROOT_DIR}: {RECOMMENDED_ROOT_DIR} (ej: client/ o frontend/)
•	{MODULE_NAME}: {NOMBRE_DEL_MODULO}
•	{MODULE_NAMESPACE}: {namespace_kebab_case}
•	{COMPONENTES_REQUERIDOS}: {lista_de_componentes}
•	{COMPONENTES_UI}: {descripcion_general_de_la_interfaz}
•	{DATA_MOCK}: {estructura_mock_data}
•	{FLUJO_UI}: {pasos_de_interaccion_esperados}
 
Notas Finales
•	Mantener compatibilidad con Vuetify 2.2.11
•	No agregar librerías externas salvo que se indique
•	Todos los textos visibles deben estar en español
•	En caso de formularios, incluir reglas de validación y ejemplos
•	Mantener coherencia con los componentes globales y el diseño NAAS
•	Priorizar claridad visual, modularidad y reutilización
