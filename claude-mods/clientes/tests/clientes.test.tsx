import { expect, mock, test } from 'claude-code/testing'

const EU = { kind: 'composer' } as const
const cliente = (args: string) => ({ command: 'cliente', args, origin: EU, presentation: { isFullscreen: false, columns: 120 } })
const pedido = (text: string) => ({ text, origin: EU, wait: false })

const PANE = { title: 'Clientes', isFocused: false, bodyColumns: 60, placement: 'dock' as const }

test('separa pedidos por cliente', async ($, on) => {
  mock.clock(on)
  mock.store(on)
  const contexto: string[] = []
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('prompt.submit', (_, e) => {
    contexto.push(...(e.context ?? []))
    return { text: e.text }
  })

  await $.command.run(cliente('Hospital HCL'))
  await $.prompt.submit(pedido('Gerar relatório de julho'))
  await $.command.run(cliente('Instituto Sol'))
  await $.prompt.submit(pedido('Revisar proposta'))

  expect(contexto).toEqual([
    'Este pedido é do cliente "Hospital HCL".',
    'Este pedido é do cliente "Instituto Sol".',
  ])

  for (const surface of ['terminal', 'desktop'] as const) {
    await $.command.run(cliente('Instituto Sol'))
    const ui = await $.ui.mount({ plugin: 'clientes', surface, component: 'Pane', requestId: 'clientes', props: PANE as never })
    expect(await ui.find({ text: 'Revisar proposta' })).toBeDefined()
    expect(await ui.find({ text: 'Gerar relatório de julho' })).toBeUndefined()

    const botoes = await ui.findAll({ type: 'Button' })
    const hcl = botoes.find(b => String(b.text ?? '').includes('Hospital HCL'))
    expect(hcl).toBeDefined()
    await ui.press({ key: String(hcl?.key) })
    expect(await ui.find({ text: 'Gerar relatório de julho' })).toBeDefined()
    expect(await ui.find({ text: 'Revisar proposta' })).toBeUndefined()
    await ui.unmount()
  }
})

test('comandos não viram pedidos e pedidos podem ser marcados como feitos', async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('prompt.submit', (_, e) => ({ text: e.text }))

  await $.command.run(cliente('HCL'))
  await $.prompt.submit(pedido('/compact'))
  await $.prompt.submit(pedido('Atualizar painel'))

  const ui = await $.ui.mount({ plugin: 'clientes', surface: 'terminal', component: 'Pane', requestId: 'clientes', props: PANE as never })
  expect((await ui.find({ type: 'Button', text: '▾ HCL (1/1)' }))).toBeDefined()
  const caixa = (await ui.findAll({ type: 'Button' })).find(b => b.text === '☐')
  await ui.press({ key: String(caixa?.key) })
  expect((await ui.find({ type: 'Button', text: '▾ HCL (0/1)' }))).toBeDefined()
  expect((await ui.find({ type: 'Text', text: 'Atualizar painel' }))?.props).toMatchObject({ strikethrough: true })

  await $.command.run(cliente(''))
  await $.prompt.submit(pedido('Sem cliente'))
  expect(await ui.find({ text: 'Sem cliente' })).toBeUndefined()
})
