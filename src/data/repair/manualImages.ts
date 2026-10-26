/*
 * Наборы изображений страниц мануалов для просмотрщика-ленты (ManualViewer).
 * Каждая страница скана заранее растеризована в WebP (оттенки серого) — в просмотрщике нет PDF/pdf.js.
 * Чтобы подключить новый мануал: растеризовать страницы в public/<dir>/pNNN.webp (+ thumbs/pNNN.webp),
 * сгенерировать манифест (размеры, подписи страниц, пустые страницы) и добавить его в PAGE_IMAGE_SETS.
 */
import { D155_RU_IMAGES } from './d155ruImages';

export interface PageImageSet {
  /** id документа из manuals.ts */
  doc: string;
  /** Каталог внутри public/ (без ведущего и завершающего «/») */
  dir: string;
  pageCount: number;
  /** Размер изображения страницы по умолчанию, px */
  width: number;
  height: number;
  /** Страницы с другим размером: pdfPage → [ширина, высота] */
  sizes?: Readonly<Record<number, readonly [number, number]>>;
  /** Подпись страницы мануала (колонтитул) для каждой страницы; индекс = pdfPage − 1 */
  labels: readonly string[];
  /** Пустые страницы скана — изображения для них нет, в ленте показывается заглушка */
  blank: readonly number[];
  /** Есть ли уменьшенные копии thumbs/pNNN.webp (показываются, пока грузится полное изображение) */
  thumbs: boolean;
  /** Число цифр в имени файла (p001 → 3) */
  digits: number;
}

export const PAGE_IMAGE_SETS: Readonly<Record<string, PageImageSet>> = {
  [D155_RU_IMAGES.doc]: D155_RU_IMAGES,
};

export function pageSize(set: PageImageSet, n: number): readonly [number, number] {
  return set.sizes?.[n] ?? [set.width, set.height];
}

export function pageImageUrl(set: PageImageSet, n: number, thumb = false): string {
  const name = `p${String(n).padStart(set.digits, '0')}.webp`;
  return `${import.meta.env.BASE_URL}${set.dir}/${thumb ? 'thumbs/' : ''}${name}`;
}

export function pageLabel(set: PageImageSet, n: number): string | undefined {
  return set.labels[n - 1] || undefined;
}
