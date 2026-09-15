const CLIENTE = new URLSearchParams(window.location.search).get('cliente') || 'HCL';

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatoNumero = new Intl.NumberFormat('pt-BR');
const formatoMesLabel = (chaveAnoMes) => {
  const [ano, mes] = chaveAnoMes.split('-');
  const nomesMes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${nomesMes[Number(mes) - 1]}/${ano}`;
};

const el = {
  clienteBadge: document.getElementById('clienteBadge'),
  dataIni: document.getElementById('dataIni'),
  dataFim: document.getElementById('dataFim'),
  tipoData: document.getElementById('tipoData'),
  operador: document.getElementById('operador'),
  metrica: document.getElementById('metrica'),
  btnAplicar: document.getElementById('btnAplicar'),
  avisoCarregando: document.getElementById('avisoCarregando'),
  avisoErro: document.getElementById('avisoErro'),
  resumoPrevistoValor: document.getElementById('resumoPrevistoValor'),
  resumoPrevistoQtd: document.getElementById('resumoPrevistoQtd'),
  resumoRealizadoValor: document.getElementById('resumoRealizadoValor'),
  resumoRealizadoQtd: document.getElementById('resumoRealizadoQtd'),
  resumoFichasQtd: document.getElementById('resumoFichasQtd'),
  resumoFichasValor: document.getElementById('resumoFichasValor'),
  tabelaDoadoresBody: document.getElementById('tabelaDoadoresBody'),
  btnPaginaAnterior: document.getElementById('btnPaginaAnterior'),
  btnProximaPagina: document.getElementById('btnProximaPagina'),
  infoPagina: document.getElementById('infoPagina'),
};

el.clienteBadge.textContent = CLIENTE;

const estado = { pagina: 1, totalPaginas: 1 };
let chartMensal;
let chartFichasNovas;

function primeiroDiaDoMesAtual() {
  const hoje = new Date();
  return new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function ultimoDiaDoMesAtual() {
  const hoje = new Date();
  return new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
}

function mostrarErro(mensagem) {
  el.avisoErro.textContent = mensagem;
  el.avisoErro.hidden = false;
}

function limparErro() {
  el.avisoErro.hidden = true;
  el.avisoErro.textContent = '';
}

function filtrosAtuais() {
  return {
    cliente: CLIENTE,
    dataIni: el.dataIni.value,
    dataFim: el.dataFim.value,
    tipoData: el.tipoData.value,
    operador: el.operador.value,
  };
}

async function buscarJson(caminho, params) {
  const url = new URL(caminho, window.location.origin);
  for (const [chave, valor] of Object.entries(params)) {
    if (valor) url.searchParams.set(chave, valor);
  }
  const resposta = await fetch(url);
  const json = await resposta.json();
  if (!resposta.ok) {
    throw new Error(json.erro || `Falha ao buscar ${caminho}`);
  }
  return json;
}

async function carregarOperadoras(filtros) {
  const operadoras = await buscarJson('/api/operadoras', { cliente: filtros.cliente, dataIni: filtros.dataIni, dataFim: filtros.dataFim });
  const selecaoAtual = el.operador.value;
  el.operador.innerHTML = '<option value="">Todas</option>';
  for (const op of operadoras) {
    const opt = document.createElement('option');
    opt.value = op.operador;
    opt.textContent = `${op.nome_operador || op.nome || op.operador} (${op.operador})`;
    el.operador.appendChild(opt);
  }
  el.operador.value = selecaoAtual;
}

function atualizarResumo(resumo, metrica) {
  el.resumoPrevistoValor.textContent = metrica === 'valor' ? formatoMoeda.format(resumo.previstoValor) : formatoNumero.format(resumo.previstoQtd);
  el.resumoPrevistoQtd.textContent =
    metrica === 'valor' ? `${formatoNumero.format(resumo.previstoQtd)} doações` : formatoMoeda.format(resumo.previstoValor);

  el.resumoRealizadoValor.textContent = metrica === 'valor' ? formatoMoeda.format(resumo.realizadoValor) : formatoNumero.format(resumo.realizadoQtd);
  el.resumoRealizadoQtd.textContent =
    metrica === 'valor' ? `${formatoNumero.format(resumo.realizadoQtd)} doações` : formatoMoeda.format(resumo.realizadoValor);

  if (resumo.fichasNovasDisponivel) {
    el.resumoFichasQtd.textContent = formatoNumero.format(resumo.fichasNovasQtd);
    el.resumoFichasValor.textContent = formatoMoeda.format(resumo.fichasNovasValor);
  } else {
    el.resumoFichasQtd.textContent = 'indisponível';
    el.resumoFichasValor.textContent = 'com filtro de operadora';
  }
}

function atualizarChartMensal(serie, metrica) {
  const labels = serie.map((s) => formatoMesLabel(s.mes));
  const previsto = serie.map((s) => (metrica === 'valor' ? s.previstoValor : s.previstoQtd));
  const realizado = serie.map((s) => (metrica === 'valor' ? s.realizadoValor : s.realizadoQtd));

  const dados = {
    labels,
    datasets: [
      { label: 'Previsto', data: previsto, borderColor: '#2563eb', backgroundColor: '#2563eb', tension: 0.25 },
      { label: 'Realizado', data: realizado, borderColor: '#0f766e', backgroundColor: '#0f766e', tension: 0.25 },
    ],
  };

  if (chartMensal) {
    chartMensal.data = dados;
    chartMensal.update();
    return;
  }

  chartMensal = new Chart(document.getElementById('chartMensal'), {
    type: 'line',
    data: dados,
    options: { responsive: true, scales: { y: { beginAtZero: true } } },
  });
}

function atualizarChartFichasNovas(serie) {
  const labels = serie.map((s) => formatoMesLabel(s.mes));
  const dados = {
    labels,
    datasets: [{ label: 'Fichas novas', data: serie.map((s) => s.fichasNovas), backgroundColor: '#0f766e' }],
  };

  if (chartFichasNovas) {
    chartFichasNovas.data = dados;
    chartFichasNovas.update();
    return;
  }

  chartFichasNovas = new Chart(document.getElementById('chartFichasNovas'), {
    type: 'bar',
    data: dados,
    options: { responsive: true, scales: { y: { beginAtZero: true } } },
  });
}

function formatarDataHora(valor) {
  if (!valor) return '—';
  return String(valor).slice(0, 10);
}

function renderizarTabelaDoadores(resultado) {
  el.tabelaDoadoresBody.innerHTML = '';
  if (!resultado.registros.length) {
    el.tabelaDoadoresBody.innerHTML = '<tr><td colspan="8" class="vazio">Nenhum registro para os filtros selecionados.</td></tr>';
  } else {
    for (const doacao of resultado.registros) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${doacao.nome ?? '—'}</td>
        <td>${doacao.contribuinte ?? '—'}</td>
        <td>${doacao.operador ?? '—'}</td>
        <td>${formatarDataHora(doacao.vencimento)}</td>
        <td>${formatoMoeda.format(Number(doacao.valor_previsto) || 0)}</td>
        <td>${formatarDataHora(doacao.pagamento)}</td>
        <td>${formatoMoeda.format(Number(doacao.valor_pago) || 0)}</td>
        <td>${doacao.status_doacao ?? '—'}</td>
      `;
      el.tabelaDoadoresBody.appendChild(tr);
    }
  }

  estado.pagina = resultado.pagina;
  estado.totalPaginas = resultado.totalPaginas;
  el.infoPagina.textContent = `página ${resultado.pagina} de ${resultado.totalPaginas} (${formatoNumero.format(resultado.totalRegistros)} registros)`;
  el.btnPaginaAnterior.disabled = resultado.pagina <= 1;
  el.btnProximaPagina.disabled = resultado.pagina >= resultado.totalPaginas;
}

async function carregarDoadores(filtros, pagina) {
  const resultado = await buscarJson('/api/doadores', { ...filtros, pagina });
  renderizarTabelaDoadores(resultado);
}

async function carregarPainel() {
  limparErro();
  const filtros = filtrosAtuais();
  if (!filtros.dataIni || !filtros.dataFim) {
    mostrarErro('Selecione o período (data inicial e final).');
    return;
  }

  const metrica = el.metrica.value;
  el.btnAplicar.disabled = true;
  el.avisoCarregando.hidden = false;
  try {
    await carregarOperadoras(filtros);
    const [resumo, serieMensal, serieFichasNovas] = await Promise.all([
      buscarJson('/api/resumo', filtros),
      buscarJson('/api/serie-mensal', filtros),
      buscarJson('/api/fichas-novas-serie', { cliente: filtros.cliente, dataIni: filtros.dataIni, dataFim: filtros.dataFim }),
    ]);

    atualizarResumo(resumo, metrica);
    atualizarChartMensal(serieMensal, metrica);
    atualizarChartFichasNovas(serieFichasNovas);
    await carregarDoadores(filtros, 1);
  } catch (err) {
    mostrarErro(err.message);
  } finally {
    el.btnAplicar.disabled = false;
    el.avisoCarregando.hidden = true;
  }
}

el.btnAplicar.addEventListener('click', carregarPainel);
el.metrica.addEventListener('change', carregarPainel);

el.btnPaginaAnterior.addEventListener('click', async () => {
  if (estado.pagina > 1) {
    try {
      await carregarDoadores(filtrosAtuais(), estado.pagina - 1);
    } catch (err) {
      mostrarErro(err.message);
    }
  }
});

el.btnProximaPagina.addEventListener('click', async () => {
  if (estado.pagina < estado.totalPaginas) {
    try {
      await carregarDoadores(filtrosAtuais(), estado.pagina + 1);
    } catch (err) {
      mostrarErro(err.message);
    }
  }
});

el.dataIni.value = primeiroDiaDoMesAtual();
el.dataFim.value = ultimoDiaDoMesAtual();
carregarPainel();
