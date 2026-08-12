// Junta meta + base mensal (provisões) + faixas de incentivo para calcular a
// comissão de um(a) captador(a) em um mês — é o que os painéis exibem.
import { listarCaptadores } from './captadores.js';
import { obterMeta } from './metas.js';
import { faixasParaCalculo } from './faixas.js';
import { obterBaseMensalPorTipo, obterNovosEmpresaAmiga } from './lancamentos.js';
import { calcularComissaoMensal } from '../calc/commission.js';

export function calcularComissaoCaptadorMes(db, captadorId, mesReferencia) {
  const meta = obterMeta(db, captadorId, mesReferencia);
  const novosEmpresaAmiga = obterNovosEmpresaAmiga(db, captadorId, mesReferencia);
  const base = obterBaseMensalPorTipo(db, captadorId, mesReferencia);
  const faixas = faixasParaCalculo(db);

  const resultado = calcularComissaoMensal({
    novosEmpresaAmiga,
    meta,
    baseEmpresaAmigaAcumulado: base.empresa_amiga,
    baseParcelaPatrocinio: base.patrocinio,
    baseParcelaEdital: base.edital,
    baseParcelaProjetoIncentivado: base.projeto_incentivado,
    faixas,
  });

  return { captadorId, mesReferencia, ...resultado };
}

export function calcularComissaoTodosCaptadoresMes(db, mesReferencia, { somenteAtivos = true } = {}) {
  const captadores = listarCaptadores(db, { somenteAtivos });
  return captadores.map((captador) => ({
    captador,
    ...calcularComissaoCaptadorMes(db, captador.id, mesReferencia),
  }));
}
