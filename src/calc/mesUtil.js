// Utilidades para trabalhar com meses no formato 'YYYY-MM' (sem depender de Date,
// que tem fuso-horário e é uma fonte comum de erro em cálculos de mês a mês).

const FORMATO_MES = /^\d{4}-\d{2}$/;

export function validarMesReferencia(mesReferencia) {
  if (typeof mesReferencia !== 'string' || !FORMATO_MES.test(mesReferencia)) {
    throw new Error(`mesReferencia inválido: "${mesReferencia}" (esperado "YYYY-MM")`);
  }
  const mes = Number(mesReferencia.slice(5, 7));
  if (mes < 1 || mes > 12) {
    throw new Error(`mesReferencia inválido: "${mesReferencia}" (mês fora do intervalo 01-12)`);
  }
}

/**
 * Soma `n` meses a `mesReferencia` ('YYYY-MM'). Aceita `n` negativo.
 */
export function addMonths(mesReferencia, n) {
  validarMesReferencia(mesReferencia);
  const ano = Number(mesReferencia.slice(0, 4));
  const mes = Number(mesReferencia.slice(5, 7));
  const totalMeses = ano * 12 + (mes - 1) + n;
  const novoAno = Math.floor(totalMeses / 12);
  const novoMes = (totalMeses % 12) + 1;
  return `${String(novoAno).padStart(4, '0')}-${String(novoMes).padStart(2, '0')}`;
}

/**
 * Compara dois meses 'YYYY-MM'. Retorna <0, 0 ou >0 (como Array.prototype.sort).
 */
export function compareMeses(a, b) {
  validarMesReferencia(a);
  validarMesReferencia(b);
  return a.localeCompare(b);
}

export function mesAtual(data = new Date()) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}
