import type { BulldozerModel, LayoutParams, ModelDims, ModelId, NodeId, NodeInfo, Part, SystemId } from '../../types';

/*
 * Модели Caterpillar: D6R Series II, D9R, D10T.
 * Все числа — из официальных спецификаций Caterpillar (Specalog), с указанием документа и страницы:
 *   D10T  — AEHQ6029 (01-2010), https://s7d2.scene7.com/is/content/Caterpillar/C574378
 *           (русское издание ARHQ6029 (05-2010), https://mining.tcgc.ru/assets/files/D10T_rus.pdf)
 *   D9R   — AEHQ6100-00 (2-2011), https://s7d2.scene7.com/is/content/Caterpillar/C646209
 *   D6R II — AEHQ5437 (08-02), https://s7d2.scene7.com/is/content/Caterpillar/C199010
 * Поля layout.dims с пометкой «оценка» в спецификациях не публикуются (высота капота, длина кабины и бака) —
 * подобраны по пропорциям для рисунка и в карточках не используются.
 * Тексты узлов — только факты из спецификаций; сервисные данные (разборка, моменты, допуски) в открытом доступе не найдены.
 */

/** Общий масштаб для всех Cat: по самой крупной машине (D10T), чтобы три модели были в истинном соотношении размеров */
const CAT_LIMITS = { length: 9158, height: 4098 };
export const CAT_K = Math.min(1000 / CAT_LIMITS.length, 405 / CAT_LIMITS.height);

interface CatFacts {
  id: ModelId;
  fullName: string;
  short: string;
  tagline: string;
  /** Короткое обозначение источника: «Specalog AEHQ6029» */
  src: string;
  /** Страницы спецификации: технические таблицы, отвалы/рыхлители, размеры, оборудование */
  pg: { specs: number; blades: number; dims: number; equip: number };
  /** Страница спецификации (по колонтитулу, = страница PDF) с фактами каждого узла; 0 — нет данных */
  map: Record<NodeId, number>;
  coolingText: string;
  sprocketText: string;
  finalDriveText: string;
  engine: { model: string; layout: string; displacement: string; bore: string; power: string; gross: string; rpm: string; cyl: number; vee: boolean };
  weight: string;
  transmission: string;
  torqueDivider: string;
  steering: string;
  speeds: string;
  undercarriage: { chain: string; shoe: string; shoes: number; pitch: string; grouser: string; rollers: number; carriers: string; gauge: string; tog: string; contact?: string; features: string };
  hydraulics: { pump: string; relief: string; tank: string };
  blade: { name: string; specs: string; variants: string; weightKg: number };
  ripper: { name: string; specs: string; variants: string; shanks: number };
  electrics: { alternator: string; batteries: string; system: string; monitor: string };
  capacities: string;
  /** Топливная система / управление двигателем — по описанию двигателя в спецификации */
  fuel: string;
  /** ЭБУ — что прямо названо в спецификации */
  ecu: string;
  dims: ModelDims;
  hoodNote?: string;
}

const P = (name: string, note: string): Part => ({ name, note });

function nodes(f: CatFacts): Record<NodeId, NodeInfo> {
  /** Ссылка на страницу спецификации, где приведены факты узла */
  const s = (id: NodeId, extra?: number) => {
    const pg = f.map[id];
    const pages = [pg, extra].filter((x): x is number => !!x && x > 0);
    return pages.length ? ` (${f.src}, с. ${[...new Set(pages)].join(', ')})` : '';
  };
  const n = (id: NodeId, system: SystemId, title: string, description: string, parts: Part[], modelNote?: string): NodeInfo => ({ id, system, title, description, parts, modelNote });
  const u = f.undercarriage;
  const SIS = 'Сервисные данные (разборка, моменты, допуски) — в Cat SIS (подписка, доступ у дилера) / платных публикациях Caterpillar; в открытом доступе не найдены.';
  return {
    engine: n('engine', 'engine', `Двигатель ${f.engine.model}`, `${f.engine.layout}, ${f.engine.displacement}, диаметр × ход ${f.engine.bore}. Мощность ${f.engine.power}, полная ${f.engine.gross}; номинальные обороты ${f.engine.rpm}${s('engine')}.`, [
      P('Двигатель', `${f.engine.layout}, ${f.engine.displacement}`),
      P('Топливная система', f.fuel),
    ], SIS),
    cooling: n('cooling', 'engine', 'Радиатор и вентилятор', `${f.coolingText}${s('cooling')}. Заправочные объёмы: ${f.capacities}${s('cooling', f.pg.specs)}.`, [
      P('Радиатор', f.coolingText),
    ]),
    trackChain: n('trackChain', 'undercarriage', 'Гусеница', `${u.shoe}; башмаков на сторону — ${u.shoes}, шаг ${u.pitch}, высота грунтозацепа ${u.grouser}${s('trackChain')}.`, [
      P('Цепь', u.chain),
      P('Башмаки', u.shoe),
    ], SIS),
    trackFrame: n('trackFrame', 'undercarriage', 'Рама тележки', `${u.features}${s('trackFrame')}. Колея ${u.gauge}, длина гусеницы на грунте ${u.tog}${u.contact ? `, площадь контакта ${u.contact}` : ''}${s('trackFrame', f.pg.specs)}.`, [
      P('Рамы катков', 'Ось качания и балансир (по спецификации)'),
    ], SIS),
    trackRollers: n('trackRollers', 'undercarriage', 'Опорные катки', `Опорных катков на сторону: ${u.rollers}${s('trackRollers')}.`, [P('Опорные катки', `${u.rollers} на сторону`)], SIS),
    carrierRollers: n('carrierRollers', 'undercarriage', 'Поддерживающие катки (опция)', `${u.carriers}. На схеме показан пунктиром как опция.`, [P('Поддерживающий каток', 'Опция')]),
    idler: n('idler', 'undercarriage', 'Натяжные колёса (переднее и заднее)', `Элевированная ходовая Cat: лента огибает два натяжных колеса и поднятую звёздочку (треугольный обвод)${s('idler')}.`, [P('Переднее натяжное колесо', 'С механизмом натяжения'), P('Заднее натяжное колесо', 'Под звёздочкой')], SIS),
    sprocket: n('sprocket', 'undercarriage', 'Ведущая звёздочка (поднятая)', `${f.sprocketText}${s('sprocket')}.`, [P('Сегменты звёздочки', 'Сменные')], SIS),
    torqueConverter: n('torqueConverter', 'transmission', 'Делитель момента (гидротрансформатор)', `${f.torqueDivider}${s('torqueConverter')}.`, [P('Гидротрансформатор', 'Одноступенчатый, с делителем момента')], SIS),
    gearbox: n('gearbox', 'transmission', 'КПП (планетарная, powershift)', `${f.transmission}. Скорости: ${f.speeds}${s('gearbox', f.pg.specs)}.`, [P('Планетарная КПП', '3 вперёд / 3 назад')], SIS),
    steering: n('steering', 'transmission', 'Механизм поворота', `${f.steering}${s('steering')}.`, [P('Механизм поворота', f.steering.split(':')[0])], SIS),
    finalDrive: n('finalDrive', 'transmission', 'Бортовой редуктор (поднятый)', `${f.finalDriveText}${s('finalDrive')}.`, [P('Бортовой редуктор', 'Поднят над грунтом вместе со звёздочкой')], SIS),
    pumps: n('pumps', 'hydraulics', 'Гидронасос навесного оборудования', `${f.hydraulics.pump}. Бак гидросистемы ${f.hydraulics.tank}${s('pumps')}.`, [P('Насос', f.hydraulics.pump), P('Предохранительные клапаны', f.hydraulics.relief)], SIS),
    blade: n('blade', 'hydraulics', f.blade.name, `${f.blade.specs}${s('blade')}. Варианты: ${f.blade.variants}.`, [P('Отвал', f.blade.name)], SIS),
    bladeCylinders: n('bladeCylinders', 'hydraulics', 'Цилиндры подъёма / перекоса отвала', `Настройки предохранительных клапанов: ${f.hydraulics.relief}${s('bladeCylinders')}.`, [P('Цилиндры подъёма', '2 шт.'), P('Цилиндр перекоса', 'по схеме')], SIS),
    ripper: n('ripper', 'hydraulics', f.ripper.name, `${f.ripper.specs}${s('ripper')}. Варианты: ${f.ripper.variants}.`, [P('Рыхлитель', `Зубьев на схеме: ${f.ripper.shanks}`)], SIS),
    ripperCylinders: n('ripperCylinders', 'hydraulics', 'Цилиндры рыхлителя', `Цилиндры подъёма и наклона рыхлителя; настройки клапанов: ${f.hydraulics.relief}${s('ripperCylinders')}.`, [P('Цилиндры подъёма', '2 шт.'), P('Цилиндры наклона', '2 шт.')], SIS),
    batteries: n('batteries', 'electrics', 'АКБ', `${f.electrics.batteries}; ${f.electrics.system}${s('batteries')}.`, [P('АКБ', f.electrics.batteries)]),
    alternator: n('alternator', 'electrics', 'Генератор', `${f.electrics.alternator}${s('alternator')}.`, [P('Генератор', f.electrics.alternator)]),
    starter: n('starter', 'electrics', 'Стартер', `Электрический пуск, ${f.electrics.system}${s('starter')}. Параметры стартера в спецификации не указаны.`, [P('Стартер', '24 В')], SIS),
    wiring: n('wiring', 'electrics', 'Жгуты и разъёмы', 'Электросхема в открытых документах Caterpillar не найдена (Cat SIS).', [P('Жгуты', 'данные из мануала не найдены')], SIS),
    fuseBox: n('fuseBox', 'electrics', 'Предохранители и реле', 'Данные в открытой спецификации не найдены (Cat SIS).', [P('Блок предохранителей', 'данные из мануала не найдены')], SIS),
    controllers: n('controllers', 'electrics', 'ЭБУ / контроллеры', `${f.ecu}${s('controllers')}.`, [P('Управление', f.ecu)], SIS),
    lights: n('lights', 'electrics', 'Фары', `Рабочее освещение — по перечню стандартного и дополнительного оборудования${s('lights')}.`, [P('Фары', 'Комплектация зависит от исполнения')]),
    monitor: n('monitor', 'electrics', 'Монитор и приборы', `${f.electrics.monitor}${s('monitor')}.`, [P('Монитор', f.electrics.monitor)]),
  };
}

function catModel(f: CatFacts, layout: Omit<LayoutParams, 'dims' | 'brand' | 'drive' | 'fixedK' | 'carrierOptional' | 'engineArt' | 'animExtras' | 'hood' | 'cab'>): BulldozerModel {
  return {
    id: f.id,
    name: f.short,
    series: 'Caterpillar',
    fullName: f.fullName,
    tagline: f.tagline,
    specs: [
      { label: 'Двигатель', value: `${f.engine.model} (${f.engine.layout.toLowerCase()}, ${f.engine.displacement})` },
      { label: 'Мощность', value: f.engine.power },
      { label: 'Эксплуатационная масса', value: f.weight },
      { label: 'Ходовая', value: 'Элевированная звёздочка (high-drive)' },
      { label: 'Источник', value: `${f.src}, с. ${f.pg.specs}, ${f.pg.blades}, ${f.pg.dims}` },
    ],
    layout: {
      ...layout,
      // Перед капота = перед базового трактора (паспортная «длина базового трактора»); задний край гусеницы = длина с отвалом.
      // Xtr0 = L − 2·Ri − TOG = L − 1,3·TOG, перед трактора = L − basicLength ⇒ вынос = basicLength − 1,3·TOG.
      dims: { ...f.dims, hoodOverhang: Math.max(0, (f.dims.basicLength ?? 0) - 1.3 * f.dims.trackOnGround) },
      hood: 'cat',
      cab: 'modern',
      brand: 'CAT',
      drive: 'elevated',
      fixedK: CAT_K,
      carrierOptional: true,
      engineArt: { cyl: f.engine.cyl, vee: f.engine.vee, label: `${f.engine.vee ? 'V' : 'R'}${f.engine.cyl} · ${f.engine.displacement.replace('.', ',')}` },
      animExtras: true,
    },
    nodes: nodes(f),
  };
}

/* ======================= D10T (Specalog AEHQ6029, 01-2010) ======================= */
const D10T_FACTS: CatFacts = {
  id: 'CAT-D10T',
  fullName: 'Caterpillar D10T',
  short: 'D10T',
  tagline: 'Тяжёлый гусеничный трактор 66 т, C27 ACERT 433 кВт, элевированная звёздочка',
  src: 'Specalog D10T AEHQ6029',
  pg: { specs: 12, blades: 13, dims: 14, equip: 15 },
  map: {
    engine: 12, cooling: 15, trackChain: 12, trackFrame: 7, trackRollers: 12, carrierRollers: 12, idler: 7, sprocket: 7,
    torqueConverter: 6, gearbox: 6, steering: 6, finalDrive: 6, pumps: 12, blade: 13, bladeCylinders: 12, ripper: 13,
    ripperCylinders: 12, batteries: 15, alternator: 15, starter: 15, wiring: 0, fuseBox: 0, controllers: 3, lights: 15, monitor: 4,
  },
  coolingText: 'Advanced Modular Cooling System (AMOCS), вентилятор всасывающего типа с гидроприводом по потребности; раздельный охладитель наддувочного воздуха «воздух-воздух»',
  sprocketText: 'Сегменты ведущих колёс — из стали Caterpillar Tough Steel с точной механической обработкой; катки и натяжные колёса герметизированы уплотнениями Duo-Cone',
  finalDriveText: 'Поднятые бортовые редукторы (Elevated Final Drives) изолированы от ударных нагрузок с грунта и от оборудования; шестерни со шлифованным (crown-shaved) профилем, разбрызгивающая смазка и уплотнения Duo-Cone',
  engine: { model: 'Cat C27 ACERT', layout: 'V12, дизель', displacement: '27 л', bore: '137,2 × 152,4 мм', power: '433 кВт (580 л. с.)', gross: '482 кВт (SAE J1995)', rpm: '1800 об/мин', cyl: 12, vee: true },
  weight: '66 451 кг (транспортная 48 263 кг)',
  transmission: 'Планетарная коробка передач с переключением под нагрузкой, 3 передачи вперёд / 3 назад, электронное управление давлением в муфтах',
  torqueDivider: 'Одноступенчатый гидротрансформатор с выходным делителем момента: 75 % момента двигателя — через гидротрансформатор, 25 % — напрямую через вал',
  steering: 'Бортовые фрикционы и тормоза с управлением Finger Tip Control: многодисковые, маслоохлаждаемые, фрикционы включаются гидравликой с электронным управлением; тормоза включаются пружинами и выключаются гидравликой',
  speeds: 'вперёд 4,0 / 7,2 / 12,7 км/ч; назад 5,2 / 9,0 / 15,8 км/ч',
  undercarriage: {
    chain: 'Гусеница PPR (Positive Pin Retention), герметизированная и смазанная', shoe: 'Башмаки Extreme Service 610 мм', shoes: 44, pitch: '260 мм', grouser: '93 мм', rollers: 8,
    carriers: 'Поддерживающие катки: 1 на сторону — опция (Specalog AEHQ6029, с. 12; стойка встроена в раму катков, с. 7)',
    gauge: '2550 мм', tog: '3872 мм (в таблице ходовой — 3885 мм, с. 12)', contact: '4,7 м²',
    features: 'Подвеска тележек (bogie): до 15 % больше площади контакта; ходовая с подвеской гасит до 50 % ударных нагрузок; трубчатые рамы катков; ось качания и балансир',
  },
  hydraulics: { pump: 'Шестерённый насос; расход в цилиндрах подъёма 404 л/мин, перекоса 112 л/мин', relief: 'отвал 18 790 кПа, перекос 20 340 кПа, рыхлитель (подъём/наклон) 18 790 кПа', tank: '144 л' },
  blade: { name: 'Отвал 10SU', specs: 'Ёмкость 18,5 м³, ширина 4860 мм, высота 2120 мм, заглубление 674 мм, подъём над грунтом 1497 мм, макс. перекос 993 мм, масса 10 229 кг (без гидроуправления)', variants: '10U — 22 м³, ширина 5260 мм, перекос 1074 мм, масса 10 784 кг', weightKg: 10229 },
  ripper: { name: 'Рыхлитель одностоечный', specs: 'Одностоечный, регулируемый параллелограмм: прирост длины 1760 мм, подъём наконечника 1058 мм, глубина 1494 мм, усилие внедрения 205 кН, вырывное 415,3 кН, масса 7117 кг', variants: 'многостоечный (3 гнезда), балка 2920 мм, глубина 876 мм, масса 7968 кг, доп. стойка 526,2 кг', shanks: 1 },
  electrics: { alternator: 'Генератор 95 А', batteries: 'АКБ 12 В × 2, 200 А·ч', system: 'система 24 В', monitor: 'Cat Monitoring Display / Advisor — контроль систем и регистрация событий' },
  capacities: 'топливо 1204 л, охлаждение 151 л, картер 76 л, силовая передача 193 л, бортовые редукторы 23 л (каждый), рамы катков 64 л (каждая), ось качания 33 л, гидробак 144 л',
  fuel: 'Насос-форсунки MEUI с электронным управлением',
  ecu: 'ЭБУ двигателя ADEM A4 (управляет подачей топлива); электронное управление силовой передачей и давлением в муфтах',
  dims: {
    overallLength: 9158, trackOnGround: 3872, cabHeight: 4098, exhaustHeight: 4505, bladeHeight: 2120, bladeWidth: 4860, groundClearance: 664,
    trackGauge: 2550, shoeWidth: 610, grouser: 93, sprocketToRipper: 9158 - (7416 - 0.15 * 3872 - 0.06 * 3872), ripperLift: 1058, ripperDepth: 1494,
    bladeLift: 1497, bladeDrop: 674, hoodHeight: 2900, hoodOverhang: 0 /* вычисляется в catModel */, cabLength: 2000, tankLength: 1150, lengthWithBlade: 7416, basicLength: 5339,
  },
};

/* ======================= D9R (Specalog AEHQ6100-00, 2-2011) ======================= */
const D9R_FACTS: CatFacts = {
  id: 'CAT-D9R',
  fullName: 'Caterpillar D9R',
  short: 'D9R',
  tagline: 'Гусеничный трактор 48,8 т, Cat 3408C 302 кВт, элевированная звёздочка',
  src: 'Specalog D9R AEHQ6100-00',
  pg: { specs: 14, blades: 15, dims: 13, equip: 16 },
  map: {
    engine: 14, cooling: 4, trackChain: 14, trackFrame: 9, trackRollers: 14, carrierRollers: 17, idler: 9, sprocket: 9,
    torqueConverter: 6, gearbox: 5, steering: 5, finalDrive: 9, pumps: 14, blade: 15, bladeCylinders: 14, ripper: 15,
    ripperCylinders: 14, batteries: 16, alternator: 16, starter: 16, wiring: 0, fuseBox: 0, controllers: 3, lights: 16, monitor: 7,
  },
  coolingText: 'Advanced Modular Cooling System (AMOCS): двухпроходная схема, отдельные сердцевины-модули на секционном нижнем бачке, без верхнего бачка; латунные трубки, 9 рёбер на дюйм',
  sprocketText: 'Поднятая звёздочка передаёт ударные нагрузки от оборудования на основную раму, разгружая звёздочки, бортовые редукторы, полуоси и механизм поворота; больше гусеницы позади рамы катков — выше тяга и устойчивость',
  finalDriveText: 'Бортовые редукторы подняты вместе со звёздочкой и не воспринимают ударные нагрузки от оборудования (Elevated Sprocket)',
  engine: { model: 'Cat 3408C', layout: 'V8, дизель DITA', displacement: '18 л', bore: '137 × 152 мм', power: '302 кВт (405 л. с.) нетто', gross: '330 кВт', rpm: '1900 об/мин', cyl: 8, vee: true },
  weight: '48 784 кг (транспортная 36 154 кг)',
  transmission: 'Планетарная коробка передач Cat с переключением под нагрузкой, 3 передачи вперёд / 3 назад, маслоохлаждаемые пакеты муфт; одним рычагом задаются скорость и направление',
  torqueDivider: 'Одноступенчатый гидротрансформатор с делителем момента: 75 % момента двигателя — через гидротрансформатор, 25 % — напрямую через вал; обгонный (freewheel) реактор',
  steering: 'Бортовые фрикционы и тормоза (clutch/brake steering): рычаги управления совмещают выключение фрикциона и торможение каждой гусеницы',
  speeds: 'вперёд 3,9 / 6,8 / 11,9 км/ч; назад 4,8 / 8,4 / 14,7 км/ч',
  undercarriage: {
    chain: 'Гусеница PPR (Positive Pin Retention), герметизированная и смазанная', shoe: 'Башмаки Extreme Service 610 мм', shoes: 43, pitch: '240 мм', grouser: '84 мм', rollers: 8,
    carriers: 'Поддерживающие катки — дополнительное оборудование (Specalog AEHQ6100-00, с. 17)',
    gauge: '2250 мм', tog: '3474 мм', contact: '4,24 м²',
    features: 'Ходовая с подвеской тележек (bogie), гусеница PPR (Positive Pin Retention) герметизированная смазанная; ось качания и шарнирный балансир',
  },
  hydraulics: { pump: 'Поршневой насос с приводом от маховика; подача (навесное оборудование) 239 л/мин', relief: 'отвал 26 200 кПа, перекос 19 300 кПа, рыхлитель (подъём и наклон) 26 200 кПа', tank: '77,2 л' },
  blade: { name: 'Отвал 9SU', specs: 'Ёмкость 13,5 м³, ширина 4310 мм, высота 1934 мм, заглубление 606 мм, подъём над грунтом 1422 мм, макс. перекос 940 мм, масса 6543 кг', variants: '9U — 16,4 м³, ширина 4650 мм, перекос 1014 мм, масса 7134 кг', weightKg: 6543 },
  ripper: { name: 'Рыхлитель одностоечный', specs: 'Одностоечный, регулируемый параллелограмм: прирост длины 1570 мм, подъём наконечника 882 мм, глубина 1231 мм, масса 4854 кг', variants: 'многостоечный (3 гнезда), балка 2640 мм, прирост длины 1330 мм, масса 5449 кг', shanks: 1 },
  electrics: { alternator: 'Генератор 75 А (опция 100 А)', batteries: 'АКБ 12 В × 2, 190 А·ч', system: 'система 24 В', monitor: 'Monitoring System: указатели температуры ОЖ, гидромасла, масла силовой передачи, уровня топлива; индикаторы давления масла двигателя, потока ОЖ, электросистемы, фильтра КПП' },
  capacities: 'топливо 889 л, охлаждение 125 л, картер 45,5 л, силовая передача 164 л, бортовые редукторы 15 л (каждый), рамы катков 45 л (каждая), ось качания 30 л, гидробак 77,2 л',
  fuel: 'Механическое управление двигателем (по спецификации — упрощает диагностику в удалённых районах)',
  ecu: 'Двигатель с механическим управлением; электронная диагностика системы мониторинга через Cat ET (Electronic Technician)',
  dims: {
    overallLength: 8214, trackOnGround: 3474, cabHeight: 3821, exhaustHeight: 4005, bladeHeight: 1934, bladeWidth: 4310, groundClearance: 588,
    trackGauge: 2250, shoeWidth: 610, grouser: 84, sprocketToRipper: 8214 - (6592 - 0.15 * 3474 - 0.06 * 3474), ripperLift: 882, ripperDepth: 1231,
    bladeLift: 1422, bladeDrop: 606, hoodHeight: 2650, hoodOverhang: 0 /* вычисляется в catModel */, cabLength: 1850, tankLength: 1000, lengthWithBlade: 6592, basicLength: 4908,
  },
};

/* ======================= D6R Series II (AEHQ5437, 08-02) ======================= */
const D6R_FACTS: CatFacts = {
  id: 'CAT-D6R',
  fullName: 'Caterpillar D6R Series II',
  short: 'D6R II',
  tagline: 'Средний гусеничный трактор 18,3 т, C9 123 кВт (STD), элевированная звёздочка',
  src: 'Specalog D6R Series II AEHQ5437',
  pg: { specs: 16, blades: 19, dims: 20, equip: 21 },
  map: {
    engine: 16, cooling: 5, trackChain: 16, trackFrame: 13, trackRollers: 16, carrierRollers: 21, idler: 13, sprocket: 13,
    torqueConverter: 6, gearbox: 16, steering: 7, finalDrive: 7, pumps: 17, blade: 19, bladeCylinders: 17, ripper: 17,
    ripperCylinders: 17, batteries: 21, alternator: 21, starter: 21, wiring: 0, fuseBox: 0, controllers: 9, lights: 22, monitor: 9,
  },
  coolingText: 'Advanced Modular Cooling System (AMOCS): двухпроходный радиатор, сердцевины заменяются по одной без снятия всего радиатора, нет верхнего бачка',
  sprocketText: 'Элевированная звёздочка Caterpillar; исполнения ходовой STD / XL / XW / LGP',
  finalDriveText: 'Поднятый бортовой редуктор (Elevated Final Drive) изолирован от ударных нагрузок с грунта и от рабочего оборудования — дольше срок службы силовой передачи',
  engine: { model: 'Cat C9', layout: 'R6, дизель', displacement: '8,8 л', bore: '112 × 149 мм', power: '123 кВт (165 л. с.) — STD; 138 кВт (185 л. с.) — XL/XW/LGP', gross: '141 кВт (STD)', rpm: '2000 об/мин', cyl: 6, vee: false },
  weight: '18 322 кг (STD, Finger Tip Control); 18 622 кг (дифференциальный поворот)',
  transmission: 'Планетарная коробка передач с переключением под нагрузкой, 3 передачи вперёд / 3 назад, электронное управление давлением в муфтах',
  torqueDivider: 'Одноступенчатый гидротрансформатор с делителем момента: 70 % момента двигателя — через гидротрансформатор, остальное — напрямую',
  steering: 'Исполнения: бортовые фрикционы и тормоза с управлением Finger Tip Control или дифференциальный поворот (поворот без отключения мощности на гусеницу)',
  speeds: 'вперёд 3,8 / 6,6 / 11,5 км/ч; назад 4,8 / 8,4 / 14,6 км/ч',
  undercarriage: {
    chain: 'Стандартно: гусеница с башмаками Moderate Service, гидравлический натяжитель, катки со смазкой на весь срок службы (с. 21)', shoe: 'Башмаки Moderate Service 560 мм (STD)', shoes: 39, pitch: '203 мм', grouser: '65 мм', rollers: 6,
    carriers: 'Поддерживающие катки: стандарт на XL/XW/LGP; для STD — опция (+156 кг) (Specalog AEHQ5437, с. 21–22)',
    gauge: '1880 мм', tog: '2610 мм', contact: '2,92 м²',
    features: 'Элевированная звёздочка, ось качания (болтовое крепление к раме) и шарнирный балансир',
  },
  hydraulics: { pump: 'Подача насоса 212 л/мин (фрикционы/тормоза) или 217 л/мин (дифф. поворот) при 2125 об/мин; цилиндры подъёма 190 л/мин, перекоса 80 л/мин, рыхлителя 160 л/мин', relief: 'главный клапан 19 300 кПа (фрикционы/тормоза) / 42 000 кПа (дифф. поворот); отвал, перекос, рыхлитель — 19 300 кПа; поворот 38 000 кПа', tank: '47,3 л' },
  blade: { name: 'Отвал SU', specs: 'Ёмкость 5,61 м³, ширина 3260 мм, высота 1412 мм, заглубление 473 мм, подъём над грунтом 1104 мм, макс. перекос 743 мм, масса 2699 кг (STD)', variants: 'S, A, PAT (по исполнениям STD/XL/XW/LGP)', weightKg: 2699 },
  ripper: { name: 'Рыхлитель многостоечный', specs: 'Фиксированный параллелограмм, балка 2202 мм (сечение 216 × 254 мм), глубина 500 мм, подъём наконечника 511 мм, 3 гнезда, масса с одной стойкой 1634 кг, каждая доп. стойка 74 кг', variants: 'по числу стоек (1–3)', shanks: 3 },
  electrics: { alternator: 'Генератор 70 А, бесщёточный', batteries: 'АКБ 12 В × 2, необслуживаемые', system: 'система 24 В', monitor: 'Caterpillar Monitoring System — контроль систем машины' },
  capacities: 'топливо 382,3 л, охлаждение 76,8 л, картер 28 л, силовая передача 145,7 л, бортовые редукторы 13,6 л (каждый), рамы катков 24,6 л (каждая), гидробак 47,3 л, ось качания 1,9 л',
  fuel: 'Топливная система с электронным управлением, гидравлическим приводом и непосредственным впрыском; турбокомпрессор с перепускным клапаном',
  ecu: 'Электронное управление топливной системой двигателя; электронное управление поворотом и КПП (Electronic Steering and Transmission), диагностика Cat ET / ECAP',
  dims: {
    // Габаритная длина = базовый трактор 3860 + SU-отвал 1235 + многостоечный рыхлитель 1403 мм (сумма паспортных величин, с. 20)
    overallLength: 3860 + 1235 + 1403, trackOnGround: 2610, cabHeight: 3195, exhaustHeight: 3143, bladeHeight: 1412, bladeWidth: 3260, groundClearance: 383,
    trackGauge: 1880, shoeWidth: 560, grouser: 65, sprocketToRipper: 1403 + 0.15 * 2610 + 0.06 * 2610, ripperLift: 511, ripperDepth: 500,
    bladeLift: 1104, bladeDrop: 473, hoodHeight: 2150, hoodOverhang: 0 /* вычисляется в catModel */, cabLength: 1500, tankLength: 760, lengthWithBlade: 3860 + 1235, basicLength: 3860,
  },
};

const common = (f: CatFacts, extra: { stacks?: 1 | 2; bogie: boolean; dualTilt: boolean; steeringLabel: string; bladeLabel: string }) =>
  catModel(f, {
    trackRollers: f.undercarriage.rollers,
    carrierRollers: 1,
    ripperShanks: f.ripper.shanks,
    engineLabel: `Двигатель ${f.engine.model}`,
    badge: f.short.replace(' II', ''),
    bladeType: 'u',
    stacks: 1 as 1 | 2,
    ...extra,
  });

export const CAT_D10T = common(D10T_FACTS, { stacks: 2, bogie: true, dualTilt: false, steeringLabel: 'Фрикционы и тормоза', bladeLabel: 'Отвал 10SU' });
export const CAT_D9R = common(D9R_FACTS, { bogie: true, dualTilt: false, steeringLabel: 'Фрикционы и тормоза', bladeLabel: 'Отвал 9SU' });
export const CAT_D6R = common(D6R_FACTS, { bogie: false, dualTilt: false, steeringLabel: 'Механизм поворота', bladeLabel: 'Отвал SU' });

export const CAT_FACTS = { 'CAT-D10T': D10T_FACTS, 'CAT-D9R': D9R_FACTS, 'CAT-D6R': D6R_FACTS } as const;
export const CAT_MODEL_IDS: ModelId[] = ['CAT-D6R', 'CAT-D9R', 'CAT-D10T'];
