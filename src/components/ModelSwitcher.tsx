import { useEffect, useRef } from 'react';
import { seriesOf } from '../data/models';
import type { BulldozerModel, ModelId } from '../types';

interface Props {
  models: BulldozerModel[];
  activeId: ModelId;
  onChange: (id: ModelId) => void;
}

const short = (m: BulldozerModel) => m.fullName.replace(/^(Komatsu|Caterpillar|Cat)\s+/, '');

/** Переключатель моделей, сгруппированный по сериям: D155 / D275 / D355 / D375 / D475 */
export function ModelSwitcher({ models, activeId, onChange }: Props) {
  const groups: { series: string; items: BulldozerModel[] }[] = [];
  for (const m of models) {
    const s = seriesOf(m);
    const g = groups.find((x) => x.series === s);
    if (g) g.items.push(m);
    else groups.push({ series: s, items: [m] });
  }
  const active = models.find((m) => m.id === activeId) ?? models[0];
  const rowRef = useRef<HTMLDivElement>(null);

  // На мобильных лента прокручивается — держим активную серию в зоне видимости
  useEffect(() => {
    const el = rowRef.current?.querySelector<HTMLElement>('.ms-group.is-active');
    const row = rowRef.current;
    if (el && row && row.scrollWidth > row.clientWidth) {
      row.scrollTo({ left: el.offsetLeft - 8, behavior: 'smooth' });
    }
  }, [activeId]);

  return (
    <div className="model-switcher">
      <div className="ms-row" ref={rowRef} role="tablist" aria-label="Выбор модели бульдозера">
        {groups.map((g) => {
          const on = g.items.some((m) => m.id === activeId);
          return (
            <div key={g.series} className={`ms-group${on ? ' is-active' : ''}`} role="group" aria-label={`Серия ${g.series}`}>
              <span className="ms-group__title">{g.series}</span>
              <div className="ms-group__chips">
                {g.items.map((m) => {
                  const sel = m.id === activeId;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="tab"
                      data-model={m.id}
                      aria-selected={sel}
                      className={`model-tab${sel ? ' is-active' : ''}`}
                      onClick={() => onChange(m.id)}
                      title={m.fullName}
                    >
                      {short(m)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="ms-summary" aria-live="polite">
        <div className="ms-summary__head">
          <span className="ms-summary__name">{active.fullName}</span>
          <span className="ms-summary__tag">{active.tagline}</span>
        </div>
        <dl className="ms-summary__specs">
          {active.specs.map((s) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
