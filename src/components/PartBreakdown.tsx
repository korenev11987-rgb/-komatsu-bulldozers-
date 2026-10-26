import { useId, useMemo, useState } from 'react';
import type { BreakdownRef, BreakdownTool, PartBreakdownData } from '../data/repair/types';

/*
 * Разбор узла: «люди · время · инструмент» — только данные мануала.
 * Общий компонент (карточка узла, просмотр мануала, другие производители): получает типизированные данные
 * PartBreakdownData и реестр документов; ничего не оценивает — пустые пункты помечаются «данные из мануала не найдены».
 */

const NOT_FOUND = 'данные из мануала не найдены';

export interface BreakdownDocInfo {
  title: string;
  docNo?: string;
}

interface Props {
  data: PartBreakdownData;
  /** Описание документа по id (название и номер) */
  docInfo: (docId: string) => BreakdownDocInfo | undefined;
  /** Заголовок блока */
  title?: string;
  /** Развёрнут при показе */
  defaultOpen?: boolean;
  /** Переход к странице-источнику (в просмотре — прокрутка ленты; в карточке — открыть просмотр) */
  onOpenRef?: (ref: BreakdownRef) => void;
  variant?: 'card' | 'viewer';
  /** Не сворачивается (например, в нижнем листе на телефоне) */
  className?: string;
}

export function PartBreakdown({ data, docInfo, title = 'Инструмент и трудоёмкость', defaultOpen = false, onOpenRef, variant = 'card', className }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();
  const groups = useMemo(() => groupTools(data.tools), [data.tools]);
  const sum = [
    `инструмент: ${data.tools.length || 'нет'}`,
    `оборудование: ${data.equipment.length || 'нет'}`,
    `массы: ${data.weights.length || 'нет'}`,
    `люди/время: ${data.crew.length + data.time.length ? 'есть' : 'нет'}`,
  ].join(' · ');

  const Ref = ({ r }: { r: BreakdownRef }) => {
    const d = docInfo(r.doc);
    const text = `${d?.docNo ?? d?.title ?? r.doc}, с. ${r.label || '—'}, стр. PDF ${r.pdfPage}`;
    return onOpenRef ? (
      <button type="button" className="pbd__ref" onClick={() => onOpenRef(r)} data-ref-page={r.pdfPage} data-ref-doc={r.doc} title="Открыть страницу в ленте мануала">
        {text}
      </button>
    ) : (
      <span className="pbd__ref" data-ref-page={r.pdfPage}>
        {text}
      </span>
    );
  };

  const Missing = () => (
    <span className="pbd__nf">
      <span className="src-badge src-badge--none">{NOT_FOUND}</span>
      {data.missingNote && <small> — {data.missingNote}</small>}
    </span>
  );

  return (
    <section className={['pbd', `pbd--${variant}`, open && 'is-open', className].filter(Boolean).join(' ')} data-breakdown aria-label={title}>
      <button type="button" className="pbd__toggle" aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen((o) => !o)} data-breakdown-toggle>
        <span className="pbd__chev" aria-hidden="true">{open ? '▾' : '▸'}</span>
        <span className="pbd__title">{title}</span>
        <small className="pbd__sum">{sum}</small>
      </button>
      {open && (
        <div className="pbd__body" id={bodyId}>
          {data.scope && <p className="pbd__scope">По документу: {data.scope}</p>}

          <div className="pbd__row" data-bd="crew">
            <h4 className="pbd__h">Исполнители</h4>
            {data.crew.length ? (
              <ul className="pbd__list">
                {data.crew.map((c, i) => (
                  <li key={i}>
                    {c.text} <Ref r={c.ref} />
                  </li>
                ))}
              </ul>
            ) : (
              <Missing />
            )}
          </div>

          <div className="pbd__row" data-bd="time">
            <h4 className="pbd__h">Время</h4>
            {data.time.length ? (
              <ul className="pbd__list">
                {data.time.map((c, i) => (
                  <li key={i}>
                    {c.text} <Ref r={c.ref} />
                  </li>
                ))}
              </ul>
            ) : (
              <Missing />
            )}
          </div>

          <div className="pbd__row" data-bd="tools">
            <h4 className="pbd__h">Специальный инструмент{data.tools.length ? ` (${data.tools.length})` : ''}</h4>
            {groups.length ? (
              groups.map((g, gi) => (
                <details className="pbd__group" key={gi} open={groups.length === 1}>
                  <summary>
                    {g.work} <small>· {g.tools.length} поз.</small>
                  </summary>
                  <div className="pbd__table-wrap">
                    <table className="pbd__table">
                      <thead>
                        <tr>
                          <th scope="col">Обозн.</th>
                          <th scope="col">Номер детали</th>
                          <th scope="col">Наименование</th>
                          <th scope="col">Кол.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.tools.map((t, i) => (
                          <tr key={i}>
                            <td>{t.sym ?? '—'}</td>
                            <td className="pbd__pn">{t.partNo}</td>
                            <td>
                              {t.name}
                              {t.note && <small className="pbd__note"> — {t.note}</small>}
                            </td>
                            <td>{t.qty ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="pbd__src">
                    Источник: {g.refs.map((r, i) => <Ref key={i} r={r} />)}
                  </p>
                </details>
              ))
            ) : (
              <Missing />
            )}
          </div>

          <div className="pbd__row" data-bd="equipment">
            <h4 className="pbd__h">Стандартное оборудование (таль, кран, домкрат, трос…)</h4>
            {data.equipment.length ? (
              <ul className="pbd__list">
                {data.equipment.map((e, i) => (
                  <li key={i}>
                    <strong>{e.name}</strong>
                    {e.general && <small className="pbd__tag"> общее указание документа, не по узлу</small>}
                    <q className="pbd__quote">{e.quote}</q>
                    {e.translated && <small className="pbd__tag"> перевод с английского</small>} <Ref r={e.ref} />
                  </li>
                ))}
              </ul>
            ) : (
              <Missing />
            )}
          </div>

          <div className="pbd__row" data-bd="weights">
            <h4 className="pbd__h">Массы деталей</h4>
            {data.weights.length ? (
              <div className="pbd__table-wrap">
                <table className="pbd__table">
                  <thead>
                    <tr>
                      <th scope="col">Деталь</th>
                      <th scope="col">Масса, кг</th>
                      <th scope="col">Источник</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.weights.map((w, i) => (
                      <tr key={i}>
                        <td>
                          {w.name}
                          {w.note && <small className="pbd__note"> — {w.note}</small>}
                        </td>
                        <td className="pbd__kg">{w.kg}</td>
                        <td>
                          <Ref r={w.ref} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Missing />
            )}
          </div>

          <p className="pbd__foot">
            Только сведения из мануала, сверенные по изображениям страниц. Чего нет в мануале — «{NOT_FOUND}»; оценки не приводятся.
          </p>
        </div>
      )}
    </section>
  );
}

interface ToolGroup {
  work: string;
  tools: BreakdownTool[];
  refs: BreakdownRef[];
}

function groupTools(tools: BreakdownTool[]): ToolGroup[] {
  const map = new Map<string, ToolGroup>();
  for (const t of tools) {
    let g = map.get(t.work);
    if (!g) map.set(t.work, (g = { work: t.work, tools: [], refs: [] }));
    g.tools.push(t);
    if (!g.refs.some((r) => r.doc === t.ref.doc && r.pdfPage === t.ref.pdfPage)) g.refs.push(t.ref);
  }
  return [...map.values()];
}
