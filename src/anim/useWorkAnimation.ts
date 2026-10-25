import { useCallback, useEffect, useRef, useState } from 'react';
import { STAGES, STAGE_BY_ID, type StageId } from './stages';

interface AnimState {
  stage: StageId | null;
  t: number;
  time: number;
  playing: boolean;
  auto: boolean;
}

const INITIAL: AnimState = { stage: null, t: 0, time: 0, playing: false, auto: false };

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return !!reduced;
}

/**
 * Состояние анимации работы бульдозера: этап, прогресс 0…1, воспроизведение, «все этапы подряд».
 * При prefers-reduced-motion прогресс отображается дискретными ключевыми кадрами (без плавного движения).
 */
export function useWorkAnimation() {
  const [s, setS] = useState<AnimState>(INITIAL);
  const reduced = usePrefersReducedMotion();
  const raf = useRef<number>();

  useEffect(() => {
    if (!s.playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(100, now - last);
      last = now;
      setS((prev) => {
        if (!prev.playing || !prev.stage) return prev;
        const dur = STAGE_BY_ID[prev.stage].duration;
        const t = prev.t + dt / dur;
        if (t < 1) return { ...prev, t, time: prev.time + dt / 1000 };
        const idx = STAGES.findIndex((x) => x.id === prev.stage);
        if (prev.auto && idx < STAGES.length - 1) return { ...prev, stage: STAGES[idx + 1].id, t: 0, time: 0 };
        return { ...prev, t: 1, playing: false, auto: false };
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [s.playing]);

  const selectStage = useCallback((id: StageId) => setS({ stage: id, t: 0, time: 0, playing: true, auto: false }), []);
  const playAll = useCallback(() => setS({ stage: STAGES[0].id, t: 0, time: 0, playing: true, auto: true }), []);
  const togglePlay = useCallback(
    () =>
      setS((prev) => {
        if (!prev.stage) return { stage: STAGES[0].id, t: 0, time: 0, playing: true, auto: true };
        if (prev.playing) return { ...prev, playing: false };
        return prev.t >= 1 ? { ...prev, t: 0, time: 0, playing: true } : { ...prev, playing: true };
      }),
    [],
  );
  const step = useCallback(
    (dir: 1 | -1) =>
      setS((prev) => {
        const idx = prev.stage ? STAGES.findIndex((x) => x.id === prev.stage) : -1;
        const next = STAGES[(idx + dir + STAGES.length) % STAGES.length];
        return { stage: next.id, t: 0, time: 0, playing: true, auto: false };
      }),
    [],
  );
  const stop = useCallback(() => setS(INITIAL), []);
  /** Для тестов и ссылок: перейти к моменту этапа без воспроизведения */
  const seek = useCallback((id: StageId, t: number) => setS({ stage: id, t, time: t * (STAGE_BY_ID[id].duration / 1000), playing: false, auto: false }), []);

  // Дискретизация для «уменьшенного движения»
  const q = (v: number) => (reduced ? Math.min(0.875, Math.floor(v * 4) / 4 + 0.125) : v);
  return {
    stage: s.stage,
    t: q(s.t),
    rawT: s.t,
    time: reduced ? Math.floor(s.time) : s.time,
    playing: s.playing,
    auto: s.auto,
    reduced,
    selectStage,
    playAll,
    togglePlay,
    step,
    stop,
    seek,
  };
}

export type WorkAnimation = ReturnType<typeof useWorkAnimation>;
