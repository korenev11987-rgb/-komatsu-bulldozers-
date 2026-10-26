/* Расшифровки английских подписей на страницах мануала (EN → RU), по документам.
 * Общая форма: id документа → номер страницы PDF → подписи. Переводятся только подписи;
 * числа, единицы, номера деталей и сокращения сохраняются, сокращения поясняются в note. */
import { D355_GLOSSARY } from './d355-glossary';

export interface GlossaryEntry {
  en: string;
  ru: string;
  note?: string;
}

export type PageGlossary = Record<number, GlossaryEntry[]>;

export interface DocGlossary {
  /** Вид страницы: чертёж / схема / таблица */
  kinds?: Record<number, 'чертёж' | 'схема' | 'таблица'>;
  pages: PageGlossary;
}

export const GLOSSARIES: Record<string, DocGlossary> = {
  'D355-SM': D355_GLOSSARY,
};
