import type { Seg } from '../../data/layout';

const angleOf = (s: Seg) => (Math.atan2(s.y2 - s.y1, s.x2 - s.x1) * 180) / Math.PI;
const lenOf = (s: Seg) => Math.hypot(s.x2 - s.x1, s.y2 - s.y1);

/** Гидроцилиндр: корпус с градиентом, хромированный шток, проушины */
export function Cylinder({ seg, barrel = 16, rod = 8, frac = 0.6, fixedBarrel }: { seg: Seg; barrel?: number; rod?: number; frac?: number; fixedBarrel?: number }) {
  const L = lenOf(seg);
  // fixedBarrel — постоянная длина корпуса (шток «выдвигается» при анимации)
  const bl = fixedBarrel ? Math.min(L - 8, fixedBarrel) : L * frac;
  return (
    <g transform={`translate(${seg.x1} ${seg.y1}) rotate(${angleOf(seg)})`}>
      <rect x={bl - 6} y={-rod / 2} width={L - bl + 2} height={rod} rx={rod / 2} fill="url(#kd-chrome)" />
      <rect x={0} y={-barrel / 2} width={bl} height={barrel} rx={4} fill="url(#kd-barrel)" stroke="#0d0f11" strokeWidth={1} />
      <rect x={bl - 10} y={-barrel / 2 - 1.5} width={10} height={barrel + 3} rx={2} fill="#2b3035" />
      <line x1={6} y1={-barrel / 2 + 3} x2={bl - 14} y2={-barrel / 2 + 3} stroke="#ffffff" strokeOpacity={0.25} strokeWidth={1.5} />
      <circle cx={0} cy={0} r={barrel / 2 + 1} fill="url(#kd-hub)" stroke="#0d0f11" />
      <circle cx={L} cy={0} r={rod / 2 + 3} fill="url(#kd-hub)" stroke="#0d0f11" />
    </g>
  );
}

/** Толстая балка/тяга с объёмом */
export function Bar({ seg, w, fill = 'url(#kd-barrel)' }: { seg: Seg; w: number; fill?: string }) {
  const L = lenOf(seg);
  return (
    <g transform={`translate(${seg.x1} ${seg.y1}) rotate(${angleOf(seg)})`}>
      <rect x={-w / 2} y={-w / 2} width={L + w} height={w} rx={w / 2.5} fill={fill} stroke="#3a2a00" />
      <line x1={0} y1={-w / 2 + 3} x2={L} y2={-w / 2 + 3} stroke="#fff" strokeOpacity={0.18} strokeWidth={2} />
      <circle cx={0} cy={0} r={w / 3} fill="url(#kd-hub)" />
      <circle cx={L} cy={0} r={w / 3} fill="url(#kd-hub)" />
    </g>
  );
}

/** Колесо с объёмной заливкой */
export function Wheel({ cx, cy, r, holes = 0 }: { cx: number; cy: number; r: number; holes?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="url(#kd-wheel)" stroke="#0d0f11" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={r * 0.78} fill="none" stroke="#5a6168" strokeWidth={1.2} />
      {Array.from({ length: holes }, (_, k) => {
        const a = (k / holes) * Math.PI * 2 + 0.4;
        return <circle key={k} cx={cx + Math.cos(a) * r * 0.5} cy={cy + Math.sin(a) * r * 0.5} r={r * 0.13} fill="#121416" />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.3} fill="url(#kd-hub)" stroke="#121416" />
      <path d={`M ${cx - r * 0.7} ${cy - r * 0.4} A ${r * 0.8} ${r * 0.8} 0 0 1 ${cx + r * 0.1} ${cy - r * 0.78}`} fill="none" stroke="#fff" strokeOpacity={0.22} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}
