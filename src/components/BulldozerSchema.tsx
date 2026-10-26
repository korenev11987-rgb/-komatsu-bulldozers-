import { useMemo, useState, type KeyboardEvent } from 'react';
import { buildGeometry, buildNodes, VIEWBOX, type Geometry } from '../data/layout';
import type { AnimFrame } from '../anim/stages';
import { SYSTEMS } from '../data/systems';
import type { BulldozerModel, NodeId, Shape, SystemId } from '../types';
import { Body, FarSide, TankBadgeOverlay } from './schema/Body';
import { CALLOUT_H, placeCallouts, type CalloutItem } from './schema/Callouts';
import { SchemaDefs } from './schema/Defs';
import { NodeArt } from './schema/NodeArt';

interface Props {
  model: BulldozerModel;
  selectedId: NodeId | null;
  activeSystem: SystemId | null;
  onSelect: (id: NodeId) => void;
  /** Текущий кадр анимации работы (null — машина в покое) */
  anim?: AnimFrame | null;
}

/** Невидимая (до наведения) область клика */
function HitShape({ s }: { s: Shape }) {
  switch (s.kind) {
    case 'rect':
      return <rect className="node__hit" x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx ?? 0} />;
    case 'circle':
      return <circle className="node__hit" cx={s.cx} cy={s.cy} r={s.r} />;
    case 'line':
      return <line className="node__hit node__hit--stroke" x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} strokeWidth={s.width} strokeLinecap="round" />;
    case 'polygon':
      return <polygon className="node__hit" points={s.points} />;
    case 'path':
      return s.width ? (
        <path className="node__hit node__hit--stroke" d={s.d} strokeWidth={s.width} strokeLinejoin="round" strokeLinecap="round" />
      ) : (
        <path className="node__hit" d={s.d} />
      );
  }
}

/** Приблизительная площадь области клика узла (для порядка наложения) */
function hitArea(shapes: Shape[]): number {
  let a = 0;
  for (const s of shapes) {
    if (s.kind === 'rect') a += s.w * s.h;
    else if (s.kind === 'circle') a += Math.PI * s.r * s.r;
    else if (s.kind === 'line') a += Math.hypot(s.x2 - s.x1, s.y2 - s.y1) * s.width;
    else if (s.kind === 'polygon') {
      const p = s.points.trim().split(/[\s,]+/).map(Number);
      let sum = 0;
      for (let i = 0; i < p.length; i += 2) {
        const j = (i + 2) % p.length;
        sum += p[i] * p[j + 1] - p[j] * p[i + 1];
      }
      a += Math.abs(sum) / 2;
    } else a += s.width ? 4000 : 20000; // путь: грубая оценка (жгуты — тонкие, но длинные)
  }
  return a;
}

const rotPt = (x: number, y: number, r: Geometry['bladeRot']) => {
  const rad = (r.a * Math.PI) / 180;
  const dx = x - r.cx;
  const dy = y - r.cy;
  return { x: r.cx + dx * Math.cos(rad) - dy * Math.sin(rad), y: r.cy + dx * Math.sin(rad) + dy * Math.cos(rad) };
};
const fmtM = (mm: number) => (mm / 1000).toFixed(2).replace('.', ',');

export function BulldozerSchema({ model, selectedId, activeSystem, onSelect, anim = null }: Props) {
  // Геометрия «в покое» — для раскладки подписей; «в позе» — для отрисовки и областей клика
  const rest = useMemo(() => buildGeometry(model.layout), [model.layout]);
  const restNodes = useMemo(() => buildNodes(rest), [rest]);
  const pose = anim?.pose;
  const geo = useMemo(() => (pose ? buildGeometry(model.layout, pose) : rest), [model.layout, rest, pose?.bladeLift, pose?.ripperTip, pose?.bladePitch]);
  const nodes = useMemo(() => (geo === rest ? restNodes : buildNodes(geo)), [geo, rest, restNodes]);
  const [hoverId, setHoverId] = useState<NodeId | null>(null);

  const { width, height, groundY } = VIEWBOX;
  const d = model.layout.dims;
  const highlight = new Set(anim?.highlight ?? []);

  const placed = useMemo(() => {
    const items: CalloutItem[] = restNodes.map((n) => ({ key: n.id, text: n.label, ax: n.anchor.x, ay: n.anchor.y, side: n.labelSide, color: SYSTEMS[n.system].color }));
    const ex = rest.exhaust[0];
    const passive: [string, number, number][] = [
      ['Выхлопная труба', ex.x, ex.top + 4],
      ['Предочиститель', rest.precleaner.x, rest.precleaner.top + 4],
      ['Кабина ROPS', rest.cab.x + rest.cab.w / 2 + 20, rest.cab.top - 8],
      ['Топливный бак', rest.tank.x + rest.tank.w / 2, rest.tank.y + 30],
    ];
    passive.forEach(([text, x, y]) => items.push({ key: `p-${text}`, text, ax: x, ay: y, side: 'top', passive: true }));
    return placeCallouts(items);
  }, [restNodes, rest]);

  // Точки привязки выносок следуют за подвижными узлами
  const poseAnchor = new Map(nodes.map((n) => [n.id as string, n.id === 'blade' ? rotPt(n.anchor.x, n.anchor.y, geo.bladeRot) : n.anchor]));
  const callouts = placed.map((c) => {
    const a = poseAnchor.get(c.key);
    return a ? { ...c, ax: a.x, ay: a.y } : c;
  });

  const onKey = (e: KeyboardEvent<SVGGElement>, id: NodeId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(id);
    }
  };

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const bladeTf = `rotate(${geo.bladeRot.a} ${geo.bladeRot.cx} ${geo.bladeRot.cy})`;
  const nodeClass = (n: (typeof nodes)[number]) => {
    const dimmed = activeSystem !== null && activeSystem !== n.system;
    return ['node', `node--${n.system}`, `node--${n.id}`, n.xray && 'node--xray', n.id === selectedId && 'is-selected', n.id === hoverId && 'is-hovered', dimmed && 'is-dimmed', highlight.has(n.id) && 'is-anim']
      .filter(Boolean)
      .join(' ');
  };
  // Порядок областей клика: по убыванию площади (мелкие узлы оказываются сверху)
  const hitOrder = [...nodes].sort((a, b) => hitArea(b.shapes) - hitArea(a.shapes));

  return (
    <figure className="schema">
      <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`Схема бульдозера ${model.fullName}, вид сбоку`} className="schema__svg">
        <SchemaDefs />
        <rect x={0} y={0} width={width} height={height} fill="url(#kd-sky)" />
        <rect x={0} y={groundY} width={width} height={height - groundY} fill="url(#kd-ground)" />
        <line x1={0} y1={groundY} x2={width} y2={groundY} stroke="#8d7b62" strokeWidth={2} />
        {/* Камешки на грунте — «бегут» назад при движении машины */}
        <line x1={0} y1={groundY + 7} x2={width} y2={groundY + 7} stroke="#5f513f" strokeWidth={3} strokeDasharray="3 37 6 54" strokeDashoffset={-(anim?.trackShift ?? 0)} opacity={0.6} />
        <line x1={0} y1={groundY + 19} x2={width} y2={groundY + 19} stroke="#6e5e48" strokeWidth={2} strokeDasharray="2 61 4 29" strokeDashoffset={-(anim?.trackShift ?? 0)} opacity={0.5} />
        <Effects geo={geo} anim={anim} under />

        <g className={['machine', anim?.engine === 'crank' && 'vib vib--crank', anim?.engine === 'run' && anim.rpm > 0.6 && 'vib vib--run'].filter(Boolean).join(' ')}>
          <FarSide geo={geo} />
          <Body geo={geo} anim={anim} />
          {/* Проход 1: рисунок узлов в исходном порядке. Клики не перехватывает (pointer-events: none) */}
          {nodes.map((n) => (
            <g key={n.id} className={`${nodeClass(n)} node--art`} data-node-art={n.id} style={{ ['--c' as string]: SYSTEMS[n.system].color }} aria-hidden="true">
              <g transform={n.id === 'blade' ? bladeTf : undefined}>
                <g className="node__art">
                  <NodeArt id={n.id} geo={geo} anim={anim} />
                </g>
              </g>
            </g>
          ))}
          <TankBadgeOverlay geo={geo} />
          {/* Проход 2: области клика поверх всех рисунков; крупные узлы снизу, мелкие сверху —
              так мелкий узел не перекрывается соседним крупным (раньше рисунок одного узла мог закрыть другой) */}
          {hitOrder.map((n) => {
            const selected = n.id === selectedId;
            const dimmed = activeSystem !== null && activeSystem !== n.system;
            const info = model.nodes[n.id];
            return (
              <g
                key={n.id}
                className={`${nodeClass(n)} node--hitlayer`}
                data-node={n.id}
                style={{ ['--c' as string]: SYSTEMS[n.system].color }}
                role="button"
                tabIndex={dimmed ? -1 : 0}
                aria-label={`${info.title} — система «${SYSTEMS[n.system].name}». Открыть карточку узла`}
                aria-pressed={selected}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(n.id);
                }}
                onKeyDown={(e) => onKey(e, n.id)}
                onMouseEnter={() => setHoverId(n.id)}
                onMouseLeave={() => setHoverId(null)}
                onFocus={() => setHoverId(n.id)}
                onBlur={() => setHoverId(null)}
              >
                <title>{info.title}</title>
                <g transform={n.id === 'blade' ? bladeTf : undefined}>
                  {n.shapes.map((sh, k) => (
                    <HitShape key={k} s={sh} />
                  ))}
                </g>
              </g>
            );
          })}
        </g>
        <Effects geo={geo} anim={anim} />

        {/* Масштабная линейка: 1 м в масштабе модели */}
        <g className="scalebar" aria-hidden="true" transform={`translate(14 ${groundY + 30})`}>
          <rect x={-4} y={-12} width={geo.K * 1000 + 64} height={22} rx={4} fill="#ffffffcc" />
          <rect x={0} y={-3} width={geo.K * 500} height={5} fill="#212529" />
          <rect x={geo.K * 500} y={-3} width={geo.K * 500} height={5} fill="#fff" stroke="#212529" />
          <text x={geo.K * 1000 + 6} y={3}>1 м</text>
        </g>

        {/* Подписи-выноски (дублируют клик мышью; для клавиатуры используются сами узлы) */}
        <g className="callouts" aria-hidden="true">
          {callouts.map((c) => {
            const node = c.passive ? undefined : nodeById.get(c.key as NodeId);
            const id = node?.id;
            const dimmed = !!node && activeSystem !== null && activeSystem !== node.system;
            const cls = [
              'callout',
              c.passive && 'callout--passive',
              id && id === selectedId && 'is-selected',
              id && id === hoverId && 'is-hovered',
              (dimmed || (c.passive && activeSystem)) && 'is-dimmed',
            ]
              .filter(Boolean)
              .join(' ');
            const ly = c.side === 'top' ? c.y + CALLOUT_H / 2 : c.y - CALLOUT_H / 2;
            const lx = Math.min(Math.max(c.ax, c.x + 8), c.x + c.w - 8);
            return (
              <g
                key={c.key}
                className={cls}
                style={c.color ? { ['--c' as string]: c.color } : undefined}
                onClick={id ? (e) => { e.stopPropagation(); onSelect(id); } : undefined}
                onMouseEnter={id ? () => setHoverId(id) : undefined}
                onMouseLeave={id ? () => setHoverId(null) : undefined}
              >
                <polyline className="callout__leader" points={`${c.ax},${c.ay} ${lx},${ly}`} />
                <circle className="callout__dot" cx={c.ax} cy={c.ay} r={3} />
                <rect className="callout__pill" x={c.x} y={c.y - CALLOUT_H / 2} width={c.w} height={CALLOUT_H} rx={CALLOUT_H / 2} />
                {!c.passive && <circle className="callout__swatch" cx={c.x + 11} cy={c.y} r={4} />}
                <text className="callout__text" x={c.passive ? c.x + 6 : c.x + 20} y={c.y + 4}>
                  {c.text}
                </text>
              </g>
            );
          })}
        </g>

      </svg>
      <figcaption className="schema__caption">
        <strong>{model.fullName}</strong> · вид сбоку · пропорции по паспортным габаритам: длина {fmtM(d.overallLength)} м, высота по кабине {fmtM(d.cabHeight)} м, отвал {fmtM(d.bladeWidth)} × {fmtM(d.bladeHeight)} м, гусеница на грунте {fmtM(d.trackOnGround)} м ({model.layout.fixedK ? 'модели Caterpillar показаны в едином масштабе — см. линейку «1 м»' : 'машины приведены к размеру экрана — см. линейку «1 м»'}). Нажмите на узел или подпись (или выберите узел клавишей Tab и нажмите Enter / Пробел), чтобы открыть описание. Внутренние узлы показаны «рентгеном».
      </figcaption>
    </figure>
  );
}

/** Слой эффектов анимации: дым, поток масла и тока, комья грунта, призма волочения. Не перехватывает клики. */
function Effects({ geo, anim, under = false }: { geo: Geometry; anim: AnimFrame | null; under?: boolean }) {
  if (!anim) return null;
  const g = geo.g;
  const r = geo.ripper;
  const tipX = r.shankX[0] - r.shankW * 0.4;
  const inGround = r.tipY > g + 2;
  if (under) {
    // Борозда за рыхлителем
    return inGround && anim.trackShift > 0 ? (
      <g className="fx" aria-hidden="true">
        <rect x={tipX} y={g - 1} width={Math.min(VIEWBOX.width - tipX, anim.trackShift)} height={8} fill="#4a3b2a" opacity={0.75} />
      </g>
    ) : null;
  }
  const H = geo.blade.H;
  const bf = rotPt(geo.blade.front, g, geo.bladeRot).x;
  const puffs = 7;
  return (
    <g className="fx" aria-hidden="true">
      {/* «Срез» грунта перед отвалом и рыхлителем: заглублённые части видны сквозь грунт */}
      {geo.bladeRot.a < -0.05 && <rect x={bf - 12} y={g + 1} width={geo.blade.back - geo.blade.front + 30} height={geo.K * 900} fill="#7a6650" opacity={0.55} />}
      {inGround && <rect x={r.beam.x - 8} y={g + 1} width={r.beam.w + 16} height={r.tipY - g + 8} fill="#7a6650" opacity={0.5} />}
      {anim.hydBlade && <path className="hyd-flow" d={geo.hoses.blade} strokeDashoffset={-anim.time * 80} />}
      {anim.hydRipper && <path className="hyd-flow" d={geo.hoses.ripper} strokeDashoffset={-anim.time * 80} />}
      {anim.smoke > 0.01 &&
        geo.exhaust.map((ex, e) =>
          Array.from({ length: puffs }, (_, k) => {
            const ph = (anim.time * (anim.engine === 'crank' ? 1.6 : 0.9) + k / puffs + e * 0.13) % 1;
            return (
              <circle
                key={`${e}-${k}`}
                className="smoke"
                cx={ex.x + ph * 46 + Math.sin(ph * 6 + k) * 4}
                cy={ex.top - 4 - ph * 90}
                r={ex.r * 0.8 + ph * 20}
                fill="url(#kd-smoke)"
                opacity={anim.smoke * (1 - ph) * 0.9}
              />
            );
          }),
        )}
      {anim.clods &&
        inGround &&
        Array.from({ length: 6 }, (_, k) => {
          const ph = ((anim.trackShift * 0.9 + k * 19) % 80) / 80;
          return <circle key={k} cx={tipX + 6 + ph * 70} cy={g - 2 - Math.sin(ph * Math.PI) * (14 + (k % 3) * 6)} r={2.5 + (k % 3)} fill="#5c4a35" stroke="#2f2418" strokeWidth={0.6} />;
        })}
      {anim.soilPile > 0.01 && (
        <g>
          <path
            d={`M ${bf + 4} ${g} L ${bf - H * 0.8 * anim.soilPile} ${g} Q ${bf - H * 0.35 * anim.soilPile} ${g - H * 0.55 * anim.soilPile}, ${bf + 6} ${g - H * 0.48 * anim.soilPile} Z`}
            fill="#8a6f4f"
            stroke="#4a3b2a"
          />
          {Array.from({ length: 5 }, (_, k) => (
            <circle key={k} cx={bf - H * (0.12 + k * 0.11) * anim.soilPile} cy={g - H * (0.1 + (k % 2) * 0.1) * anim.soilPile} r={2 + (k % 2)} fill="#5c4a35" />
          ))}
        </g>
      )}
    </g>
  );
}
