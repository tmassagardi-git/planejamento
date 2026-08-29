import { v4 as uuid } from 'uuid';
import { db } from '../lib/db';
import type { VicAxis, VicCriterion } from '../lib/types';
import { VIC_DEFAULT_PROJECT } from '../lib/vic-calc';
import { vicCriteriosSeed, vicEmpresasSeed } from '../lib/vic-seed-data';
import { createCompany } from './companies';

// --- Critérios (Configurações) ---

export async function createCriterion(eixo: VicAxis, nome: string, peso: number): Promise<string> {
  const now = new Date().toISOString();
  const id = uuid();
  const siblings = await db.vicCriteria.toArray();
  await db.vicCriteria.add({ id, eixo, nome, peso, order: siblings.length, createdAt: now, updatedAt: now });
  return id;
}

export async function updateCriterion(
  id: string,
  patch: Partial<Pick<VicCriterion, 'nome' | 'peso'>>,
): Promise<void> {
  await db.vicCriteria.update(id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function deleteCriterion(id: string): Promise<void> {
  await db.vicCriteria.delete(id);
}

/** Restaura a lista de critérios/pesos para os 16 padrões do método VIC.
 * Não mexe nas avaliações já lançadas nas empresas (notas de critérios
 * removidos ficam órfãs e voltam a valer se um critério com o mesmo nome
 * de eixo for recriado). */
export async function restoreDefaultCriteria(): Promise<void> {
  const now = new Date().toISOString();
  await db.transaction('rw', db.vicCriteria, async () => {
    await db.vicCriteria.clear();
    await db.vicCriteria.bulkAdd(
      vicCriteriosSeed.map((c, i) => ({
        id: c.id,
        eixo: c.eixo,
        nome: c.nome,
        peso: c.peso,
        order: i,
        createdAt: now,
        updatedAt: now,
      })),
    );
  });
}

// --- Avaliações (ficha da empresa) ---

export async function createEvaluation(companyId: string, projeto: string): Promise<string> {
  const now = new Date().toISOString();
  const id = uuid();
  await db.vicEvaluations.add({ id, companyId, projeto, notas: {}, obs: {}, createdAt: now, updatedAt: now });
  return id;
}

export async function duplicateEvaluation(id: string): Promise<string> {
  const original = await db.vicEvaluations.get(id);
  if (!original) throw new Error('Avaliação não encontrada.');
  const now = new Date().toISOString();
  const newId = uuid();
  await db.vicEvaluations.add({
    id: newId,
    companyId: original.companyId,
    projeto: `${original.projeto || 'Projeto'} (cópia)`,
    notas: { ...original.notas },
    obs: { ...original.obs },
    createdAt: now,
    updatedAt: now,
  });
  return newId;
}

export async function updateEvaluationProject(id: string, projeto: string): Promise<void> {
  await db.vicEvaluations.update(id, { projeto, updatedAt: new Date().toISOString() });
}

export async function setNota(evaluationId: string, criterionId: string, valor: number): Promise<void> {
  const evaluation = await db.vicEvaluations.get(evaluationId);
  if (!evaluation) return;
  await db.vicEvaluations.update(evaluationId, {
    notas: { ...evaluation.notas, [criterionId]: valor },
    updatedAt: new Date().toISOString(),
  });
}

export async function setObs(evaluationId: string, criterionId: string, texto: string): Promise<void> {
  const evaluation = await db.vicEvaluations.get(evaluationId);
  if (!evaluation) return;
  await db.vicEvaluations.update(evaluationId, {
    obs: { ...evaluation.obs, [criterionId]: texto },
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteEvaluation(id: string): Promise<void> {
  await db.vicEvaluations.delete(id);
}

// --- Importação dos dados-semente (68 empresas pesquisadas) ---

/** Roda uma única vez (ver `ensureSeeded`): cria os 16 critérios padrão e,
 * para cada empresa do dataset original, casa por nome (case-insensitive)
 * com uma empresa já cadastrada ou cria uma nova, lançando a avaliação
 * VIC "Institucional" com as notas e observações da pesquisa original. */
export async function importVicSeedData(): Promise<void> {
  const now = new Date().toISOString();

  const criteriaCount = await db.vicCriteria.count();
  if (criteriaCount === 0) {
    await db.vicCriteria.bulkAdd(
      vicCriteriosSeed.map((c, i) => ({
        id: c.id,
        eixo: c.eixo,
        nome: c.nome,
        peso: c.peso,
        order: i,
        createdAt: now,
        updatedAt: now,
      })),
    );
  }

  const existingCompanies = await db.companies.toArray();
  const byName = new Map(existingCompanies.map((c) => [c.name.trim().toLowerCase(), c]));

  for (const seed of vicEmpresasSeed) {
    const key = seed.nome.trim().toLowerCase();
    let company = byName.get(key);
    if (!company) {
      const id = await createCompany({ name: seed.nome, segment: seed.ramo, tags: ['VIC'] });
      company = await db.companies.get(id);
      if (company) byName.set(key, company);
    }
    if (!company) continue;

    const alreadyImported = await db.vicEvaluations
      .where('companyId')
      .equals(company.id)
      .filter((e) => e.projeto === VIC_DEFAULT_PROJECT)
      .count();
    if (alreadyImported > 0) continue;

    await db.vicEvaluations.add({
      id: uuid(),
      companyId: company.id,
      projeto: VIC_DEFAULT_PROJECT,
      notas: { ...seed.notas },
      obs: { ...seed.obs },
      createdAt: now,
      updatedAt: now,
    });
  }
}
