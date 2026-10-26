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
    note: 'Русское издание SEBM0195, 702 стр. Скан без текстового слоя — текст распознан (OCR) и сверен по страницам.',
  },
  'D355-PP-RU': {
    id: 'D355-PP-RU',
    title: 'Технический паспорт (инструкция по эксплуатации и уходу) D355A-3',
    model: 'D355A-3',
    docNo: 'SRAM197D01',
    url: 'https://diesel-inj.ru/upload/iblock/2d9/Technical-passport-KOMATSU-Bulldozer%20D355A-3.pdf',
    note: 'Русское издание, 305 стр. Руководство по эксплуатации и уходу, не Shop Manual: разборки агрегатов нет.',
  },
  'D155-OM-RU': {
    id: 'D155-OM-RU',
    title: 'Технический паспорт (инструкция по эксплуатации и уходу) D155A-5',
    model: 'D155A-5, серийный № 65039 и выше',
    docNo: 'SRAM005500',
    url: 'https://hostozavr.com/files/spectehnika/rukovodstvo-po-jekspluatacii-i-obsluzhivaniju-buldozera-komatsu-d155a-5.pdf',
    note: 'Русское издание, 277 стр. Руководство по эксплуатации и уходу, не Shop Manual.',
  },
  'D155AX5-OMM': {
    id: 'D155AX5-OMM',
    title: 'Operation & Maintenance Manual D155AX-5',
    model: 'D155AX-5, серийный № 75001 и выше (другое исполнение, не D155A-5)',
    docNo: 'EEAM020802',
    url: 'https://sd95d2cbd361a0b8d.jimcontent.com/download/version/1610735635/module/15572907522/name/Komatsu%20D155AX-5%20Opeartion%20Manual.pdf',
    note: 'Английское издание, 290 стр. Руководство по эксплуатации и ТО, не Shop Manual.',
  },
  'D155-SM-EN-EXCERPT': {
    id: 'D155-SM-EN-EXCERPT',
    title: 'Shop Manual D155A-5 (фрагмент, ManualsLib)',
    model: 'D155A-5, серийный № 65001 и выше',
    docNo: 'SEBM023301',
    url: 'https://www.manualslib.com/manual/4218946/Komatsu-D155a-5.html',
    note: 'Английский ознакомительный фрагмент, 33 стр.: техника безопасности, предисловие, технические характеристики.',
  },
  'D475-SM-SAMPLE': {
    id: 'D475-SM-SAMPLE',
    title: 'Shop Manual D475A-5 (ознакомительный фрагмент)',
    model: 'D475A-5, серийный № 20001 и выше (не D475A-5E0 и не D475A-8)',
    docNo: 'SEBM033708',
    url: 'https://www.aservicemanualpdf.com/',
    note: 'Бесплатный фрагмент заводского Shop Manual: 33 стр. (00 — безопасность и предисловие, 01 — общие сведения и характеристики). Последняя (34-я) страница файла — реклама продавца, в ленту не включена. Разделов разборки/сборки во фрагменте нет; полный Shop Manual D475A-5 в открытом доступе не найден (только платно или после входа).',
  },
  'D475A3-SM-SAMPLE': {
    id: 'D475A3-SM-SAMPLE',
    title: 'Shop Manual D475A-3 (ознакомительный фрагмент)',
    model: 'D475A-3, серийный № 10685 и выше (предыдущая модель)',
    docNo: 'SEBM027502',
    url: 'https://www.aservicemanualpdf.com/',
    note: 'Бесплатный фрагмент: 27 стр. (00 и 01 — характеристики). Последняя страница файла — реклама продавца, в ленту не включена.',
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
