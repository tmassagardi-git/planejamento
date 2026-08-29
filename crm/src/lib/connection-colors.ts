// Paleta categórica (mesma usada nos gráficos do Dashboard) aplicada aos
// tipos de conexão do mapa de relacionamento. Como a lista de tipos é
// editável pelo usuário, a cor é escolhida por hash do texto — determinística
// e sem precisar de configuração extra por tipo.
const PALETTE = [
  '#2a78d6', // azul
  '#eb6834', // laranja
  '#1baf7a', // água
  '#eda100', // amarelo
  '#e87ba4', // magenta
  '#008300', // verde
  '#4a3aa7', // violeta
  '#e34948', // vermelho
];

export function colorForConnectionType(tipo: string): string {
  let hash = 0;
  for (let i = 0; i < tipo.length; i++) {
    hash = (hash * 31 + tipo.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
