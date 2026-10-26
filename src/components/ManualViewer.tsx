import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { pageImageUrl, pageLabel, pageSize } from '../data/repair/manualImages';
import { MANUAL_PAGE_KINDS, nodeDoc, type ManualPageKind, type NodeManual } from '../data/repair/manualPages';
import { MANUALS } from '../data/repair/manuals';
import type { BreakdownRef, PartBreakdownData } from '../data/repair/types';
import { GLOSSARIES } from '../data/manuals/glossary';
import { loadTranslation, translationInfo, type DocTranslation } from '../data/manuals/translations';
import { PartBreakdown } from './PartBreakdown';
import type { TranslationState } from './PageSidePanel';

/** Панель «Перевод на русский» (и рендер markdown) — отдельный чанк */
const PageSidePanel = lazy(() => import('./PageSidePanel'));

/*
 * Просмотр мануала — непрерывная вертикальная лента изображений страниц (без PDF).
 * Лента охватывает весь мануал и открывается на странице узла; рендерятся только видимые страницы ±2
 * (виртуализация), у остальных — места точного размера (размеры из манифеста), поэтому прокрутка не прыгает.
 *
 * Масштаб: 100 % = «По ширине» (ширина страницы = ширина окна просмотра); 50–400 %, шаг 25 %.
 * Колесо мыши прокручивает ленту; Ctrl + колесо (и «щипок» на тачпаде/двумя пальцами) — масштаб у курсора.
 * При масштабе > 100 % — горизонтальная прокрутка; перетаскивание мышью — панорамирование в обе стороны;
 * на сенсорном экране лента прокручивается пальцем (нативно).
 * Клавиши: + / = — крупнее, − — мельче, 0 — по ширине, ← / → и PageUp / PageDown — страница назад/вперёд, Esc — закрыть.
 */

export const ZOOM_MIN = 50;
export const ZOOM_MAX = 400;
export const ZOOM_STEP = 25;
const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z)));
/** Масштаб сохраняется между страницами, разделами и повторными открытиями */
let rememberedZoom = 100;
/** Отступы ленты и промежуток между страницами (css px, не зависят от масштаба) */
const PAD = 12;
const GAP = 12;
/** Сколько страниц сверх видимых держать в DOM с каждой стороны */
const OVERSCAN = 2;
/** Показ расшифровок EN→RU (выключено по умолчанию, запоминается) */
const GLOSSARY_KEY = 'mviewer.glossary';
const readGlossaryPref = () => {
  try {
    return localStorage.getItem(GLOSSARY_KEY) === '1';
  } catch {
    return false;
  }
};

/** «Русский перевод»: по умолчанию включён для англоязычных документов; выбор пользователя запоминается */
const TRANSLATION_KEY = 'mviewer.translation';
const readTranslationPref = (): boolean | null => {
  try {
    const v = localStorage.getItem(TRANSLATION_KEY);
    return v === '1' ? true : v === '0' ? false : null;
  } catch {
    return null;
  }
};

interface Props {
  manual: NodeManual;
  nodeTitle: string;
  /** Страница, на которой лента открывается (pdfPage) */
  initialPage: number;
  /** Текущая страница изменилась (прокрутка/переход) — для синхронизации ?page= */
  onPageChange: (pdfPage: number) => void;
  onClose: () => void;
  onShowCard: () => void;
  /** Открытый документ (id из manuals.ts); null — основной */
  docId?: string | null;
  /** Переключить документ (и открыть его на странице page или на странице узла) */
  onDocChange?: (docId: string, page?: number) => void;
  /** Разбор узла «люди · время · инструмент» */
  breakdown?: PartBreakdownData;
}

interface Anchor {
  /** Точка внутри окна просмотра */
  ax: number;
  ay: number;
  page: number;
  fy: number;
  fx: number;
}

export function ManualViewer({ manual, nodeTitle, initialPage, onPageChange, onClose, onShowCard, docId, onDocChange, breakdown }: Props) {
  const entry = nodeDoc(manual, docId);
  const set = entry.images;
  const glossary = GLOSSARIES[entry.doc.id];
  const [showGlossary, setShowGlossaryState] = useState(readGlossaryPref);
  const setShowGlossary = (v: boolean) => {
    setShowGlossaryState(v);
    if (!v) setGlossPage(null);
    try {
      localStorage.setItem(GLOSSARY_KEY, v ? '1' : '0');
    } catch {
      /* без хранилища — только на время сеанса */
    }
  };
  const [glossPage, setGlossPage] = useState<number | null>(null);
  // ── Полный перевод страниц (ленивая загрузка по документу) ──
  const trInfo = translationInfo(set);
  const [trPref, setTrPref] = useState(readTranslationPref);
  const showTr = !!trInfo && (trPref ?? trInfo.sourceLang !== 'ru');
  const setShowTr = (v: boolean) => {
    setTrPref(v);
    try {
      localStorage.setItem(TRANSLATION_KEY, v ? '1' : '0');
    } catch {
      /* только на время сеанса */
    }
  };
  const [trDoc, setTrDoc] = useState<{ id: string; doc: DocTranslation | 'loading' | 'error' } | null>(null);
  useEffect(() => {
    if (!showTr) return;
    const p = loadTranslation(set);
    if (!p) return;
    let live = true;
    setTrDoc((d) => (d?.id === set.dir && d.doc !== 'error' ? d : { id: set.dir, doc: 'loading' }));
    p.then(
      (doc) => live && setTrDoc({ id: set.dir, doc }),
      () => live && setTrDoc({ id: set.dir, doc: 'error' }),
    );
    return () => {
      live = false;
    };
  }, [showTr, set]);
  const total = set.pageCount;
  const dialogRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [zoom, setZoomState] = useState(rememberedZoom);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [range, setRange] = useState<[number, number]>([initialPage, initialPage]);
  const [current, setCurrent] = useState(Math.min(Math.max(1, initialPage), total));
  const [jump, setJump] = useState('');
  const anchorRef = useRef<Anchor | null>(null);
  const pendingScrollRef = useRef<number | null>(Math.min(Math.max(1, initialPage), total));
  const blank = useMemo(() => new Set(set.blank), [set]);

  // ── Раскладка: ширина ленты и вертикальные позиции страниц ──
  const fitW = Math.max(120, stage.w - 2 * PAD);
  const feedW = Math.round(fitW * (zoom / 100));
  const layout = useMemo(() => {
    const tops = new Float64Array(total + 2);
    const heights = new Float64Array(total + 1);
    let y = PAD;
    for (let n = 1; n <= total; n++) {
      const [w, h] = pageSize(set, n);
      tops[n] = y;
      heights[n] = Math.round((feedW * h) / w);
      y += heights[n] + GAP;
    }
    tops[total + 1] = y;
    return { tops, heights, height: y - GAP + PAD };
  }, [set, total, feedW]);
  const feedLeft = Math.max(PAD, (stage.w - feedW) / 2);

  /** Страница, содержащая координату y ленты (двоичный поиск) */
  const pageAt = useCallback(
    (y: number) => {
      const { tops } = layout;
      let lo = 1;
      let hi = total;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (tops[mid] <= y) lo = mid;
        else hi = mid - 1;
      }
      return lo;
    },
    [layout, total],
  );

  const updateRange = useCallback(() => {
    const st = stageRef.current;
    if (!st) return;
    const a = pageAt(st.scrollTop + GAP);
    const b = pageAt(st.scrollTop + st.clientHeight);
    setRange((r) => {
      const next: [number, number] = [Math.max(1, a - OVERSCAN), Math.min(total, b + OVERSCAN)];
      return r[0] === next[0] && r[1] === next[1] ? r : next;
    });
  }, [pageAt, total]);

  /** Текущая страница — та, что пересекает линию на 30 % высоты окна */
  const updateCurrent = useCallback(() => {
    const st = stageRef.current;
    if (!st) return;
    setCurrent(pageAt(st.scrollTop + st.clientHeight * 0.3));
  }, [pageAt]);

  // Размер окна просмотра
  useLayoutEffect(() => {
    const st = stageRef.current;
    if (!st) return;
    const update = () => {
      const w = st.clientWidth;
      const h = st.clientHeight;
      setStage((s) => {
        if (s.w === w && s.h === h) return s;
        // сохранить текущую точку при изменении ширины (поворот экрана, ресайз)
        if (s.w && !anchorRef.current && pendingScrollRef.current == null) anchorRef.current = captureAnchor(st.clientWidth / 2, 0);
        return { w, h };
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(st);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Снимок точки под курсором/центром — для удержания при смене масштаба
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const feedRef = useRef({ feedW, feedLeft });
  feedRef.current = { feedW, feedLeft };
  const captureAnchor = (ax: number, ay: number): Anchor | null => {
    const st = stageRef.current;
    if (!st) return null;
    const y = st.scrollTop + ay;
    const page = pageAt(y);
    const { tops, heights } = layoutRef.current;
    const { feedW: fw, feedLeft: fl } = feedRef.current;
    return { ax, ay, page, fy: (y - tops[page]) / Math.max(1, heights[page]), fx: (st.scrollLeft + ax - fl) / Math.max(1, fw) };
  };

  // Применить отложенную прокрутку (открытие/переход на страницу) или вернуть точку-якорь после перераскладки
  useLayoutEffect(() => {
    const st = stageRef.current;
    if (!st || !stage.w) return;
    const target = pendingScrollRef.current;
    if (target != null) {
      pendingScrollRef.current = null;
      anchorRef.current = null;
      st.scrollTop = layout.tops[target] - PAD / 2;
      st.scrollLeft = (st.scrollWidth - st.clientWidth) / 2;
    } else if (anchorRef.current) {
      const a = anchorRef.current;
      anchorRef.current = null;
      st.scrollTop = layout.tops[a.page] + a.fy * layout.heights[a.page] - a.ay;
      st.scrollLeft = a.fx * feedW + feedLeft - a.ax;
    }
    updateRange();
    updateCurrent();
  }, [layout, stage.w, feedW, feedLeft, updateRange, updateCurrent]);

  // Прокрутка → видимый диапазон
  useEffect(() => {
    const st = stageRef.current;
    if (!st) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        updateRange();
      });
    };
    st.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      st.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [updateRange]);

  // Индикатор текущей страницы — по IntersectionObserver на отрисованных страницах
  useEffect(() => {
    const st = stageRef.current;
    if (!st) return;
    const io = new IntersectionObserver(() => updateCurrent(), {
      root: st,
      // узкая полоса на 30 % высоты окна: срабатывает, когда через неё проходит граница страницы
      rootMargin: '-30% 0px -69% 0px',
      threshold: [0, 1],
    });
    st.querySelectorAll('[data-feed-page]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [range, layout, updateCurrent]);

  // Сообщать текущую страницу наверх (для ?page=)
  useEffect(() => {
    onPageChange(current);
  }, [current, onPageChange]);

  const setZoom = useCallback((next: number, anchor?: { x: number; y: number }) => {
    const st = stageRef.current;
    const z = clampZoom(next);
    setZoomState((prev) => {
      if (z === prev) return prev;
      if (st) anchorRef.current = captureAnchor(anchor?.x ?? st.clientWidth / 2, anchor?.y ?? st.clientHeight * 0.3);
      rememberedZoom = z;
      return z;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageAt]);
  const zoomBy = useCallback(
    (dir: 1 | -1, anchor?: { x: number; y: number }) => {
      const prev = rememberedZoom;
      // шаг 25 %: с «нестандартного» значения (после щипка/Ctrl+колеса) — к ближайшему кратному
      const z = dir > 0 ? Math.floor(prev / ZOOM_STEP) * ZOOM_STEP + ZOOM_STEP : Math.ceil(prev / ZOOM_STEP) * ZOOM_STEP - ZOOM_STEP;
      setZoom(z, anchor);
    },
    [setZoom],
  );

  const goTo = useCallback(
    (n: number) => {
      const st = stageRef.current;
      const page = Math.min(Math.max(1, Math.round(n)), total);
      if (!st) return;
      st.scrollTop = layout.tops[page] - PAD / 2;
      updateRange();
      setCurrent(page);
    },
    [layout, total, updateRange],
  );

  // Фокус: при открытии — на кнопку закрытия, при закрытии — вернуть на прежний элемент
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => {
      if (prev && document.contains(prev)) prev.focus();
    };
  }, []);

  // Клавиатура (перехват до обработчиков карточки: Esc закрывает только просмотр)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const root = dialogRef.current;
        if (!root) return;
        const f = [...root.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null);
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return; // ввод номера страницы
      let handled = true;
      if (e.key === '+' || e.key === '=') zoomBy(1);
      else if (e.key === '-' || e.key === '_') zoomBy(-1);
      else if (e.key === '0') setZoom(100);
      else if (e.key === 'ArrowRight' || e.key === 'PageDown') goTo(current + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') goTo(current - 1);
      else handled = false;
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose, zoomBy, setZoom, goTo, current]);

  // Ctrl + колесо (и «щипок» на тачпаде — он приходит как wheel с ctrlKey) — масштаб у курсора
  useEffect(() => {
    const st = stageRef.current;
    if (!st) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const r = st.getBoundingClientRect();
      const factor = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0025));
      setZoom(rememberedZoom * factor, { x: e.clientX - r.left, y: e.clientY - r.top });
    };
    st.addEventListener('wheel', onWheel, { passive: false });
    return () => st.removeEventListener('wheel', onWheel);
  }, [setZoom]);

  // Щипок двумя пальцами (сенсорный экран); прокрутка одним пальцем — нативная
  useEffect(() => {
    const st = stageRef.current;
    if (!st) return;
    let pinch: { d: number; z: number; x: number; y: number } | null = null;
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      const r = st.getBoundingClientRect();
      pinch = { d: dist(e.touches), z: rememberedZoom, x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top };
    };
    const onMove = (e: TouchEvent) => {
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();
      setZoom(pinch.z * (dist(e.touches) / Math.max(1, pinch.d)), { x: pinch.x, y: pinch.y });
    };
    const onEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch = null;
    };
    st.addEventListener('touchstart', onStart, { passive: true });
    st.addEventListener('touchmove', onMove, { passive: false });
    st.addEventListener('touchend', onEnd, { passive: true });
    st.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      st.removeEventListener('touchstart', onStart);
      st.removeEventListener('touchmove', onMove);
      st.removeEventListener('touchend', onEnd);
      st.removeEventListener('touchcancel', onEnd);
    };
  }, [setZoom]);

  // Перетаскивание мышью — панорамирование по обеим осям
  const drag = useRef<{ id: number; x: number; y: number; sl: number; st: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, a')) return; // кнопки на странице (расшифровка)
    const st = stageRef.current!;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, sl: st.scrollLeft, st: st.scrollTop };
    st.setPointerCapture(e.pointerId);
    setDragging(true);
    e.preventDefault();
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const st = stageRef.current!;
    st.scrollLeft = d.sl - (e.clientX - d.x);
    st.scrollTop = d.st - (e.clientY - d.y);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== e.pointerId) return;
    drag.current = null;
    setDragging(false);
  };

  const label = pageLabel(set, current);
  const currentKind = MANUAL_PAGE_KINDS.find((k) => entry.pages[k.key]?.pdfPage === current)?.key ?? null;
  const openRef = (r: BreakdownRef) => {
    if (r.doc === entry.doc.id) goTo(r.pdfPage);
    else if (manual.docs.some((d) => d.doc.id === r.doc)) onDocChange?.(r.doc, r.pdfPage);
  };
  // Панель: при включённом переводе — следует за текущей страницей; иначе — страница, выбранная плашкой расшифровки
  const sidePage = showTr ? (glossPage ?? current) : glossPage;
  const glossEntries = sidePage != null && (showGlossary || glossPage != null) ? glossary?.pages[sidePage] : undefined;
  const trLoaded = trDoc && trDoc.id === set.dir ? trDoc.doc : null;
  const trState: TranslationState = !showTr || sidePage == null
    ? null
    : trLoaded == null || trLoaded === 'loading'
      ? 'loading'
      : trLoaded === 'error'
        ? 'error'
        : (trLoaded.pages[String(sidePage)] ?? (blank.has(sidePage) ? null : 'missing'));
  const sideOpen = sidePage != null && (trState != null || !!glossEntries?.length);
  const closeSide = () => {
    if (showTr) setShowTr(false);
    setGlossPage(null);
  };
  const titleId = 'mviewer-title';
  const kindBtn = (k: { key: ManualPageKind; title: string }) => {
    const ref = entry.pages[k.key];
    return (
      <button
        key={k.key}
        type="button"
        className={`mviewer__kind ${currentKind === k.key ? 'is-active' : ''}`}
        disabled={!ref}
        aria-pressed={currentKind === k.key}
        title={ref ? `${k.title}: с. ${ref.label} (стр. ${ref.pdfPage})` : 'данные из мануала не найдены'}
        data-kind={k.key}
        onClick={() => ref && goTo(ref.pdfPage)}
      >
        {k.title}
        {ref && <small> {ref.label}</small>}
      </button>
    );
  };

  const pages = [];
  for (let n = range[0]; n <= range[1]; n++) {
    const top = layout.tops[n];
    const h = layout.heights[n];
    const isBlank = blank.has(n);
    pages.push(
      <div
        key={n}
        className={`mviewer__page ${isBlank ? 'mviewer__page--blank' : ''}`}
        data-feed-page={n}
        style={{
          top,
          height: h,
          backgroundImage: !isBlank && set.thumbs ? `url("${pageImageUrl(set, n, true)}")` : undefined,
        }}
      >
        {isBlank ? (
          <span className="mviewer__blank-note">стр. {n}: пустая страница скана</span>
        ) : (
          <img
            src={pageImageUrl(set, n)}
            alt={`Страница ${pageLabel(set, n) ?? n} (стр. ${n})`}
            loading="lazy"
            decoding="async"
            draggable={false}
            width={pageSize(set, n)[0]}
            height={pageSize(set, n)[1]}
          />
        )}
        {showGlossary && glossary?.pages[n] && (
          <button
            type="button"
            className={`mviewer__gloss-badge ${glossPage === n ? 'is-active' : ''}`}
            onClick={() => setGlossPage((p) => (p === n ? null : n))}
            aria-pressed={glossPage === n}
            aria-label={`Расшифровка английских подписей страницы ${n}: ${glossary.pages[n].length}`}
            data-gloss-badge={n}
          >
            Расшифровка EN→RU ({glossary.pages[n].length})
          </button>
        )}
        <span className="mviewer__pno" aria-hidden="true">
          {pageLabel(set, n) ?? '—'} · {n}
        </span>
      </div>,
    );
  }

  return (
    <div className="mviewer" data-testid="manual-viewer">
      <div className="mviewer__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="mviewer__dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogRef}>
        <header className="mviewer__head">
          <div className="mviewer__titles">
            <h2 id={titleId} className="mviewer__title">{nodeTitle}</h2>
            <p className="mviewer__doc">
              {entry.doc.title}
              {entry.doc.docNo && <>, {entry.doc.docNo}</>}
              {entry.scope && <> · <span className="mviewer__scope">{entry.scope}</span></>}
            </p>
            <p className="mviewer__page-ind" aria-live="polite" data-indicator>
              <strong data-label>{label ?? '—'}</strong> · стр. <strong data-pdf>{current}</strong> из {total}
              {blank.has(current) && <span className="mviewer__blank"> · пустая страница скана</span>}
            </p>
          </div>
          <button type="button" className="mviewer__close" ref={closeRef} onClick={onClose} aria-label="Закрыть просмотр мануала (Esc)" title="Закрыть (Esc)">
            ×
          </button>
        </header>

        <div className="mviewer__toolbar" role="toolbar" aria-label="Просмотр мануала">
          {manual.docs.length > 1 && (
            <label className="mviewer__docsel">
              <span>Документ</span>
              <select
                value={entry.doc.id}
                onChange={(e) => onDocChange?.(e.target.value)}
                data-doc-switch
                aria-label="Документ модели"
              >
                {manual.docs.map((d) => (
                  <option key={d.doc.id} value={d.doc.id}>
                    {d.doc.docNo ? `${d.doc.docNo} — ` : ''}
                    {d.doc.title} ({d.images.pageCount} стр.)
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="mviewer__group" aria-label="Раздел">
            {MANUAL_PAGE_KINDS.map(kindBtn)}
          </div>
          <div className="mviewer__group" aria-label="Страницы">
            <button type="button" className="mviewer__btn mviewer__btn--text" onClick={() => goTo(current - 1)} disabled={current <= 1} aria-label="Предыдущая страница" title="Предыдущая страница (←)" data-prev>
              ◀ Назад
            </button>
            <button type="button" className="mviewer__btn mviewer__btn--text" onClick={() => goTo(current + 1)} disabled={current >= total} aria-label="Следующая страница" title="Следующая страница (→)" data-next>
              Вперёд ▶
            </button>
            <form
              className="mviewer__jump"
              onSubmit={(e) => {
                e.preventDefault();
                const n = Number(jump);
                if (Number.isFinite(n) && n >= 1) goTo(n);
                setJump('');
              }}
            >
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={total}
                placeholder={String(current)}
                value={jump}
                onChange={(e) => setJump(e.target.value)}
                aria-label={`Перейти к странице (1–${total})`}
                title={`Перейти к странице (1–${total}), Enter`}
              />
            </form>
          </div>
          <div className="mviewer__group" aria-label="Масштаб">
            <button type="button" className="mviewer__btn" onClick={() => zoomBy(-1)} disabled={zoom <= ZOOM_MIN} aria-label="Уменьшить" title="Уменьшить (−)">
              −
            </button>
            <span className="mviewer__zoom" aria-live="polite" data-zoom={zoom}>
              {zoom}%
            </span>
            <button type="button" className="mviewer__btn" onClick={() => zoomBy(1)} disabled={zoom >= ZOOM_MAX} aria-label="Увеличить" title="Увеличить (+)">
              +
            </button>
            <button type="button" className={`mviewer__btn mviewer__btn--text ${zoom === 100 ? 'is-active' : ''}`} onClick={() => setZoom(100)} title="По ширине окна (0)" data-fit>
              По ширине
            </button>
          </div>
          {trInfo && (
            <label className="mviewer__gloss-toggle" title="Панель с полным переводом текущей страницы на русский">
              <input type="checkbox" checked={showTr} onChange={(e) => setShowTr(e.target.checked)} data-tr-toggle />
              Русский перевод
            </label>
          )}
          {glossary && (
            <label className="mviewer__gloss-toggle" title="Плашки с переводом английских подписей на страницах">
              <input type="checkbox" checked={showGlossary} onChange={(e) => setShowGlossary(e.target.checked)} data-gloss-toggle />
              Показывать расшифровки
            </label>
          )}
          <div className="mviewer__group mviewer__group--end">
            <button type="button" className="mviewer__btn mviewer__btn--text mviewer__btn--card" onClick={onShowCard}>
              Карточка узла
            </button>
          </div>
        </div>

        {breakdown && (
          <PartBreakdown
            data={breakdown}
            variant="viewer"
            title="Разбор: люди · время · инструмент"
            docInfo={(id) => MANUALS[id]}
            onOpenRef={openRef}
          />
        )}

        <div className="mviewer__body">
        <div
          className={`mviewer__stage ${dragging ? 'is-dragging' : ''}`}
          ref={stageRef}
          tabIndex={0}
          aria-label="Лента страниц мануала. Колесо — прокрутка, Ctrl + колесо — масштаб, перетаскивание — сдвиг"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="mviewer__feed" style={{ width: feedW + 2 * feedLeft, height: layout.height }}>
            <div className="mviewer__col" style={{ left: feedLeft, width: feedW }}>
              {pages}
            </div>
          </div>
        </div>
        {sideOpen && sidePage != null && (
          <Suspense fallback={<aside className="mviewer__gloss mviewer__side" aria-busy="true" />}>
            <PageSidePanel
              page={sidePage}
              label={pageLabel(set, sidePage) ?? null}
              kind={glossary?.kinds?.[sidePage]}
              glossary={glossEntries}
              translation={trState}
              onClose={closeSide}
            />
          </Suspense>
        )}
        </div>
      </div>
    </div>
  );
}
