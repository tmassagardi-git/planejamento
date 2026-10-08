export type Pedido = { id: string; texto: string; data: number; feito: boolean }
export type Cliente = { id: string; nome: string; pedidos: Pedido[] }

declare module 'claude-code' {
  interface PluginState {
    clientes: {
      lista: Cliente[]
      ativo: string | null
      aberto: string | null
    }
  }
}
