// Interfaz de la calculadora de aguinaldo: lee el formulario, llama al motor y pinta.
// Toda la lógica de dinero vive en calculos-laborales.js; las piezas comunes de UI, en ui-calculadoras.js.
// Regla: los datos se pintan con textContent o nodos creados; nunca con innerHTML.
// Spec: docs/specs/2026-09-30-calculadora-aguinaldo.md
import { calcularAguinaldo, MINIMOS_LEY } from './calculos-laborales.js?v=20260930';
import {
  $, fmtMonto, fmtDias, fmtNum, fmtFecha, hoyLocal, leerFechaIso, filaValor, nota, paso, lineasAguinaldo,
  leerNumero, leerSueldo, pintarSueldo, pintarErrores, pintarDatosCapturados,
  pintarEstado, conectarFormulario, crearBarraTotal, conectarImpresion,
} from './ui-calculadoras.js?v=20260930';

const form = $('calcForm');
const campos = {
  sueldo: $('sueldo'),
  fechaAntiguedad: $('fechaAntiguedad'),
  fechaCorte: $('fechaCorte'),
  diasAguinaldo: $('diasAguinaldo'),
};

// Campo del motor → input al que se ancla el mensaje de error.
const INPUT_DE_CAMPO = {
  salarioDiario: campos.sueldo,
  fechaAntiguedad: campos.fechaAntiguedad,
  fechaCorte: campos.fechaCorte,
  diasAguinaldo: campos.diasAguinaldo,
};

// Solo mostramos errores de campos que la persona ya tocó.
// Los precargados ("Calcular al" y días de aguinaldo) cuentan como tocados.
const tocados = new Set(['fechaCorte', 'diasAguinaldo']);
const CAMPO_DE_INPUT = { sueldo: 'salarioDiario' };

// ---- Lectura del formulario ----

function leerEntrada() {
  const sueldo = leerSueldo(form);
  return {
    sueldo,
    entrada: {
      salarioDiario: sueldo.diario,
      fechaAntiguedad: campos.fechaAntiguedad.value,
      fechaCorte: campos.fechaCorte.value,
      diasAguinaldo: leerNumero(campos.diasAguinaldo.value),
    },
  };
}

// ---- Pintado del resultado ----

function pintarComoSeCalculo(entrada, aguinaldo) {
  const anio = leerFechaIso(aguinaldo.hasta).anio;
  const formula = lineasAguinaldo(aguinaldo, entrada.salarioDiario, aguinaldo.diasAguinaldo > MINIMOS_LEY.diasAguinaldo);

  const inicioConteo = aguinaldo.desdeAntiguedad
    ? `Tu fecha de antigüedad cae en ${anio}, así que se cuenta desde esa fecha.`
    : `Se cuenta desde el 1 de enero de ${anio}.`;
  const lineasDias = [
    ['t', `${inicioConteo} Del ${fmtFecha(aguinaldo.desde)} al ${fmtFecha(aguinaldo.hasta)} ` +
      `van ${fmtNum(aguinaldo.diasTrabajados)} días, contando ambos.`],
  ];
  if (aguinaldo.topado) {
    lineasDias.push(['t', `${anio} tiene 366 días, pero el aguinaldo se calcula sobre 365 como máximo.`]);
  }

  const lineasProporcion = [['t', formula.origen], formula.dias];

  const lineasMonto = [
    formula.monto,
    ['t', 'Los días se muestran con 2 decimales pero se calculan completos; el monto se redondea a centavos.'],
  ];

  $('comoSeCalculoCuerpo').replaceChildren(
    paso('Días trabajados en el año', lineasDias),
    paso('Días de aguinaldo que te tocan', lineasProporcion),
    paso('Monto', lineasMonto),
  );
}

function pintarDatos(entrada, sueldo) {
  const filas = [];
  if (sueldo.tipo === 'mensual') filas.push(['Sueldo mensual', fmtMonto(sueldo.capturado)]);
  filas.push(
    ['Salario diario', fmtMonto(entrada.salarioDiario)],
    ['Fecha de antigüedad', fmtFecha(entrada.fechaAntiguedad)],
    ['Calcular al', fmtFecha(entrada.fechaCorte)],
    ['Días de aguinaldo al año', fmtNum(entrada.diasAguinaldo)],
    ['Calculado el', fmtFecha(hoyLocal())],
  );
  pintarDatosCapturados(filas);
}

function pintarResultado(entrada, sueldo, resultado, erroresVisibles) {
  const hayResultado = resultado.valido;
  pintarEstado({ hayResultado, erroresVisibles });
  mostrarTotal(hayResultado ? fmtMonto(resultado.aguinaldo.monto) : null);
  if (!hayResultado) return;

  const { aguinaldo } = resultado;
  $('total').textContent = fmtMonto(aguinaldo.monto);
  $('totalAnuncio').textContent = `Aguinaldo estimado: ${fmtMonto(aguinaldo.monto)}`;

  $('desglose').replaceChildren(
    filaValor('Días trabajados', `Del ${fmtFecha(aguinaldo.desde)} al ${fmtFecha(aguinaldo.hasta)}`,
      `${fmtNum(aguinaldo.diasTrabajados)} días`),
    filaValor('Días de aguinaldo', `Proporcionales a ${fmtNum(aguinaldo.diasAguinaldo)} días al año`,
      `${fmtDias(aguinaldo.dias)} días`),
    filaValor('Salario diario', sueldo.tipo === 'mensual' ? `Sueldo mensual de ${fmtMonto(sueldo.capturado)} ÷ 30` : 'Sueldo base bruto',
      fmtMonto(entrada.salarioDiario)),
  );

  $('notas').replaceChildren(...resultado.avisos.map((aviso) => nota('aviso', aviso.mensaje)));

  pintarComoSeCalculo(entrada, aguinaldo);
  pintarDatos(entrada, sueldo);
}

// Barra fija en móvil con el total (ver ui-calculadoras.js).
const mostrarTotal = crearBarraTotal();

// ---- Ciclo ----

function actualizar() {
  const { sueldo, entrada } = leerEntrada();
  pintarSueldo(sueldo);
  const resultado = calcularAguinaldo(entrada);
  const visibles = pintarErrores(resultado.errores, INPUT_DE_CAMPO, tocados);
  pintarResultado(entrada, sueldo, resultado, visibles.size);
}

conectarFormulario({ form, tocados, campoDeInput: CAMPO_DE_INPUT, actualizar });
conectarImpresion();

// Estado inicial: "Calcular al" = 31 de diciembre del año actual (fecha local) y 15 días.
campos.fechaCorte.value = `${hoyLocal().slice(0, 4)}-12-31`;
actualizar();
