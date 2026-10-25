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
  /** PDF, приложенный к сайту: путь внутри public/ (без ведущего «/»); ссылки строятся как file#page=N */
  file?: string;
}

/** Ссылка на конкретное место в мануале */
export interface ManualRef {
  doc: string;
  /** Раздел мануала (заголовок как в документе) */
  section: string;
  /** Страница(ы) по нумерации мануала, например «4-23…4-25» */
  pages: string;
  /** Номер страницы в PDF-файле (если документ приложен к сайту) */
  pdfPage?: number;
}

/** Дополнительный блок данных из другого документа внутри секции */
export interface RepairExtra {
  title: string;
  items: string[];
  source: ManualRef[];
}

/** Секция карточки: данные из мануала или явная отметка об их отсутствии */
export type RepairSection =
  | {
      status: 'manual';
      items: string[];
      source: ManualRef[];
      /** Видимая пометка, к какой модели относятся данные */
      scope?: string;
      /** Дополнительные сведения из другого документа (отдельный источник) */
      extra?: RepairExtra;
    }
  | { status: 'not-found' };

export type SectionKey = 'components' | 'disassembly' | 'assembly' | 'repair';

export type RepairCard = Record<SectionKey, RepairSection>;

export type RepairBook = Partial<Record<NodeId, Partial<RepairCard>>>;

export type RepairLibrary = Partial<Record<ModelId, RepairBook>>;

export const NOT_FOUND: RepairSection = { status: 'not-found' };

/** URL страницы приложенного PDF (или null, если документ не приложен) */
export function manualPageUrl(doc: ManualDoc, pdfPage?: number): string | null {
  if (!doc.file) return null;
  return `${import.meta.env.BASE_URL}${doc.file}${pdfPage ? `#page=${pdfPage}` : ''}`;
}
