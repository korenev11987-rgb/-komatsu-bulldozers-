import type { ModelId, NodeId } from '../../types';
import { D155_RU_BLANK_PAGES, D155_RU_PAGE_LABELS } from './d155ruPageLabels';
import { MANUALS } from './manuals';
import { PAGE_IMAGE_SETS, type PageImageSet } from './manualImages';
import { CAT_MANUAL_PAGES } from '../cat/docs';
import type { ManualDoc } from './types';

/*
 * Страницы мануала, которые открываются по клику на узел схемы.
 * ТОЛЬКО проверенные страницы (номер PDF и колонтитул сверены по скану) — ничего не угадывать.
 *   disassembly — снятие/разборка (глава 30), assembly — установка/сборка (глава 30),
 *   specs — нормы: стандартные значения (главы 10/20) или стандарт техобслуживания (глава 40),
 *   catalog — страница группы каталога запчастей (Parts Manual); у документа задаётся kinds: ['catalog'].
 * Чтобы добавить модель: новый ключ в MANUAL_PAGES с doc (id из manuals.ts; для doc нужен набор изображений в manualImages.ts)
 * и картой nodes; при желании — pageLabel(pdfPage) для подписи страниц при листании.
 */

export type ManualPageKind = 'disassembly' | 'assembly' | 'specs' | 'catalog';

export interface ManualPage {
  /** Номер страницы в PDF-файле (1…N) */
  pdfPage: number;
  /** Номер страницы по нумерации мануала, например «30-112» */
  label: string;
}

export type NodeManualPages = Partial<Record<ManualPageKind, ManualPage>>;

/** Страницы узлов в одном документе */
export interface DocManualPages {
  /** id документа из manuals.ts (для документа нужен набор изображений в manualImages.ts) */
  doc: string;
  /** Видимая пометка, к какой модели относятся данные документа */
  scope?: string;
  /** Разделы-кнопки просмотра для этого документа (по умолчанию — разборка/сборка/нормы) */
  kinds?: readonly ManualPageKind[];
  nodes: Partial<Record<NodeId, NodeManualPages>>;
}

export interface ModelManualPages extends DocManualPages {
  /** Подпись страницы мануала для произвольной страницы PDF (для листания) */
  pageLabel?: (pdfPage: number) => string | undefined;
  /** Пустые страницы скана */
  blankPages?: readonly number[];
  /** Другие полные документы модели — доступны в переключателе документов просмотра */
  extraDocs?: DocManualPages[];
}

export const MANUAL_PAGE_KINDS: { key: ManualPageKind; title: string }[] = [
  { key: 'disassembly', title: 'Разборка' },
  { key: 'assembly', title: 'Сборка' },
  { key: 'specs', title: 'Нормы' },
];

/** Все разделы, включая «Каталог» (каталоги запчастей) */
export const ALL_PAGE_KINDS: { key: ManualPageKind; title: string }[] = [...MANUAL_PAGE_KINDS, { key: 'catalog', title: 'Каталог' }];

/** Кнопки разделов для документа: заданные у документа или стандартные (разборка/сборка/нормы) */
export function docKinds(entry: { kinds?: readonly ManualPageKind[] }): { key: ManualPageKind; title: string }[] {
  return entry.kinds ? ALL_PAGE_KINDS.filter((k) => entry.kinds!.includes(k.key)) : MANUAL_PAGE_KINDS;
}

const hasPages = (pages: NodeManualPages | undefined): pages is NodeManualPages => !!pages && ALL_PAGE_KINDS.some((k) => pages[k.key]);

const p = (pdfPage: number, label: string): ManualPage => ({ pdfPage, label });

export const MANUAL_PAGES: Partial<Record<ModelId, ModelManualPages>> = {
  ...CAT_MANUAL_PAGES,
  D155: {
    doc: 'D155-SM-RU',
    pageLabel: (n) => D155_RU_PAGE_LABELS[n - 1],
    blankPages: D155_RU_BLANK_PAGES,
    scope: 'данные D155A-5 (на схеме — D155AX-8)',
    nodes: {
      engine: { disassembly: p(401, '30-61'), assembly: p(402, '30-62'), specs: p(174, '20-2') },
      cooling: { disassembly: p(391, '30-51'), assembly: p(393, '30-53'), specs: p(33, '10-3') },
      torqueConverter: { disassembly: p(438, '30-96'), assembly: p(441, '30-99'), specs: p(649, '40-7') },
      gearbox: { disassembly: p(444, '30-102'), assembly: p(453, '30-111'), specs: p(176, '20-4') },
      steering: { disassembly: p(464, '30-122'), assembly: p(472, '30-130'), specs: p(655, '40-13') },
      finalDrive: { disassembly: p(500, '30-156'), assembly: p(503, '30-159'), specs: p(663, '40-21') },
      sprocket: { disassembly: p(590, '30-246'), assembly: p(590, '30-246'), specs: p(663, '40-21') },
      trackFrame: { disassembly: p(515, '30-171'), assembly: p(517, '30-173'), specs: p(666, '40-24') },
      idler: { disassembly: p(518, '30-174'), assembly: p(519, '30-175'), specs: p(671, '40-29') },
      trackRollers: { disassembly: p(532, '30-188'), assembly: p(533, '30-189'), specs: p(673, '40-31') },
      carrierRollers: { disassembly: p(550, '30-206'), assembly: p(553, '30-209'), specs: p(674, '40-32') },
      trackChain: { disassembly: p(556, '30-212'), assembly: p(556, '30-212'), specs: p(679, '40-37') },
      pumps: { disassembly: p(592, '30-248'), assembly: p(592, '30-248'), specs: p(682, '40-40') },
      blade: { disassembly: p(621, '30-277'), assembly: p(622, '30-278'), specs: p(697, '40-55') },
      bladeCylinders: { disassembly: p(610, '30-266'), assembly: p(617, '30-273'), specs: p(691, '40-49') },
      ripper: { disassembly: p(627, '30-283'), assembly: p(629, '30-285'), specs: p(703, '40-61') },
      ripperCylinders: { disassembly: p(612, '30-268'), assembly: p(619, '30-275'), specs: p(693, '40-51') },
      alternator: { disassembly: p(367, '30-27'), assembly: p(367, '30-27'), specs: p(192, '20-110') },
      starter: { disassembly: p(366, '30-26'), assembly: p(366, '30-26') },
      monitor: { disassembly: p(642, '30-298'), assembly: p(642, '30-298'), specs: p(165, '10-135') },
    },
    extraDocs: [
      { doc: 'D155-SM-EN-EXCERPT', scope: 'D155A-5, английский фрагмент Shop Manual', nodes: {} },
      { doc: 'D155-OM-RU', scope: 'D155A-5, руководство по эксплуатации и уходу', nodes: {} },
      { doc: 'D155AX5-OMM', scope: 'D155AX-5 — другое исполнение', nodes: {} },
    ],
  },
  D355: {
    doc: 'D355-SM',
    scope: 'данные D355A-3',
    // Страницы сверены по изображениям: заголовок раздела и колонтитул (номер страницы мануала)
    nodes: {
      starter: { disassembly: p(60, '13-2'), assembly: p(61, '13-3') },
      alternator: { disassembly: p(64, '13-6'), assembly: p(66, '13-7-1') },
      cooling: { disassembly: p(112, '13-54'), assembly: p(116, '13-58') },
      engine: { disassembly: p(134, '13-74'), assembly: p(145, '13-84'), specs: p(41, '12-2') },
      pumps: { disassembly: p(552, '63-2'), assembly: p(554, '63-4'), specs: p(645, '64-2') },
      torqueConverter: { disassembly: p(239, '23-2'), assembly: p(242, '23-5'), specs: p(412, '24-2') },
      gearbox: { disassembly: p(265, '23-30'), assembly: p(272, '23-38'), specs: p(417, '24-7') },
      steering: { disassembly: p(328, '23-96'), assembly: p(332, '23-100'), specs: p(428, '24-16') },
      finalDrive: { disassembly: p(366, '23-136'), assembly: p(374, '23-144'), specs: p(439, '24-28') },
      trackChain: { disassembly: p(453, '33-2'), assembly: p(455, '33-4'), specs: p(488, '34-2') },
      carrierRollers: { disassembly: p(461, '33-10'), assembly: p(462, '33-11'), specs: p(498, '34-12') },
      trackRollers: { disassembly: p(463, '33-12'), assembly: p(465, '33-14'), specs: p(496, '34-10') },
      idler: { disassembly: p(467, '33-16'), assembly: p(469, '33-18'), specs: p(494, '34-8') },
      trackFrame: { disassembly: p(482, '33-32'), assembly: p(485, '33-36'), specs: p(492, '34-6') },
      bladeCylinders: { disassembly: p(598, '63-48'), assembly: p(611, '63-61'), specs: p(651, '64-8') },
      ripperCylinders: { disassembly: p(626, '63-76'), assembly: p(627, '63-77'), specs: p(653, '64-10') },
      blade: { disassembly: p(667, '73-2'), assembly: p(675, '73-10'), specs: p(688, '74-2') },
      ripper: { disassembly: p(677, '73-12'), assembly: p(682, '73-18'), specs: p(692, '74-6') },
    },
    extraDocs: [{ doc: 'D355-PP-RU', scope: 'D355A-3, руководство по эксплуатации и уходу', nodes: {} }],
  },
  D475: {
    doc: 'D475-SM-SAMPLE',
    scope: 'данные D475A-5 (фрагмент Shop Manual; на схеме — D475A-8)',
    // В фрагменте есть только характеристики (01 GENERAL) — кнопки «Разборка»/«Сборка» неактивны
    nodes: {
      engine: { specs: p(26, '01-4') },
      cooling: { specs: p(26, '01-4') },
      starter: { specs: p(26, '01-4') },
      alternator: { specs: p(26, '01-4') },
      batteries: { specs: p(26, '01-4') },
      torqueConverter: { specs: p(26, '01-4') },
      gearbox: { specs: p(26, '01-4') },
      steering: { specs: p(26, '01-4') },
      finalDrive: { specs: p(26, '01-4') },
      trackFrame: { specs: p(26, '01-4') },
      carrierRollers: { specs: p(26, '01-4') },
      trackRollers: { specs: p(26, '01-4') },
      trackChain: { specs: p(26, '01-4') },
      pumps: { specs: p(27, '01-5') },
      bladeCylinders: { specs: p(27, '01-5') },
      ripperCylinders: { specs: p(28, '01-6') },
      blade: { specs: p(29, '01-7') },
      ripper: { specs: p(29, '01-7') },
    },
    extraDocs: [
      {
        doc: 'D475A3-SM-SAMPLE',
        scope: 'D475A-3 — предыдущая модель',
        nodes: {
          engine: { specs: p(20, '01-5') },
          cooling: { specs: p(20, '01-5') },
          starter: { specs: p(20, '01-5') },
          alternator: { specs: p(20, '01-5') },
          batteries: { specs: p(20, '01-5') },
          torqueConverter: { specs: p(20, '01-5') },
          gearbox: { specs: p(20, '01-5') },
          steering: { specs: p(20, '01-5') },
          finalDrive: { specs: p(20, '01-5') },
          trackFrame: { specs: p(21, '01-6') },
          carrierRollers: { specs: p(21, '01-6') },
          trackRollers: { specs: p(21, '01-6') },
          trackChain: { specs: p(21, '01-6') },
          pumps: { specs: p(21, '01-6') },
          bladeCylinders: { specs: p(21, '01-6') },
        },
      },
    ],
  },
};

/** Документ в просмотре узла: изображения страниц и страницы узла в этом документе */
export interface NodeDocManual {
  doc: ManualDoc;
  images: PageImageSet;
  /** Страницы узла (может быть пусто — документ открывается с первой страницы) */
  pages: NodeManualPages;
  scope?: string;
  kinds?: readonly ManualPageKind[];
}

export interface NodeManual extends NodeDocManual {
  model: ModelId;
  node: NodeId;
  info: ModelManualPages;
  /** Все документы модели с изображениями: [0] — основной (тот же, что doc/images/pages) */
  docs: NodeDocManual[];
}

/**
 * Страницы мануала узла или null, если ни в одном документе модели нет проверенной страницы узла.
 * Основной документ — первый по порядку (основной, затем extraDocs), в котором у узла есть страница.
 */
export function getNodeManual(model: ModelId, node: NodeId): NodeManual | null {
  const info = MANUAL_PAGES[model];
  if (!info) return null;
  const docs: NodeDocManual[] = [];
  for (const x of [info, ...(info.extraDocs ?? [])]) {
    const d = MANUALS[x.doc];
    const im = PAGE_IMAGE_SETS[x.doc];
    if (d && im) docs.push({ doc: d, images: im, pages: x.nodes[node] ?? {}, scope: x.scope, kinds: x.kinds });
  }
  const i = docs.findIndex((d) => hasPages(d.pages));
  if (i < 0) return null;
  if (i > 0) docs.unshift(...docs.splice(i, 1));
  return { model, node, ...docs[0], info, docs };
}

/** Документ просмотра по id (или основной) */
export function nodeDoc(manual: NodeManual, docId: string | null | undefined): NodeDocManual {
  return manual.docs.find((d) => d.doc.id === docId) ?? manual.docs[0];
}

/** Первый доступный раздел: разборка → сборка → нормы → каталог */
export function firstManualKind(pages: NodeManualPages): ManualPageKind | null {
  return ALL_PAGE_KINDS.find((k) => pages[k.key])?.key ?? null;
}
