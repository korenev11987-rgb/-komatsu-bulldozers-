import { trackPath, type Geometry } from '../../data/layout';
import type { AnimFrame } from '../../anim/stages';

/** Дальняя гусеница (смещена для лёгкой перспективы) */
export function FarSide({ geo }: { geo: Geometry }) {
  return (
    <g aria-hidden="true" className="decor" transform="translate(16 -11)">
      <path d={trackPath(geo, geo.trackT)} fill="#121416" />
      <path d={trackPath(geo, geo.trackT * 0.6)} fill="none" stroke="#2b2f33" strokeWidth={geo.trackT * 0.7} strokeDasharray="16 3" />
    </g>
  );
}

/** Верхняя кромка капота в точке x */
export function hoodTopAt(geo: Geometry, x: number): number {
  const { hood: h, p } = geo;
  if (p.hood === 'slant' || p.hood === 'cat') {
    const x0 = h.front + 8;
    return h.noseTop + ((h.top - h.noseTop) * Math.max(0, x - x0)) / (h.end - x0);
  }
  if (p.hood === 'big') {
    const x1 = h.front + (h.end - h.front) * 0.22;
    return x < x1 ? h.noseTop + ((h.top - h.noseTop) * Math.max(0, x - h.front - 14)) / (x1 - h.front - 14) : h.top;
  }
  return h.top;
}

/** Некликабельная «оболочка» машины: корпус, капот, кабина, бак, выхлоп и т. д. */
export function Body({ geo, anim = null }: { geo: Geometry; anim?: AnimFrame | null }) {
  const { hood: h, cab: c, tank: t, fender: f, p, deckY, hullBottom, K } = geo;
  const modern = p.cab === 'modern';
  const hl = h.end - h.front;
  const hh = deckY - h.top;
  const top = (x: number) => hoodTopAt(geo, x);

  // ---- Капот: форма зависит от поколения машины ----
  let hoodPts: string;
  if (p.hood === 'slant') {
    hoodPts = `${h.front},${deckY} ${h.front - 3},${h.noseTop + hh * 0.2} ${h.front + 8},${h.noseTop} ${h.end},${h.top} ${h.end},${deckY}`;
  } else if (p.hood === 'big') {
    const x1 = h.front + hl * 0.22;
    hoodPts = `${h.front},${deckY} ${h.front - 5},${h.noseTop + hh * 0.18} ${h.front + 14},${h.noseTop} ${x1},${h.top} ${h.end},${h.top} ${h.end},${deckY}`;
  } else if (p.hood === 'cat') {
    // Cat D6R/D9R/D10T: капот с плавным уклоном вперёд, высокая облицовка радиатора с фаской
    hoodPts = `${h.front},${deckY} ${h.front - 2},${h.noseTop + hh * 0.08} ${h.front + 8},${h.noseTop} ${h.end},${h.top} ${h.end},${deckY}`;
  } else {
    // D355A-3: угловатый капот 80-х с фаской и ступенькой у кабины
    hoodPts = `${h.front},${deckY} ${h.front},${h.top + 10} ${h.front + 10},${h.top} ${h.end - 30},${h.top} ${h.end - 30},${h.top - 8} ${h.end},${h.top - 8} ${h.end},${deckY}`;
  }
  // Верхняя грань капота (перспектива)
  const tx = 11;
  const ty = -8;
  const ridge: [number, number][] = p.hood === 'angular'
    ? [[h.front + 10, h.top], [h.end - 30, h.top]]
    : p.hood === 'big'
      ? [[h.front + 14, h.noseTop], [h.front + hl * 0.22, h.top], [h.end, h.top]]
      : [[h.front + 8, h.noseTop], [h.end, h.top]];
  const ridgeTop = `${ridge.map(([x, y]) => `${x},${y}`).join(' ')} ${[...ridge].reverse().map(([x, y]) => `${x + tx},${y + ty}`).join(' ')}`;

  const louvres: number[] = [];
  for (let x = h.end - hl * 0.42; x < h.end - 14; x += Math.max(8, hl * 0.032)) louvres.push(x);
  const grille: number[] = [];
  for (let y = h.noseTop + 8; y < deckY - 6; y += 8) grille.push(y);
  const railPosts = [h.front + hl * 0.3, h.front + hl * 0.6, h.end - 22];
  const brandSize = Math.max(11, Math.min(24, hh * 0.15));
  // Подбираем место для надписи: спереди или у кабины — где выше полоса капота над окном разреза
  const brand = (() => {
    if (p.hood === 'slant') {
      const size = h.strip - 8;
      const x = geo.engine.x + 4;
      return { x, size, anchor: 'start' as const, y: top(x) + size + 3 };
    }
    return { x: h.front + hl * 0.2, size: brandSize, anchor: 'start' as const, y: Math.min(geo.engine.y - 10, top(h.front + hl * 0.2) + brandSize + 4) };
  })();

  // ---- Кабина ----
  const ch = c.floor - c.top;
  const W = c.w;
  const cabPts = modern
    ? `${c.x},${c.floor} ${c.x},${c.top + ch * 0.6} ${c.x + W * 0.13},${c.top + ch * 0.03} ${c.x + W},${c.top + ch * 0.03} ${c.x + W},${c.floor}`
    : `${c.x + W * 0.03},${c.floor} ${c.x + W * 0.03},${c.top + ch * 0.08} ${c.x + W * 0.97},${c.top + ch * 0.08} ${c.x + W * 0.97},${c.floor}`;
  const winTop = c.top + ch * (modern ? 0.09 : 0.15);
  const winBottom = c.top + ch * (modern ? 0.66 : 0.6);
  const sideWin = modern
    ? `${c.x + W * 0.2},${winTop} ${c.x + W * 0.94},${winTop} ${c.x + W * 0.94},${winBottom} ${c.x + W * 0.09},${winBottom}`
    : `${c.x + W * 0.13},${winTop} ${c.x + W * 0.88},${winTop} ${c.x + W * 0.88},${winBottom} ${c.x + W * 0.13},${winBottom}`;
  const windshield = modern
    ? `${c.x + 5},${c.top + ch * 0.58} ${c.x + W * 0.135},${c.top + ch * 0.08} ${c.x + W * 0.18},${c.top + ch * 0.08} ${c.x + W * 0.07},${c.top + ch * 0.62}`
    : `${c.x + W * 0.05},${winTop} ${c.x + W * 0.1},${winTop} ${c.x + W * 0.1},${winBottom} ${c.x + W * 0.05},${winBottom}`;
  const postX = c.x + W * (modern ? 0.56 : 0.5);
  // Рычаги в кабине (только модели с animExtras): джойстик отвала/рыхлителя и рычаг хода отклоняются по фазе анимации
  const lever = (() => {
    if (!p.animExtras || !anim?.levers) return { left: 0, right: 0 };
    return { left: anim.levers.travel * 16, right: anim.levers.implement * 16 };
  })();
  const tankBrand = Math.max(9, Math.min(14, t.w * 0.13));

  return (
    <g aria-hidden="true" className="decor">
      {/* Тень на земле */}
      <ellipse cx={(geo.blade.front + geo.ripper.beam.x + geo.ripper.beam.w) / 2} cy={geo.g + 5} rx={(geo.ripper.beam.x + geo.ripper.beam.w - geo.blade.front) / 2} ry={15} fill="url(#kd-shadow)" />

      <g filter="url(#kd-drop)">
        {/* Нижняя часть корпуса и защита картера */}
        <rect x={h.front + 4} y={deckY - 2} width={geo.tx1 - h.front - 4} height={hullBottom - deckY + 2} fill="url(#kd-body)" stroke="#5c3d00" strokeWidth={1} />
        <polygon points={`${h.front + 2},${deckY + 2} ${h.front + 2},${hullBottom - 8} ${h.front + 18},${hullBottom} ${geo.idler.cx},${hullBottom} ${geo.idler.cx},${deckY + 2}`} fill="url(#kd-dark)" opacity={0.92} />

        {/* Основание кабины и трансмиссия в разрезе */}
        <rect x={h.end - 2} y={c.floor - 3} width={t.x - h.end + 6} height={deckY - c.floor + 5} fill="url(#kd-body)" stroke="#5c3d00" />
        <rect className="cutaway" x={geo.powertrain.x} y={geo.powertrain.y} width={geo.powertrain.w} height={geo.powertrain.h} rx={4} />
        <text className="decor__tiny cutaway__label" x={geo.powertrain.x + 4} y={geo.powertrain.y + geo.powertrain.h - 4}>разрез</text>

        {/* Кронштейн рыхлителя */}
        <rect x={geo.ripper.mount.x} y={geo.ripper.mount.y} width={geo.ripper.mount.w} height={geo.ripper.mount.h} rx={5} fill="url(#kd-bodyH)" stroke="#5c3d00" />
        <circle cx={geo.ripper.upper.x1} cy={geo.ripper.upper.y1} r={5} fill="url(#kd-hub)" />
        <circle cx={geo.ripper.lower.x1} cy={geo.ripper.lower.y1} r={5} fill="url(#kd-hub)" />

        {/* Капот */}
        <polygon points={hoodPts} fill="url(#kd-body)" stroke="#5c3d00" strokeWidth={1.5} />
        <polygon points={ridgeTop} fill="url(#kd-top)" stroke="#8a5d00" strokeWidth={1} />
        {p.hood === 'angular' && <polygon points={`${h.end - 30},${h.top - 8} ${h.end},${h.top - 8} ${h.end + tx},${h.top - 8 + ty} ${h.end - 30 + tx},${h.top - 8 + ty}`} fill="url(#kd-top)" stroke="#8a5d00" />}
        {/* Облицовка радиатора: чёрная решётка в жёлтой рамке */}
        <rect x={h.front - 3} y={h.noseTop + 6} width={14} height={deckY - h.noseTop - 10} fill="#1d2023" />
        {grille.map((y) => (
          <line key={y} x1={h.front - 3} y1={y} x2={h.front + 11} y2={y} stroke="#e6a800" strokeWidth={2} />
        ))}
        {/* Вырез моторного отсека («рентген») */}
        {p.hood === 'slant' ? (
          <polygon
            className="cutaway"
            points={`${geo.radiator.x - 4},${deckY - 3} ${geo.radiator.x - 4},${top(geo.radiator.x) + 6} ${geo.engine.x - 6},${top(geo.engine.x - 6) + 6} ${geo.engine.x - 6},${top(geo.engine.x) + h.strip} ${h.end - 2},${top(h.end - 2) + h.strip} ${h.end - 2},${deckY - 3}`}
          />
        ) : (
          <rect className="cutaway" x={geo.radiator.x - 4} y={geo.engine.y - 6} width={h.end - geo.radiator.x - 2} height={deckY - geo.engine.y + 3} rx={6} />
        )}
        <text className="decor__tiny cutaway__label" x={h.end - 8} y={(p.hood === 'slant' ? top(h.end) + h.strip : geo.engine.y - 6) + 10} textAnchor="end">разрез</text>
        {/* Жалюзи */}
        {louvres.map((x) => {
          const y0 = top(x) + 5;
          const y1 = Math.min(geo.engine.y - 9, y0 + hh * 0.16);
          return (
            <g key={x}>
              <line x1={x} y1={y0} x2={x + 5} y2={y1} stroke="#3a2a00" strokeWidth={2.6} />
              <line x1={x + 1.6} y1={y0} x2={x + 6.6} y2={y1} stroke="#fff3bf" strokeOpacity={0.6} strokeWidth={0.8} />
            </g>
          );
        })}
        {/* Линии панелей и замки */}
        <line x1={h.front + hl * 0.17} y1={top(h.front + hl * 0.17) + 2} x2={h.front + hl * 0.17} y2={geo.engine.y - 6} stroke="#6b4700" strokeWidth={1.3} />
        <line x1={h.end - hl * 0.45} y1={top(h.end - hl * 0.45) + 2} x2={h.end - hl * 0.45} y2={geo.engine.y - 6} stroke="#6b4700" strokeWidth={1.3} />
        <circle cx={h.front + hl * 0.17 + 6} cy={geo.engine.y - 14} r={1.8} fill="#3a2a00" />
        {/* Поручни на капоте */}
        <polyline points={railPosts.map((x) => `${x},${top(x) - 16}`).join(' ')} fill="none" stroke="#2b2f33" strokeWidth={2.6} strokeLinecap="round" />
        {railPosts.map((x) => (
          <line key={x} x1={x} y1={top(x) - 16} x2={x} y2={top(x) - 2} stroke="#2b2f33" strokeWidth={2.6} />
        ))}

        {/* Предочиститель воздуха */}
        <rect x={geo.precleaner.x - 6} y={geo.precleaner.top + 10} width={12} height={top(geo.precleaner.x) - geo.precleaner.top - 10} fill="url(#kd-pipe)" />
        <ellipse cx={geo.precleaner.x} cy={geo.precleaner.top + 9} rx={12} ry={6} fill="#2b2f33" stroke="#0b0c0d" />
        <rect x={geo.precleaner.x - 10} y={geo.precleaner.top + 11} width={20} height={12} rx={3} fill="#9cc4e4" fillOpacity={0.45} stroke="#1a1c1f" />

        {/* Выхлопные трубы с кожухом и колпаком */}
        {geo.exhaust.map((e, k) => (
          <g key={k}>
            <rect x={e.x - e.r / 2} y={e.top} width={e.r} height={top(e.x) - e.top} fill="url(#kd-pipe)" />
            <rect x={e.x - e.r * 0.75} y={top(e.x) - (top(e.x) - e.top) * 0.45} width={e.r * 1.5} height={(top(e.x) - e.top) * 0.4} rx={3} fill="url(#kd-pipe)" stroke="#0b0c0d" />
            {[0.2, 0.5, 0.8].map((q) => (
              <line key={q} x1={e.x - e.r * 0.6} y1={top(e.x) - (top(e.x) - e.top) * (0.05 + 0.4 * q)} x2={e.x + e.r * 0.6} y2={top(e.x) - (top(e.x) - e.top) * (0.05 + 0.4 * q)} stroke="#0b0c0d" strokeWidth={1.6} />
            ))}
            <polygon points={`${e.x - e.r * 0.6},${e.top + 2} ${e.x + e.r * 0.8},${e.top - 6} ${e.x + e.r * 0.8},${e.top + 2}`} fill="#2b3035" stroke="#0b0c0d" />
          </g>
        ))}

        {/* Надпись производителя (KOMATSU по умолчанию) — чёрная, на боковине капота над окном разреза */}
        <text className="decor__brand" x={brand.x} y={brand.y} style={{ fontSize: brand.size }} textAnchor={brand.anchor}>
          {p.brand ?? 'KOMATSU'}
        </text>

        {/* Топливный бак */}
        <rect x={t.x} y={t.y} width={t.w} height={t.h} rx={6} fill="url(#kd-bodyH)" stroke="#5c3d00" strokeWidth={1.5} />
        <polygon points={`${t.x + 4},${t.y} ${t.x + 4 + tx},${t.y + ty} ${t.x + t.w + tx - 2},${t.y + ty} ${t.x + t.w - 2},${t.y}`} fill="url(#kd-top)" stroke="#8a5d00" />
        <rect x={t.x + 10} y={t.y + ty - 6} width={12} height={7} rx={2} fill="#2b2f33" />
        <rect x={t.x + 3} y={t.y + 4} width={t.w - 6} height={6} fill="url(#kd-hazard)" opacity={0.9} />
        <text className="decor__model" x={t.x + t.w / 2} y={t.y + t.h * 0.3} style={{ fontSize: tankBrand }}>{p.badge}</text>

        {/* Крылья над гусеницами */}
        <rect x={f.x} y={f.y - f.h * 0.4} width={f.w} height={f.h} rx={3} fill="url(#kd-top)" stroke="#8a5d00" />
        <rect x={f.x} y={f.y - f.h * 0.4 + 3} width={20} height={f.h - 5} fill="url(#kd-hazard)" />
        <rect x={f.x + f.w - 20} y={f.y - f.h * 0.4 + 3} width={20} height={f.h - 5} fill="url(#kd-hazard)" />
        {/* Подножки и поручень у кабины */}
        {[0, 1].map((k) => (
          <rect key={k} x={c.x + 4 + k * 5} y={deckY - 24 + k * 12} width={Math.max(20, W * 0.16)} height={3.5} rx={1.5} fill="#2b2f33" />
        ))}

        {/* Кабина ROPS */}
        <polygon points={cabPts} fill="url(#kd-body)" stroke="#5c3d00" strokeWidth={1.5} />
        <clipPath id="kd-cabclip">
          <polygon points={sideWin} />
        </clipPath>
        {/* Интерьер через стекло */}
        <g clipPath="url(#kd-cabclip)">
          <rect x={c.x} y={c.top} width={W} height={ch} fill="url(#kd-interior)" />
          {/* Сиденье */}
          <path
            d={`M ${c.x + W * 0.6} ${c.top + ch * 0.28} q ${W * 0.04} -${ch * 0.04} ${W * 0.1} -${ch * 0.02} l ${W * 0.03} ${ch * 0.34} h ${W * 0.08} q ${W * 0.03} 0 ${W * 0.03} ${ch * 0.04} v ${ch * 0.06} h -${W * 0.28} v -${ch * 0.07} q 0 -${ch * 0.03} ${W * 0.04} -${ch * 0.03} z`}
            fill="#3a2f2a"
            stroke="#120f0d"
          />
          {modern ? (
            <>
              <g transform={`rotate(${lever.right} ${c.x + W * 0.86} ${winBottom - 2})`} className="cab-lever" data-lever="implement">
                <line x1={c.x + W * 0.86} y1={winBottom - 2} x2={c.x + W * 0.84} y2={winBottom - ch * 0.12} stroke="#9aa1a8" strokeWidth={2.5} />
                <ellipse cx={c.x + W * 0.84} cy={winBottom - ch * 0.14} rx={4} ry={6} fill="#111" stroke="#666" />
              </g>
              <g transform={`rotate(${lever.left} ${c.x + W * 0.52} ${winBottom - 2})`} className="cab-lever" data-lever="steer">
                <line x1={c.x + W * 0.52} y1={winBottom - 2} x2={c.x + W * 0.5} y2={winBottom - ch * 0.1} stroke="#9aa1a8" strokeWidth={2.5} />
                <ellipse cx={c.x + W * 0.5} cy={winBottom - ch * 0.12} rx={4} ry={5} fill="#111" stroke="#666" />
              </g>
            </>
          ) : (
            [0, 1].map((k) => (
              <g key={k}>
                <line x1={c.x + W * (0.46 + k * 0.05)} y1={winBottom} x2={c.x + W * (0.43 + k * 0.05)} y2={winBottom - ch * 0.2} stroke="#9aa1a8" strokeWidth={2.5} />
                <circle cx={c.x + W * (0.43 + k * 0.05)} cy={winBottom - ch * 0.21} r={3.5} fill="#c92a2a" />
              </g>
            ))
          )}
          <polygon points={sideWin} fill="url(#kd-glass)" />
          <polygon points={`${c.x + W * 0.32},${winTop} ${c.x + W * 0.46},${winTop} ${c.x + W * 0.26},${winBottom} ${c.x + W * 0.12},${winBottom}`} fill="#fff" opacity={0.14} />
          <polygon points={`${c.x + W * 0.52},${winTop} ${c.x + W * 0.57},${winTop} ${c.x + W * 0.37},${winBottom} ${c.x + W * 0.32},${winBottom}`} fill="#fff" opacity={0.08} />
        </g>
        <polygon points={windshield} fill="url(#kd-glass)" stroke="#1d2023" />
        {/* Стойки рамы (чёрные уплотнители) */}
        <polygon points={sideWin} fill="none" stroke="#1d2023" strokeWidth={4} strokeLinejoin="round" />
        <line x1={postX} y1={winTop} x2={postX} y2={winBottom} stroke="#1d2023" strokeWidth={3.5} />
        {!modern && (
          <>
            {/* Внешние стойки ROPS классической кабины */}
            <rect x={c.x - 4} y={c.top - 2} width={8} height={deckY - c.top} fill="url(#kd-bodyH)" stroke="#5c3d00" />
            <rect x={c.x + W - 4} y={c.top - 2} width={8} height={deckY - c.top} fill="url(#kd-bodyH)" stroke="#5c3d00" />
          </>
        )}
        {/* Дверная ручка и поручень */}
        <rect x={postX - 14} y={winBottom + ch * 0.08} width={12} height={3.5} rx={1.5} fill="#2b2f33" />
        <line x1={c.x + W + 6} y1={c.top + ch * 0.3} x2={c.x + W + 6} y2={c.floor - 6} stroke="#2b2f33" strokeWidth={2.6} strokeLinecap="round" />
        {/* Стеклоочиститель */}
        <line x1={c.x + W * 0.05} y1={c.top + ch * 0.55} x2={c.x + W * (modern ? 0.12 : 0.07)} y2={c.top + ch * 0.3} stroke="#111" strokeWidth={1.8} />
        {/* Зеркало */}
        <line x1={c.x + W * 0.06} y1={c.top + ch * 0.2} x2={c.x - 12} y2={c.top + ch * 0.14} stroke="#2b2f33" strokeWidth={2} />
        <rect x={c.x - 19} y={c.top + ch * 0.06} width={8} height={Math.max(14, ch * 0.1)} rx={3} fill="#2b3035" stroke="#0b0c0d" />
        {/* Крыша */}
        <rect x={c.x - 6} y={c.top - 5} width={W + 12} height={Math.max(9, K * 120)} rx={4} fill="url(#kd-body)" stroke="#5c3d00" />
        <polygon points={`${c.x - 6},${c.top - 3} ${c.x - 6 + tx},${c.top - 3 + ty} ${c.x + W + 6 + tx},${c.top - 3 + ty} ${c.x + W + 6},${c.top - 3}`} fill="url(#kd-top)" stroke="#8a5d00" />
        {/* Маячок / антенна KOMTRAX */}
        {modern && <rect x={c.x + W * 0.62} y={c.top - 18} width={8} height={9} rx={2} fill="#f08c00" stroke="#7a4500" />}
      </g>
    </g>
  );
}
