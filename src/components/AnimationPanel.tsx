import type { AnimFrame } from '../anim/stages';
import { STAGES, STAGE_BY_ID } from '../anim/stages';
import type { WorkAnimation } from '../anim/useWorkAnimation';
import { SYSTEMS } from '../data/systems';
import type { BulldozerModel, NodeId } from '../types';

interface Props {
  anim: WorkAnimation;
  frame: AnimFrame | null;
  model: BulldozerModel;
  onSelectNode: (id: NodeId) => void;
}

/** Панель «Как работает бульдозер»: выбор этапа, воспроизведение, пояснение и участвующие узлы. */
export function AnimationPanel({ anim, frame, model, onSelectNode }: Props) {
  const def = anim.stage ? STAGE_BY_ID[anim.stage] : null;
  const idx = anim.stage ? STAGES.findIndex((s) => s.id === anim.stage) : -1;
  return (
    <section className="anim" aria-label="Анимация работы бульдозера">
      <div className="anim__head">
        <h2 className="anim__title">Как работает {model.name}</h2>
        <div className="anim__controls">
          <button type="button" className="anim__btn" onClick={() => anim.step(-1)} aria-label="Предыдущий этап" title="Предыдущий этап">
            ◀
          </button>
          <button type="button" className="anim__btn anim__btn--main" onClick={anim.togglePlay} aria-label={anim.playing ? 'Пауза' : 'Воспроизвести'} title={anim.playing ? 'Пауза' : 'Воспроизвести'}>
            {anim.playing ? '❚❚' : '▶'}
          </button>
          <button type="button" className="anim__btn" onClick={() => anim.step(1)} aria-label="Следующий этап" title="Следующий этап">
            ▶▶
          </button>
          <button type="button" className={`anim__btn anim__btn--text ${anim.auto ? 'is-on' : ''}`} onClick={anim.playAll} aria-pressed={anim.auto}>
            Все этапы
          </button>
          <button type="button" className="anim__btn anim__btn--text" onClick={anim.stop} disabled={!anim.stage}>
            Стоп
          </button>
        </div>
      </div>

      <ol className="anim__steps">
        {STAGES.map((s, k) => (
          <li key={s.id}>
            <button
              type="button"
              className={`anim__step ${s.id === anim.stage ? 'is-active' : ''} ${idx > k ? 'is-done' : ''}`}
              aria-pressed={s.id === anim.stage}
              data-stage={s.id}
              onClick={() => anim.selectStage(s.id)}
            >
              <span className="anim__num">{k + 1}</span>
              {s.title}
            </button>
          </li>
        ))}
      </ol>

      <div className="anim__progress" role="progressbar" aria-label="Ход этапа" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(anim.rawT * 100)}>
        <span style={{ width: `${(anim.stage ? anim.rawT : 0) * 100}%` }} />
      </div>

      {def && frame ? (
        <div className="anim__body">
          <p className="anim__phase" aria-live="polite">
            <strong>{def.title}:</strong> {frame.phase}
          </p>
          <p className="anim__caption">{def.caption}</p>
          <div className="anim__nodes">
            <span className="anim__nodes-label">Участвуют узлы:</span>
            {def.nodes.map((id) => {
              const info = model.nodes[id];
              const sys = SYSTEMS[info.system];
              const active = frame.highlight.includes(id);
              return (
                <button key={id} type="button" className={`anim__chip ${active ? 'is-active' : ''}`} style={{ ['--c' as string]: sys.color }} onClick={() => onSelectNode(id)} title={`${sys.name}: открыть описание`}>
                  <i />
                  {info.title}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="anim__hint">
          Выберите этап — запуск двигателя, подъём отвала, рыхление или набор грунта — или нажмите «Все этапы». Узлы остаются кликабельными во время анимации.
          {anim.reduced && ' Включён режим «уменьшить движение»: этапы показываются ключевыми кадрами.'}
        </p>
      )}
    </section>
  );
}
