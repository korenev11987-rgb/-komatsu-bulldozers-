import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { MANUAL_PAGE_KINDS, type ManualPageKind, type NodeManual } from '../data/repair/manualPages';

/*
 * Просмотр страницы мануала поверх схемы.
 * pdf.js (pdfjs-dist) грузится лениво отдельным чанком; worker — отдельный файл из сборки (?url), поэтому
 * путь корректен при любой базе (в т. ч. '/-komatsu-bulldozers-/'). PDF читается диапазонами (HTTP Range),
 * без предварительной загрузки всего файла, рендерится одна страница в canvas.
 *
 * Масштаб: 100 % = «По ширине» (страница по ширине окна просмотра); 50–400 %, шаг 25 %.
 * Колесо мыши прокручивает страницу; Ctrl + колесо (и жест «щипок» на тачпаде) — масштаб относительно курсора.
 * Перетаскивание мышью/пальцем — панорамирование; два пальца — масштаб (pinch).
 * Клавиши: + / = — крупнее, − — мельче, 0 — по ширине, ← / → (PageUp / PageDown) — страницы, Esc — закрыть.
 */

type PdfJs = typeof import('pdfjs-dist');
let pdfjsPromise: Promise<PdfJs> | null = null;
function loadPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]).then(([lib, worker]) => {
      lib.GlobalWorkerOptions.workerSrc = worker.default;
      return lib;
    });
  }
  return pdfjsPromise;
}

/** Открытые документы кэшируются: повторное открытие просмотра не перечитывает PDF */
const docCache = new Map<string, Promise<PDFDocumentProxy>>();
function openDoc(url: string): Promise<PDFDocumentProxy> {
  let p = docCache.get(url);
  if (!p) {
    p = loadPdfJs().then((lib) => {
      const task: PDFDocumentLoadingTask = lib.getDocument({
        url,
        disableAutoFetch: true,
        disableStream: true,
        rangeChunkSize: 256 * 1024,
      });
      return task.promise;
    });
    p.catch(() => docCache.delete(url));
    docCache.set(url, p);
  }
  return p;
}

export const ZOOM_MIN = 50;
export const ZOOM_MAX = 400;
export const ZOOM_STEP = 25;
const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z)));
/** Масштаб сохраняется между страницами, разделами и повторными открытиями */
let rememberedZoom = 100;
/** Ограничение размера canvas (пикселей), чтобы не исчерпать память на 400 % × DPR */
const MAX_CANVAS_PIXELS = 48e6;

interface Props {
  manual: NodeManual;
  nodeTitle: string;
  page: number;
  onPageChange: (pdfPage: number) => void;
  onClose: () => void;
  onShowCard: () => void;
}

export function ManualViewer({ manual, nodeTitle, page, onPageChange, onClose, onShowCard }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(true);
  const [zoom, setZoomState] = useState(rememberedZoom);
  const [stageW, setStageW] = useState(0);
  /** Размер страницы при scale = 1 (pt) */
  const [base, setBase] = useState<{ w: number; h: number } | null>(null);
  const anchorRef = useRef<{ x: number; y: number; from: number } | null>(null);
  const [rendered, setRendered] = useState<{ page: number; css: number } | null>(null);

  const total = doc?.numPages ?? null;
  const label = manual.info.pageLabel?.(page);
  const blank = manual.info.blankPages?.includes(page);
  const fileHref = `${manual.fileUrl}#page=${page}`;
  const currentKind = MANUAL_PAGE_KINDS.find((k) => manual.pages[k.key]?.pdfPage === page)?.key ?? null;

  const setZoom = useCallback((next: number, anchor?: { x: number; y: number }) => {
    setZoomState((prev) => {
      const z = clampZoom(next);
      if (z === prev) return prev;
      const st = stageRef.current;
      anchorRef.current = st ? { x: anchor?.x ?? st.clientWidth / 2, y: anchor?.y ?? st.clientHeight / 2, from: prev } : null;
      rememberedZoom = z;
      return z;
    });
  }, []);
  const zoomBy = useCallback((dir: 1 | -1, anchor?: { x: number; y: number }) => {
    setZoomState((prev) => {
      // шаг 25 %: с «нестандартного» значения (после pinch / Ctrl+колесо) — к ближайшему кратному
      const z = clampZoom(dir > 0 ? Math.floor(prev / ZOOM_STEP) * ZOOM_STEP + ZOOM_STEP : Math.ceil(prev / ZOOM_STEP) * ZOOM_STEP - ZOOM_STEP);
      if (z === prev) return prev;
      const st = stageRef.current;
      anchorRef.current = st ? { x: anchor?.x ?? st.clientWidth / 2, y: anchor?.y ?? st.clientHeight / 2, from: prev } : null;
      rememberedZoom = z;
      return z;
    });
  }, []);

  // Документ
  useEffect(() => {
    let alive = true;
    setError(null);
    openDoc(manual.fileUrl).then(
      (d) => alive && setDoc(d),
      (e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      alive = false;
    };
  }, [manual.fileUrl]);

  // Ширина области просмотра (для «по ширине»)
  useLayoutEffect(() => {
    const st = stageRef.current;
    if (!st) return;
    const update = () => setStageW(st.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(st);
    return () => ro.disconnect();
  }, []);

  const fitScale = base && stageW ? Math.max(0.1, (stageW - 24) / base.w) : 0;
  const cssScale = fitScale * (zoom / 100);
  const cssW = base ? Math.round(base.w * cssScale) : 0;
  const cssH = base ? Math.round(base.h * cssScale) : 0;

  // Удерживать точку под курсором/центром при смене масштаба
  useLayoutEffect(() => {
    const a = anchorRef.current;
    const st = stageRef.current;
    if (!a || !st || !base) return;
    anchorRef.current = null;
    const k = zoom / a.from;
    st.scrollLeft = (st.scrollLeft + a.x) * k - a.x;
    st.scrollTop = (st.scrollTop + a.y) * k - a.y;
  }, [zoom, base]);

  // Рендер страницы (по DPR, без растягивания CSS)
  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    let task: RenderTask | null = null;
    setRendering(true);
    (async () => {
      try {
        const pg = await doc.getPage(Math.min(Math.max(1, page), doc.numPages));
        if (cancelled) return;
        const v1 = pg.getViewport({ scale: 1 });
        if (!base || Math.abs(base.w - v1.width) > 0.5 || Math.abs(base.h - v1.height) > 0.5) {
          setBase({ w: v1.width, h: v1.height });
          return; // повторный запуск эффекта с новым размером
        }
        if (!cssScale) return;
        const dpr = window.devicePixelRatio || 1;
        const vpCss = pg.getViewport({ scale: cssScale });
        const ratio = Math.min(dpr, Math.sqrt(MAX_CANVAS_PIXELS / (vpCss.width * vpCss.height)));
        const vp = pg.getViewport({ scale: cssScale * ratio });
        const off = document.createElement('canvas');
        off.width = Math.floor(vp.width);
        off.height = Math.floor(vp.height);
        const ctx = off.getContext('2d');
        if (!ctx) throw new Error('canvas 2d недоступен');
        task = pg.render({ canvasContext: ctx, viewport: vp });
        await task.promise;
        if (cancelled) return;
        const c = canvasRef.current;
        if (!c) return;
        c.width = off.width;
        c.height = off.height;
        c.getContext('2d')?.drawImage(off, 0, 0);
        c.dataset.page = String(page);
        c.dataset.scale = (vp.scale / cssScale).toFixed(3);
        setRendered({ page, css: cssScale });
        setRendering(false);
      } catch (e: unknown) {
        if (cancelled || (e instanceof Error && e.name === 'RenderingCancelledException')) return;
        setError(e instanceof Error ? e.message : String(e));
        setRendering(false);
      }
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, page, cssScale, base]);

  // При смене страницы — к началу страницы
  useEffect(() => {
    const st = stageRef.current;
    if (st) {
      st.scrollTop = 0;
      st.scrollLeft = 0;
    }
  }, [page]);

  const go = useCallback(
    (n: number) => {
      const max = total ?? n;
      const next = Math.min(Math.max(1, n), max);
      if (next !== page) onPageChange(next);
    },
    [page, total, onPageChange],
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
        const f = [...root.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null);
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
      let handled = true;
      if (e.key === '+' || e.key === '=') zoomBy(1);
      else if (e.key === '-' || e.key === '_') zoomBy(-1);
      else if (e.key === '0') setZoom(100);
      else if (e.key === 'ArrowRight' || e.key === 'PageDown') go(page + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(page - 1);
      else handled = false;
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose, zoomBy, setZoom, go, page]);

  // Ctrl + колесо — масштаб у курсора (обычное колесо — прокрутка)
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

  // Перетаскивание (мышь/палец) и pinch двумя пальцами
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ x: number; y: number; sl: number; st: number } | null>(null);
  const pinch = useRef<{ d: number; z: number; cx: number; cy: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const st = stageRef.current!;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    st.setPointerCapture(e.pointerId);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const r = st.getBoundingClientRect();
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoom, cx: (a.x + b.x) / 2 - r.left, cy: (a.y + b.y) / 2 - r.top };
      drag.current = null;
    } else {
      drag.current = { x: e.clientX, y: e.clientY, sl: st.scrollLeft, st: st.scrollTop };
      setDragging(true);
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const st = stageRef.current!;
    if (pinch.current && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current.d > 0) setZoom(pinch.current.z * (d / pinch.current.d), { x: pinch.current.cx, y: pinch.current.cy });
    } else if (drag.current) {
      st.scrollLeft = drag.current.sl - (e.clientX - drag.current.x);
      st.scrollTop = drag.current.st - (e.clientY - drag.current.y);
    }
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) {
      drag.current = null;
      setDragging(false);
    }
  };

  const titleId = 'mviewer-title';
  const kindBtn = (k: { key: ManualPageKind; title: string }) => {
    const ref = manual.pages[k.key];
    return (
      <button
        key={k.key}
        type="button"
        className={`mviewer__kind ${currentKind === k.key ? 'is-active' : ''}`}
        disabled={!ref}
        aria-pressed={currentKind === k.key}
        title={ref ? `${k.title}: с. ${ref.label} (PDF ${ref.pdfPage})` : 'данные из мануала не найдены'}
        data-kind={k.key}
        onClick={() => ref && onPageChange(ref.pdfPage)}
      >
        {k.title}
        {ref && <small> {ref.label}</small>}
      </button>
    );
  };

  return (
    <div className="mviewer" data-testid="manual-viewer">
      <div className="mviewer__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="mviewer__dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogRef}>
        <header className="mviewer__head">
          <div className="mviewer__titles">
            <h2 id={titleId} className="mviewer__title">{nodeTitle}</h2>
            <p className="mviewer__doc">
              {manual.doc.title}, {manual.doc.docNo}
              {manual.info.scope && <> · <span className="mviewer__scope">{manual.info.scope}</span></>}
            </p>
            <p className="mviewer__page" aria-live="polite">
              Страница мануала <strong data-label>{label ?? '—'}</strong> · PDF <strong data-pdf>{page}</strong>
              {total ? <> из {total}</> : null}
              {blank && <span className="mviewer__blank"> · страница в скане пустая</span>}
            </p>
          </div>
          <button type="button" className="mviewer__close" ref={closeRef} onClick={onClose} aria-label="Закрыть просмотр мануала (Esc)" title="Закрыть (Esc)">
            ×
          </button>
        </header>

        <div className="mviewer__toolbar" role="toolbar" aria-label="Просмотр мануала">
          <div className="mviewer__group" aria-label="Раздел">
            {MANUAL_PAGE_KINDS.map(kindBtn)}
          </div>
          <div className="mviewer__group" aria-label="Страницы">
            <button type="button" className="mviewer__btn" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Предыдущая страница" title="Предыдущая страница (←)">
              ‹
            </button>
            <button type="button" className="mviewer__btn" onClick={() => go(page + 1)} disabled={total != null && page >= total} aria-label="Следующая страница" title="Следующая страница (→)">
              ›
            </button>
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
            <button type="button" className={`mviewer__btn mviewer__btn--text ${zoom === 100 ? 'is-active' : ''}`} onClick={() => setZoom(100)} title="По ширине окна (0)">
              По ширине
            </button>
          </div>
          <div className="mviewer__group mviewer__group--end">
            <a className="mviewer__btn mviewer__btn--text" href={fileHref} target="_blank" rel="noopener" data-open-pdf>
              Открыть PDF целиком
            </a>
            <button type="button" className="mviewer__btn mviewer__btn--text mviewer__btn--card" onClick={onShowCard}>
              Карточка узла
            </button>
          </div>
        </div>

        <div
          className={`mviewer__stage ${dragging ? 'is-dragging' : ''}`}
          ref={stageRef}
          tabIndex={0}
          aria-label={`Страница ${label ?? page}. Перетаскивание — прокрутка, Ctrl + колесо — масштаб`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="mviewer__sheet" style={{ width: cssW || undefined, height: cssH || undefined }}>
            <canvas
              ref={canvasRef}
              className="mviewer__canvas"
              style={{
                width: cssW || undefined,
                height: cssH || undefined,
                visibility: rendered ? 'visible' : 'hidden',
              }}
            />
            {(!doc || (rendering && rendered?.page !== page)) && !error && <div className="mviewer__loading">Загрузка страницы…</div>}
          </div>
          {error && (
            <div className="mviewer__error" role="alert">
              Не удалось показать страницу ({error}). <a href={fileHref} target="_blank" rel="noopener">Открыть PDF на странице {page}</a>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
