import type { Pose } from '../data/layout';
import type { LayoutParams, NodeId } from '../types';

export type StageId = 'start' | 'blade' | 'rip' | 'push';

export interface StageDef {
  id: StageId;
  title: string;
  short: string;
  /** Длительность этапа, мс */
  duration: number;
  /** Общее описание этапа */
  caption: string;
  /** Узлы, участвующие в этапе (подсвечиваются) */
  nodes: NodeId[];
}

export const STAGES: StageDef[] = [
  {
    id: 'start',
    title: 'Запуск двигателя',
    short: 'Запуск',
    duration: 7000,
    caption:
      'Ключ в положение ON: АКБ питают блок предохранителей, монитор и ЭБУ, загораются контрольные лампы. Стартер прокручивает коленвал, двигатель запускается — растут обороты и давление масла, лампы гаснут, генератор начинает заряжать АКБ.',
    nodes: ['batteries', 'fuseBox', 'wiring', 'starter', 'engine', 'alternator', 'monitor', 'controllers'],
  },
  {
    id: 'blade',
    title: 'Подъём и опускание отвала',
    short: 'Отвал',
    duration: 6500,
    caption:
      'Джойстик отвала управляет распределителем: гидронасос подаёт масло в цилиндры подъёма. Штоки втягиваются — отвал поворачивается вокруг шарниров толкающих брусьев и поднимается; при опускании штоки выдвигаются и режущая кромка заглубляется в грунт.',
    nodes: ['pumps', 'bladeCylinders', 'blade', 'engine'],
  },
  {
    id: 'rip',
    title: 'Рыхление',
    short: 'Рыхление',
    duration: 8500,
    caption:
      'Цилиндры рыхлителя опускают стойку с наконечником в грунт на рабочую глубину. Двигатель через гидротрансформатор, КПП и бортовые редукторы вращает звёздочки — машина идёт вперёд, зуб вспарывает плотный грунт или скалу. В конце прохода рыхлитель поднимается.',
    nodes: ['ripper', 'ripperCylinders', 'pumps', 'sprocket', 'trackChain', 'finalDrive', 'gearbox', 'torqueConverter'],
  },
  {
    id: 'push',
    title: 'Движение с набором грунта',
    short: 'Набор грунта',
    duration: 7500,
    caption:
      'Отвал слегка заглублён: машина движется вперёд, срезает слой грунта и набирает перед отвалом «призму волочения». Механизм поворота удерживает курс, в конце прохода отвал приподнимается и грунт остаётся валиком.',
    nodes: ['blade', 'bladeCylinders', 'trackChain', 'sprocket', 'steering', 'gearbox'],
  },
];

export const STAGE_BY_ID = Object.fromEntries(STAGES.map((s) => [s.id, s])) as Record<StageId, StageDef>;

export interface AnimFrame {
  stage: StageId;
  pose: Pose;
  /** Смещение башмаков гусеницы, px (движение вперёд) */
  trackShift: number;
  engine: 'off' | 'crank' | 'run';
  /** Интенсивность дыма 0…1 */
  smoke: number;
  /** Положение стрелок 0…1 */
  rpm: number;
  oil: number;
  lamps: boolean;
  elecFlow: boolean;
  hydBlade: boolean;
  hydRipper: boolean;
  clods: boolean;
  soilPile: number;
  /** Время от начала этапа, с (для дыма, потоков) */
  time: number;
  phase: string;
  highlight: NodeId[];
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (v: number) => {
  const x = clamp(v);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
};
/** Доля прохождения отрезка [a, b] с плавностью */
const seg = (t: number, a: number, b: number) => ease((t - a) / (b - a));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export function frameAt(stage: StageId, t: number, time: number, p: LayoutParams): AnimFrame {
  const d = p.dims;
  const restRip = Math.round(d.ripperLift * 0.4);
  const base: AnimFrame = {
    stage, pose: { bladeLift: 0, ripperTip: restRip }, trackShift: 0, engine: 'run', smoke: 0.25, rpm: 0.38, oil: 0.7,
    lamps: false, elecFlow: false, hydBlade: false, hydRipper: false, clods: false, soilPile: 0, time, phase: '', highlight: [],
  };
  const speed = 46; // px/с — условная скорость движения на схеме
  const dur = STAGE_BY_ID[stage].duration / 1000;

  switch (stage) {
    case 'start': {
      if (t < 0.12) {
        return { ...base, engine: 'off', smoke: 0, rpm: 0, oil: 0, lamps: true, elecFlow: t > 0.04, phase: 'Ключ в положение ON: питание от АКБ, загораются контрольные лампы', highlight: ['batteries', 'fuseBox', 'monitor', 'controllers'] };
      }
      if (t < 0.36) {
        const k = (t - 0.12) / 0.24;
        return { ...base, engine: 'crank', smoke: k > 0.7 ? 0.35 : 0.05, rpm: 0.1 + 0.03 * Math.sin(time * 30), oil: 0.08 * k, lamps: true, elecFlow: true, phase: 'Стартер прокручивает коленчатый вал (ток от АКБ по силовому кабелю)', highlight: ['starter', 'batteries', 'wiring'] };
      }
      if (t < 0.56) {
        const k = seg(t, 0.36, 0.56);
        return { ...base, engine: 'run', smoke: 1 - 0.5 * k, rpm: lerp(0.15, 0.52, k), oil: lerp(0.1, 0.78, k), lamps: t < 0.5, phase: 'Двигатель запустился: обороты и давление масла растут, из трубы — выхлоп', highlight: ['engine', 'monitor'] };
      }
      const k = seg(t, 0.56, 0.75);
      return { ...base, smoke: 0.4, rpm: lerp(0.52, 0.38, k), oil: 0.7, phase: 'Холостой ход: генератор заряжает АКБ, контрольные лампы погасли', highlight: ['engine', 'alternator', 'monitor'] };
    }
    case 'blade': {
      const up = seg(t, 0.1, 0.42);
      const down = seg(t, 0.55, 0.82);
      const back = seg(t, 0.88, 1);
      const lift = t < 0.55 ? d.bladeLift * up : t < 0.88 ? lerp(d.bladeLift, -d.bladeDrop * 0.6, down) : lerp(-d.bladeDrop * 0.6, 0, back);
      const moving = (t > 0.1 && t < 0.42) || (t > 0.55 && t < 0.82) || t > 0.88;
      const phase = t < 0.1 ? 'Оператор отклоняет джойстик отвала' : t < 0.55 ? `Подъём: штоки цилиндров втягиваются, отвал поднимается до ≈${(d.bladeLift / 1000).toFixed(2).replace('.', ',')} м над грунтом` : t < 0.88 ? `Опускание: штоки выдвигаются, кромка заглубляется (макс. ≈${d.bladeDrop} мм)` : 'Отвал возвращается на грунт';
      return { ...base, pose: { ...base.pose, bladeLift: lift }, rpm: moving ? 0.62 : 0.42, smoke: moving ? 0.45 : 0.25, hydBlade: moving, phase, highlight: ['pumps', 'bladeCylinders', 'blade'] };
    }
    case 'rip': {
      const down = seg(t, 0.04, 0.24);
      const raise = seg(t, 0.82, 0.98);
      const tip = t < 0.82 ? lerp(restRip, -d.ripperDepth, down) : lerp(-d.ripperDepth, restRip, raise);
      const moveK = clamp((t - 0.24) / 0.58);
      const trackShift = speed * dur * 0.58 * moveK;
      const moving = t > 0.24 && t < 0.82;
      const phase = t < 0.24 ? `Рыхлитель опускается на глубину до ≈${(d.ripperDepth / 1000).toFixed(2).replace('.', ',')} м` : moving ? 'Звёздочки тянут гусеницу — машина идёт вперёд, зуб рыхлит грунт' : 'Рыхлитель поднимается из грунта';
      return {
        ...base, pose: { ...base.pose, ripperTip: tip }, trackShift, rpm: moving ? 0.86 : 0.55, smoke: moving ? 0.8 : 0.4, hydRipper: !moving, clods: moving, phase,
        highlight: moving ? ['ripper', 'sprocket', 'trackChain', 'finalDrive', 'gearbox'] : ['ripper', 'ripperCylinders', 'pumps'],
      };
    }
    case 'push': {
      const cut = seg(t, 0.04, 0.14);
      const lift = seg(t, 0.78, 0.9);
      const blade = t < 0.78 ? lerp(0, -d.bladeDrop * 0.25, cut) : lerp(-d.bladeDrop * 0.25, d.bladeLift * 0.25, lift);
      const moveK = clamp((t - 0.12) / 0.7);
      const moving = t > 0.12 && t < 0.82;
      const phase = t < 0.12 ? 'Отвал заглубляется на несколько сантиметров' : moving ? 'Машина движется вперёд и набирает грунт перед отвалом' : 'Отвал приподнят — грунт остаётся валиком';
      return {
        ...base, pose: { ...base.pose, bladeLift: blade }, trackShift: speed * dur * 0.7 * moveK, rpm: moving ? 0.9 : 0.5, smoke: moving ? 0.85 : 0.35,
        hydBlade: !moving && t < 0.95, soilPile: clamp((t - 0.14) / 0.64) * (t > 0.9 ? 1 : 1), phase,
        highlight: moving ? ['blade', 'trackChain', 'sprocket', 'steering'] : ['blade', 'bladeCylinders'],
      };
    }
  }
}
