import type { ModelId, NodeId } from '../../types';
import { D155_RU_BLANK_PAGES, D155_RU_PAGE_LABELS } from './d155ruPageLabels';
import { MANUALS } from './manuals';
import type { ManualDoc } from './types';

/*
 * Страницы мануала, которые открываются по клику на узел схемы.
 * ТОЛЬКО проверенные страницы (номер PDF и колонтитул сверены по скану) — ничего не угадывать.
 *   disassembly — снятие/разборка (глава 30), assembly — установка/сборка (глава 30),
 *   specs — нормы: стандартные значения (главы 10/20) или стандарт техобслуживания (глава 40).
 * Чтобы добавить модель: новый ключ в MANUAL_PAGES с doc (id из manuals.ts, у документа должен быть file)
 * и картой nodes; при желании — pageLabel(pdfPage) для подписи страниц при листании.
 */

export type ManualPageKind = 'disassembly' | 'assembly' | 'specs';

export interface ManualPage {
  /** Номер страницы в PDF-файле (1…N) */
  pdfPage: number;
  /** Номер страницы по нумерации мануала, например «30-112» */
  label: string;
}

export type NodeManualPages = Partial<Record<ManualPageKind, ManualPage>>;

export interface ModelManualPages {
  doc: string;
  /** Подпись страницы мануала для произвольной страницы PDF (для листания) */
  pageLabel?: (pdfPage: number) => string | undefined;
  /** Пустые страницы скана */
  blankPages?: readonly number[];
  /** Видимая пометка, к какой модели относятся данные документа */
  scope?: string;
  nodes: Partial<Record<NodeId, NodeManualPages>>;
}

export const MANUAL_PAGE_KINDS: { key: ManualPageKind; title: string }[] = [
  { key: 'disassembly', title: 'Разборка' },
  { key: 'assembly', title: 'Сборка' },
  { key: 'specs', title: 'Нормы' },
];

const p = (pdfPage: number, label: string): ManualPage => ({ pdfPage, label });

export const MANUAL_PAGES: Partial<Record<ModelId, ModelManualPages>> = {
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
  },
};

export interface NodeManual {
  model: ModelId;
  node: NodeId;
  doc: ManualDoc;
  /** URL файла PDF (без #page) */
  fileUrl: string;
  pages: NodeManualPages;
  info: ModelManualPages;
}

/** Страницы мануала узла или null, если ни одной проверенной страницы нет */
export function getNodeManual(model: ModelId, node: NodeId): NodeManual | null {
  const info = MANUAL_PAGES[model];
  const pages = info?.nodes[node];
  if (!info || !pages || !MANUAL_PAGE_KINDS.some((k) => pages[k.key])) return null;
  const doc = MANUALS[info.doc];
  if (!doc?.file) return null;
  return { model, node, doc, fileUrl: `${import.meta.env.BASE_URL}${doc.file}`, pages, info };
}

/** Первый доступный раздел: разборка → сборка → нормы */
export function firstManualKind(pages: NodeManualPages): ManualPageKind | null {
  return MANUAL_PAGE_KINDS.find((k) => pages[k.key])?.key ?? null;
}
