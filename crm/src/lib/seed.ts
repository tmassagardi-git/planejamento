import { v4 as uuid } from 'uuid';
import { db } from './db';

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

  const catalogCount = await db.catalog.count();
  if (catalogCount === 0) {
    const now = new Date().toISOString();
    await db.catalog.add({
      id: uuid(),
      categories: ['Bronze', 'Prata', 'Ouro', 'Premium', 'Exclusiva', 'Corporativo', 'Cestas Básicas'],
      strategies: ['Empresa Amiga', 'Corrida'],
      paymentMethods: ['Pix', 'Boleto', 'Transferência', 'Cartão de crédito', 'Em serviço / Produto', 'Cesta Básica'],
      lossReasons: ['Sem orçamento', 'Sem retorno', 'Optou por outra instituição', 'Fora do perfil', 'Outro'],
      createdAt: now,
      updatedAt: now,
    });
  }
}
