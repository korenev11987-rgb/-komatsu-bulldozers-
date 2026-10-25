import type { ModelId, NodeId } from '../../types';

/** Опубликованный документ Komatsu, из которого взяты данные */
export interface ManualDoc {
  id: string;
  /** Название документа, как на обложке */
  title: string;
  /** Модель и диапазон серийных номеров, как на обложке */
  model: string;
  /** Номер документа Komatsu (если указан) */
  docNo?: string;
  /** Где документ был прочитан */
  url: string;
  /** Пояснение: например, «другое поколение модели» */
  note?: string;
}

/** Ссылка на конкретное место в мануале */
export interface ManualRef {
  doc: string;
  /** Раздел мануала (заголовок как в документе) */
  section: string;
  /** Страница(ы) по нумерации мануала, например «4-23…4-25» */
  pages: string;
}

/** Секция карточки: данные из мануала или явная отметка об их отсутствии */
export type RepairSection =
  | { status: 'manual'; items: string[]; source: ManualRef[] }
  | { status: 'not-found' };

export type SectionKey = 'components' | 'disassembly' | 'assembly' | 'repair';

export type RepairCard = Record<SectionKey, RepairSection>;

export type RepairBook = Partial<Record<NodeId, Partial<RepairCard>>>;

export type RepairLibrary = Partial<Record<ModelId, RepairBook>>;

export const NOT_FOUND: RepairSection = { status: 'not-found' };
