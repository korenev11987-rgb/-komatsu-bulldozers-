import type { AnyNodeId, ExcavatorModel, NodeInfo, Part, SystemId } from '../../types';
import { SEBP5244_GROUPS, type CatalogGroup } from './catalog374.gen';

/*
 * Гидравлический экскаватор Caterpillar 374D L.
 * Источники (только официальные документы Caterpillar):
 *   HEHH4376-02 — Specalog «374D L Hydraulic Excavator», https://s7d2.scene7.com/is/content/Caterpillar/C633458
 *     (приложен: public/manuals/cat/cat-374dl-hehh4376.pdf). Номера страниц = страницы PDF.
 *     Размеры для рисунка — с. 18 (Dimensions, Reach boom 7,8 м, стрела R3.6 м), рабочие зоны — с. 19, массы — с. 20.
 *   SEBP5244 — Parts Manual 374D L Excavator (PAS1-Up, апрель 2010), файл предоставлен владельцем сайта;
 *     лента страниц: public/manuals/cat-374dl-sebp5244. Ссылки — «печатная страница (стр. PDF)».
 * Поля dims с пометкой «оценка» в спецификации не опубликованы — подобраны по пропорциям только для рисунка
 * и в карточках как данные не показываются.
 */

export const HEHH = 'CAT-374DL-SPEC';
export const SEBP = 'CAT-374DL-PM';
const S = (...pages: number[]) => ` (HEHH4376-02, с. ${pages.join(', ')})`;

/** Страница спецификации HEHH4376-02 с фактами узла (0 — в спецификации нет данных) */
export const SPEC_PAGE: Record<string, number> = {
  engine: 17, cooling: 17, trackChain: 17, trackFrame: 18, trackRollers: 17, carrierRollers: 17, idler: 10, sprocket: 0,
  finalDrive: 17, swingDrive: 17, swingBearing: 8,
  pumps: 17, mainValve: 4, swingMotors: 17, travelMotors: 17, swivel: 0, hydTank: 17,
  boom: 20, stick: 20, bucket: 19, boomCylinders: 17, stickCylinder: 17, bucketCylinder: 17,
  batteries: 0, alternator: 7, starter: 0, wiring: 0, fuseBox: 0, controllers: 6, lights: 5, monitor: 7,
};

/** Подпись группы каталога для карточки: «Цилиндр стрелы, группа (CYLINDER GP-BOOM)» */
export const groupTitle = (g: CatalogGroup) => `${g.ru} (${g.en})`;
export const groupPages = (g: CatalogGroup) => {
  const lastLabel = g.last > g.pdf ? String(Number(g.label) + (g.last - g.pdf)) : '';
  return g.last > g.pdf ? `с. ${g.label}–${lastLabel} (стр. PDF ${g.pdf}–${g.last})` : `с. ${g.label} (стр. PDF ${g.pdf})`;
};

function catalogParts(id: AnyNodeId): Part[] {
  return (SEBP5244_GROUPS[id] ?? []).map((g) => ({
    name: `${g.pn} — ${groupTitle(g)}`,
    note: [g.notes.join('; '), g.sn ? `с/н ${g.sn}` : '', `SEBP5244, ${groupPages(g)}`].filter(Boolean).join(' · '),
  }));
}

interface N {
  system: SystemId;
  title: string;
  description: string;
}

const N: Record<string, N> = {
  engine: {
    system: 'engine',
    title: 'Двигатель Cat C15 ACERT',
    description:
      'Дизель Cat C15 ACERT с насос-форсунками MEUI и электронным управлением ADEM' + S(6) +
      '. Мощность 355 кВт; диаметр цилиндра 137 мм, ход поршня 171 мм, рабочий объём 15,2 л' + S(17) + '.',
  },
  cooling: {
    system: 'engine',
    title: 'Система охлаждения',
    description:
      'Вентилятор с гидроприводом и переменной частотой вращения; реверсивный вентилятор — опция' + S(6) +
      '. Объём системы охлаждения 95 л' + S(17) + '. В каталоге — радиатор с охладителем наддувочного воздуха и радиатор с маслоохладителем гидросистемы.',
  },
  trackChain: {
    system: 'undercarriage',
    title: 'Гусеничная цепь и башмаки',
    description:
      'Звенья с фиксацией пальцев PPR2 (Positive Pin Retention 2) со смазкой' + S(10) + '. 47 башмаков с каждой стороны; ширина башмака в базовой комплектации 650 мм' + S(17) + '.',
  },
  trackFrame: {
    system: 'undercarriage',
    title: 'Рама гусеничной тележки',
    description:
      'Длинная ходовая с изменяемой колеёй: 2750 мм (транспортное положение) / 3410 мм (рабочее)' + S(18) +
      '; рама катков — коробчатая, из гнутого U-образного листа' + S(8) + '. Длина гусеницы 5870 мм, база (между центрами колёс) 4705 мм, дорожный просвет 840 мм' + S(18) + '.',
  },
  trackRollers: {
    system: 'undercarriage',
    title: 'Опорные катки',
    description: '8 опорных катков с каждой стороны' + S(17) + '. В каталоге — катки с двумя и с одной ребордой.',
  },
  carrierRollers: {
    system: 'undercarriage',
    title: 'Поддерживающие катки',
    description: '3 поддерживающих катка с каждой стороны' + S(17) + '; уплотнения Duo-Cone, смазка не требует обслуживания' + S(10) + '.',
  },
  idler: {
    system: 'undercarriage',
    title: 'Направляющее колесо и натяжитель',
    description: 'Кованое направляющее колесо; опущенное переднее колесо и пружина натяжителя с увеличенным ходом' + S(10) + '. Натяжение — гидравлическое (группа ADJUSTMENT GP-HYDRAULIC TRACK в каталоге).',
  },
  sprocket: {
    system: 'undercarriage',
    title: 'Ведущая звёздочка',
    description: 'Ведущая звёздочка на бортовом редукторе. В спецификации отдельных данных нет — состав по каталогу SEBP5244.',
  },
  finalDrive: {
    system: 'transmission',
    title: 'Бортовой редуктор хода',
    description: 'Масло: 15 л в каждом редукторе. Скорость хода до 4,1 км/ч, тяговое усилие 492,5 кН, преодолеваемый уклон 35° (70 %)' + S(17) + '.',
  },
  swingDrive: {
    system: 'transmission',
    title: 'Редукторы поворота',
    description: 'Два редуктора поворота (левый и правый в каталоге), масло 12 л в каждом. Скорость поворота 6,4 об/мин, момент поворота 214,8 кН·м' + S(17) + '.',
  },
  swingBearing: {
    system: 'transmission',
    title: 'Опорно-поворотный круг',
    description: 'Перекрёстно-роликовый подшипник с роликами диаметром 54 мм' + S(8) + '.',
  },
  pumps: {
    system: 'hydraulics',
    title: 'Гидронасосы',
    description: 'Два основных насоса и отдельный насос поворота' + S(4) + '. Подача: основная система 880 л/мин, поворот 360 л/мин; давление: рабочее оборудование и ход 35 000 кПа, поворот 29 400 кПа, пилотная система 4120 кПа' + S(17) + '.',
  },
  mainValve: {
    system: 'hydraulics',
    title: 'Главный распределитель',
    description: 'Распределитель с пропорциональной приоритетной компенсацией давления (PPPC) и чувствительностью к нагрузке; режимы Soft / Normal / Quick; контуры регенерации стрелы (электронный) и рукояти (гидравлический)' + S(4) + '.',
  },
  swingMotors: {
    system: 'hydraulics',
    title: 'Гидромоторы поворота',
    description: 'Давление контура поворота 29 400 кПа' + S(17) + '; клапаны гашения обратного качания при остановке поворота' + S(4) + '. В каталоге — два мотора (левый и правый).',
  },
  travelMotors: {
    system: 'hydraulics',
    title: 'Гидромоторы хода',
    description: 'Давление контура хода 35 000 кПа; скорость хода до 4,1 км/ч' + S(17) + '.',
  },
  swivel: {
    system: 'hydraulics',
    title: 'Поворотное соединение',
    description: 'Центральное поворотное соединение подаёт масло от поворотной платформы к гидромоторам хода. В спецификации данных нет — состав по каталогу SEBP5244.',
  },
  hydTank: {
    system: 'hydraulics',
    title: 'Гидробак',
    description: 'Гидробак 360 л; масло гидросистемы 705 л' + S(17) + '.',
  },
  boom: {
    system: 'hydraulics',
    title: 'Стрела (Reach, 7,8 м)',
    description: 'Удлинённая стрела Reach 7,8 м, масса 6730 кг (с трубопроводами, пальцами и цилиндром рукояти)' + S(20) + '. Отливки и поковки в зоне пяты, оголовка и крепления цилиндров; стрелы проходят снятие напряжений и ультразвуковой контроль' + S(9) + '.',
  },
  stick: {
    system: 'hydraulics',
    title: 'Рукоять R3.6',
    description: 'Рукоять R3,6 м, масса 3670 кг (с трубопроводами, пальцами, цилиндром ковша и тягами)' + S(20) + '. Усилие на рукояти 279,3 кН (ISO)' + S(19) + '. Коробчатое сечение из высокопрочной стали' + S(9) + '.',
  },
  bucket: {
    system: 'hydraulics',
    title: 'Ковш и тяги',
    description: 'Ковш общего назначения 3,8 м³ (базовая конфигурация); радиус по зубьям 2251 мм; усилие копания ковшом 338,6 кН (ISO)' + S(17, 19) + '. Тяги VB2 — для рукоятей Reach и ковшей VB2' + S(9) + '.',
  },
  boomCylinders: {
    system: 'hydraulics',
    title: 'Цилиндры стрелы',
    description: 'Два цилиндра: диаметр 190 мм, ход 1792 мм' + S(17) + '; масса двух цилиндров 1400 кг' + S(20) + '.',
  },
  stickCylinder: {
    system: 'hydraulics',
    title: 'Цилиндр рукояти',
    description: 'Диаметр 210 мм, ход 2118 мм' + S(17) + '.',
  },
  bucketCylinder: {
    system: 'hydraulics',
    title: 'Цилиндр ковша',
    description: 'Тяги VB2: диаметр 190 мм, ход 1443 мм; тяги WB2: диаметр 200 мм, ход 1457 мм' + S(17) + '.',
  },
  batteries: {
    system: 'electrics',
    title: 'Аккумуляторные батареи',
    description: 'В спецификации данных о батареях нет — состав по каталогу SEBP5244 (группа BATTERY & WIRING GP, выключатель массы).',
  },
  alternator: {
    system: 'electrics',
    title: 'Генератор',
    description: 'Генератор 24 В, 75 А, привод поликлиновым ремнём от переднего шкива' + S(7) + '.',
  },
  starter: {
    system: 'electrics',
    title: 'Стартер',
    description: 'В спецификации данных нет — состав по каталогу SEBP5244 (STARTING MOTOR GP-ELECTRIC).',
  },
  wiring: {
    system: 'electrics',
    title: 'Жгуты проводов',
    description: 'В спецификации данных нет — состав по каталогу SEBP5244 (жгуты кабины и двигателя).',
  },
  fuseBox: {
    system: 'electrics',
    title: 'Панель автоматических выключателей',
    description: 'В спецификации данных нет — состав по каталогу SEBP5244 (PANEL GP-CIRCUIT BREAKER).',
  },
  controllers: {
    system: 'electrics',
    title: 'Контроллеры (ЭБУ)',
    description: 'Контроллер двигателя ADEM' + S(6) + '; контроллер машины управляет регенерацией стрелы' + S(4) + '. В каталоге — CONTROL & MTG GP-ENGINE ELEK и CONTROL & MTG GP-MACHINE.',
  },
  lights: {
    system: 'electrics',
    title: 'Фары',
    description: 'Фары на стреле и кабине; HID-фары с задержкой выключения — опция' + S(5) + '.',
  },
  monitor: {
    system: 'electrics',
    title: 'Монитор',
    description: 'Цветной ЖК-дисплей 400 × 234 пикселей; мигающая сигнальная лампа при низком давлении масла двигателя, перегреве ОЖ или гидромасла' + S(7) + '; служит экраном камеры заднего вида' + S(5) + '.',
  },
};

export const EXC_NODE_ORDER = Object.keys(N) as AnyNodeId[];

const nodes: Partial<Record<AnyNodeId, NodeInfo>> = {};
for (const id of EXC_NODE_ORDER) nodes[id] = { id, ...N[id], parts: catalogParts(id) };

export const CAT_374DL: ExcavatorModel = {
  kind: 'excavator',
  id: 'CAT-374DL',
  name: 'Cat 374D L',
  fullName: 'Caterpillar 374D L — гидравлический экскаватор',
  series: 'Caterpillar',
  tagline: 'Гусеничный экскаватор 71 т: стрела Reach 7,8 м, рукоять R3.6, ковш 3,8 м³',
  specs: [
    { label: 'Эксплуатационная масса', value: '71 132 кг' + S(17) },
    { label: 'Двигатель', value: 'Cat C15 ACERT, 355 кВт' + S(17) },
    { label: 'Ковш (базовый)', value: '3,8 м³' + S(17) },
    { label: 'Макс. глубина копания', value: '8590 мм' + S(19) },
    { label: 'Макс. вылет на уровне земли', value: '13 170 мм' + S(19) },
    { label: 'Транспортная длина / высота', value: '13 320 / 4480 мм' + S(18) },
  ],
  systemSubtitles: {
    undercarriage: 'гусеницы, катки, направляющее колесо, звёздочка',
    transmission: 'редукторы поворота и хода, опорно-поворотный круг',
    hydraulics: 'стрела, рукоять, ковш, цилиндры, насосы, распределитель, моторы',
  },
  dims: {
    // HEHH4376-02, с. 18 — Reach boom 7,8 м, R3.6
    shippingLength: 13320,
    shippingHeight: 4480,
    tailSwingRadius: 4015,
    rollerCenters: 4705,
    trackLength: 5870,
    groundClearance: 840,
    cabHeight: 3540,
    trackGaugeShipping: 2750,
    trackGaugeWorking: 3410,
    transportWidth: 3500,
    boomLength: 7800, // название стрелы, с. 18–20
    stickLength: 3600, // R3.6, с. 18–20
    bucketTipRadius: 2251, // с. 19
    // оценка — только для рисунка
    upperClearance: 1450,
    hoodHeight: 3150,
    boomFootX: 700,
    boomFootY: 2350,
    cabLength: 1900,
    cabFrontX: 2050,
  },
  nodes,
};
