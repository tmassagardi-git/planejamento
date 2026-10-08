import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Cliente, Pedido } from '../types'

const PAINEL = 'clientes'
const TITULO = 'Clientes'
const SALVO = 'dados'

const lista = atom({ plugin: 'clientes', key: 'lista' } as const, [])
const ativo = atom({ plugin: 'clientes', key: 'ativo' } as const, null)
const aberto = atom({ plugin: 'clientes', key: 'aberto' } as const, null)

type Salvo = { lista?: Cliente[]; ativo?: string | null }

let contador = 0
async function novoId($: EngineInterface): Promise<string> {
  contador += 1
  return `${(await $.clock.now()).toString(36)}-${contador}`
}

async function salvar($: EngineInterface) {
  const dados: Salvo = { lista: await read($, lista), ativo: await read($, ativo) }
  await $.store.set(SALVO, dados)
}

async function mostrarStatus($: EngineInterface) {
  const id = await read($, ativo)
  const cliente = (await read($, lista)).find(c => c.id === id)
  $.ui.status(cliente ? `Cliente: ${cliente.nome}` : undefined)
}

async function mudarLista($: EngineInterface, fn: (l: Cliente[]) => Cliente[]) {
  await update($, lista, l => fn(l ?? []))
  await salvar($)
}

async function ativar($: EngineInterface, id: string | null) {
  await update($, ativo, () => id)
  await salvar($)
  await mostrarStatus($)
}

async function criarCliente($: EngineInterface, nome: string): Promise<Cliente> {
  const limpo = nome.trim()
  const existente = (await read($, lista)).find(
    c => c.nome.toLowerCase() === limpo.toLowerCase(),
  )
  if (existente) return existente
  const cliente: Cliente = { id: await novoId($), nome: limpo, pedidos: [] }
  await mudarLista($, l => [...l, cliente])
  return cliente
}

async function adicionarPedido($: EngineInterface, clienteId: string, texto: string) {
  const limpo = texto.trim()
  if (!limpo) return
  const pedido: Pedido = {
    id: await novoId($),
    texto: limpo.length > 300 ? `${limpo.slice(0, 300)}…` : limpo,
    data: await $.clock.now(),
    feito: false,
  }
  await mudarLista($, l =>
    l.map(c => (c.id === clienteId ? { ...c, pedidos: [...c.pedidos, pedido] } : c)),
  )
}

async function anotar($: EngineInterface, texto: string): Promise<Cliente | undefined> {
  const id = await read($, ativo)
  const cliente = (await read($, lista)).find(c => c.id === id)
  if (!cliente || texto.trim().startsWith('/')) return undefined
  await adicionarPedido($, cliente.id, texto)
  return cliente
}

function mudarPedido(clienteId: string, pedidoId: string, fn: (p: Pedido) => Pedido | null) {
  return (l: Cliente[]) =>
    l.map(c =>
      c.id !== clienteId
        ? c
        : {
            ...c,
            pedidos: c.pedidos.flatMap(p => {
              if (p.id !== pedidoId) return [p]
              const novo = fn(p)
              return novo ? [novo] : []
            }),
          },
    )
}

function dataCurta(ms: number) {
  const d = new Date(ms)
  const dois = (n: number) => String(n).padStart(2, '0')
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)} ${dois(d.getHours())}:${dois(d.getMinutes())}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const salvo = (await $.store.get(SALVO)) as Salvo | undefined
    if (salvo?.lista && (await read($, lista)).length === 0) {
      await update($, lista, () => salvo.lista ?? [])
      await update($, ativo, () => salvo.ativo ?? null)
    }
    await mostrarStatus($)

    await $.command.register({
      name: 'clientes',
      description: 'Abre o painel lateral com seus pedidos separados por cliente',
    })
    await $.command.register({
      name: 'cliente',
      description: 'Define o cliente ativo (/cliente Nome); sem nome, desativa',
    })

    return next(e)
  })

  on('command.run', { command: 'clientes' }, async $ => {
    await $.ui.open({ id: PAINEL, title: TITULO })

    return { text: 'Painel de clientes aberto.' }
  })

  on('command.run', { command: 'cliente' }, async ($, e) => {
    const nome = e.args.trim()
    if (!nome) {
      await ativar($, null)
      return { text: 'Nenhum cliente ativo. Os pedidos não serão registrados.' }
    }
    const cliente = await criarCliente($, nome)
    await ativar($, cliente.id)
    await update($, aberto, () => cliente.id)
    await $.ui.open({ id: PAINEL, title: TITULO })

    return { text: `Cliente ativo: ${cliente.nome}. Seus próximos pedidos ficam na lista dele.` }
  })

  // Cada pedido digitado com um cliente ativo entra na lista desse cliente.
  on('prompt.submit', async ($, e, next) => {
    const cliente = await anotar($, e.text).catch(() => {
      // Uma falha ao anotar nunca segura o pedido.
      $.ui.toast('clientes: não consegui anotar este pedido')
      return undefined
    })
    if (!cliente) return next(e)

    return next({
      ...e,
      context: [...(e.context ?? []), `Este pedido é do cliente "${cliente.nome}".`],
    })
  })

  on('ui.render', { component: 'Pane', requestId: PAINEL }, async ($, e) => {
    const elementos = $.ui.resolve(e)
    const { Box, Text, Button } = elementos
    // O celular não tem campos de texto nem seletor: lá o painel só mostra a lista.
    const Input = 'Input' in elementos ? elementos.Input : null
    const Select = 'Select' in elementos ? elementos.Select : null
    const clientes = await read($, lista)
    const idAtivo = await read($, ativo)
    const idAberto = await read($, aberto)

    return (
      <Box flexDirection="column" gap={1}>
        {Select && <Select
          key="ativo"
          label="Cliente ativo: "
          value={idAtivo ?? ''}
          options={[
            { value: '', label: '(nenhum)' },
            ...clientes.map(c => ({ value: c.id, label: c.nome })),
          ]}
          onSelect={(valor: string) => ativar($, valor || null)}
        />}
        {Input && <Input
          key="novo-cliente"
          label="+ "
          placeholder="Novo cliente"
          submitLabel="criar"
          value=""
          onSubmit={async (nome: string) => {
            if (!nome.trim()) return
            const cliente = await criarCliente($, nome)
            await update($, aberto, () => cliente.id)
          }}
        />}

        {clientes.length === 0 && (
          <Text dimColor>Nenhum cliente ainda. Crie um acima ou use /cliente Nome.</Text>
        )}

        <Box flexDirection="column">
          {clientes.map(c => {
            const pendentes = c.pedidos.filter(p => !p.feito).length
            const estaAberto = c.id === idAberto

            return (
              <Box key={`c-${c.id}`} flexDirection="column">
                <Box flexDirection="row" gap={1}>
                  <Button
                    key={`abrir-${c.id}`}
                    plain
                    label={`${estaAberto ? '▾' : '▸'} ${c.nome} (${pendentes}/${c.pedidos.length})`}
                    onPress={() => update($, aberto, () => (estaAberto ? null : c.id))}
                  />
                  {c.id === idAtivo && <Text color="success">● ativo</Text>}
                </Box>

                {estaAberto && (
                  <Box flexDirection="column" paddingLeft={2}>
                    {c.pedidos.length === 0 && <Text dimColor>Sem pedidos.</Text>}
                    {c.pedidos.map(p => (
                      <Box key={`p-${p.id}`} flexDirection="row" gap={1}>
                        <Button
                          key={`feito-${p.id}`}
                          plain
                          label={p.feito ? '☑' : '☐'}
                          onPress={() =>
                            mudarLista($, mudarPedido(c.id, p.id, x => ({ ...x, feito: !x.feito })))
                          }
                        />
                        <Text dimColor>{dataCurta(p.data)}</Text>
                        <Text strikethrough={p.feito} dimColor={p.feito} wrap="truncate-end">
                          {p.texto}
                        </Text>
                        <Button
                          key={`apagar-${p.id}`}
                          plain
                          dimColor
                          label="✕"
                          onPress={() => mudarLista($, mudarPedido(c.id, p.id, () => null))}
                        />
                      </Box>
                    ))}
                    {Input && <Input
                      key={`novo-pedido-${c.id}`}
                      label="+ "
                      placeholder="Anotar pedido"
                      submitLabel="anotar"
                      value=""
                      onSubmit={(texto: string) => adicionarPedido($, c.id, texto)}
                    />}
                    <Box flexDirection="row" gap={2}>
                      {c.id !== idAtivo && (
                        <Button key={`ativar-${c.id}`} label="Ativar" onPress={() => ativar($, c.id)} />
                      )}
                      <Button
                        key={`limpar-${c.id}`}
                        label="Limpar feitos"
                        onPress={() =>
                          mudarLista($, l =>
                            l.map(x =>
                              x.id === c.id ? { ...x, pedidos: x.pedidos.filter(p => !p.feito) } : x,
                            ),
                          )
                        }
                      />
                      <Button
                        key={`remover-${c.id}`}
                        dimColor
                        label="Remover cliente"
                        onPress={async () => {
                          await mudarLista($, l => l.filter(x => x.id !== c.id))
                          if (c.id === (await read($, ativo))) await ativar($, null)
                          await update($, aberto, () => null)
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>
      </Box>
    )
  })
}
