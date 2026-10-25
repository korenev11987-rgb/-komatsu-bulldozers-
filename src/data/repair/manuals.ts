import type { ManualDoc } from './types';

/**
 * Документы, из которых взяты данные карточек.
 * Все документы прочитаны в открытом доступе (без входа и без обхода платного доступа).
 */
export const MANUALS: Record<string, ManualDoc> = {
  'D155-SM-RU': {
    id: 'D155-SM-RU',
    title: 'Заводская инструкция D155A-5',
    model: 'D155A-5, серийный № 65001 и выше (на схеме — D155AX-8)',
    docNo: 'SRBM028200',
    url: 'manuals/komatsu-d155a-5-srbm028200-ru.pdf',
    file: 'manuals/komatsu-d155a-5-srbm028200-ru.pdf',
    note: 'Русское издание Shop Manual, 703 стр. Скан без текстового слоя — текст распознан (OCR), цифры сверены по изображениям страниц. Двигатель S6D140-1 подробно описан в отдельном мануале двигателя 6D140-1 (в этой инструкции — только снятие/установка, головка блока и стандартные значения).',
  },
  'D155-OMM': {
    id: 'D155-OMM',
    title: 'Operation & Maintenance Manual D155AX-8E0',
    model: 'D155AX-8E0, серийный № 100358 и выше',
    docNo: 'EENAM03780',
    url: 'https://www.easymanua.ls/komatsu/d155ax-8e0/manual',
    note: 'Руководство по эксплуатации и ТО (не Shop Manual): содержит обслуживание и регулировки, но не полную разборку агрегатов.',
  },
  'D355-SM': {
    id: 'D355-SM',
    title: 'Заводская инструкция (Shop Manual) KOMATSU D355A-3',
    model: 'D355A-3, серийный № 9872 и выше',
    docNo: 'SRBM0195UR02',
    url: 'https://diesel-inj.ru/upload/iblock/b2a/Factory-manual-KOMATSU-D355A-3.pdf',
    note: 'Русское издание SEBM0195. Скан без текстового слоя — текст распознан (OCR) и сверен по страницам.',
  },
  'D475-OMM': {
    id: 'D475-OMM',
    title: 'Operation & Maintenance Manual D475A-5E0',
    model: 'D475A-5E0, серийный № 30134 и выше',
    docNo: 'PEN00537-05',
    url: 'https://www.easymanua.ls/komatsu/d475a-5e0/manual',
    note: 'Предыдущее поколение (D475A-5E0), а не D475A-8. Руководство по эксплуатации и ТО: без полной разборки агрегатов.',
  },
  'D475-ENG': {
    id: 'D475-ENG',
    title: 'Shop Manual (Engine volume) 12V140E-3 Series',
    model: 'двигатель SAA12V140E-3 для D475A-5 (не D475A-8)',
    docNo: 'SEN00291-00 (разделы SEN00303-00, SEN00307-00)',
    url: 'https://idoc.pub/documents/engine-saa12v140e-3-hpcr-sen00291-00d-ylyxwvpoddnm',
    note: 'Текст открыт для просмотра без входа. Значения относятся к SAA12V140E-3 (D475A-5).',
  },
};
