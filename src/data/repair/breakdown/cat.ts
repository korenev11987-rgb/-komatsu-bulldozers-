import type { ModelId, NodeId } from '../../../types';
import type { BreakdownRef, PartBreakdownData } from '../types';

/*
 * Разбор по узлам Caterpillar — только массы из официальных спецификаций (Specalog), с разделом и страницей.
 * Спецоснастка с номерами Cat, бригада и нормы времени в открытых документах не найдены:
 * они в Cat SIS (Disassembly & Assembly, Standard Job Times) — доступ у дилера по подписке.
 */
const MISSING = 'Cat SIS / Standard Job Times, доступ у дилера';
interface Src {
  ref: BreakdownRef;
  section: string;
}
interface W {
  part: string;
  kg: number;
  note?: string;
  /** Индекс источника в списке (по умолчанию 0) */
  src?: number;
}
const r = (doc: string, section: string, page: number): Src => ({ ref: { doc, label: String(page), pdfPage: page }, section });
const kg = (v: number) => v.toLocaleString('ru-RU').replace(/\u00a0/g, ' ');
const bd = (weights: W[], source: Src[]): PartBreakdownData => ({
  tools: [],
  equipment: [],
  weights: weights.map((w) => {
    const s = source[w.src ?? 0];
    return { name: w.part, kg: kg(w.kg), note: [w.note, `раздел «${s.section}»`].filter(Boolean).join('; '), ref: s.ref };
  }),
  crew: [],
  time: [],
  scope: 'официальная спецификация Caterpillar (Specalog), не сервисный мануал',
  missingNote: MISSING,
});

/** Узел Cat без данных в спецификации */
export const CAT_EMPTY: PartBreakdownData = { ...bd([], []), scope: 'официальная спецификация Caterpillar (Specalog), не сервисный мануал' };

const D10 = 'CAT-D10T-SPEC';
const D9 = 'CAT-D9R-SPEC';
const D6 = 'CAT-D6R-SPEC';

export const CAT_BREAKDOWN: Partial<Record<ModelId, Partial<Record<NodeId, PartBreakdownData>>>> = {
  'CAT-D10T': {
    blade: bd(
      [
        { part: 'Отвал 10SU', kg: 10229, note: 'без гидроуправления' },
        { part: 'Отвал 10U', kg: 10784, note: 'без гидроуправления' },
        { part: 'Абразивостойкая облицовка (ABR) 10SU', kg: 840 },
        { part: 'Абразивостойкая облицовка (ABR) 10U', kg: 1629 },
      ],
      [r(D10, 'Bulldozer Blades', 13)],
    ),
    ripper: bd(
      [
        { part: 'Рыхлитель одностоечный', kg: 7117, note: 'без гидроуправления' },
        { part: 'Рыхлитель многостоечный (одна стойка)', kg: 7968, note: 'без гидроуправления' },
        { part: 'Каждая дополнительная стойка', kg: 526.2 },
      ],
      [r(D10, 'Rippers', 13)],
    ),
  },
  'CAT-D9R': {
    blade: bd(
      [
        { part: 'Отвал 9SU', kg: 6543, note: 'без гидроуправления' },
        { part: 'Отвал 9U', kg: 7134, note: 'без гидроуправления' },
      ],
      [r(D9, 'Bulldozer Blades', 15)],
    ),
    ripper: bd(
      [
        { part: 'Рыхлитель одностоечный', kg: 4854, note: 'без гидроуправления' },
        { part: 'Рыхлитель многостоечный (одна стойка)', kg: 5449, note: 'без гидроуправления' },
      ],
      [r(D9, 'Rippers', 15)],
    ),
  },
  'CAT-D6R': {
    blade: bd([{ part: 'Отвал SU (STD)', kg: 2699, note: 'с толкающими брусьями, цилиндром перекоса, ножами и крепежом' }], [r(D6, 'Bulldozers', 19)]),
    ripper: bd(
      [
        { part: 'Рыхлитель многостоечный (одна стойка)', kg: 1634 },
        { part: 'Каждая дополнительная стойка', kg: 74, src: 1 },
      ],
      [r(D6, 'Multi-Shank Ripper', 17), r(D6, 'Optional Equipment', 22)],
    ),
    ripperCylinders: bd([{ part: 'Гидравлика рыхлителя', kg: 46, note: 'изменение эксплуатационной массы' }], [r(D6, 'Optional Equipment', 22)]),
    carrierRollers: bd([{ part: 'Поддерживающие катки для STD', kg: 156, note: 'изменение эксплуатационной массы' }], [r(D6, 'Optional Equipment', 22)]),
    alternator: bd(
      [
        { part: 'Генератор 75 А (опция)', kg: 13, note: 'изменение эксплуатационной массы' },
        { part: 'Генератор 100 А (опция)', kg: 14, note: 'изменение эксплуатационной массы' },
      ],
      [r(D6, 'Optional Equipment', 22)],
    ),
    batteries: bd([{ part: 'АКБ повышенной ёмкости (HD)', kg: 33, note: 'изменение эксплуатационной массы' }], [r(D6, 'Optional Equipment', 22)]),
    lights: bd([{ part: 'Фары (4 шт.)', kg: 13, note: 'изменение эксплуатационной массы' }], [r(D6, 'Optional Equipment', 22)]),
  },
};
