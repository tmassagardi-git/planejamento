# CRM Doadores — Gestão de Prospecção e Fechamento de Empresas

CRM para ONGs gerenciarem a prospecção e o fechamento de empresas doadoras
("Empresa Amiga"): cadastro de empresas e contatos, funil de vendas com
kanban arrastável, conversão de oportunidades ganhas em doações com parcelas,
controle financeiro das doações e um dashboard com os principais indicadores.

Roda **100% offline no navegador** — todos os dados ficam salvos localmente
via IndexedDB (biblioteca [Dexie](https://dexie.org)). Não há backend nem
necessidade de internet para usar o sistema no dia a dia.

## Rodando localmente

```bash
npm install
npm run dev      # abre em http://localhost:5173
```

Build de produção (gera arquivos estáticos em `dist/`, pode ser hospedado em
qualquer servidor estático ou aberto localmente):

```bash
npm run build
npm run preview
```

## Funcionalidades

- **Empresas** — cadastro (nome, CNPJ, segmento, contato, endereço, tags,
  observações), busca, e ficha detalhada com abas:
  - **Dados** — informações cadastrais
  - **VIC** — avaliação de qualificação (ver abaixo)
  - **Contatos** — pessoas associadas à empresa (nome, cargo, telefone,
    WhatsApp, e-mail)
  - **Histórico de Doações** — todas as doações da empresa, cada uma
    expansível para ver as parcelas
- **Mapa de relacionamento** — clicando no nome de um contato abre um mapa
  visual com todas as suas conexões (familiares, amigos, colegas de
  trabalho...) com qualquer outro contato do sistema, mesmo de outra
  empresa. Ao adicionar uma conexão, o tipo pode ser diferente em cada
  sentido (ex.: A é "Pai" de B, B é "Filho(a)" de A); tipos simétricos
  (Amigos, Família...) usam o mesmo valor dos dois lados. Contatos da mesma
  empresa entram automaticamente em conexão de "Colegas de trabalho"; ao
  mudar um contato de empresa, essa conexão automática vira "Ex colega de
  trabalho" (sem apagar o histórico) e novas conexões de "Colegas de
  trabalho" são criadas com quem já está na empresa nova — a empresa
  anterior fica registrada na ficha do contato. Conexões criadas/editadas
  manualmente nunca são sobrescritas por essa lógica automática.
- **Funil de Vendas** — etapas configuráveis (Configurações → Funil de
  vendas), visualização **Kanban** (drag and drop entre etapas) ou **Lista**.
  Cada oportunidade tem: empresa, contato, nome, proposta (o que foi
  ofertado), valor, mês trabalhado, previsão de fechamento e observações.
- **Ganho → Doação** — ao clicar em "Marcar venda" numa oportunidade, abre um
  formulário para lançar a doação gerada: projeto apoiado, cota/categoria,
  valor total e número de parcelas. As parcelas mensais são geradas
  automaticamente a partir da data de início.
- **Doações** — página de controle financeiro: todas as doações (doadores),
  cada uma com suas parcelas (data prevista, data da baixa, status, meio de
  pagamento). "Dar baixa" registra o pagamento de uma parcela.
- **Dashboard** — arrecadado x previsto por mês, novos doadores por mês,
  distribuição por categoria/cota, funil de conversão por etapa.
- **Matriz VIC** — qualificação de prospects pelo método **Vínculo, Interesse
  e Capacidade**: cada empresa pode ter uma ou mais avaliações (uma por
  projeto), com nota 0-5 em critérios ponderados por eixo. Acessível pela
  guia **VIC** na ficha da empresa (logo depois de "Dados") ou pela página
  **Matriz VIC** no menu, que mostra todas as avaliações num gráfico de
  bolhas (Vínculo × Interesse, tamanho = Capacidade) com ranking e uma
  visualização em lista, filtráveis por projeto.
- **Configurações** — etapas do funil (criar/editar/reordenar/excluir),
  cotas/categorias, estratégias, meios de pagamento, motivos de perda e os
  critérios/pesos do Sistema VIC — todos editáveis para se adaptar ao
  vocabulário da sua ONG.

## Backup dos dados

Como os dados ficam apenas no navegador (IndexedDB), use **Configurações →
Backup dos dados** para exportar um `.json` regularmente. O mesmo arquivo
pode ser reimportado (substitui todos os dados atuais) para restaurar ou
migrar de máquina.

### Dados iniciais do Sistema VIC

Na primeira execução, o app carrega os 16 critérios padrão do método VIC
(`src/lib/vic-seed-data.ts`) e importa as 68 empresas já pesquisadas e
avaliadas na planilha original (casando por nome com empresas já
cadastradas, quando existirem, ou criando novas). Critérios e pesos podem
ser ajustados depois em Configurações — a soma dos pesos de cada eixo deve
continuar somando 10.

## Arquitetura (pensada para migração futura ao Lovable/Supabase)

```
src/
  lib/
    types.ts     # modelo de dados (entidades) — ids uuid, datas ISO
    db.ts        # schema do IndexedDB (Dexie)
    seed.ts      # dados iniciais (funil padrão + catálogo)
    format.ts    # formatação de moeda/data (pt-BR)
  services/      # camada de acesso a dados — TODA a lógica de negócio
                 # (criar/editar/mover oportunidade, gerar parcelas, dar
                 # baixa, agregações do dashboard) vive aqui, isolada do
                 # IndexedDB por trás de funções simples (create*, update*,
                 # delete*, etc.)
  components/    # UI reutilizável (formulários, kanban, cards)
  pages/         # uma página por rota
```

A ideia de "trabalhar offline agora, exportar para o Lovable depois": a
camada `services/*.ts` é a única parte que conversa com o banco (Dexie/
IndexedDB). Para migrar para Supabase (usado pelo Lovable), essas funções
podem ser reescritas para chamar `supabase.from(...)` mantendo a mesma
assinatura — o restante do app (componentes, páginas) não muda.

O modelo de dados (`src/lib/types.ts`) já foi desenhado pensando nisso:

| Entidade        | Tabela sugerida no Postgres | Observações |
|-----------------|------------------------------|--------------|
| `Company`       | `companies`                  | — |
| `Contact`        | `contacts`                   | FK `company_id` |
| `Funnel`         | `funnels`                     | — |
| `Stage`          | `stages`                      | FK `funnel_id`, campo `order` |
| `Opportunity`    | `opportunities`               | FK `funnel_id`, `stage_id`, `company_id`, `contact_id`, `donation_id` |
| `Donation`       | `donations`                   | FK `company_id`, `opportunity_id` |
| `Installment`    | `installments`                | FK `donation_id` |
| `Catalog`        | pode virar tabelas `categories`, `strategies`, `payment_methods`, `loss_reasons` (ou permanecer 1 registro de config) | — |
| `VicCriterion`   | `vic_criteria`                | eixo `V`/`I`/`C`, peso |
| `VicEvaluation`  | `vic_evaluations`              | FK `company_id`; `notas`/`obs` → `jsonb` |
| `ContactConnection` | `contact_connections`       | FK `contact_a_id`, `contact_b_id` (ambos para `contacts`) |

Convenções usadas (facilitam o `CREATE TABLE` no Postgres):
- `id`: `uuid` (gerado com `uuid` no cliente — pode continuar assim ou virar
  `default gen_random_uuid()`)
- Datas "sem hora" (`startDate`, `dueDate`, `paymentDate`, `expectedCloseDate`):
  string `YYYY-MM-DD` → tipo `date`
  - `createdAt`/`updatedAt`: string ISO completa → tipo `timestamptz`
- Valores monetários: `number` em reais (não centavos) → `numeric(12,2)`
- `Opportunity.workingMonth`: string `YYYY-MM` → pode virar `date` (primeiro
  dia do mês) ou `text`, como preferir

## Stack

React + TypeScript + Vite + Tailwind CSS v4 + Dexie (IndexedDB) + dnd-kit
(drag and drop) + Recharts (gráficos) + React Router — o mesmo tipo de stack
usado pelo Lovable, o que deixa a migração mais direta quando chegar a hora.
