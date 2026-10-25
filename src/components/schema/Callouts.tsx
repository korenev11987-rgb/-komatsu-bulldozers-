import { VIEWBOX } from '../../data/layout';

export interface CalloutItem {
  key: string;
  text: string;
  /** Точка выноски уже в координатах viewBox (после масштабирования) */
  ax: number;
  ay: number;
  side: 'top' | 'bottom';
  color?: string;
  /** Пассивная подпись (не узел) */
  passive?: boolean;
}

export interface PlacedCallout extends CalloutItem {
  x: number;
  y: number;
  w: number;
}

const ROWS = { top: [26, 54, 82], bottom: [584, 612, 640] } as const;
const H = 20;
const GAP = 8;
const textWidth = (t: string, passive?: boolean) => t.length * (passive ? 6.3 : 7.2) + (passive ? 14 : 28);

/** Простая раскладка подписей по рядам без наложений */
export function placeCallouts(items: CalloutItem[]): PlacedCallout[] {
  const out: PlacedCallout[] = [];
  for (const side of ['top', 'bottom'] as const) {
    const rows = side === 'top' ? [...ROWS.top].reverse() : [...ROWS.bottom];
    const rightEdge = rows.map(() => -Infinity);
    const list = items.filter((i) => i.side === side).sort((a, b) => a.ax - b.ax);
    for (const it of list) {
      const w = textWidth(it.text, it.passive);
      const ideal = Math.min(Math.max(it.ax - w / 2, 6), VIEWBOX.width - w - 6);
      let best = 0;
      let bestX = Infinity;
      let bestCost = Infinity;
      rows.forEach((_, r) => {
        const x = Math.max(ideal, rightEdge[r] + GAP);
        const cost = x - ideal + r * 18 + (x + w > VIEWBOX.width - 4 ? 1000 : 0);
        if (cost < bestCost) {
          bestCost = cost;
          best = r;
          bestX = x;
        }
      });
      rightEdge[best] = bestX + w;
      out.push({ ...it, x: bestX, y: rows[best], w });
    }
  }
  return out;
}

export const CALLOUT_H = H;
