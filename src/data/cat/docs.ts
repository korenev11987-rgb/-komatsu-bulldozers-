import type { ModelId, NodeId } from '../../types';
import type { ModelDocument } from '../docs';
import type { DocManualPages, ManualPageKind, ModelManualPages, NodeManualPages } from '../repair/manualPages';
import type { ManualDoc, ManualRef, RepairBlock, RepairBook, RepairLibrary, RepairSection } from '../repair/types';
import { CAT_D10T, CAT_D6R, CAT_D9R, CAT_FACTS } from './models';
import { CAT_PARTS, type CatPartGroup, type CatPartItem } from './partsCatalogs';
import { CAT_PARTS_IMAGES } from './partsImages';

const CAT_MODELS = { 'CAT-D10T': CAT_D10T, 'CAT-D9R': CAT_D9R, 'CAT-D6R': CAT_D6R } as const;

/*
 * Документы Caterpillar, приложенные к сайту.
 * Спецификации (Specalog) — официальные файлы Caterpillar из свободного доступа.
 * Каталоги запчастей (Parts Manual) — официальные файлы Caterpillar, предоставленные владельцем сайта:
 * D10T SEBP3655-44 (т. I–II), D9R SEBP4196, D6R Series III XEBP8580-01 и SEBP4457-00. На сайте они показываются
 * лентой страниц WebP (public/manuals/<feed>/), PDF не прикладываются. Разные каталоги и диапазоны серийных
 * номеров не объединяются: у каждой позиции в карточке указан каталог и диапазон.
 * Сервисные руководства (Operation & Maintenance Manual, Disassembly & Assembly) Caterpillar распространяет
 * только через Cat SIS (подписка, доступ у дилера) и publications.cat.com (платно); копии на сторонних сайтах
 * не являются легальными и не использовались. Поэтому разделы «Разборка» / «Сборка» — «данные из мануала не найдены».
 */

const SIS_NOTE =
  'Официальная спецификация Caterpillar (не сервисный мануал). Разборка/сборка, моменты затяжки — только в Cat SIS (подписка, доступ у дилера) / publications.cat.com (платно).';

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

/* ---------- Каталоги запчастей (Parts Manual): ленты страниц WebP ---------- */
interface PartsDocCfg {
  id: string;
  feed: string;
  model: ModelId;
  title: string;
  docNo: string;
  /** Код для ссылок «Parts Manual <code>, с. N (PDF стр. M)» */
  code: string;
  /** Машина и диапазон серийных номеров каталога — коротко, для пометки у каждого блока */
  range: string;
  /** Машина и диапазон серийных номеров каталога (как на обложке) */
  serial: string;
  note: string;
}

const PARTS_DOCS: PartsDocCfg[] = (
  [
    {
      id: 'CAT-D10T-PARTS',
      feed: 'cat-d10t-sebp3655',
      model: 'CAT-D10T',
      title: 'Parts Manual D10T Track-Type Tractor',
      docNo: 'SEBP3655-44 (03-2009), т. I–II',
      code: 'SEBP3655-44',
      range: 'D10T RJG1-Up',
      serial: 'D10T, S/N RJG1-Up (двигатель C27, EHX1-Up)',
      note: 'Официальный каталог запчастей Caterpillar (2 тома, 730 + 729 стр.; лента сквозная: т. II = стр. ленты 731–1459). Разборка/сборка и нормы времени в каталоге не приводятся (Cat SIS / Standard Job Times, доступ у дилера).',
    },
    {
      id: 'CAT-D9R-PARTS',
      feed: 'cat-d9r-sebp4196',
      model: 'CAT-D9R',
      title: 'Parts Manual D9R Track-Type Tractor',
      docNo: 'SEBP4196 (01-2005)',
      code: 'SEBP4196',
      range: 'D9R WDM1-Up',
      serial: 'D9R, S/N WDM1-Up (двигатель 3408C, 48W42331-Up)',
      note: 'Официальный каталог запчастей Caterpillar для D9R WDM1-Up (2005). Спецификация AEHQ6100 (2011) может описывать более позднее исполнение D9R — данные каталога и спецификации не смешиваются.',
    },
    {
      id: 'CAT-D6R-PARTS-XEBP8580',
      feed: 'cat-d6r-xebp8580',
      model: 'CAT-D6R',
      title: 'Parts Manual D6R Series III Track-Type Tractor',
      docNo: 'XEBP8580-01 (04-2009)',
      code: 'XEBP8580-01',
      range: 'D6R Series III, JEK00001-Up',
      serial: 'D6R Series III, S/N JEK00001-Up (двигатель C9 ACERT THX, КПП SCM, дифференциальный поворот)',
      note: 'Официальный каталог запчастей Caterpillar, D6R Series III JEK00001-Up. На схеме — Series II (Specalog AEHQ5437): данные серий не смешиваются; позиции каталога SEBP4457-00 (TBC/LFM) с этим каталогом не объединяются.',
    },
    {
      id: 'CAT-D6R-PARTS-SEBP4457',
      feed: 'cat-d6r-sebp4457',
      model: 'CAT-D6R',
      title: 'Parts Manual D6R Series III STD/XL Track-Type Tractor',
      docNo: 'SEBP4457-00 (12-2005)',
      code: 'SEBP4457-00',
      range: 'D6R Series III STD/XL, TBC1-Up / LFM1-Up',
      serial: 'D6R Series III STD/XL, S/N TBC1-Up, LFM1-Up (двигатель THY1-Up, КПП FTA1-Up)',
      note: 'Официальный каталог запчастей Caterpillar, D6R Series III STD/XL (TBC/LFM). На схеме — Series II (Specalog AEHQ5437): данные серий не смешиваются.',
    },
  ] as PartsDocCfg[]
).filter((d) => CAT_PARTS[d.feed] && CAT_PARTS_IMAGES.some((im) => im.doc === d.id));

/** Подписи страниц ленты каталога (печатные номера) */
const partsLabels = (d: PartsDocCfg): readonly string[] => CAT_PARTS_IMAGES.find((im) => im.doc === d.id)?.labels ?? [];

for (const d of PARTS_DOCS) {
  // url пустой: файл получен от владельца сайта (официальная копия Caterpillar), публичной ссылки нет
  CAT_MANUALS[d.id] = { id: d.id, title: d.title, model: d.serial, docNo: d.docNo, url: '', note: d.note };
}

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

/* ---------- Страницы для просмотра: спецификация — «Нормы»; каталоги запчастей — «Каталог» ---------- */
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

const CATALOG_KINDS: readonly ManualPageKind[] = ['catalog'];

/** Страницы каталога запчастей: по клику на узел — страница главной группы узла */
function partsPagesFor(d: PartsDocCfg): DocManualPages {
  const nodes: Partial<Record<NodeId, NodeManualPages>> = {};
  for (const [node, groups] of Object.entries(CAT_PARTS[d.feed].nodes) as [NodeId, CatPartGroup[]][]) {
    if (groups?.length) nodes[node] = { catalog: { pdfPage: groups[0].page, label: groups[0].label } };
  }
  return { doc: d.id, scope: d.serial, kinds: CATALOG_KINDS, nodes };
}

const partsOf = (id: ModelId) => PARTS_DOCS.filter((d) => d.model === id);

/** Основной документ по клику на узел — каталог запчастей (если есть); остальные каталоги и спецификации — в переключателе */
function modelPages(id: ModelId): ModelManualPages {
  const spec = pagesFor(id);
  const parts = partsOf(id).map(partsPagesFor);
  if (!parts.length) return spec;
  const [first, ...rest] = parts;
  return { ...first, extraDocs: [...rest, { doc: spec.doc, scope: spec.scope, nodes: spec.nodes }, ...(spec.extraDocs ?? [])] };
}

export const CAT_MANUAL_PAGES: Partial<Record<ModelId, ModelManualPages>> = {
  'CAT-D6R': modelPages('CAT-D6R'),
  'CAT-D9R': modelPages('CAT-D9R'),
  'CAT-D10T': modelPages('CAT-D10T'),
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

const itemLine = (i: CatPartItem): string => {
  const marks = [
    i.sn && `S/N ${i.sn}`,
    i.note?.includes('C') && 'C — изменение',
    i.note?.includes('R') && 'R — есть восстановленная (Reman)',
    i.see && `иллюстрация: с. ${i.see}`,
  ].filter(Boolean);
  const name = i.ru ? `${i.ru} (${i.en})` : i.en;
  return `${i.pn} — ${name} × ${i.qty}${marks.length ? ` · ${marks.join(' · ')}` : ''}`;
};

const pdfOf = (g: CatPartGroup) => `PDF стр. ${g.pdf}${g.vol ? `, т. ${g.vol}` : ''}`;

/** Ссылка на группу каталога: печатные страницы; стр. PDF совпадает со страницей ленты, кроме т. II каталога D10T */
const groupRef = (d: PartsDocCfg, g: CatPartGroup): ManualRef => {
  const labels = partsLabels(d);
  const last = g.pages[1] > g.pages[0] ? labels[g.pages[1] - 1] : '';
  const span = `${g.label}${last && last !== g.label ? `–${last}` : ''}`;
  return g.pdf === g.page
    ? { doc: d.id, section: `${g.pn} ${g.name}`, pages: span, pdfPage: g.page }
    : { doc: d.id, section: `${g.pn} ${g.name}`, pages: `${span} (${pdfOf(g)}; лента ${g.page})` };
};

/** Блоки по группам каталогов: каждая группа — свой каталог и свой диапазон серийных номеров, без объединения */
function partsBlocks(id: ModelId, node: NodeId): { blocks: RepairBlock[]; summary: string[]; refs: ManualRef[] } {
  const blocks: RepairBlock[] = [];
  const summary: string[] = [];
  const refs: ManualRef[] = [];
  for (const d of partsOf(id)) {
    const groups = CAT_PARTS[d.feed]?.nodes[node] ?? [];
    if (!groups.length) {
      summary.push(`Parts Manual ${d.code} (${d.serial}): группа узла — данные из мануала не найдены.`);
      continue;
    }
    summary.push(
      `Parts Manual ${d.code} (${d.serial}): ${groups.map((g) => `${g.pn} ${g.ru || g.name} — с. ${g.label} (${pdfOf(g)})`).join('; ')}.`,
    );
    refs.push(groupRef(d, groups[0]));
    for (const g of groups) {
      blocks.push({
        title: `${g.pn} ${g.ru ? `${g.ru} (${g.name})` : g.name}`,
        scope: `${d.code} · ${d.range}${g.sn ? ` · S/N группы: ${g.sn}` : ''}`,
        items: g.items.map(itemLine),
        source: [groupRef(d, g)],
        open: { doc: d.id, label: g.label, pdfPage: g.page },
      });
    }
  }
  return { blocks, summary, refs };
}

/** Чем спецификация отличается от каталогов — показывается в заголовке блока «Из спецификации» */
const SPEC_TITLE: Record<string, string> = {
  'CAT-D10T': 'Из спецификации Specalog AEHQ6029 (D10T)',
  'CAT-D9R': 'Из спецификации Specalog AEHQ6100 (2011) — может относиться к другому исполнению, чем каталог WDM1-Up',
  'CAT-D6R': 'Из спецификации Specalog AEHQ5437 — D6R Series II, не Series III из каталогов',
};

/** Узлы, для которых в каталоге нет отдельной группы — пояснение */
const PARTS_GAPS: Record<string, Partial<Record<NodeId, string>>> = {
  'CAT-D9R': {
    controllers:
      'Parts Manual SEBP4196 (D9R WDM1-Up, двигатель 3408C): группы электронного блока управления (ECM) в каталоге нет — данные из мануала не найдены. Подачей топлива управляет регулятор: GOVERNOR GP 4W-6013 (с. 142, PDF стр. 282) и CONTROL GP-GOVERNOR 6Y-7668 (с. 129, PDF стр. 269); электрика машины — в группах жгутов и приборов.',
  },
};

function bookFor(id: ModelId): RepairBook {
  const f = CAT_FACTS[id as keyof typeof CAT_FACTS];
  const doc = MODEL_DOC(id);
  const m = CAT_MODELS[id as keyof typeof CAT_MODELS];
  const book: RepairBook = {};
  for (const [node, pg] of Object.entries(f.map) as [NodeId, number][]) {
    const caps = CAPS[id]?.[node];
    const specItems = pg > 0 ? [m.nodes[node].description.replace(/ \([^()]*с\. [\d, ]+\)/g, ''), ...m.nodes[node].parts.filter((p) => !/не найдены/.test(p.note)).map((p) => `${p.name}: ${p.note}`)] : [];
    const parts = partsBlocks(id, node);
    const gap = PARTS_DOCS.some((d) => d.model === id) ? PARTS_GAPS[id]?.[node] : undefined;
    let components: RepairSection | null = null;
    if (parts.blocks.length) {
      components = {
        status: 'manual',
        items: [...parts.summary, ...(gap ? [gap] : [])],
        source: parts.refs,
        scope: 'по официальным Parts Manual Caterpillar; каталоги и диапазоны серийных номеров не объединяются',
        blocks: parts.blocks,
        ...(specItems.length ? { extra: { title: SPEC_TITLE[id], items: specItems, source: [ref(doc, 'спецификация', pg)] } } : {}),
      };
    } else if (specItems.length) {
      components = { ...sec([...specItems, ...(gap ? [gap] : parts.summary)], [ref(doc, 'спецификация', pg)]) };
    }
    if (!components && !caps) continue;
    book[node] = {
      ...(components ? { components } : {}),
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
