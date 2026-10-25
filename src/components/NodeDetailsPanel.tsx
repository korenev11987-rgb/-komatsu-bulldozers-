import { ModelDocs } from './ModelDocs';
import { useEffect, useRef, useState } from 'react';
import { SYSTEMS } from '../data/systems';
import { getRepairCard, MANUALS } from '../data/repair';
import type { RepairSection, SectionKey } from '../data/repair/types';
import type { BulldozerModel, NodeInfo } from '../types';

interface Props {
  model: BulldozerModel;
  node: NodeInfo | null;
  onClose: () => void;
}

type TabKey = 'overview' | SectionKey;

const SECTIONS: { key: SectionKey; title: string; tab: string; ordered: boolean }[] = [
  { key: 'components', title: 'Составные части', tab: 'Состав', ordered: false },
  { key: 'disassembly', title: 'Как разобрать (снять)', tab: 'Разборка', ordered: true },
  { key: 'assembly', title: 'Как собрать (установить)', tab: 'Сборка', ordered: true },
  { key: 'repair', title: 'Как чинить: обслуживание и проверки', tab: 'Ремонт и ТО', ordered: false },
];

export function NodeDetailsPanel({ model, node, onClose }: Props) {
  const [tab, setTab] = useState<TabKey>('repair');
  const titleRef = useRef<HTMLHeadingElement>(null);

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
        <p className="panel__hint">
          Нажмите на узел схемы: откроется карточка с составом узла, порядком разборки и сборки и указаниями по обслуживанию — со ссылками на страницы мануалов Komatsu.
        </p>
        <p className="panel__disclaimer">
          Характеристики приблизительные, по открытым данным производителя; зависят от исполнения и года выпуска.
        </p>
      </aside>
    );
  }

  const system = SYSTEMS[node.system];
  const card = getRepairCard(model.id, node.id);
  const found = SECTIONS.filter((s) => card[s.key].status === 'manual').length;
  const current = SECTIONS.find((s) => s.key === tab);

  return (
    <aside
      className="panel panel--card"
      role="dialog"
      aria-modal="false"
      aria-labelledby="panel-title"
      style={{ ['--c' as string]: system.color }}
    >
      <div className="panel__head">
        <span className="panel__badge">{system.name}</span>
        <button type="button" className="panel__close" onClick={onClose} aria-label="Закрыть карточку (Esc)" title="Закрыть (Esc)">
          ×
        </button>
      </div>
      <h2 id="panel-title" className="panel__title" ref={titleRef}>
        {node.title}
      </h2>
      <p className="panel__model">{model.fullName}</p>
      <p className={`src-summary ${found ? 'src-summary--ok' : 'src-summary--none'}`}>
        {found ? `Данные из мануала: ${found} из ${SECTIONS.length} разделов` : 'Данные из мануала не найдены ни для одного раздела'}
      </p>

      <div className="tabs" role="tablist" aria-label="Разделы карточки">
        {[{ key: 'overview' as TabKey, tab: 'Обзор', status: null as RepairSection['status'] | null }, ...SECTIONS.map((s) => ({ key: s.key as TabKey, tab: s.tab, status: card[s.key].status }))].map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls="tabpanel"
            className={['tabs__tab', tab === t.key && 'is-active'].filter(Boolean).join(' ')}
            onClick={() => setTab(t.key)}
          >
            {t.status && <i className={`tabs__dot tabs__dot--${t.status}`} aria-hidden="true" />}
            {t.tab}
            {t.status === 'not-found' && <span className="sr-only"> (данные из мануала не найдены)</span>}
          </button>
        ))}
      </div>

      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="tabpanel">
        {current ? (
          <SectionView title={current.title} section={card[current.key]} ordered={current.ordered} />
        ) : (
          <>
            <p className="panel__desc">{node.description}</p>
            {node.modelNote && (
              <p className="panel__note">
                <strong>Особенность модели:</strong> {node.modelNote}
              </p>
            )}
            <h3 className="panel__subtitle">Основные детали (обзор)</h3>
            <ul className="parts">
              {node.parts.map((p) => (
                <li key={p.name} className="parts__item">
                  <span className="parts__name">{p.name}</span>
                  <span className="parts__note">{p.note}</span>
                </li>
              ))}
            </ul>
            <p className="panel__disclaimer">
              Обзор — общее учебное описание схемы, а не выдержка из мануала. Разделы «Состав», «Разборка», «Сборка» и «Ремонт и ТО» заполняются только по мануалам Komatsu.
            </p>
          </>
        )}
      </div>

      <ModelDocs modelId={model.id} compact />

      <p className="panel__disclaimer">
        Перед работами сверяйтесь с официальным Shop Manual / Operation &amp; Maintenance Manual Komatsu для серийного номера вашей машины. Каталожные номера запчастей не приводятся.
      </p>
    </aside>
  );
}

function SectionView({ title, section, ordered }: { title: string; section: RepairSection; ordered: boolean }) {
  if (section.status === 'not-found') {
    return (
      <section className="rsec">
        <div className="rsec__head">
          <h3 className="panel__subtitle">{title}</h3>
          <span className="src-badge src-badge--none">данные из мануала не найдены</span>
        </div>
        <p className="rsec__empty">
          В доступных нам мануалах Komatsu для этой модели нет сведений для этого раздела. Мы не заполняем его общими знаниями — используйте Shop Manual Komatsu.
        </p>
      </section>
    );
  }
  const List = ordered ? 'ol' : 'ul';
  return (
    <section className="rsec">
      <div className="rsec__head">
        <h3 className="panel__subtitle">{title}</h3>
        <span className="src-badge src-badge--ok">Данные из мануала</span>
      </div>
      <List className={ordered ? 'steps' : 'facts'}>
        {section.items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </List>
      <div className="cite">
        <span className="cite__label">Источник:</span>
        <ul>
          {section.source.map((r, i) => {
            const d = MANUALS[r.doc];
            return (
              <li key={i}>
                <cite>{d.title}</cite>, {d.model}
                {d.docNo && <>, № {d.docNo}</>} — раздел «{r.section}», с. {r.pages}
                {d.note && <span className="cite__note"> ({d.note})</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
