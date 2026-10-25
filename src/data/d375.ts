import type { LayoutParams } from '../types';
import { specModel, classicElectrics, modernElectrics } from './specModel';

const base = (o: Partial<LayoutParams> & Pick<LayoutParams, 'dims' | 'badge'>): LayoutParams => ({
  trackRollers: 8,
  carrierRollers: 2,
  ripperShanks: 1,
  engineLabel: 'Двигатель 6D170',
  steeringLabel: 'Фрикционы и тормоза поворота',
  cab: 'modern',
  bladeLabel: 'Отвал Semi-U',
  bladeType: 'u',
  hood: 'angular',
  bogie: true,
  dualTilt: false,
  stacks: 1,
  ...o,
});

const steeringCB = 'Мокрые многодисковые фрикционы поворота и тормоза (clutch & brake)';

/*
 * Komatsu D375A-3.
 * Источник: Komatsu, спецификация D375A-3 (копия): https://cdn.machine.market/specifications/komatsu-dozers-spec-d6d070.pdf
 *   A колея 2500, B ширина отвала 4695, C высота по выхлопу 4045, D высота отвала 2265, E гусеница на грунте 3840,
 *   F габаритная длина 10060, G звёздочка→рыхлитель 3450, H подъём рыхлителя 1435, I глубина рыхления 1060,
 *   J высота по кабине 4230, просвет 610; SA6D170E, 391 кВт (525 л.с.) нетто @ 1800, 23,15 л, регулятор механический;
 *   масса 66 740 кг (Semi-U с двойным перекосом, giant ripper); 40 башмаков 610 мм, грунтозацеп 93, 7 опорных катков,
 *   X-образные тележки; Semi-U 18,5 м³, Full-U 22,0 м³.
 * Справочник (https://heavy-spec.com/crawler-tractor/7811-komatsu-d375a-3.html): 2 поддерживающих катка; отвал 4695 × 2265, заглубление 715.
 * Подъём отвала в источниках не найден — оценка.
 */
export const D375A3 = specModel({
  id: 'D375A-3',
  series: 'D375',
  fullName: 'Komatsu D375A-3',
  tagline: 'Карьерный бульдозер класса 67 т (1990-е)',
  source: 'спецификация Komatsu D375A-3',
  engine: { model: 'SA6D170E', layout: 'Рядный 6-цилиндровый', displacement: '23,15 л', power: '391 кВт (525 л.с.) нетто @ 1800 об/мин' },
  weight: '66,74 т',
  layout: base({
    dims: {
      overallLength: 10060, trackOnGround: 3840, cabHeight: 4230, exhaustHeight: 4045, bladeHeight: 2265, bladeWidth: 4695,
      groundClearance: 610, trackGauge: 2500, shoeWidth: 610, grouser: 93, sprocketToRipper: 3450, ripperLift: 1435, ripperDepth: 1060,
      bladeLift: 1600, // оценка
      bladeDrop: 715,
      hoodHeight: 2850, // оценка
      hoodOverhang: 520, // оценка
      cabLength: 2000, // оценка
      tankLength: 1050, // оценка
    },
    trackRollers: 7,
    badge: 'D375A-3',
    engineLabel: 'Двигатель SA6D170E',
    cab: 'classic',
    dualTilt: true,
  }),
  shoes: '40 башмаков 610 мм на сторону, грунтозацеп 93 мм, площадь контакта 46 766 см² (по спецификации).',
  suspension: 'Балансир и ось качания; катки на X-образных тележках с резиновыми подушками; 7 опорных катков (по спецификации).',
  torqueConverter: 'Гидротрансформатор в составе трансмиссии TORQFLOW. Подробности конструкции в использованной спецификации не найдены.',
  gearbox: 'Трансмиссия TORQFLOW с планетарной КПП. Подробности — в Shop Manual (не использовался).',
  finalDrive: 'Конструкция бортовых редукторов в использованной спецификации не описана.',
  pumps: { description: 'Параметры гидронасосов в использованной части спецификации не найдены.', parts: [] },
  blade: { description: 'Semi-U 18,5 м³ (4695 × 2265 мм) или Full-U 22,0 м³; в массе учтён Semi-U с двойным перекосом (по спецификации).', variants: 'Semi-U 18,5 м³, Full-U 22,0 м³' },
  ripper: { description: 'Гигантский рыхлитель: подъём 1435 мм, глубина 1060 мм (буквенные размеры H/I спецификации).', variants: 'Giant ripper' },
  electrics: classicElectrics('—', '—', '—'),
  steeringNote: 'Тип механизма поворота в использованной части спецификации не указан; показаны фрикционы и тормоза (как у D375A-5) — оценка',
});

/*
 * Komatsu D375A-5.
 * Источник: Komatsu Europe, брошюра D375A-5 EESS015306 (01/2009): https://www.komatsu.eu/Assets/GetBrochureByProductName.aspx?id=D375A-5&langID=en
 *   A 2500, B 4695, C 4265, D 2265, E 3980, F 10410, G 3450, H 1435, I 1370, J 4285, просвет 610;
 *   SAA6D170E-5 (Common Rail), ISO 14396 452 кВт / 606 л.с., ISO 9249 нетто 391 кВт / 524 л.с. @ 1800, 23,15 л;
 *   масса 69 560 кг; 41 башмак 610 мм, грунтозацеп 93, 8 опорных и 2 поддерживающих катка, K-Bogie;
 *   Semi-U: длина с отвалом 7635, 18,5 м³, подъём 1660, заглубление 715; ГДТ с блокировкой; фрикционы и тормоза (ECMV);
 *   стартер 24 В / 7,5 кВт, генератор 24 В / 90 А, АКБ 2 × 12 В / 170 А·ч; насос шестерённый 405 л/мин, 210 кгс/см².
 */
export const D375A5 = specModel({
  id: 'D375A-5',
  series: 'D375',
  fullName: 'Komatsu D375A-5',
  tagline: 'Карьерный бульдозер класса 70 т с Common Rail и VHMS',
  source: 'брошюра Komatsu Europe D375A-5 (EESS015306)',
  engine: { model: 'SAA6D170E-5', layout: 'Рядный 6-цилиндровый', displacement: '23,15 л', power: '391 кВт (524 л.с.) нетто ISO 9249; 452 кВт ISO 14396' },
  weight: '69,56 т',
  layout: base({
    dims: {
      overallLength: 10410, trackOnGround: 3980, cabHeight: 4285, exhaustHeight: 4265, bladeHeight: 2265, bladeWidth: 4695,
      groundClearance: 610, trackGauge: 2500, shoeWidth: 610, grouser: 93, sprocketToRipper: 3450, ripperLift: 1435, ripperDepth: 1370,
      bladeLift: 1660, bladeDrop: 715,
      hoodHeight: 2900, // оценка
      hoodOverhang: 500, // оценка
      cabLength: 2100, // оценка
      tankLength: 1100, // оценка
    },
    badge: 'D375A-5',
    engineLabel: 'Двигатель SAA6D170E-5',
  }),
  shoes: '41 башмак 610 мм на сторону, грунтозацеп 93 мм, площадь контакта 48 560 см² (по брошюре).',
  suspension: 'K-Bogie: катки парами на тележках; балансир и ось качания; натяжение — пружинно-гидравлическое (по брошюре).',
  torqueConverter: '3-элементный одноступенчатый однофазный ГДТ с водяным охлаждением и муфтой блокировки (по брошюре).',
  gearbox: 'TORQFLOW: планетарная КПП с многодисковыми муфтами, 3 вперёд / 3 назад, клапаны ECMV; до 11,8 км/ч вперёд и 15,8 км/ч назад (по брошюре).',
  finalDrive: 'Цилиндрическая одноступенчатая и планетарная одноступенчатая передачи, разбрызгивающая смазка; сегментные зубья звёздочки (по брошюре).',
  pumps: {
    description: 'CLSS; основной насос шестерённый, до 405 л/мин, предохранительный клапан 210 кгс/см² (по брошюре).',
    parts: [{ name: 'Шестерённый насос', note: '405 л/мин (по брошюре)' }],
  },
  blade: { description: 'Semi-U 4695 × 2265 мм, 18,5 м³; подъём 1660 мм, заглубление 715 мм (по брошюре).', variants: 'Semi-U 18,5 м³, U 22,0 м³; одинарный или двойной перекос' },
  ripper: { description: 'Гигантский рыхлитель: подъём 1470 мм, глубина 1370 мм, глубина регулируется в 3 положениях (по брошюре).', variants: 'Giant ripper или многостоечный (3 зуба)' },
  electrics: modernElectrics('24 В / 90 А', '2 × 12 В / 170 А·ч', '24 В / 7,5 кВт', 'Электронный регулятор двигателя, контроллер силовой передачи, система VHMS (по брошюре).'),
  steeringNote: steeringCB + ', управление ECMV, PCCS; радиус поворота 4,2 м',
});

/*
 * Komatsu D375A-6.
 * Источник: Komatsu, спецификация CEN00372-03 D375A-6:
 *   https://www.komatsu.com/content/dam/komatsu/websites/south-africa/documents/product-spec-sheets/tracked_dozer_d375a-6_spec_sheet.pdf
 *   A 2500, B 4775, C 4265, D 2265, E 3980, F 10485, G 3460, H 1485, I 1100, J 4285, просвет 610;
 *   масса 71 640 кг; Semi-U: длина с отвалом 7780, 18,5 м³, 4775 × 2265, подъём 1690, заглубление 735; CLSS, поршневой насос 366 л/мин, 27,5 МПа.
 * Komatsu Europe (https://www.komatsu.eu/Assets/GetBrochureByProductName.aspx?id=D375A-6&langID=en): SAA6D170E-5, 455 кВт / 610 л.с. нетто ISO 9249,
 *   474 кВт ISO 14396, 170 × 170, 23,15 л, электронный регулятор, гидропривод вентилятора.
 * Число катков и грунтозацеп для D375A-6 в прочитанной части не найдены — приняты как у D375A-5/-8 (оценка).
 */
export const D375A6 = specModel({
  id: 'D375A-6',
  series: 'D375',
  fullName: 'Komatsu D375A-6',
  tagline: 'Карьерный бульдозер класса 72 т',
  source: 'спецификация Komatsu D375A-6 (CEN00372-03)',
  engine: { model: 'SAA6D170E-5', layout: 'Рядный 6-цилиндровый', displacement: '23,15 л', power: '455 кВт (610 л.с.) нетто ISO 9249' },
  weight: '71,64 т',
  layout: base({
    dims: {
      overallLength: 10485, trackOnGround: 3980, cabHeight: 4285, exhaustHeight: 4265, bladeHeight: 2265, bladeWidth: 4775,
      groundClearance: 610, trackGauge: 2500,
      shoeWidth: 610, // оценка (стандарт D375A-5/-8)
      grouser: 93, // оценка
      sprocketToRipper: 3460, ripperLift: 1485, ripperDepth: 1100, // H/I — трактовка букв как у D475A-8
      bladeLift: 1690, bladeDrop: 735,
      hoodHeight: 2900, // оценка
      hoodOverhang: 480, // оценка
      cabLength: 2150, // оценка
      tankLength: 1100, // оценка
    },
    badge: 'D375A-6',
    engineLabel: 'Двигатель SAA6D170E-5',
    hood: 'slant',
  }),
  shoes: 'Стандартный башмак 610 мм (оценка — в прочитанной части спецификации не указан).',
  suspension: 'K-Bogie, 8 опорных и 2 поддерживающих катка — оценка по D375A-5/-8.',
  torqueConverter: 'Параметры ГДТ в прочитанной части спецификации не найдены.',
  gearbox: 'Трансмиссия TORQFLOW (по брошюре Komatsu Europe). Подробности в прочитанной части не найдены.',
  finalDrive: 'Конструкция бортовых редукторов в прочитанной части спецификации не описана.',
  pumps: {
    description: 'CLSS; поршневой насос переменной производительности 366 л/мин, предохранительный клапан 27,5 МПа; цилиндры: подъём 2 × 140 мм, перекос 200 мм, рыхлитель 2 × 200 / 2 × 180 мм (по спецификации).',
    parts: [{ name: 'Поршневой насос', note: '366 л/мин (по спецификации)' }],
  },
  blade: { description: 'Semi-U 4775 × 2265 мм, 18,5 м³; подъём 1690 мм, заглубление 735 мм (по спецификации).', variants: 'Semi-U 18,5 м³, U 22,0 м³, двойной перекос' },
  ripper: { description: 'Гигантский рыхлитель (размеры H/I спецификации).', variants: 'Giant ripper или многостоечный' },
  electrics: modernElectrics('—', '—', '—', 'Электронный регулятор двигателя (по брошюре).'),
  steeringNote: 'Тип механизма поворота в прочитанной части не указан; показаны фрикционы и тормоза, как у D375A-5/-8 — оценка',
});

/*
 * Komatsu D375A-8.
 * Источник: Komatsu Europe, брошюра D375A-8 EENSS20325 (02/2024): https://www.komatsu.eu/Assets/GetBrochureByProductName.aspx?id=D375A-8&langID=en
 *   A колея 2500, B ширина отвала 4775, C высота 4160, D высота отвала 2525, E подъём отвала 1690, F заглубление 734,
 *   G гусеница на грунте 3980, H габаритная длина 10560, I звёздочка→рыхлитель 3460, J подъём рыхлителя 1120,
 *   K глубина рыхления 1485, L 4278 (трактовано как высота по кабине), просвет 610;
 *   SAA6D170E-7, нетто ISO 9249: 455 кВт / 609 л.с. вперёд, 558 кВт назад; 23,15 л; масса 72 840 кг;
 *   41 башмак 610 мм, грунтозацеп 93, 8 опорных и 2 поддерживающих катка, K-Bogie; ГДТ с автоблокировкой;
 *   мокрые фрикционы поворота (PCCS); стартер 2 × 24 В / 7,5 кВт, генератор 24 В / 140 А, АКБ 2 × 12 В / 200 А·ч; два глушителя.
 * Буквенные обозначения G…L в этой брошюре сдвинуты относительно D375A-5/-6; трактовка C (высота по выхлопу) и L (по кабине) — оценка.
 */
export const D375A8 = specModel({
  id: 'D375A-8',
  series: 'D375',
  fullName: 'Komatsu D375A-8',
  tagline: 'Карьерный бульдозер класса 73 т, EU Stage V',
  source: 'брошюра Komatsu Europe D375A-8 (EENSS20325)',
  engine: { model: 'SAA6D170E-7', layout: 'Рядный 6-цилиндровый', displacement: '23,15 л', power: '455 кВт (609 л.с.) нетто вперёд; 558 кВт назад' },
  weight: '72,84 т',
  layout: base({
    dims: {
      overallLength: 10560, trackOnGround: 3980, cabHeight: 4278, exhaustHeight: 4160, bladeHeight: 2525, bladeWidth: 4775,
      groundClearance: 610, trackGauge: 2500, shoeWidth: 610, grouser: 93, sprocketToRipper: 3460, ripperLift: 1120, ripperDepth: 1485,
      bladeLift: 1690, bladeDrop: 734,
      hoodHeight: 2900, // оценка
      hoodOverhang: 460, // оценка
      cabLength: 2200, // оценка
      tankLength: 1100, // оценка
    },
    badge: 'D375A-8',
    engineLabel: 'Двигатель SAA6D170E-7',
    hood: 'slant',
    stacks: 2,
  }),
  shoes: '41 башмак 610 мм на сторону, грунтозацеп 93 мм, площадь контакта 48 560 см² (по брошюре).',
  suspension: 'K-Bogie с качающимся натяжным колесом; балансир с плечевой подушкой и ось качания (по брошюре).',
  torqueConverter: '3-элементный одноступенчатый однофазный ГДТ с водяным охлаждением и автоматической блокировкой (по брошюре).',
  gearbox: 'TORQFLOW: планетарная КПП, 3 вперёд / 3 назад + 3L; автоматическое переключение, ECMV; до 11,8 км/ч вперёд, 15,8 км/ч назад (по брошюре).',
  finalDrive: 'Планетарный двухступенчатый бортовой редуктор; сегментные зубья звёздочки на болтах (по брошюре).',
  pumps: {
    description: 'CLSS; поршневой насос переменной производительности, 366 л/мин, предохранительный клапан 29,8 МПа; гидропривод вентилятора с реверсом (по брошюре).',
    parts: [{ name: 'Поршневой насос', note: '366 л/мин (по брошюре)' }],
  },
  blade: { description: 'Усиленный Semi-U 4775 × 2525 мм, 18,5 м³; подъём 1690 мм, заглубление 734 мм (по брошюре).', variants: 'Semi-U 18,5 м³, U 22,0 м³; одинарный или двойной перекос' },
  ripper: { description: 'Гигантский рыхлитель: подъём 1120 мм, глубина 1485 мм (по брошюре).', variants: 'Giant ripper (5210 кг) или многостоечный (3 зуба, 6430 кг)' },
  electrics: modernElectrics('24 В / 140 А', '2 × 12 В / 200 А·ч', '2 × 24 В / 7,5 кВт', 'Цветной монитор, KOMTRAX Plus (по брошюре).'),
  steeringNote: steeringCB + ', PCCS; радиус поворота 4,2 м',
});
