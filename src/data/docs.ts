import type { ModelId } from '../types';
import { CAT_MODEL_DOCS } from './cat/docs';
import { EXC_MODEL_DOCS } from './excavator/docs374';

export interface ModelDocument {
  id: string;
  /** Текст кнопки */
  label: string;
  /** Путь внутри public/ (без ведущего «/») — URL строится от import.meta.env.BASE_URL */
  file: string;
  docNo: string;
  model: string;
  sourceUrl: string;
  sourceLabel: string;
  note: string;
}

/** Документы, приложенные к сайту (лежат в public/manuals). */
export const MODEL_DOCS: Partial<Record<ModelId, ModelDocument[]>> = {
  D155: [
    {
      id: 'd155a-5-srbm028200-ru',
      label: 'Заводская инструкция D155A-5 (RU, полная, 703 стр., 16,6 МБ)',
      file: 'manuals/komatsu-d155a-5-srbm028200-ru.pdf',
      docNo: 'SRBM028200',
      model: 'Заводская инструкция (Shop Manual) Komatsu D155A-5, серийный № 65001 и выше',
      sourceUrl: '',
      sourceLabel: 'файл, предоставленный владельцем сайта',
      note: 'Полный русский Shop Manual D155A-5 (скан). Карточки узлов D155 ссылаются на его страницы. D155A-5 — более раннее поколение, чем D155AX-8 на схеме: значения относятся к D155A-5.',
    },
    {
      id: 'd155a-5-sebm023301',
      label: 'Мануал D155A-5 (PDF, фрагмент: раздел 01 «Общее», 31 стр.)',
      file: 'manuals/komatsu-d155a-5-sebm023301-excerpt.pdf',
      docNo: 'SEBM023301',
      model: 'Shop Manual Komatsu D155A-5, серийный № 65001 и выше',
      sourceUrl: 'https://www.manualslib.com/manual/4218946/Komatsu-D155a-5.html',
      sourceLabel: 'страница источника на manualslib.com',
      note: 'D155A-5 — более раннее поколение, чем изображённый на схеме D155AX-8: данные фрагмента (общие сведения, техника безопасности, моменты затяжки, характеристики) относятся к D155A-5 и для D155AX-8 могут отличаться.',
    },
  ],
  ...CAT_MODEL_DOCS,
  ...EXC_MODEL_DOCS,
};

export const docUrl = (d: ModelDocument): string => `${import.meta.env.BASE_URL}${d.file}`;
