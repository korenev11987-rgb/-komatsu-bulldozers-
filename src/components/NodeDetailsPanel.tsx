import { useEffect } from 'react';
import { SYSTEMS } from '../data/systems';
import type { BulldozerModel, NodeInfo } from '../types';

interface Props {
  model: BulldozerModel;
  node: NodeInfo | null;
  onClose: () => void;
}

export function NodeDetailsPanel({ model, node, onClose }: Props) {
  useEffect(() => {
    if (!node) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [node, onClose]);

  if (!node) {
    return (
      <aside className="panel panel--empty" aria-live="polite">
        <h2 className="panel__title">{model.fullName}</h2>
        <p className="panel__tagline">{model.tagline}</p>
        <dl className="panel__specs">
          {model.specs.map((s) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
        <p className="panel__hint">Выберите узел на схеме, чтобы увидеть описание и основные детали.</p>
        <p className="panel__disclaimer">
          Характеристики приблизительные, по открытым данным производителя; зависят от исполнения и года выпуска.
        </p>
      </aside>
    );
  }

  const system = SYSTEMS[node.system];
  return (
    <aside
      className="panel"
      aria-live="polite"
      aria-labelledby="panel-title"
      style={{ ['--c' as string]: system.color }}
    >
      <div className="panel__head">
        <span className="panel__badge">{system.name}</span>
        <button type="button" className="panel__close" onClick={onClose} aria-label="Закрыть панель">
          ×
        </button>
      </div>
      <h2 id="panel-title" className="panel__title">
        {node.title}
      </h2>
      <p className="panel__model">{model.fullName}</p>
      <p className="panel__desc">{node.description}</p>
      {node.modelNote && (
        <p className="panel__note">
          <strong>Особенность модели:</strong> {node.modelNote}
        </p>
      )}
      <h3 className="panel__subtitle">Основные детали</h3>
      <ul className="parts">
        {node.parts.map((p) => (
          <li key={p.name} className="parts__item">
            <span className="parts__name">{p.name}</span>
            <span className="parts__note">{p.note}</span>
          </li>
        ))}
      </ul>
      <p className="panel__disclaimer">Каталожные номера не приводятся — сверяйтесь с каталогом запчастей Komatsu по серийному номеру машины.</p>
    </aside>
  );
}
