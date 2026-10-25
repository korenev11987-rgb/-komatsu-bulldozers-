import { useState } from 'react';
import type { ModelId } from '../types';
import { MODEL_DOCS, docUrl } from '../data/docs';

/** Блок «Документы» под схемой; показывается только для моделей с приложенными PDF. */
export function ModelDocs({ modelId, compact = false }: { modelId: ModelId; compact?: boolean }) {
  const docs = MODEL_DOCS[modelId];
  const [preview, setPreview] = useState<string | null>(null);
  if (!docs?.length) return null;
  return (
    <section className={`docs ${compact ? 'docs--compact' : ''}`} aria-label="Документы">
      {!compact && <h2 className="docs__title">Документы</h2>}
      {docs.map((d) => (
        <div key={d.id} className="docs__item">
          <a className="docs__btn" href={docUrl(d)} target="_blank" rel="noopener" data-doc={d.id}>
            <span className="docs__icon" aria-hidden="true">PDF</span>
            {d.label}
          </a>
          <p className="docs__meta">
            {d.model}, № {d.docNo}. Источник:{' '}
            {d.sourceUrl ? (
              <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer">
                {d.sourceLabel}
              </a>
            ) : (
              d.sourceLabel
            )}
            .
          </p>
          <p className="docs__note">{d.note}</p>
          {!compact && (
            <>
              <button
                type="button"
                className="docs__toggle"
                aria-expanded={preview === d.id}
                onClick={() => setPreview(preview === d.id ? null : d.id)}
              >
                {preview === d.id ? 'Скрыть просмотр' : 'Показать просмотр здесь'}
              </button>
              {preview === d.id && (
                <object className="docs__preview" data={docUrl(d)} type="application/pdf" aria-label={d.label}>
                  <p>
                    Браузер не показывает PDF встроенно — <a href={docUrl(d)} target="_blank" rel="noopener">откройте файл в новой вкладке</a>.
                  </p>
                </object>
              )}
            </>
          )}
        </div>
      ))}
    </section>
  );
}
