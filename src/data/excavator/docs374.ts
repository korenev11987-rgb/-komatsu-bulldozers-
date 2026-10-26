import type { AnyNodeId, ModelId } from '../../types';
import type { ModelDocument } from '../docs';
import type { ModelManualPages, NodeManualPages } from '../repair/manualPages';
import type { PageImageSet } from '../repair/manualImages';
import type { BreakdownBook, BreakdownRef, ManualDoc, ManualRef, PartBreakdownData, RepairBlock, RepairBook, RepairLibrary, RepairSection } from '../repair/types';
import { CAT_374DL, EXC_NODE_ORDER, HEHH, SEBP, SPEC_PAGE, groupPages, groupTitle } from './cat374dl';
import { SEBP5244_GROUPS, type CatalogGroup } from './catalog374.gen';
import { CAT_374DL_PM_IMAGES, CAT_374DL_SPEC_IMAGES } from './images374';

/*
 * Регистрация документов экскаватора Cat 374D L в общих реестрах (manuals, изображения страниц,
 * страницы узлов, карточки, разбор, документы модели). Общие файлы только подключают эти объекты.
 */

export const EXC_MANUALS: Record<string, ManualDoc> = {
  [SEBP]: {
    id: SEBP,
    title: 'Parts Manual 374D L Excavator',
    model: 'Cat 374D L, с/н PAS1-Up; двигатель C15 LHX1-Up',
    docNo: 'SEBP5244 (April 2010)',
    url: '',
    note: 'Официальный каталог запчастей Caterpillar (файл предоставлен владельцем сайта; на сайте — постраничная лента и перевод). Разборка/сборка и моменты затяжки в каталоге не приводятся — они в Cat SIS (Disassembly & Assembly).',
  },
  [HEHH]: {
    id: HEHH,
    title: '374D L Hydraulic Excavator (Specalog)',
    model: 'Cat 374D L, двигатель C15 ACERT',
    docNo: 'HEHH4376-02',
    url: 'https://s7d2.scene7.com/is/content/Caterpillar/C633458',
    note: 'Официальная спецификация Caterpillar (не сервисный мануал).',
    file: 'manuals/cat/cat-374dl-hehh4376.pdf',
  },
};

export const EXC_PAGE_IMAGE_SETS: Record<string, PageImageSet> = {
  [CAT_374DL_PM_IMAGES.doc]: CAT_374DL_PM_IMAGES,
  [CAT_374DL_SPEC_IMAGES.doc]: CAT_374DL_SPEC_IMAGES,
};

export const EXC_MODEL_DOCS: Partial<Record<ModelId, ModelDocument[]>> = {
  'CAT-374DL': [
    {
      id: 'cat-374dl-spec',
      label: 'Specalog 374D L (EN, HEHH4376-02, 28 стр.)',
      file: EXC_MANUALS[HEHH].file!,
      docNo: 'HEHH4376-02',
      model: EXC_MANUALS[HEHH].model,
      sourceUrl: EXC_MANUALS[HEHH].url,
      sourceLabel: 'официальный файл Caterpillar',
      note: EXC_MANUALS[HEHH].note ?? '',
    },
  ],
};

/* ---------- Страницы узлов: «Каталог» (SEBP5244) и «Нормы» (HEHH4376-02) ---------- */
const partsNodes: Partial<Record<AnyNodeId, NodeManualPages>> = {};
const specNodes: Partial<Record<AnyNodeId, NodeManualPages>> = {};
for (const id of EXC_NODE_ORDER) {
  const g = SEBP5244_GROUPS[id]?.[0];
  if (g) partsNodes[id] = { catalog: { pdfPage: g.pdf, label: g.label } };
  const sp = SPEC_PAGE[id];
  if (sp > 0) specNodes[id] = { specs: { pdfPage: sp, label: String(sp) } };
}

export const EXC_MANUAL_PAGES: Partial<Record<ModelId, ModelManualPages>> = {
  'CAT-374DL': {
    doc: SEBP,
    pageLabel: (n) => CAT_374DL_PM_IMAGES.labels[n - 1] || undefined,
    scope: 'каталог запчастей 374D L (PAS1-Up), апрель 2010',
    kinds: ['catalog'],
    nodes: partsNodes,
    extraDocs: [{ doc: HEHH, scope: 'спецификация Caterpillar (Specalog), не сервисный мануал', kinds: ['specs'], nodes: specNodes }],
  },
};

/* ---------- Карточки ---------- */
const ref = (doc: string, section: string, pages: string, pdfPage: number): ManualRef => ({ doc, section, pages, pdfPage });

/** Заправочные объёмы — HEHH4376-02, с. 17 (Service Refill Capacities) */
const CAPS: Partial<Record<AnyNodeId, string[]>> = {
  engine: ['Моторное масло: 65 л', 'Топливный бак: 935 л'],
  cooling: ['Система охлаждения: 95 л'],
  swingDrive: ['Редуктор поворота: 12 л (каждый)'],
  finalDrive: ['Бортовой редуктор: 15 л (каждый)'],
  hydTank: ['Гидробак: 360 л', 'Масло гидросистемы: 705 л'],
  pumps: ['Масло гидросистемы: 705 л'],
};

/** Блок «Состав» по группе каталога (как у каталогов бульдозеров Cat): P/N, кол-во, RU (EN) и кнопка на страницу группы */
const block = (g: CatalogGroup): RepairBlock => ({
  title: `${g.pn} ${g.ru} (${g.en})`,
  scope: `SEBP5244 · 374D L PAS1-Up${g.sn ? ` · S/N группы: ${g.sn}` : ''}`,
  items: [
    ...g.notes.map((n) => `Примечание каталога: ${n}`),
    ...g.items.map((i) => `${i.pn} ×${i.qty} — ${i.ru}${i.ru !== i.en ? ` (${i.en})` : ''}`),
    ...(g.top > g.items.length ? [`Показаны ${g.items.length} из ${g.top} позиций — полный список на странице каталога.`] : []),
  ],
  source: [ref(SEBP, `${g.pn} ${g.en}`, groupPages(g).replace(/^с\. /, '').replace(/ \(.*$/, ''), g.pdf)],
  open: { doc: SEBP, label: g.label, pdfPage: g.pdf },
});

const stripCites = (s: string) => s.replace(/ \(HEHH4376-02, с\. [\d, ]+\)/g, '');

function bookFor(): RepairBook {
  const book: RepairBook = {};
  for (const id of EXC_NODE_ORDER) {
    const groups = SEBP5244_GROUPS[id] ?? [];
    const node = CAT_374DL.nodes[id]!;
    const sp = SPEC_PAGE[id];
    const components: RepairSection | undefined = groups.length
      ? {
          status: 'manual',
          scope: 'по каталогу запчастей SEBP5244 (PAS1-Up); номера деталей и количества — как напечатаны; применимость проверяйте по серийному номеру',
          items: groups.map((g) => [`${g.pn} — ${groupTitle(g)}`, g.notes.join('; '), g.sn ? `с/н ${g.sn}` : ''].filter(Boolean).join(' · ')),
          source: groups.map((g) => ref(SEBP, groupTitle(g), groupPages(g).replace(/^с\. /, '').replace(/ \(.*$/, ''), g.pdf)),
          blocks: groups.map(block),
          extra: sp > 0 ? { title: 'По спецификации HEHH4376-02', items: [stripCites(node.description)], source: [ref(HEHH, 'спецификация', String(sp), sp)] } : undefined,
        }
      : undefined;
    const caps = CAPS[id];
    book[id] = {
      ...(components ? { components } : {}),
      ...(caps
        ? {
            repair: {
              status: 'manual',
              scope: 'по официальной спецификации Caterpillar (Specalog), не по сервисному мануалу',
              items: [...caps, 'Интервалы и процедуры ТО — в Operation & Maintenance Manual (Cat SIS / publications.cat.com); в открытом доступе не найдены.'],
              source: [ref(HEHH, 'Service Refill Capacities', '17', 17)],
            } as RepairSection,
          }
        : {}),
    };
  }
  return book;
}

export const EXC_REPAIR: RepairLibrary = { 'CAT-374DL': bookFor() };

/* ---------- Разбор: массы из HEHH4376-02, с. 20 (Major Component Weights) ---------- */
const W = (name: string, kg: string, note: string): PartBreakdownData['weights'][number] => ({
  name,
  kg,
  note: `${note}; раздел «Major Component Weights»`,
  ref: { doc: HEHH, label: '20', pdfPage: 20 } as BreakdownRef,
});
const bd = (weights: PartBreakdownData['weights']): PartBreakdownData => ({
  tools: [],
  equipment: [],
  weights,
  crew: [],
  time: [],
  scope: 'официальная спецификация Caterpillar (Specalog), не сервисный мануал',
  missingNote: 'Cat SIS / Standard Job Times, доступ у дилера',
});
export const EXC_EMPTY = bd([]);

export const EXC_BREAKDOWN: Partial<Record<ModelId, BreakdownBook>> = {
  'CAT-374DL': {
    boom: bd([W('Стрела Reach 7,8 м', '6730', 'с трубопроводами, пальцами и цилиндром рукояти')]),
    stick: bd([W('Рукоять R3,6 м', '3670', 'с трубопроводами, пальцами, цилиндром ковша и тягами')]),
    boomCylinders: bd([W('Цилиндры стрелы (два)', '1400', 'два цилиндра')]),
  },
};
