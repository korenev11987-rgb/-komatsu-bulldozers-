import type { ModelId, NodeId } from '../../../types';
import { EMPTY_BREAKDOWN, type BreakdownBook, type PartBreakdownData } from '../types';
import { D155_BREAKDOWN } from './d155';
import { D355_BREAKDOWN } from './d355';
import { D475_BREAKDOWN } from './d475';
import { CAT_BREAKDOWN, CAT_EMPTY } from './cat';

/** Разбор узлов по моделям. Модели без мануала — пустой разбор (всё «данные из мануала не найдены»). */
export const BREAKDOWNS: Partial<Record<ModelId, BreakdownBook>> = {
  D155: D155_BREAKDOWN,
  D355: D355_BREAKDOWN,
  D475: D475_BREAKDOWN,
  ...(CAT_BREAKDOWN as Partial<Record<ModelId, BreakdownBook>>),
};

export function getBreakdown(model: ModelId, node: NodeId): PartBreakdownData {
  return BREAKDOWNS[model]?.[node] ?? (model.startsWith('CAT-') ? CAT_EMPTY : EMPTY_BREAKDOWN);
}
