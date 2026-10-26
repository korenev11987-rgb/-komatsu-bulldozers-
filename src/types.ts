/** Пять основных систем бульдозера */
export type SystemId = 'engine' | 'undercarriage' | 'transmission' | 'hydraulics' | 'electrics';

/** Идентификаторы узлов — общие для всех моделей, что позволяет сравнивать модели */
export type NodeId =
  | 'engine'
  | 'cooling'
  | 'trackChain'
  | 'trackFrame'
  | 'trackRollers'
  | 'carrierRollers'
  | 'idler'
  | 'sprocket'
  | 'torqueConverter'
  | 'gearbox'
  | 'steering'
  | 'finalDrive'
  | 'pumps'
  | 'blade'
  | 'bladeCylinders'
  | 'ripper'
  | 'ripperCylinders'
  | 'batteries'
  | 'alternator'
  | 'starter'
  | 'wiring'
  | 'fuseBox'
  | 'controllers'
  | 'lights'
  | 'monitor';

export type ModelId =
  | 'D155'
  | 'D275A-2'
  | 'D275A-5'
  | 'D355'
  | 'D375A-3'
  | 'D375A-5'
  | 'D375A-6'
  | 'D375A-8'
  | 'D475'
  /* Caterpillar (элевированная звёздочка) */
  | 'CAT-D6R'
  | 'CAT-D9R'
  | 'CAT-D10T'
  /* Caterpillar, гидравлический экскаватор (отдельный тип машины — kind: 'excavator') */
  | 'CAT-374DL';

/** Узлы, которые есть только у экскаватора (добавлены к общим NodeId; узлы бульдозеров не меняются) */
export type ExcavatorNodeId =
  | 'boom'
  | 'stick'
  | 'bucket'
  | 'boomCylinders'
  | 'stickCylinder'
  | 'bucketCylinder'
  | 'mainValve'
  | 'swingMotors'
  | 'travelMotors'
  | 'swivel'
  | 'hydTank'
  | 'swingDrive'
  | 'swingBearing';

/** Любой узел любой машины (бульдозер или экскаватор) */
export type AnyNodeId = NodeId | ExcavatorNodeId;

export interface SystemInfo {
  id: SystemId;
  name: string;
  subtitle: string;
  color: string;
}

export interface Part {
  name: string;
  note: string;
}

export interface NodeInfo {
  id: AnyNodeId;
  system: SystemId;
  title: string;
  description: string;
  parts: Part[];
  /** Особенность именно этой модели */
  modelNote?: string;
}

export type Shape =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; rx?: number }
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; width: number }
  | { kind: 'polygon'; points: string }
  /** Путь; если задан width — область клика по обводке (жгуты проводов) */
  | { kind: 'path'; d: string; width?: number };

export interface SchemaNode {
  id: NodeId;
  system: SystemId;
  label: string;
  shapes: Shape[];
  /** Точка, к которой тянется выноска подписи (в координатах машины до масштабирования) */
  anchor: { x: number; y: number };
  /** Где размещать подпись-выноску: над машиной или под ней */
  labelSide: 'top' | 'bottom';
  /** Внутренний узел, показанный «рентгеном» поверх корпуса */
  xray?: boolean;
}

/**
 * Паспортные габариты модели (мм) — по ним масштабируется рисунок.
 * Поля с пометкой «оценка» в брошюрах не публикуются и подобраны по пропорциям.
 */
export interface ModelDims {
  /** Габаритная длина с отвалом и рыхлителем */
  overallLength: number;
  /** Длина гусеницы на грунте (между осями натяжного колеса и звёздочки) */
  trackOnGround: number;
  /** Высота по крыше кабины (ROPS) */
  cabHeight: number;
  /** Высота по выхлопной трубе */
  exhaustHeight: number;
  /** Высота отвала */
  bladeHeight: number;
  /** Ширина отвала */
  bladeWidth: number;
  /** Дорожный просвет */
  groundClearance: number;
  /** Колея */
  trackGauge: number;
  /** Ширина башмака (стандарт) */
  shoeWidth: number;
  /** Высота грунтозацепа */
  grouser: number;
  /** От оси звёздочки до наконечника рыхлителя */
  sprocketToRipper: number;
  /** Подъём наконечника рыхлителя над грунтом (макс.) */
  ripperLift: number;
  /** Глубина рыхления (макс.) */
  ripperDepth: number;
  /** Подъём отвала над грунтом (макс.) */
  bladeLift: number;
  /** Заглубление отвала (макс.) */
  bladeDrop: number;
  /** Оценка: высота верха капота */
  hoodHeight: number;
  /** Оценка: вынос облицовки радиатора перед гусеницей */
  hoodOverhang: number;
  /** Оценка: длина кабины */
  cabLength: number;
  /** Оценка: длина топливного бака за кабиной */
  tankLength: number;
  /** Длина машины с отвалом без рыхлителя (паспорт; для элевированной ходовой задаёт положение гусеницы) */
  lengthWithBlade?: number;
  /** Длина базового трактора (паспорт) */
  basicLength?: number;
}

/** Параметры, влияющие на прорисовку конкретной модели */
export interface LayoutParams {
  dims: ModelDims;
  trackRollers: number;
  carrierRollers: number;
  ripperShanks: number;
  engineLabel: string;
  steeringLabel: string;
  bladeLabel: string;
  /** Современная кабина с монитором или классическая с аналоговыми приборами */
  cab: 'modern' | 'classic';
  /** Надпись модели на баке */
  badge: string;
  /** Тип отвала: Sigmadozer (D155), прямой/полу-U старого образца (D355), U с козырьком (D475) */
  bladeType: 'sigma' | 'straight' | 'u';
  /** Форма капота: скошенный (D155-8), угловатый 80-х (D355), большой V12 (D475) */
  hood: 'slant' | 'angular' | 'big' | 'cat';
  /** Подвеска катков K-Bogie (тележки по 2 катка) */
  bogie: boolean;
  /** Двойной перекос отвала (два цилиндра перекоса) */
  dualTilt: boolean;
  /** Число выхлопных труб */
  stacks: 1 | 2;
  /* ---- Необязательные поля (модели Caterpillar; у Komatsu не заданы — поведение прежнее) ---- */
  /** Ходовая: 'elevated' — элевированная звёздочка (high-drive, треугольный обвод: 2 натяжных колеса + звёздочка сверху) */
  drive?: 'elevated';
  /** Надпись на капоте (по умолчанию KOMATSU) */
  brand?: string;
  /** Общий масштаб px/мм для группы моделей (истинные относительные размеры); иначе — масштаб под экран */
  fixedK?: number;
  /** Поддерживающие катки — опция (рисуются пунктиром, подпись «опция») */
  carrierOptional?: boolean;
  /** Рисунок двигателя: число цилиндров, V-образный, подпись */
  engineArt?: { cyl: number; vee: boolean; label: string };
  /** Анимация наклона (pitch) отвала и рычагов в кабине */
  animExtras?: boolean;
}

export interface SpecItem {
  label: string;
  value: string;
}

export interface BulldozerModel {
  /** Тип машины (не задан — бульдозер) */
  kind?: 'dozer';
  id: ModelId;
  name: string;
  fullName: string;
  /** Серия для группировки в переключателе (D155, D275, …) */
  series?: string;
  tagline: string;
  specs: SpecItem[];
  layout: LayoutParams;
  nodes: Record<NodeId, NodeInfo>;
}

/** Паспортные размеры экскаватора (мм) для рисунка в масштабе; источник каждого поля — в данных модели */
export interface ExcavatorDims {
  shippingLength: number;
  shippingHeight: number;
  tailSwingRadius: number;
  rollerCenters: number;
  trackLength: number;
  groundClearance: number;
  cabHeight: number;
  trackGaugeShipping: number;
  trackGaugeWorking: number;
  transportWidth: number;
  boomLength: number;
  stickLength: number;
  bucketTipRadius: number;
  /* ---- Оценка (в спецификации не опубликовано; только для рисунка) ---- */
  /** Просвет под противовесом/платформой — оценка */
  upperClearance: number;
  /** Высота капота двигателя — оценка */
  hoodHeight: number;
  /** Пята стрелы: вынос вперёд от оси поворота и высота — оценка */
  boomFootX: number;
  boomFootY: number;
  /** Длина кабины и вынос её передней стенки от оси поворота — оценка */
  cabLength: number;
  cabFrontX: number;
}

/** Гидравлический экскаватор: те же карточки, свой набор узлов и своя схема */
export interface ExcavatorModel {
  kind: 'excavator';
  id: ModelId;
  name: string;
  fullName: string;
  series?: string;
  tagline: string;
  specs: SpecItem[];
  dims: ExcavatorDims;
  /** Подписи систем для легенды (у экскаватора другой состав систем) */
  systemSubtitles: Partial<Record<SystemId, string>>;
  nodes: Partial<Record<AnyNodeId, NodeInfo>>;
}

export type AnyModel = BulldozerModel | ExcavatorModel;
export const isExcavator = (m: AnyModel): m is ExcavatorModel => m.kind === 'excavator';
