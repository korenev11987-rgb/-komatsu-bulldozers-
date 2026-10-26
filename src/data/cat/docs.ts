import type { ModelId, NodeId } from '../../types';
import type { ModelDocument } from '../docs';
import type { ModelManualPages, NodeManualPages } from '../repair/manualPages';
import type { ManualDoc, ManualRef, RepairBook, RepairLibrary, RepairSection } from '../repair/types';
import { CAT_D10T, CAT_D6R, CAT_D9R, CAT_FACTS } from './models';

const CAT_MODELS = { 'CAT-D10T': CAT_D10T, 'CAT-D9R': CAT_D9R, 'CAT-D6R': CAT_D6R } as const;

/*
 * Документы Caterpillar, приложенные к сайту.
 * Найдены в свободном доступе только официальные спецификации (Specalog) — они и приложены.
 * Полные сервисные руководства (Operation & Maintenance Manual, Disassembly & Assembly, Parts Manual)
 * Caterpillar распространяет только через Cat SIS (подписка, доступ у дилера) и publications.cat.com (платно);
 * копии на сторонних сайтах не являются легальными и не использовались.
 * Поэтому у карточек Cat разделы «Разборка» / «Сборка» — «данные из мануала не найдены».
 */

const SIS_NOTE =
  'Официальная спецификация Caterpillar (не сервисный мануал). Разборка/сборка, моменты затяжки, каталожные номера — только в Cat SIS (подписка, доступ у дилера) / publications.cat.com (платно).';

export const CAT_MANUALS: Record<string, ManualDoc> = {
  'CAT-D10T-SPEC': {
    id: 'CAT-D10T-SPEC',
    title: 'D10T Track-Type Tractor (Specalog)',
    model: 'Cat D10T, двигатель C27 ACERT',
    docNo: 'AEHQ6029 (01-2010)',
    url: 'https://s7d2.scene7.com/is/content/Caterpillar/C574378',
    note: SIS_NOTE,
    file: 'manuals/cat/cat-d10t-aehq6029.pdf',
  },
  'CAT-D10T-SPEC-RU': {
    id: 'CAT-D10T-SPEC-RU',
    title: 'Гусеничный трактор D10T (технические характеристики)',
    model: 'Cat D10T, двигатель C27 ACERT',
    docNo: 'ARHQ6029 (05-2010), заменяет AEHQ5592-01',
    url: 'https://mining.tcgc.ru/assets/files/D10T_rus.pdf',
    note: 'Русское издание спецификации Caterpillar (та же структура страниц, что AEHQ6029). ' + SIS_NOTE,
    file: 'manuals/cat/cat-d10t-arhq6029-ru.pdf',
  },
  'CAT-D9R-SPEC': {
    id: 'CAT-D9R-SPEC',
    title: 'D9R Track-Type Tractor (Specalog)',
    model: 'Cat D9R, двигатель 3408C',
    docNo: 'AEHQ6100-00 (2011)',
    url: 'https://s7d2.scene7.com/is/content/Caterpillar/C646209',
    note: SIS_NOTE,
    file: 'manuals/cat/cat-d9r-aehq6100.pdf',
  },
  'CAT-D6R-SPEC': {
    id: 'CAT-D6R-SPEC',
    title: 'D6R Series II Track-Type Tractor (Specalog)',
    model: 'Cat D6R Series II, двигатель C9',
    docNo: 'AEHQ5437 (08-02)',
    url: 'https://s7d2.scene7.com/is/content/Caterpillar/C199010',
    note: SIS_NOTE,
    file: 'manuals/cat/cat-d6r2-aehq5437.pdf',
  },
};

/** Полистраничная лента (WebP) каждого документа: public/manuals/<feedId>/pNNN.webp + manifest.json */
export const CAT_PAGE_FEEDS: Record<string, { feedId: string; pageCount: number }> = {
  'CAT-D10T-SPEC': { feedId: 'cat-d10t-aehq6029', pageCount: 20 },
  'CAT-D10T-SPEC-RU': { feedId: 'cat-d10t-arhq6029-ru', pageCount: 20 },
  'CAT-D9R-SPEC': { feedId: 'cat-d9r-aehq6100', pageCount: 20 },
  'CAT-D6R-SPEC': { feedId: 'cat-d6r2-aehq5437', pageCount: 24 },
};

const MODEL_DOC = (id: ModelId): string => (id === 'CAT-D10T' ? 'CAT-D10T-SPEC' : id === 'CAT-D9R' ? 'CAT-D9R-SPEC' : 'CAT-D6R-SPEC');
/** Документ, открываемый в просмотре по клику на узел (для D10T — русское издание) */
const VIEW_DOC = (id: ModelId): string => (id === 'CAT-D10T' ? 'CAT-D10T-SPEC-RU' : MODEL_DOC(id));

const asDoc = (d: ManualDoc, label: string): ModelDocument => ({
  id: d.id.toLowerCase(),
  label,
  file: d.file!,
  docNo: d.docNo ?? '',
  model: d.model,
  sourceUrl: d.url,
  sourceLabel: 'официальный файл Caterpillar',
  note: d.note ?? '',
});

export const CAT_MODEL_DOCS: Partial<Record<ModelId, ModelDocument[]>> = {
  'CAT-D10T': [
    asDoc(CAT_MANUALS['CAT-D10T-SPEC-RU'], 'Спецификация D10T (RU, ARHQ6029, 20 стр.)'),
    asDoc(CAT_MANUALS['CAT-D10T-SPEC'], 'Specalog D10T (EN, AEHQ6029, 20 стр.)'),
  ],
  'CAT-D9R': [asDoc(CAT_MANUALS['CAT-D9R-SPEC'], 'Specalog D9R (EN, AEHQ6100-00, 20 стр.)')],
  'CAT-D6R': [asDoc(CAT_MANUALS['CAT-D6R-SPEC'], 'Specalog D6R Series II (EN, AEHQ5437, 24 стр.)')],
};

/* ---------- Страницы для просмотра: только «Нормы» (страница спецификации с данными узла) ---------- */
function pagesFor(id: ModelId): ModelManualPages {
  const f = CAT_FACTS[id as keyof typeof CAT_FACTS];
  const nodes: Partial<Record<NodeId, NodeManualPages>> = {};
  for (const [node, pg] of Object.entries(f.map) as [NodeId, number][]) {
    if (pg > 0) nodes[node] = { specs: { pdfPage: pg, label: String(pg) } };
  }
  return {
    doc: VIEW_DOC(id),
    pageLabel: (n) => String(n),
    scope: 'спецификация Caterpillar (Specalog), не сервисный мануал',
    nodes,
    // D10T: английское издание AEHQ6029 — та же структура страниц, что русское ARHQ6029
    extraDocs: id === 'CAT-D10T' ? [{ doc: MODEL_DOC(id), scope: 'Specalog EN, та же нумерация страниц', nodes }] : undefined,
  };
}

export const CAT_MANUAL_PAGES: Partial<Record<ModelId, ModelManualPages>> = {
  'CAT-D6R': pagesFor('CAT-D6R'),
  'CAT-D9R': pagesFor('CAT-D9R'),
  'CAT-D10T': pagesFor('CAT-D10T'),
};

/* ---------- Карточки «Состав» и «Ремонт и ТО» по спецификациям ---------- */
const ref = (doc: string, section: string, page: number): ManualRef => ({ doc, section, pages: String(page), pdfPage: page });
const sec = (items: string[], source: ManualRef[]): RepairSection => ({ status: 'manual', items, source, scope: 'по официальной спецификации Caterpillar (Specalog), не по сервисному мануалу' });

/** Заправочные объёмы (Service Refill Capacities) — таблица на странице specs */
const CAPS: Record<string, Partial<Record<NodeId, string[]>>> = {
  'CAT-D10T': {
    engine: ['Картер двигателя (с фильтрами): 76 л', 'Топливный бак: 1204 л'],
    cooling: ['Система охлаждения: 151 л'],
    gearbox: ['Силовая передача: 193 л'], torqueConverter: ['Силовая передача: 193 л'], steering: ['Силовая передача: 193 л'],
    finalDrive: ['Бортовые редукторы: 23 л (каждый)'],
    trackFrame: ['Рамы катков: 64 л (каждая)', 'Ось качания: 33 л'],
    pumps: ['Гидробак: 144 л'],
  },
  'CAT-D9R': {
    engine: ['Картер двигателя (с фильтрами): 45,5 л', 'Топливный бак: 889 л'],
    cooling: ['Система охлаждения: 125 л'],
    gearbox: ['Силовая передача: 164 л'], torqueConverter: ['Силовая передача: 164 л'], steering: ['Силовая передача: 164 л'],
    finalDrive: ['Бортовые редукторы: 15 л (каждый)'],
    trackFrame: ['Рамы катков: 45 л (каждая)', 'Ось качания: 30 л'],
    pumps: ['Гидробак: 77,2 л'],
  },
  'CAT-D6R': {
    engine: ['Картер двигателя: 28 л', 'Топливный бак: 382,3 л'],
    cooling: ['Система охлаждения: 76,8 л'],
    gearbox: ['Силовая передача: 145,7 л'], torqueConverter: ['Силовая передача: 145,7 л'], steering: ['Силовая передача: 145,7 л'],
    finalDrive: ['Бортовые редукторы: 13,6 л (каждый)'],
    trackFrame: ['Рамы катков: 24,6 л (каждая)', 'Отсек оси качания: 1,9 л'],
    pumps: ['Гидробак: 47,3 л'],
  },
};

function bookFor(id: ModelId): RepairBook {
  const f = CAT_FACTS[id as keyof typeof CAT_FACTS];
  const doc = MODEL_DOC(id);
  const m = CAT_MODELS[id as keyof typeof CAT_MODELS];
  const book: RepairBook = {};
  for (const [node, pg] of Object.entries(f.map) as [NodeId, number][]) {
    if (!(pg > 0)) continue;
    const caps = CAPS[id]?.[node];
    book[node] = {
      components: sec([m.nodes[node].description.replace(/ \([^()]*с\. [\d, ]+\)/g, ''), ...m.nodes[node].parts.filter((p) => !/не найдены/.test(p.note)).map((p) => `${p.name}: ${p.note}`)], [ref(doc, 'спецификация', pg)]),
      ...(caps ? { repair: sec([...caps, 'Интервалы и процедуры ТО — в Operation & Maintenance Manual (Cat SIS / publications.cat.com); в открытом доступе не найдены.'], [ref(doc, 'Service Refill Capacities', f.pg.specs)]) } : {}),
    };
  }
  return book;
}

export const CAT_REPAIR: RepairLibrary = {
  'CAT-D6R': bookFor('CAT-D6R'),
  'CAT-D9R': bookFor('CAT-D9R'),
  'CAT-D10T': bookFor('CAT-D10T'),
};
