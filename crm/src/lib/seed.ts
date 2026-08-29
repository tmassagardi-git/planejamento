import { v4 as uuid } from 'uuid';
import { db } from './db';
import { importVicSeedData } from '../services/vic';

// Popula o banco local (IndexedDB) na primeira execução: um funil padrão com
// etapas comuns de captação de empresas doadoras, e um catálogo inicial de
// categorias/estratégias/meios de pagamento (editáveis depois em Configurações).
export async function ensureSeeded() {
  const funnelCount = await db.funnels.count();
  if (funnelCount === 0) {
    const now = new Date().toISOString();
    const funnelId = uuid();
    await db.funnels.add({
      id: funnelId,
      name: 'Captação de Empresas',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });

    const stageNames = [
      'Sem contato',
      'Contato feito',
      'Reunião agendada',
      'Proposta enviada',
      'Termo / Aguardando pagamento',
    ];
    const colors = ['#94a3b8', '#38bdf8', '#a78bfa', '#fb923c', '#34d399'];
    await db.stages.bulkAdd(
      stageNames.map((name, i) => ({
        id: uuid(),
        funnelId,
        name,
        order: i,
        color: colors[i],
        createdAt: now,
        updatedAt: now,
      })),
    );
  }

  const RELATIONSHIP_TYPES_SEED = [
    'Família',
    'Cônjuge',
    'Pai',
    'Mãe',
    'Filho(a)',
    'Amigos',
    'Colegas de trabalho',
    'Ex colega de trabalho',
    'Outro',
  ];

  const catalogCount = await db.catalog.count();
  if (catalogCount === 0) {
    const now = new Date().toISOString();
    await db.catalog.add({
      id: uuid(),
      categories: ['Bronze', 'Prata', 'Ouro', 'Premium', 'Exclusiva', 'Corporativo', 'Cestas Básicas'],
      strategies: ['Empresa Amiga', 'Corrida'],
      paymentMethods: ['Pix', 'Boleto', 'Transferência', 'Cartão de crédito', 'Em serviço / Produto', 'Cesta Básica'],
      lossReasons: ['Sem orçamento', 'Sem retorno', 'Optou por outra instituição', 'Fora do perfil', 'Outro'],
      relationshipTypes: RELATIONSHIP_TYPES_SEED,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    // migração: bancos criados antes do mapa de relacionamento não têm essa lista ainda
    const catalog = await db.catalog.toCollection().first();
    if (catalog && !catalog.relationshipTypes) {
      await db.catalog.update(catalog.id, { relationshipTypes: RELATIONSHIP_TYPES_SEED });
    }
  }

  // Importa, uma única vez, os 16 critérios padrão do Sistema VIC e as 68
  // empresas já pesquisadas/avaliadas na planilha original (casando por
  // nome com empresas já cadastradas, quando existirem).
  const vicEvaluationsCount = await db.vicEvaluations.count();
  if (vicEvaluationsCount === 0) {
    await importVicSeedData();
  }
}
