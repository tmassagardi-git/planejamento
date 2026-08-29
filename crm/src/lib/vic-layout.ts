import { bubbleColor } from './vic-calc';

// Geometria do gráfico de bolhas da Matriz VIC — viewBox fixo 780x600,
// replicando o protótipo original (ver design_handoff_vic).
const SCALE = 5;
const px = (v: number) => 70 + (v / SCALE) * 660;
const py = (v: number) => 520 - (v / SCALE) * 490;

export interface BubbleInput {
  key: string;
  nome: string;
  v: number;
  i: number;
  c: number;
  total: number;
}

export interface Bubble {
  key: string;
  cx: number;
  cy: number;
  r: number;
  fill: string;
}

export interface BubbleLabel {
  key: string;
  nome: string;
  left: string;
  top: string;
  transform: string;
}

export interface Tick {
  label: string;
  pos: string;
}

export function computeBubbles(items: BubbleInput[], fator = 1): Bubble[] {
  return items.map((x) => ({
    key: x.key,
    cx: px(x.v),
    cy: py(x.i),
    r: 5 + (x.c / SCALE) * 26 * fator,
    fill: bubbleColor(x.total),
  }));
}

/** Posiciona os rótulos (nome da empresa) evitando sobreposição, maiores
 * notas primeiro. Rótulos ficam numa camada HTML sobre o SVG (não dentro
 * dele) para não encolher em telas menores — ver README do handoff. */
export function computeLabels(items: BubbleInput[], fator = 1, limiar = 7, mostrarTodos = false): BubbleLabel[] {
  const ocupados: { tx: number; ty: number }[] = [];
  const labels: BubbleLabel[] = [];

  items
    .filter((x) => mostrarTodos || x.total >= limiar)
    .slice()
    .sort((a, b) => b.total - a.total)
    .forEach((x) => {
      const raio = 5 + (x.c / SCALE) * 26 * fator;
      const largura = x.nome.length * 6.6;
      const cx = px(x.v);
      const cy = py(x.i);
      let tx = cx + raio + 6;
      let anchor: 'start' | 'end' = 'start';
      if (tx + largura > 726) {
        tx = cx - raio - 6;
        anchor = 'end';
      }
      if (anchor === 'end' && tx - largura < 74) {
        tx = cx + raio + 6;
        anchor = 'start';
      }
      let ty = cy - raio - 5;
      let tentativa = 0;
      while (
        ocupados.some((o) => Math.abs(o.ty - ty) < 14 && Math.abs(o.tx - tx) < largura + 40) &&
        tentativa < 14
      ) {
        tentativa += 1;
        ty = cy - raio - 5 + (tentativa % 2 === 1 ? 1 : -1) * Math.ceil(tentativa / 2) * 15;
      }
      ty = Math.max(44, Math.min(514, ty));
      ocupados.push({ tx, ty });
      labels.push({
        key: x.key,
        nome: x.nome,
        left: `${((tx / 780) * 100).toFixed(3)}%`,
        top: `${(((ty - 4) / 600) * 100).toFixed(3)}%`,
        transform: anchor === 'end' ? 'translate(-100%, -50%)' : 'translate(0, -50%)',
      });
    });

  return labels;
}

export function computeTicksX(): Tick[] {
  return [0, 1, 2, 3, 4, 5].map((n) => ({ label: String(n), pos: `${((px(n) / 780) * 100).toFixed(3)}%` }));
}

export function computeTicksY(): Tick[] {
  return [0, 1, 2, 3, 4, 5].map((n) => ({ label: String(n), pos: `${((py(n) / 600) * 100).toFixed(3)}%` }));
}
