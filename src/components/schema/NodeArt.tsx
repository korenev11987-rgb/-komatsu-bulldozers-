import { shankPolygon, trackPath, type Geometry } from '../../data/layout';
import type { AnimFrame } from '../../anim/stages';
import type { NodeId } from '../../types';
import { Bar, Cylinder, Wheel } from './primitives';

/** Детальная прорисовка конкретного узла. Цвет системы берётся из CSS-переменной --c. */
export function NodeArt({ id, geo, anim }: { id: NodeId; geo: Geometry; anim?: AnimFrame | null }) {
  const { g, p } = geo;
  const T = geo.trackT;
  const shift = anim?.trackShift ?? 0;
  const spin = (r: number, cx: number, cy: number) => `rotate(${(-shift / Math.max(1, r)) * (180 / Math.PI)} ${cx} ${cy})`;
  switch (id) {
    case 'trackChain':
      return (
        <g>
          <path d={trackPath(geo, T)} fill="#16181b" />
          <path d={trackPath(geo, 0)} fill="#202327" />
          {/* башмаки */}
          <path d={trackPath(geo, T * 0.62)} fill="none" stroke="url(#kd-shoe)" strokeWidth={T * 0.62} strokeDasharray={`${T * 0.72} ${Math.max(2, T * 0.1)}`} strokeDashoffset={shift} />
          {/* грунтозацепы */}
          <path d={trackPath(geo, T * 0.96)} fill="none" stroke="#0f1113" strokeWidth={T * 0.16} strokeDasharray={`${T * 0.22} ${T * 0.6}`} strokeDashoffset={shift} />
          {/* звенья и пальцы */}
          <path d={trackPath(geo, T * 0.16)} fill="none" stroke="#5c636a" strokeWidth={T * 0.3} strokeDasharray={`${T * 0.6} ${T * 0.22}`} strokeDashoffset={shift} />
          <path d={trackPath(geo, T * 0.16)} fill="none" stroke="#c3c9cf" strokeWidth={T * 0.18} strokeDasharray={`${T * 0.1} ${T * 0.72}`} strokeDashoffset={shift} />
          <path d={trackPath(geo, T)} fill="none" stroke="#ffffff" strokeOpacity={0.12} />
        </g>
      );
    case 'trackFrame': {
      const f = geo.frame;
      // K-Bogie: тележки, качающиеся на осях, по 2 катка
      const pairs: [number, number][] = [];
      if (p.bogie) for (let k = 0; k + 1 < geo.rollers.length; k += 2) pairs.push([k, k + 1]);
      return (
        <g>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={5} fill="url(#kd-dark)" stroke="#0b0c0d" />
          <rect x={f.x + f.w * 0.1} y={f.y + f.h - 5} width={f.w * 0.8} height={6} rx={2} fill="#2b3035" stroke="#0b0c0d" />
          {Array.from({ length: 8 }, (_, k) => (
            <circle key={k} cx={f.x + 20 + (k * (f.w - 40)) / 7} cy={f.y + 6} r={1.8} fill="#9aa1a8" />
          ))}
          {/* механизм натяжения (пружина + гидроцилиндр) */}
          <rect x={f.x + 14} y={f.y + f.h * 0.3} width={f.w * 0.16} height={Math.max(6, f.h * 0.35)} rx={3} fill="url(#kd-chrome)" opacity={0.8} />
          {pairs.map(([a, b]) => {
            const r1 = geo.rollers[a];
            const r2 = geo.rollers[b];
            const mx = (r1.cx + r2.cx) / 2;
            return (
              <g key={a}>
                <polygon points={`${r1.cx - r1.r * 0.6},${r1.cy - r1.r * 0.2} ${mx - r1.r * 0.6},${f.y + f.h - 2} ${mx + r1.r * 0.6},${f.y + f.h - 2} ${r2.cx + r2.r * 0.6},${r2.cy - r2.r * 0.2} ${r2.cx},${r2.cy + r2.r * 0.35} ${r1.cx},${r1.cy + r1.r * 0.35}`} fill="#3a3f45" stroke="#0b0c0d" />
                <circle cx={mx} cy={f.y + f.h - 1} r={3.2} fill="url(#kd-hub)" stroke="#0b0c0d" />
              </g>
            );
          })}
          {p.bogie && <text className="decor__micro" x={f.x + f.w * 0.5} y={f.y + f.h * 0.62} textAnchor="middle">{p.brand ? 'BOGIE' : 'K-BOGIE'}</text>}
        </g>
      );
    }
    case 'carrierRollers':
      return (
        <g opacity={p.carrierOptional ? 0.55 : undefined} strokeDasharray={p.carrierOptional ? '3 2' : undefined}>
          {geo.carriers.map((c, k) => (
            <g key={k}>
              <rect x={c.cx - 3.5} y={c.cy} width={7} height={Math.max(2, geo.frame.y - c.cy + 2)} fill="#2b3035" />
              <g transform={spin(c.r, c.cx, c.cy)}>
                <Wheel cx={c.cx} cy={c.cy} r={c.r} holes={3} />
              </g>
            </g>
          ))}
        </g>
      );
    case 'trackRollers':
      return (
        <g>
          {geo.rollers.map((r, k) => (
            <g key={k} transform={`rotate(${(shift / r.r) * (180 / Math.PI)} ${r.cx} ${r.cy})`}>
              <Wheel cx={r.cx} cy={r.cy} r={r.r} holes={3} />
              <circle cx={r.cx} cy={r.cy} r={r.r + 2} fill="none" stroke={k % 2 ? '#3d4349' : '#596067'} strokeWidth={2} />
            </g>
          ))}
        </g>
      );
    case 'idler':
      return (
        <g>
          <g transform={spin(geo.idler.r + T, geo.idler.cx, geo.idler.cy)}>
            <Wheel {...geo.idler} holes={5} />
          </g>
          {/* Элевированная ходовая: заднее натяжное колесо */}
          {geo.rearIdler && (
            <g transform={spin(geo.rearIdler.r + T, geo.rearIdler.cx, geo.rearIdler.cy)}>
              <Wheel {...geo.rearIdler} holes={5} />
            </g>
          )}
        </g>
      );
    case 'sprocket': {
      const s = geo.sprocket;
      const teeth = 13;
      const pts: string[] = [];
      for (let k = 0; k < teeth * 2; k++) {
        const a = (k / (teeth * 2)) * Math.PI * 2;
        const rr = k % 2 === 0 ? s.r + T * 0.32 : s.r - 1;
        pts.push(`${s.cx + Math.cos(a) * rr},${s.cy + Math.sin(a) * rr}`);
      }
      return (
        <g transform={spin(s.r + T, s.cx, s.cy)}>
          <polygon points={pts.join(' ')} fill="#2f3439" stroke="#0b0c0d" strokeLinejoin="round" />
          <Wheel {...s} />
          {Array.from({ length: 5 }, (_, k) => {
            const a = (k / 5) * Math.PI * 2;
            return <line key={k} x1={s.cx + Math.cos(a) * s.r * 0.55} y1={s.cy + Math.sin(a) * s.r * 0.55} x2={s.cx + Math.cos(a) * s.r} y2={s.cy + Math.sin(a) * s.r} stroke="#121416" strokeWidth={2} />;
          })}
        </g>
      );
    }
    case 'finalDrive': {
      const d = geo.finalDrive;
      return (
        <g>
          <circle cx={d.cx} cy={d.cy} r={d.r} fill="url(#kd-hub)" stroke="#0b0c0d" strokeWidth={1.5} />
          <circle cx={d.cx} cy={d.cy} r={d.r * 0.55} fill="url(#kd-wheel)" />
          {Array.from({ length: 8 }, (_, k) => {
            const a = (k / 8) * Math.PI * 2;
            return <circle key={k} cx={d.cx + Math.cos(a) * d.r * 0.78} cy={d.cy + Math.sin(a) * d.r * 0.78} r={1.8} fill="#1a1c1f" />;
          })}
        </g>
      );
    }
    case 'cooling': {
      const r = geo.radiator;
      return (
        <g>
          <rect className="xr-fill" x={r.x} y={r.y} width={r.w} height={r.h} rx={4} />
          {Array.from({ length: 9 }, (_, k) => (
            <line key={k} className="xr-line" x1={r.x + 6 + k * 5.5} y1={r.y + 6} x2={r.x + 6 + k * 5.5} y2={r.y + r.h - 6} />
          ))}
          <ellipse className="xr-fill" cx={r.x + r.w + 8} cy={r.y + r.h / 2} rx={6} ry={40} />
        </g>
      );
    }
    case 'engine': {
      const e = geo.engine;
      const v12 = p.engineArt ? p.engineArt.vee : p.engineLabel.includes('V12');
      const cyl = p.engineArt ? (p.engineArt.vee ? p.engineArt.cyl / 2 : p.engineArt.cyl) : 6;
      const cw = (e.w - e.w * 0.22) / cyl;
      const hh = e.h * 0.28;
      return (
        <g className={anim?.engine === 'crank' ? 'vib vib--crank' : anim?.engine === 'run' ? 'vib vib--run' : undefined}>
          <rect className="xr-fill" x={e.x} y={e.y} width={e.w} height={e.h} rx={8} />
          {/* головки цилиндров (для V12 — два ряда) */}
          {(v12 ? [0, 1] : [0]).map((row) =>
            Array.from({ length: cyl }, (_, k) => (
              <rect key={`${row}-${k}`} className="xr-fill xr-solid" x={e.x + e.w * 0.11 + k * cw + row * 5} y={e.y + 4 - row * 5} width={cw - 5} height={hh} rx={3} opacity={row ? 0.6 : 1} />
            )),
          )}
          <line className="xr-line" x1={e.x + e.w * 0.08} y1={e.y + e.h * 0.5} x2={e.x + e.w * 0.88} y2={e.y + e.h * 0.5} />
          {/* поддон, шкив демпфера, маховик, турбина */}
          <rect className="xr-fill" x={e.x + e.w * 0.12} y={e.y + e.h * 0.78} width={e.w * 0.6} height={e.h * 0.18} rx={4} />
          <circle className="xr-fill" cx={e.x + 9} cy={e.y + e.h * 0.62} r={Math.min(11, e.h * 0.2)} />
          <circle className="xr-fill" cx={e.x + e.w - e.h * 0.32} cy={e.y + e.h * 0.55} r={e.h * 0.36} />
          <circle className="xr-fill xr-solid" cx={e.x + e.w * 0.58} cy={e.y + e.h * 0.66} r={Math.min(11, e.h * 0.18)} />
          {v12 && <circle className="xr-fill xr-solid" cx={e.x + e.w * 0.36} cy={e.y + e.h * 0.66} r={Math.min(11, e.h * 0.18)} />}
          <text className="decor__micro xr-label" x={e.x + e.w * 0.11} y={e.y + e.h * 0.72}>{p.engineArt ? p.engineArt.label : v12 ? 'V12 · 30,5 л' : p.engineLabel.includes('155') ? 'R6 · 19 л' : 'R6 · 15,2 л'}</text>
        </g>
      );
    }
    case 'pumps': {
      const b = geo.pumps;
      return (
        <g>
          <rect className="xr-fill" x={b.x} y={b.y} width={b.w} height={b.h} rx={4} />
          {[0, 1, 2].map((k) => (
            <rect key={k} className="xr-fill xr-solid" x={b.x + 5 + k * 22} y={b.y + 5} width={18} height={b.h - 10} rx={6} />
          ))}
        </g>
      );
    }
    case 'torqueConverter': {
      const b = geo.torqueConverter;
      return (
        <g>
          <rect className="xr-fill" x={b.x} y={b.y} width={b.w} height={b.h} rx={20} />
          <ellipse className="xr-line" cx={b.x + b.w / 2} cy={b.y + b.h / 2} rx={Math.max(4, b.w / 2 - 5)} ry={Math.max(4, b.h / 2 - 5)} />
          <ellipse className="xr-line" cx={b.x + b.w / 2} cy={b.y + b.h / 2} rx={3} ry={Math.max(3, b.h / 2 - 10)} />
        </g>
      );
    }
    case 'gearbox': {
      const b = geo.gearbox;
      return (
        <g>
          <rect className="xr-fill" x={b.x} y={b.y} width={b.w} height={b.h} rx={6} />
          {[0, 1, 2].map((k) => {
            const cx = b.x + b.w * (0.2 + k * 0.3);
            const cy = b.y + b.h / 2;
            return (
              <g key={k}>
                <circle className="xr-line" cx={cx} cy={cy} r={Math.min(9, b.w * 0.13)} />
                <circle className="xr-fill xr-solid" cx={cx} cy={cy} r={3} />
                <circle className="xr-line" cx={cx} cy={cy - 6} r={2.5} />
                <circle className="xr-line" cx={cx} cy={cy + 6} r={2.5} />
              </g>
            );
          })}
        </g>
      );
    }
    case 'steering': {
      const b = geo.steering;
      const hss = p.steeringLabel.includes('HSS');
      return (
        <g>
          <rect className="xr-fill" x={b.x} y={b.y} width={b.w} height={b.h} rx={6} />
          {hss ? (
            <>
              <circle className="xr-line" cx={b.x + b.w / 2} cy={b.y + b.h / 2} r={Math.min(18, b.h * 0.4)} />
              <circle className="xr-fill xr-solid" cx={b.x + b.w / 2} cy={b.y + b.h / 2} r={7} />
              {[0, 1, 2].map((k) => {
                const a = (k / 3) * Math.PI * 2;
                return <circle key={k} className="xr-line" cx={b.x + b.w / 2 + Math.cos(a) * 12} cy={b.y + b.h / 2 + Math.sin(a) * 12} r={4} />;
              })}
              <rect className="xr-fill xr-solid" x={b.x + 4} y={b.y + 4} width={14} height={16} rx={3} />
            </>
          ) : (
            Array.from({ length: 9 }, (_, k) => (
              <rect key={k} className="xr-fill xr-solid" x={b.x + 8 + k * ((b.w - 16) / 9)} y={b.y + 8} width={3} height={b.h - 16} />
            ))
          )}
        </g>
      );
    }
    case 'blade': {
      const b = geo.blade;
      const H = b.H;
      const f = b.front;
      const armW = Math.max(14, H * 0.09);
      // Вогнутая рабочая поверхность (лоб) отвала
      const face =
        p.bladeType === 'sigma'
          ? `M ${f + H * 0.06} ${b.top} C ${f + H * 0.26} ${b.top + H * 0.3}, ${f + H * 0.24} ${g - H * 0.32}, ${f + H * 0.06} ${g - H * 0.17}`
          : p.bladeType === 'u'
            ? `M ${f + H * 0.04} ${b.top + H * 0.02} C ${f + H * 0.3} ${b.top + H * 0.3}, ${f + H * 0.3} ${g - H * 0.35}, ${f + H * 0.06} ${g - H * 0.38}`
            : `M ${f + H * 0.04} ${b.top} C ${f + H * 0.2} ${b.top + H * 0.3}, ${f + H * 0.2} ${g - H * 0.4}, ${f + H * 0.08} ${g - H * 0.5}`;
      return (
        <g>
          <Bar seg={geo.pushArm} w={armW} fill="url(#kd-body)" />
          <polygon points={b.outline} fill="url(#kd-bodyH)" stroke="#5c3d00" strokeWidth={1.5} />
          {/* Тень вогнутого лба */}
          <path d={`${face} L ${f + H * 0.02} ${g - H * 0.1} L ${f - H * 0.02} ${b.top + H * 0.1} Z`} fill="#b07800" opacity={0.5} />
          <path d={face} fill="none" stroke="#fff3bf" strokeOpacity={0.75} strokeWidth={2.5} />
          {/* Рёбра жёсткости задней стенки */}
          {[0.28, 0.5, 0.72].map((k) => (
            <line key={k} x1={b.back - H * 0.18} y1={b.top + H * k} x2={b.back - 2} y2={b.top + H * k + 3} stroke="#6b4700" strokeWidth={2.4} />
          ))}
          {p.bladeType === 'u' && (
            <g>
              {/* Козырёк (spill guard) с решёткой */}
              <polygon points={`${f + H * 0.1},${b.top - H * 0.05} ${f + H * 0.16},${b.top - H * 0.17} ${f + H * 0.4},${b.top - H * 0.17} ${f + H * 0.42},${b.top - H * 0.05}`} fill="none" stroke="#e6a800" strokeWidth={3} />
              {[0.2, 0.27, 0.34].map((k) => (
                <line key={k} x1={f + H * k} y1={b.top - H * 0.16} x2={f + H * k} y2={b.top - H * 0.05} stroke="#e6a800" strokeWidth={2} />
              ))}
              {/* Боковая «щека» U-отвала */}
              <path d={`M ${f + H * 0.08} ${g - H * 0.38} Q ${f + H * 0.22} ${g - H * 0.18}, ${f + H * 0.24} ${g - 2}`} fill="none" stroke="#6b4700" strokeWidth={1.5} />
            </g>
          )}
          {p.bladeType === 'sigma' && (
            <text className="decor__micro decor__micro--dark" x={b.back - H * 0.08} y={b.top + H * 0.6} textAnchor="end">SIGMA</text>
          )}
          {/* Режущая кромка (нож) и угловой нож */}
          <polygon points={`${f},${g} ${f + H * 0.2},${g} ${f + H * 0.18},${g - H * 0.08} ${f + H * 0.02},${g - H * 0.1}`} fill="url(#kd-steel)" stroke="#0b0c0d" />
          {[0.05, 0.1, 0.15].map((k) => (
            <circle key={k} cx={f + H * k} cy={g - H * 0.05} r={1.6} fill="#2b2f33" />
          ))}
          <polygon points={`${f - 3},${g} ${f + 4},${g} ${f + 6},${g - H * 0.16} ${f - 1},${g - H * 0.16}`} fill="#7c838a" stroke="#0b0c0d" />
          {/* Шарнир толкающего бруса на раме тележки */}
          <circle cx={geo.pushArm.x2} cy={geo.pushArm.y2} r={armW * 0.55} fill="url(#kd-hub)" stroke="#0b0c0d" />
        </g>
      );
    }
    case 'bladeCylinders':
      return (
        <g>
          {p.dualTilt && (
            <g opacity={0.6} transform="translate(9 -6)">
              <Cylinder seg={geo.tiltCyl} barrel={11} rod={5} frac={0.55} />
            </g>
          )}
          <Cylinder seg={geo.tiltCyl} barrel={12} rod={6} frac={0.55} />
          <Cylinder seg={geo.liftCyl} barrel={17} rod={8} frac={0.5} fixedBarrel={geo.barrels.lift} />
        </g>
      );
    case 'ripper': {
      const r = geo.ripper;
      const n = r.shankX.length;
      return (
        <g>
          <Bar seg={r.upper} w={12} fill="url(#kd-body)" />
          <Bar seg={r.lower} w={12} fill="url(#kd-body)" />
          {Array.from({ length: n }, (_, kk) => {
            const k = n - 1 - kk; // дальние стойки рисуем первыми
            const x = r.shankX[k];
            const w = r.shankW;
            const tip = r.tipY - k * 2;
            return (
              <g key={k} opacity={1 - k * 0.14}>
                <polygon points={shankPolygon(geo, k)} fill="url(#kd-darkH)" stroke="#0b0c0d" />
                {/* защита стойки */}
                <polygon points={`${x - w * 0.1},${tip - w * 1.4} ${x + w * 0.25},${tip - w * 1.5} ${x + w * 0.2},${tip - w * 3.4} ${x},${tip - w * 3.3}`} fill="url(#kd-steel)" opacity={0.9} />
                {/* наконечник */}
                <polygon points={`${x + w * 0.5},${tip - w * 0.4} ${x - w * 0.55},${tip} ${x - w * 0.1},${tip - w * 0.95}`} fill="url(#kd-steel)" stroke="#0b0c0d" />
                <circle cx={x + w * 0.5} cy={r.beam.y + r.beam.h * 0.5} r={Math.min(4, w * 0.25)} fill="url(#kd-hub)" />
              </g>
            );
          })}
          <rect x={r.beam.x} y={r.beam.y} width={r.beam.w} height={r.beam.h} rx={5} fill="url(#kd-body)" stroke="#5c3d00" strokeWidth={1.5} />
          <rect x={r.beam.x + 3} y={r.beam.y + r.beam.h - 9} width={r.beam.w - 6} height={6} fill="url(#kd-hazard)" />
          <circle cx={r.beam.x + 6} cy={r.beam.y + r.beam.h * 0.25} r={4} fill="url(#kd-hub)" />
          <circle cx={r.beam.x + 6} cy={r.beam.y + r.beam.h * 0.85} r={4} fill="url(#kd-hub)" />
        </g>
      );
    }
    case 'ripperCylinders':
      return (
        <g>
          <Cylinder seg={geo.ripperTilt} barrel={13} rod={7} fixedBarrel={geo.barrels.ripTilt} />
          <Cylinder seg={geo.ripperLift} barrel={17} rod={9} fixedBarrel={geo.barrels.ripLift} />
        </g>
      );
    case 'wiring':
      return (
        <g>
          <path d={geo.wiring} fill="none" stroke="#0b0c0d" strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
          <path d={geo.wiring} fill="none" className="wire" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="10 2" />
          {anim?.elecFlow && <path d={geo.wiringStart} className="wire-flow" fill="none" strokeWidth={3} strokeDasharray="6 10" strokeDashoffset={-anim.time * 70} strokeLinecap="round" />}
          {geo.connectors.map((c, k) => (
            <g key={k}>
              <rect x={c.x - 5} y={c.y - 4} width={10} height={8} rx={1.5} fill="#2b3035" stroke="#0b0c0d" />
              <rect x={c.x - 2} y={c.y - 4} width={4} height={8} className="wire-fill" />
            </g>
          ))}
        </g>
      );
    case 'batteries': {
      const b = geo.batteries;
      return (
        <g>
          <rect className="xr-fill" x={b.x} y={b.y} width={b.w} height={b.h} rx={3} />
          {[0, 1].map((k) => (
            <g key={k}>
              <rect x={b.x + 4 + k * 28} y={b.y + 8} width={24} height={b.h - 11} rx={2} fill="#1f2326" stroke="#6c737a" />
              <rect x={b.x + 6 + k * 28} y={b.y + 4} width={5} height={4} fill="#e03131" />
              <rect x={b.x + 19 + k * 28} y={b.y + 4} width={5} height={4} fill="#adb5bd" />
              <text className="decor__tiny" x={b.x + 16 + k * 28} y={b.y + 22} textAnchor="middle" fill="#f59f00">12В</text>
            </g>
          ))}
        </g>
      );
    }
    case 'alternator': {
      const a = geo.alternator;
      return (
        <g>
          <circle className="xr-fill xr-solid" cx={a.cx} cy={a.cy} r={a.r} />
          {[0, 1, 2, 3].map((k) => (
            <line key={k} className="xr-line" x1={a.cx - a.r + 4} y1={a.cy - 6 + k * 4} x2={a.cx + a.r - 4} y2={a.cy - 6 + k * 4} />
          ))}
          <circle cx={a.cx} cy={a.cy} r={3} fill="#0b0c0d" />
        </g>
      );
    }
    case 'starter': {
      const s = geo.starter;
      return (
        <g>
          <rect className="xr-fill xr-solid" x={s.cx - 16} y={s.cy - 8} width={30} height={16} rx={7} />
          <rect className="xr-fill" x={s.cx - 12} y={s.cy - 16} width={20} height={8} rx={3} />
        </g>
      );
    }
    case 'monitor': {
      const d = geo.dash;
      const modern = p.cab === 'modern';
      // Стрелки: 0…1 → угол от −125° до +125°. Без анимации — типичные значения на холостом ходу.
      const rpm = anim ? anim.rpm : 0.38;
      const oil = anim ? anim.oil : 0.7;
      const ang = (v: number) => (-125 + 250 * v) * (Math.PI / 180);
      const gauges = modern
        ? [
            { x: d.x + 47, y: d.y + 15, t: 'ОБ/МИН', v: rpm },
            { x: d.x + 66, y: d.y + 15, t: 'МАСЛО', v: oil },
          ]
        : [
            { x: d.x + 11, y: d.y + 16, t: 'ОЖ', v: anim && anim.engine === 'off' ? 0 : 0.45 },
            { x: d.x + 30, y: d.y + 16, t: 'МАСЛО', v: oil },
            { x: d.x + 49, y: d.y + 16, t: 'ТОПЛ', v: 0.8 },
            { x: d.x + 68, y: d.y + 16, t: 'ОБ/МИН', v: rpm },
          ];
      const lamps = ['#e03131', '#f59f00', '#f59f00', '#2f9e44', '#1c7ed6', '#e03131'];
      const lampsOn = anim ? anim.lamps : true;
      const powered = !anim || anim.lamps || anim.engine !== 'off';
      return (
        <g>
          <rect x={d.x} y={d.y} width={d.w} height={d.h} rx={4} fill="#1a1d20" stroke="#4a5056" />
          {modern && (
            <g opacity={powered ? 1 : 0.35}>
              <rect x={d.x + 4} y={d.y + 4} width={32} height={26} rx={2} fill="url(#kd-screen)" stroke="#0b0c0d" />
              <rect x={d.x + 7} y={d.y + 8} width={Math.max(1, 24 * rpm)} height={3} fill="#69db7c" />
              <rect x={d.x + 7} y={d.y + 13} width={Math.max(1, 24 * oil)} height={3} fill="#ffd43b" />
              <rect x={d.x + 7} y={d.y + 18} width={8} height={3} fill="#ff8787" />
              <text className="decor__tiny" x={d.x + 33} y={d.y + 28} textAnchor="end" fill="#e7f5ff">{anim ? `${Math.round(rpm * 2100)}` : 'F1'}</text>
            </g>
          )}
          {gauges.map((gg) => (
            <g key={gg.t}>
              <circle cx={gg.x} cy={gg.y} r={8} fill="#f1f3f5" stroke="#0b0c0d" />
              <path d={`M ${gg.x - 6} ${gg.y + 3} A 6.5 6.5 0 0 1 ${gg.x + 3} ${gg.y - 6}`} fill="none" stroke="#2f9e44" strokeWidth={2} />
              <path d={`M ${gg.x + 3} ${gg.y - 6} A 6.5 6.5 0 0 1 ${gg.x + 6} ${gg.y + 3}`} fill="none" stroke="#e03131" strokeWidth={2} />
              <line className="needle" x1={gg.x} y1={gg.y} x2={gg.x + Math.sin(ang(gg.v)) * 6.5} y2={gg.y - Math.cos(ang(gg.v)) * 6.5} stroke="#c92a2a" strokeWidth={1.3} />
              <circle cx={gg.x} cy={gg.y} r={1.2} fill="#0b0c0d" />
              <text className="decor__micro" x={gg.x} y={gg.y + 15} textAnchor="middle">{gg.t}</text>
            </g>
          ))}
          {lamps.map((c, k) => (
            <circle key={k} cx={d.x + 8 + k * 12} cy={d.y + d.h - 8} r={3} fill={c} stroke="#0b0c0d" strokeWidth={0.6} opacity={lampsOn ? 1 : 0.16} />
          ))}
          <text className="decor__micro" x={d.x + 4} y={d.y + d.h - 15} fill="#adb5bd">{modern ? 'Монитор' : 'Приборы'}</text>
        </g>
      );
    }
    case 'controllers': {
      const b = geo.controllers;
      return (
        <g>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={3} fill="#3a3f45" stroke="#0b0c0d" />
          {[0, 1, 2, 3].map((k) => (
            <line key={k} x1={b.x + 4} y1={b.y + 6 + k * 6} x2={b.x + b.w - 4} y2={b.y + 6 + k * 6} stroke="#1a1c1f" strokeWidth={2} />
          ))}
          <rect x={b.x + 6} y={b.y + b.h - 7} width={b.w - 12} height={5} className="wire-fill" />
          <text className="decor__micro" x={b.x + b.w / 2} y={b.y - 2} textAnchor="middle">{p.cab === 'modern' ? 'ECU' : 'РЕЛЕ'}</text>
        </g>
      );
    }
    case 'fuseBox': {
      const b = geo.fuseBox;
      const colors = ['#e03131', '#1c7ed6', '#f59f00', '#2f9e44', '#f8f9fa', '#e03131', '#f59f00', '#1c7ed6'];
      return (
        <g>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={3} fill="#212529" stroke="#868e96" />
          {colors.map((c, k) => (
            <rect key={k} x={b.x + 3 + (k % 4) * 6.5} y={b.y + 5 + Math.floor(k / 4) * 10} width={4.5} height={7} fill={c} />
          ))}
        </g>
      );
    }
    case 'lights':
      return (
        <g>
          {geo.lights.map((l, k) => (
            <g key={k}>
              <polygon className="beam" points={`${l.x + l.dir * 10},${l.y - 6} ${l.x + l.dir * 90},${l.y - 22} ${l.x + l.dir * 90},${l.y + 18} ${l.x + l.dir * 10},${l.y + 6}`} fill={l.dir > 0 ? 'url(#kd-beam)' : 'url(#kd-beamL)'} />
              <rect x={l.x - 10} y={l.y - 7} width={20} height={14} rx={4} fill="#2b3035" stroke="#0b0c0d" />
              <circle cx={l.x + l.dir * 4} cy={l.y} r={5} fill="url(#kd-lens)" />
            </g>
          ))}
        </g>
      );
  }
}
