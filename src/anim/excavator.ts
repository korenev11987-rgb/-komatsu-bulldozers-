import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnyNodeId } from '../types';
import { usePrefersReducedMotion } from './useWorkAnimation';

/*
 * Анимация экскаватора: копание (стрела, рукоять, ковш), поворот платформы, передвижение.
 * Углы — абсолютные, в градусах от горизонтали «вперёд» (ось x машины), против часовой стрелки.
 * Ключевые позы подобраны для наглядности (рабочие зоны машины — HEHH4376-02, с. 19), а не как точная траектория.
 */

export type ExcStageId = 'dig' | 'swing' | 'travel';

export interface ExcPose {
  /** Стрела: угол линии «пята — оголовок» */
  boom: number;
  /** Рукоять: угол линии «шарнир на стреле — шарнир ковша» */
  stick: number;
  /** Ковш: угол линии «шарнир — кромка зубьев» */
  bucket: number;
  /** Поворот платформы, градусы (0 — стрела вперёд, влево на экране) */
  swing: number;
}

export interface ExcFrame {
  pose: ExcPose;
  /** Сдвиг гусеницы (мм пути) — для «бега» звеньев и катков */
  travel: number;
  highlight: AnyNodeId[];
  phase: string;
}

interface Key {
  t: number;
  pose: ExcPose;
  phase: string;
  highlight: AnyNodeId[];
}

export const EXC_REST: ExcPose = { boom: 25, stick: -100, bucket: -75, swing: 0 };
const REACH: ExcPose = { boom: 18, stick: -55, bucket: -90, swing: 0 };
const CURL: ExcPose = { boom: 10, stick: -100, bucket: -160, swing: 0 };
const LIFT: ExcPose = { boom: 26, stick: -90, bucket: 170, swing: 0 };

const HYD: AnyNodeId[] = ['pumps', 'mainValve'];

export interface ExcStageDef {
  id: ExcStageId;
  title: string;
  duration: number;
  caption: string;
  nodes: AnyNodeId[];
  keys: Key[];
  /** Мм пути гусеницы за этап */
  travel?: number;
}

export const EXC_STAGES: ExcStageDef[] = [
  {
    id: 'dig',
    title: 'Копание',
    duration: 7000,
    caption:
      'Насосы подают масло через главный распределитель в цилиндры: цилиндр рукояти подтягивает рукоять к машине, цилиндр ковша поворачивает ковш, цилиндры стрелы поднимают заполненный ковш.',
    nodes: ['boom', 'stick', 'bucket', 'boomCylinders', 'stickCylinder', 'bucketCylinder', 'mainValve', 'pumps', 'engine'],
    keys: [
      { t: 0, pose: EXC_REST, phase: 'исходное положение', highlight: [] },
      { t: 0.25, pose: REACH, phase: 'вынос рукояти и опускание ковша', highlight: ['stickCylinder', 'boomCylinders', ...HYD] },
      { t: 0.55, pose: CURL, phase: 'копание: рукоять к себе, ковш на себя', highlight: ['stickCylinder', 'bucketCylinder', 'bucket', ...HYD] },
      { t: 0.8, pose: LIFT, phase: 'подъём стрелы с заполненным ковшом', highlight: ['boomCylinders', 'boom', ...HYD] },
      { t: 1, pose: LIFT, phase: 'ковш поднят', highlight: ['boomCylinders'] },
    ],
  },
  {
    id: 'swing',
    title: 'Поворот и выгрузка',
    duration: 7000,
    caption:
      'Насос поворота питает два гидромотора; через редукторы поворота шестерни обкатываются по зубчатому венцу опорно-поворотного круга, и платформа поворачивается вместе со стрелой (HEHH4376-02, с. 4, 17).',
    nodes: ['swingMotors', 'swingDrive', 'swingBearing', 'pumps', 'mainValve', 'bucketCylinder'],
    keys: [
      { t: 0, pose: LIFT, phase: 'начало поворота', highlight: ['swingMotors', 'swingDrive', 'swingBearing', 'pumps'] },
      { t: 0.4, pose: { ...LIFT, swing: 150 }, phase: 'поворот платформы', highlight: ['swingMotors', 'swingDrive', 'swingBearing', 'pumps'] },
      { t: 0.55, pose: { ...LIFT, swing: 150, bucket: -40 }, phase: 'выгрузка: ковш от себя', highlight: ['bucketCylinder', 'mainValve'] },
      { t: 0.95, pose: { ...EXC_REST, swing: 0 }, phase: 'возврат в исходное положение', highlight: ['swingMotors', 'swingDrive', 'boomCylinders'] },
      { t: 1, pose: EXC_REST, phase: 'исходное положение', highlight: [] },
    ],
  },
  {
    id: 'travel',
    title: 'Передвижение',
    duration: 6000,
    travel: 6000,
    caption:
      'Масло к гидромоторам хода идёт через поворотное соединение в центре платформы; мотор через бортовой редуктор вращает ведущую звёздочку, гусеничная цепь перекатывается по опорным и поддерживающим каткам (скорость до 4,1 км/ч, HEHH4376-02, с. 17).',
    nodes: ['travelMotors', 'finalDrive', 'sprocket', 'trackChain', 'idler', 'trackRollers', 'carrierRollers', 'swivel', 'pumps'],
    keys: [
      { t: 0, pose: EXC_REST, phase: 'движение вперёд', highlight: ['travelMotors', 'finalDrive', 'sprocket', 'trackChain', 'swivel'] },
      { t: 1, pose: EXC_REST, phase: 'движение вперёд', highlight: ['travelMotors', 'finalDrive', 'sprocket', 'trackChain', 'swivel'] },
    ],
  },
];

export const EXC_STAGE_BY_ID = Object.fromEntries(EXC_STAGES.map((s) => [s.id, s])) as Record<ExcStageId, ExcStageDef>;

const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** Угол ковша — по кратчайшему пути (170° → −160° через 180°) */
const lerpAng = (a: number, b: number, k: number) => {
  let d = b - a;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return a + d * k;
};

export function excFrameAt(id: ExcStageId, t: number): ExcFrame {
  const s = EXC_STAGE_BY_ID[id];
  const ks = s.keys;
  let i = 0;
  while (i < ks.length - 2 && t > ks[i + 1].t) i++;
  const a = ks[i];
  const b = ks[i + 1] ?? a;
  const k = b.t > a.t ? ease(Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)))) : 1;
  const pose: ExcPose = {
    boom: lerp(a.pose.boom, b.pose.boom, k),
    stick: lerp(a.pose.stick, b.pose.stick, k),
    bucket: lerpAng(a.pose.bucket, b.pose.bucket, k),
    swing: lerp(a.pose.swing, b.pose.swing, k),
  };
  const cur = b;
  return { pose, travel: (s.travel ?? 0) * t, highlight: cur.highlight, phase: cur.phase };
}

interface St {
  stage: ExcStageId | null;
  t: number;
  playing: boolean;
  auto: boolean;
}
const INIT: St = { stage: null, t: 0, playing: false, auto: false };

/** Состояние анимации экскаватора (тот же интерфейс управления, что у бульдозеров) */
export function useExcAnimation() {
  const [s, setS] = useState<St>(INIT);
  const reduced = usePrefersReducedMotion();
  const raf = useRef<number>();
  useEffect(() => {
    if (!s.playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(100, now - last);
      last = now;
      setS((p) => {
        if (!p.playing || !p.stage) return p;
        const t = p.t + dt / EXC_STAGE_BY_ID[p.stage].duration;
        if (t < 1) return { ...p, t };
        const idx = EXC_STAGES.findIndex((x) => x.id === p.stage);
        if (p.auto && idx < EXC_STAGES.length - 1) return { ...p, stage: EXC_STAGES[idx + 1].id, t: 0 };
        return { ...p, t: 1, playing: false, auto: false };
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [s.playing]);

  const selectStage = useCallback((id: ExcStageId) => setS({ stage: id, t: 0, playing: true, auto: false }), []);
  const playAll = useCallback(() => setS({ stage: EXC_STAGES[0].id, t: 0, playing: true, auto: true }), []);
  const togglePlay = useCallback(
    () =>
      setS((p) => {
        if (!p.stage) return { stage: EXC_STAGES[0].id, t: 0, playing: true, auto: true };
        if (p.playing) return { ...p, playing: false };
        return p.t >= 1 ? { ...p, t: 0, playing: true } : { ...p, playing: true };
      }),
    [],
  );
  const step = useCallback(
    (dir: 1 | -1) =>
      setS((p) => {
        const idx = p.stage ? EXC_STAGES.findIndex((x) => x.id === p.stage) : -1;
        return { stage: EXC_STAGES[(idx + dir + EXC_STAGES.length) % EXC_STAGES.length].id, t: 0, playing: true, auto: false };
      }),
    [],
  );
  const stop = useCallback(() => setS(INIT), []);
  const seek = useCallback((id: ExcStageId, t: number) => setS({ stage: id, t, playing: false, auto: false }), []);
  // При «уменьшении движения» — дискретные ключевые кадры
  const shownT = reduced && s.stage ? (() => {
    const ks = EXC_STAGE_BY_ID[s.stage].keys;
    return [...ks].reverse().find((k) => k.t <= s.t + 1e-9)?.t ?? 0;
  })() : s.t;
  return { stage: s.stage, t: shownT, rawT: s.t, playing: s.playing, auto: s.auto, reduced, selectStage, playAll, togglePlay, step, stop, seek };
}

export type ExcAnimation = ReturnType<typeof useExcAnimation>;
