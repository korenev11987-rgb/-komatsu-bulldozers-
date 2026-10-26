import type { GlossaryEntry } from '../data/manuals/glossary';
import type { TranslationPage } from '../data/manuals/translations';
import { Markdown } from './Markdown';

/* Боковая панель «Перевод на русский» рядом со страницей ленты (на узком экране — под страницей).
 * Общая для всех документов: показывает полный перевод страницы (markdown) и/или
 * расшифровку английских подписей (таблица EN → RU). Масштаб ленты на панель не влияет.
 * Загружается отдельным чанком (React.lazy) вместе с рендером markdown. */

export type TranslationState = TranslationPage | 'loading' | 'missing' | 'error' | null;

interface Props {
  page: number;
  label: string | null;
  kind?: string;
  glossary?: GlossaryEntry[];
  translation: TranslationState;
  onClose: () => void;
}

export default function PageSidePanel({ page, label, kind, glossary, translation, onClose }: Props) {
  const tr = translation && typeof translation === 'object' ? translation : null;
  const k = kind ?? tr?.kind;
  return (
    <aside
      className="mviewer__gloss mviewer__side"
      aria-label={`Перевод на русский, стр. ${page}`}
      data-side-panel={page}
      data-gloss-panel={glossary?.length ? page : undefined}
      data-tr-panel={translation ? page : undefined}
    >
      <header className="mviewer__gloss-head">
        <strong>
          Перевод на русский · с. {tr?.label ?? label ?? '—'}, стр. {page}
          {k && <> · {k}</>}
        </strong>
        <button type="button" className="mviewer__btn" onClick={onClose} aria-label="Закрыть перевод">
          ×
        </button>
      </header>
      <div className="mviewer__gloss-scroll">
        {translation === 'loading' && <p className="mviewer__side-note">Загрузка перевода…</p>}
        {translation === 'error' && <p className="mviewer__side-note">Не удалось загрузить перевод документа.</p>}
        {translation === 'missing' && <p className="mviewer__side-note" data-tr-missing>Перевод этой страницы пока не подготовлен.</p>}
        {tr && (
          <div className="mviewer__tr" data-tr-text>
            <Markdown text={tr.ru} />
            {tr.terms && tr.terms.length > 0 && (
              <details className="mviewer__tr-terms">
                <summary>Термины ({tr.terms.length})</summary>
                <table className="mviewer__gloss-table">
                  <tbody>
                    {tr.terms.map((t, i) => (
                      <tr key={i}>
                        <td lang="en">{t.en}</td>
                        <td>{t.ru}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}
          </div>
        )}
        {glossary && glossary.length > 0 && (
          <>
            {tr && <h3 className="mviewer__side-sub">Расшифровка английских подписей</h3>}
            <table className="mviewer__gloss-table">
              <thead>
                <tr>
                  <th scope="col">English</th>
                  <th scope="col">Русский</th>
                </tr>
              </thead>
              <tbody>
                {glossary.map((g, i) => (
                  <tr key={i}>
                    <td lang="en">{g.en}</td>
                    <td>
                      {g.ru}
                      {g.note && <small className="mviewer__gloss-note">{g.note}</small>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </aside>
  );
}
