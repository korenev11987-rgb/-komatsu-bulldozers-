/* Русские переводы англоязычных документов (полный перевод страниц).
 * Сами переводы не входят в бандл: лежат рядом с изображениями страниц —
 * public/manuals/<docId>/ru.json (или ru.part1.json … ru.partN.json) и загружаются лениво при открытии документа.
 * Индекс (какие документы переведены и из скольких частей) генерирует /workspace/tools/importtranslations.py. */
import type { PageImageSet } from '../repair/manualImages';
import { TRANSLATION_INDEX } from './translationIndex';

export interface TranslationTerm {
  en: string;
  ru: string;
}
export interface TranslationPage {
  label?: string;
  kind?: string;
  /** Перевод страницы, markdown */
  ru: string;
  terms?: TranslationTerm[];
}
export interface DocTranslation {
  docId: string;
  title?: string;
  titleRu?: string;
  sourceLang?: string;
  pages: Record<string, TranslationPage>;
}
export interface TranslationInfo {
  /** Число файлов: 0 — один ru.json, N — ru.part1.json … ru.partN.json */
  parts: number;
  sourceLang: string;
  pages: number;
  titleRu?: string;
}

/** id перевода = имя каталога ленты страниц (public/manuals/<docId>) */
export const translationId = (set: PageImageSet): string => set.dir.split('/').pop() ?? set.dir;

export const translationInfo = (set: PageImageSet): TranslationInfo | undefined =>
  (TRANSLATION_INDEX as Record<string, TranslationInfo>)[translationId(set)];

const cache = new Map<string, Promise<DocTranslation>>();

export function loadTranslation(set: PageImageSet): Promise<DocTranslation> | null {
  const info = translationInfo(set);
  if (!info) return null;
  const id = translationId(set);
  let p = cache.get(id);
  if (!p) {
    const base = `${import.meta.env.BASE_URL}${set.dir}/`;
    const files = info.parts > 0 ? Array.from({ length: info.parts }, (_, i) => `ru.part${i + 1}.json`) : ['ru.json'];
    p = Promise.all(
      files.map((f) =>
        fetch(base + f).then((r) => {
          if (!r.ok) throw new Error(`${f}: HTTP ${r.status}`);
          return r.json() as Promise<DocTranslation>;
        }),
      ),
    ).then((docs) => ({ ...docs[0], pages: Object.assign({}, ...docs.map((d) => d.pages)) }));
    p.catch(() => cache.delete(id));
    cache.set(id, p);
  }
  return p;
}
