import { SYSTEMS, SYSTEM_ORDER } from '../data/systems';
import type { SystemId } from '../types';

interface Props {
  activeSystem: SystemId | null;
  onToggle: (id: SystemId | null) => void;
}

export function Legend({ activeSystem, onToggle }: Props) {
  return (
    <div className="legend" role="group" aria-label="Фильтр по системам">
      {SYSTEM_ORDER.map((id) => {
        const s = SYSTEMS[id];
        const active = activeSystem === id;
        return (
          <button
            key={id}
            type="button"
            className={`legend__item${active ? ' is-active' : ''}${activeSystem && !active ? ' is-dimmed' : ''}`}
            aria-pressed={active}
            onClick={() => onToggle(active ? null : id)}
            style={{ ['--c' as string]: s.color }}
            title={s.subtitle}
          >
            <span className="legend__swatch" aria-hidden="true" />
            <span className="legend__name">{s.name}</span>
            <span className="legend__sub">{s.subtitle}</span>
          </button>
        );
      })}
      <button
        type="button"
        className="legend__reset"
        onClick={() => onToggle(null)}
        disabled={activeSystem === null}
      >
        Показать все
      </button>
    </div>
  );
}
