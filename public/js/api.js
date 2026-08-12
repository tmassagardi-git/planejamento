// Helper mínimo para chamar a API REST do sistema de comissão a partir dos painéis.
export async function api(metodo, caminho, corpo) {
  const resposta = await fetch(caminho, {
    method: metodo,
    headers: corpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  });
  const json = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(json.erro || `Erro ${resposta.status}`);
  }
  return json;
}

export function formatarMoeda(valor) {
  return Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarPercentual(fracao) {
  return `${(Number(fracao ?? 0) * 100).toFixed(1)}%`;
}

export function mesAtualISO() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
}

export function proximosMeses(mesBase, quantidade = 15, inicioAntes = 3) {
  const [ano, mes] = mesBase.split('-').map(Number);
  const meses = [];
  for (let i = -inicioAntes; i < quantidade - inicioAntes; i += 1) {
    const total = ano * 12 + (mes - 1) + i;
    const novoAno = Math.floor(total / 12);
    const novoMes = (total % 12) + 1;
    meses.push(`${novoAno}-${String(novoMes).padStart(2, '0')}`);
  }
  return meses;
}

export function mostrarMensagem(elemento, texto, tipo = 'sucesso') {
  elemento.textContent = texto;
  elemento.className = `mensagem ${tipo}`;
  if (tipo === 'sucesso') {
    setTimeout(() => {
      if (elemento.textContent === texto) elemento.textContent = '';
    }, 4000);
  }
}
