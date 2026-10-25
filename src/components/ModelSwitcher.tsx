import type { BulldozerModel, ModelId } from '../types';

interface Props {
  models: BulldozerModel[];
  activeId: ModelId;
  onChange: (id: ModelId) => void;
}

export function ModelSwitcher({ models, activeId, onChange }: Props) {
  return (
    <div className="model-switcher" role="tablist" aria-label="Выбор модели бульдозера">
      {models.map((m) => {
        const active = m.id === activeId;
        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`model-tab${active ? ' is-active' : ''}`}
            onClick={() => onChange(m.id)}
          >
            <span className="model-tab__name">{m.name}</span>
            <span className="model-tab__full">{m.fullName}</span>
            <dl className="model-tab__specs">
              {m.specs.slice(0, 3).map((s) => (
                <div key={s.label}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          </button>
        );
      })}
    </div>
  );
}
