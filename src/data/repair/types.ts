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

/** Блок секции из конкретного документа: например, группа каталога запчастей со своим диапазоном серийных номеров */
export interface RepairBlock extends RepairExtra {
  /** Видимая пометка: документ и диапазон серийных номеров */
  scope?: string;
  /** Открыть полный список в просмотре: документ, печатная страница и страница ленты */
  open?: BreakdownRef;
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
      /** Блоки из отдельных документов (каждый со своим источником; данные блоков не объединяются) */
      blocks?: RepairBlock[];
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

/* ───────── Разбор узла: люди · время · инструмент ─────────
 * Общая типизированная форма, не привязанная к конкретному производителю:
 * ключи узлов — строки, документ — id из реестра документов (MANUALS или аналог).
 * Каждое значение — только из мануала, со ссылкой на документ, страницу мануала и страницу PDF.
 */

/** Место в документе, откуда взято значение разбора */
export interface BreakdownRef {
  /** id документа в реестре */
  doc: string;
  /** Страница по нумерации мануала (колонтитул), например «30-15» */
  label: string;
  /** Номер страницы в PDF-файле (1…N) */
  pdfPage: number;
}

/** Специальный инструмент из таблицы мануала */
export interface BreakdownTool {
  /** Обозначение в таблице мануала (например «R3», «A»), если есть */
  sym?: string;
  /** Номер позиции внутри обозначения, если есть */
  pos?: string;
  /** Номер детали Komatsu — как напечатан */
  partNo: string;
  name: string;
  qty?: string;
  /** Работа, для которой инструмент указан */
  work: string;
  /** Примечание из таблицы */
  note?: string;
  ref: BreakdownRef;
}

/** Стандартное оборудование (кран, таль, домкрат, трос…) — с цитатой из мануала */
export interface BreakdownEquipment {
  name: string;
  /** Цитата из текста мануала, где оборудование названо */
  quote: string;
  /** Общее указание документа, не относящееся к конкретному узлу */
  general?: boolean;
  /** Перевод с английского (если цитата переведена) */
  translated?: boolean;
  ref: BreakdownRef;
}

/** Масса детали — как указана в мануале (знак груза «кг») */
export interface BreakdownWeight {
  name: string;
  /** Значение в кг, как напечатано (может содержать пояснение: «30 (каждая)») */
  kg: string;
  note?: string;
  ref: BreakdownRef;
}

/** Явно указанное в мануале значение (исполнители, время) */
export interface BreakdownStated {
  text: string;
  ref: BreakdownRef;
}

export interface PartBreakdownData {
  tools: BreakdownTool[];
  equipment: BreakdownEquipment[];
  weights: BreakdownWeight[];
  /** Исполнители — только если указаны в мануале */
  crew: BreakdownStated[];
  /** Время/трудоёмкость — только если указаны в мануале */
  time: BreakdownStated[];
  /** К какой модели/документу относятся данные */
  scope?: string;
  /** Где искать то, чего нет в документах (например, «Cat SIS / Standard Job Times») */
  missingNote?: string;
}

export type BreakdownBook = Record<string, PartBreakdownData>;

export const EMPTY_BREAKDOWN: PartBreakdownData = { tools: [], equipment: [], weights: [], crew: [], time: [] };
