import { ModelDocs } from './components/ModelDocs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { frameAt, STAGE_BY_ID, type StageId } from './anim/stages';
import { useWorkAnimation } from './anim/useWorkAnimation';
import { AnimationPanel } from './components/AnimationPanel';
import { BulldozerSchema } from './components/BulldozerSchema';
import { Legend } from './components/Legend';
import { ModelSwitcher } from './components/ModelSwitcher';
import { NodeDetailsPanel } from './components/NodeDetailsPanel';
import { ManualViewer } from './components/ManualViewer';
import { firstManualKind, getNodeManual } from './data/repair/manualPages';
import { MODELS, MODEL_ORDER } from './data/models';
import type { ModelId, NodeId, SystemId } from './types';

export default function App() {
  const [modelId, setModelId] = useState<ModelId>(() => readUrl().model);
  const [selectedId, setSelectedId] = useState<NodeId | null>(() => readUrl().node);
  const [activeSystem, setActiveSystem] = useState<SystemId | null>(null);
  /** Открытый просмотр мануала: страница PDF (узел — selectedId) */
  const [viewerPage, setViewerPage] = useState<number | null>(() => readUrl().page);

  const model = MODELS[modelId];
  const anim = useWorkAnimation();
  const frame = useMemo(() => (anim.stage ? frameAt(anim.stage, anim.t, anim.time, model.layout) : null), [anim.stage, anim.t, anim.time, model.layout]);

  // ?anim=rip&t=0.5 — открыть кадр этапа (для ссылок и проверки)
  const [initParams] = useState(() => new URLSearchParams(window.location.search));
  useEffect(() => {
    const params = initParams;
    const a = params.get('anim');
    if (a && a in STAGE_BY_ID) anim.seek(a as StageId, Math.min(1, Math.max(0, Number(params.get('t') ?? 0.5))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Узлы общие для всех моделей, поэтому выбранный узел сохраняется при смене модели — удобно сравнивать
  const node = selectedId ? model.nodes[selectedId] : null;
  const nodeManual = useMemo(() => (selectedId ? getNodeManual(modelId, selectedId) : null), [modelId, selectedId]);
  const viewerOpen = viewerPage != null && nodeManual != null;

  // Состояние синхронизируется с адресной строкой: ?model=D475&node=engine
  useEffect(() => {
    const params = new URLSearchParams({ model: modelId });
    if (selectedId) params.set('node', selectedId);
    if (selectedId && viewerOpen) params.set('page', String(viewerPage));
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [modelId, selectedId, viewerOpen, viewerPage]);

  // Смена модели или узла без страниц мануала закрывает просмотр
  useEffect(() => {
    if (viewerPage != null && !nodeManual) setViewerPage(null);
  }, [viewerPage, nodeManual]);

  const handleSelect = useCallback((id: NodeId) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);
  const handleClose = useCallback(() => {
    setSelectedId(null);
    setViewerPage(null);
  }, []);

  /** Открыть мануал узла на первом доступном разделе (разборка → сборка → нормы) */
  const openManual = useCallback(
    (id: NodeId) => {
      const nm = getNodeManual(modelId, id);
      const kind = nm && firstManualKind(nm.pages);
      if (!nm || !kind) return false;
      setSelectedId(id); // карточка доступна за просмотром и после него
      setViewerPage(nm.pages[kind]!.pdfPage);
      return true;
    },
    [modelId],
  );

  // Клик / Enter / Пробел по узлу схемы: есть страница мануала — просмотр; нет — карточка как раньше
  const handleSchemaSelect = useCallback(
    (id: NodeId) => {
      if (openManual(id)) return;
      setViewerPage(null);
      handleSelect(id);
    },
    [openManual, handleSelect],
  );

  // Клик вне карточки (по пустому месту схемы, фону страницы или затемнению) закрывает её.
  // Клик по другому узлу или подписи переключает карточку; переключатели моделей, легенда и
  // панель анимации карточку не закрывают (можно сравнивать один узел на разных моделях).
  useEffect(() => {
    if (!selectedId) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (!t || !(t instanceof Element)) return;
      if (t.closest('.panel, [data-node], .callout:not(.callout--passive), .model-switcher, .legend, .anim, .docs, .mviewer')) return;
      setSelectedId(null);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [selectedId]);

  const handleSystem = useCallback(
    (id: SystemId | null) => {
      setActiveSystem(id);
      if (id && selectedId && model.nodes[selectedId].system !== id) setSelectedId(null);
    },
    [model, selectedId],
  );

  return (
    <div className="app">
      <header className="app__header">
        <h1>Бульдозеры Komatsu: интерактивные схемы</h1>
        <p>Схемы по системам: мотор, ходовая, трансмиссия, гидравлика и электрика. Значения приблизительные.</p>
      </header>

      <ModelSwitcher models={MODEL_ORDER.map((id) => MODELS[id])} activeId={modelId} onChange={setModelId} />

      <Legend activeSystem={activeSystem} onToggle={handleSystem} />

      <main className="app__main">
        <section className="app__schema" aria-label="Схема">
          <BulldozerSchema
            model={model}
            selectedId={selectedId}
            activeSystem={activeSystem}
            onSelect={handleSchemaSelect}
            anim={frame}
          />
          <AnimationPanel anim={anim} frame={frame} model={model} onSelectNode={setSelectedId} />
          <ModelDocs modelId={model.id} />
        </section>
        {node && <div className="panel-backdrop" aria-hidden="true" />}
        <NodeDetailsPanel
          model={model}
          node={node}
          onClose={handleClose}
          manual={nodeManual}
          onOpenManual={node ? () => openManual(node.id) : undefined}
        />
      </main>

      {viewerOpen && node && nodeManual && (
        <ManualViewer
          manual={nodeManual}
          nodeTitle={node.title}
          page={viewerPage ?? 1}
          onPageChange={setViewerPage}
          onClose={() => setViewerPage(null)}
          onShowCard={() => {
            setViewerPage(null);
            requestAnimationFrame(() => document.querySelector<HTMLElement>('.panel--card .panel__close')?.focus());
          }}
        />
      )}

      <footer className="app__footer">
        Учебная схема. Komatsu, D155, D355, D475, Sigmadozer, TORQFLOW — обозначения производителя Komatsu Ltd.
      </footer>
    </div>
  );
}

function readUrl(): { model: ModelId; node: NodeId | null; page: number | null } {
  const params = new URLSearchParams(window.location.search);
  const m = params.get('model');
  const model: ModelId = m && m in MODELS ? (m as ModelId) : 'D155';
  const n = params.get('node');
  const node = n && n in MODELS[model].nodes ? (n as NodeId) : null;
  // ?page=N — открыть просмотр мануала на странице PDF (только если у узла есть страницы)
  const pg = Number(params.get('page'));
  const page = node && Number.isInteger(pg) && pg > 0 && getNodeManual(model, node) ? pg : null;
  return { model, node, page };
}
