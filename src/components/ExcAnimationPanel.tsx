import { EXC_STAGES, EXC_STAGE_BY_ID, type ExcAnimation, type ExcFrame } from '../anim/excavator';
import { SYSTEMS } from '../data/systems';
import type { AnyNodeId, ExcavatorModel } from '../types';

interface Props {
  anim: ExcAnimation;
  frame: ExcFrame | null;
  model: ExcavatorModel;
  onSelectNode: (id: AnyNodeId) => void;
}

/** Панель «Как работает экскаватор»: копание, поворот и выгрузка, передвижение (те же классы, что у бульдозеров) */
export function ExcAnimationPanel({ anim, frame, model, onSelectNode }: Props) {
  const def = anim.stage ? EXC_STAGE_BY_ID[anim.stage] : null;
  const idx = anim.stage ? EXC_STAGES.findIndex((s) => s.id === anim.stage) : -1;
  return (
    <section className="anim" aria-label="Анимация работы экскаватора">
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
        {EXC_STAGES.map((s, k) => (
          <li key={s.id}>
            <button type="button" className={`anim__step ${s.id === anim.stage ? 'is-active' : ''} ${idx > k ? 'is-done' : ''}`} aria-pressed={s.id === anim.stage} data-stage={s.id} onClick={() => anim.selectStage(s.id)}>
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
              if (!info) return null;
              const sys = SYSTEMS[info.system];
              return (
                <button key={id} type="button" className={`anim__chip ${frame.highlight.includes(id) ? 'is-active' : ''}`} style={{ ['--c' as string]: sys.color }} onClick={() => onSelectNode(id)} title={`${sys.name}: открыть описание`}>
                  <i />
                  {info.title}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="anim__hint">
          Выберите этап — копание, поворот и выгрузка или передвижение — или нажмите «Все этапы». Узлы остаются кликабельными во время анимации. Позы стрелы, рукояти и ковша — иллюстрация (рабочие зоны — HEHH4376-02, с. 19).
          {anim.reduced && ' Включён режим «уменьшить движение»: этапы показываются ключевыми кадрами.'}
        </p>
      )}
    </section>
  );
}
