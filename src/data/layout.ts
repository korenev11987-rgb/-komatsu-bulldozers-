import type { LayoutParams, SchemaNode } from '../types';

/**
 * Вид сбоку, машина обращена отвалом влево.
 * Все размеры машины задаются в миллиметрах (паспортные габариты модели, см. layout.dims в d155/d355/d475.ts)
 * и переводятся в пиксели одним масштабом K (px/мм), подобранным так, чтобы машина занимала ~1000 px
 * по длине и не выше ~405 px по высоте. Пропорции каждой модели — реальные; размер между моделями
 * на экране выровнен (истинный масштаб показан масштабной линейкой).
 * Сверху и снизу оставлены полосы для подписей-выносок.
 */
export const VIEWBOX = { width: 1200, height: 660, groundY: 520, cx: 600 };

export interface Box { x: number; y: number; w: number; h: number }
export interface Circle { cx: number; cy: number; r: number }
export interface Pt { x: number; y: number }
export interface Seg { x1: number; y1: number; x2: number; y2: number }

/** Поза рабочего оборудования для анимации (мм) */
export interface Pose {
  /** Подъём режущей кромки отвала над грунтом (отрицательное — заглубление) */
  bladeLift: number;
  /** Высота наконечника рыхлителя над грунтом (отрицательное — в грунте) */
  ripperTip: number;
  /** Наклон (pitch) отвала, градусы: + — верх отвала вперёд (только модели с animExtras) */
  bladePitch?: number;
}

export const restPose = (p: LayoutParams): Pose => ({ bladeLift: 0, ripperTip: Math.round(p.dims.ripperLift * 0.4) });

export interface Geometry {
  p: LayoutParams;
  /** Масштаб, px на мм */
  K: number;
  g: number;
  /** Толщина гусеничной ленты (звено + башмак + грунтозацеп), px */
  trackT: number;
  tx0: number;
  tx1: number;
  idler: Circle;
  /** Заднее натяжное колесо (только элевированная ходовая) */
  rearIdler?: Circle;
  sprocket: Circle;
  rollers: Circle[];
  carriers: Circle[];
  frame: Box;
  deckY: number;
  hullBottom: number;
  fender: Box;
  /** strip — высота «жёлтой» полосы боковины над окном разреза (для наклонного капота), px */
  hood: { front: number; end: number; top: number; noseTop: number; bottom: number; strip: number };
  radiator: Box;
  engine: Box;
  pumps: Box;
  powertrain: Box;
  torqueConverter: Box;
  gearbox: Box;
  steering: Box;
  finalDrive: Circle;
  cab: { x: number; w: number; top: number; floor: number };
  dash: Box;
  fuseBox: Box;
  controllers: Box;
  tank: Box;
  exhaust: { x: number; top: number; r: number }[];
  precleaner: { x: number; top: number };
  /** Отвал в положении «на грунте»; поворот вокруг шарнира толкающего бруса — bladeRot */
  blade: { front: number; back: number; top: number; bottom: number; H: number; outline: string };
  bladeRot: { a: number; cx: number; cy: number };
  pushArm: Seg;
  liftCyl: Seg;
  tiltCyl: Seg;
  ripper: { mount: Box; upper: Seg; lower: Seg; beam: Box; shankX: number[]; shankW: number; tipY: number };
  ripperLift: Seg;
  ripperTilt: Seg;
  batteries: Box;
  alternator: Circle;
  starter: Circle;
  lights: { x: number; y: number; dir: 1 | -1 }[];
  wiring: string;
  /** Отдельные трассы для анимации тока при запуске: АКБ → стартер и АКБ → кабина */
  wiringStart: string;
  connectors: Pt[];
  hoses: { blade: string; ripper: string };
  /** Постоянные длины корпусов цилиндров (шток выдвигается при анимации), px */
  barrels: { lift: number; tilt: number; ripLift: number; ripTilt: number };
}

/** Контур гусеницы вокруг натяжного колеса и звёздочки: offset 0 — линия звеньев, offset trackT — грунтозацепы */
export function trackPath(geo: Geometry, offset = 0): string {
  if (geo.rearIdler) return elevatedTrackPath(geo, offset);
  const { idler: i, sprocket: s, g, trackT } = geo;
  const r1 = g - i.cy - trackT + offset;
  const r2 = g - s.cy - trackT + offset;
  return [
    `M ${i.cx} ${i.cy - r1}`,
    `L ${s.cx} ${s.cy - r2}`,
    `A ${r2} ${r2} 0 0 1 ${s.cx} ${s.cy + r2}`,
    `L ${i.cx} ${i.cy + r1}`,
    `A ${r1} ${r1} 0 0 1 ${i.cx} ${i.cy - r1}`,
    'Z',
  ].join(' ');
}

/**
 * Элевированная ходовая (Cat high-drive): лента огибает переднее натяжное колесо, поднятую звёздочку
 * и заднее натяжное колесо — выпуклая оболочка трёх окружностей (внешние касательные).
 */
function elevatedTrackPath(geo: Geometry, offset: number): string {
  const { idler: i, sprocket: s, rearIdler: r, trackT } = geo;
  if (!r) return '';
  // радиусы по средней линии ленты: колесо + (offset − trackT) + толщина ленты, как в trackPath
  const circles = [
    { x: i.cx, y: i.cy, r: i.r + 2 + offset },
    { x: s.cx, y: s.cy, r: s.r + 2 + offset },
    { x: r.cx, y: r.cy, r: r.r + 2 + offset },
  ];
  void trackT;
  // внешняя касательная от a к b при обходе по часовой стрелке (на экране): нормаль наружу
  const tangent = (a: (typeof circles)[number], b: (typeof circles)[number]) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const L = Math.hypot(dx, dy);
    const ux = dx / L;
    const uy = dy / L;
    const px = uy; // перпендикуляр наружу (для движения вправо — вверх)
    const py = -ux;
    const c = (a.r - b.r) / L;
    const sn = Math.sqrt(Math.max(0, 1 - c * c));
    const nx = c * ux + sn * px;
    const ny = c * uy + sn * py;
    return { a: { x: a.x + a.r * nx, y: a.y + a.r * ny }, b: { x: b.x + b.r * nx, y: b.y + b.r * ny }, n: Math.atan2(ny, nx) };
  };
  const t = [tangent(circles[0], circles[1]), tangent(circles[1], circles[2]), tangent(circles[2], circles[0])];
  const f = (v: number) => v.toFixed(2);
  const arc = (c: (typeof circles)[number], from: number, to: number, end: Pt) => {
    let da = to - from;
    while (da < 0) da += Math.PI * 2;
    return `A ${f(c.r)} ${f(c.r)} 0 ${da > Math.PI ? 1 : 0} 1 ${f(end.x)} ${f(end.y)}`;
  };
  return [
    `M ${f(t[0].a.x)} ${f(t[0].a.y)}`,
    `L ${f(t[0].b.x)} ${f(t[0].b.y)}`,
    arc(circles[1], t[0].n, t[1].n, t[1].a),
    `L ${f(t[1].b.x)} ${f(t[1].b.y)}`,
    arc(circles[2], t[1].n, t[2].n, t[2].a),
    `L ${f(t[2].b.x)} ${f(t[2].b.y)}`,
    arc(circles[0], t[2].n, t[0].n, t[0].a),
    'Z',
  ].join(' ');
}

const rot = (pt: Pt, c: Pt, deg: number): Pt => {
  const a = (deg * Math.PI) / 180;
  const dx = pt.x - c.x;
  const dy = pt.y - c.y;
  return { x: c.x + dx * Math.cos(a) - dy * Math.sin(a), y: c.y + dx * Math.sin(a) + dy * Math.cos(a) };
};

export function buildGeometry(p: LayoutParams, pose: Pose = restPose(p)): Geometry {
  const d = p.dims;
  const g = VIEWBOX.groundY;
  const K = p.fixedK ?? Math.min(1000 / d.overallLength, 405 / d.cabHeight);
  const elevated = p.drive === 'elevated';
  const x0 = VIEWBOX.cx - (d.overallLength * K) / 2;
  const X = (mm: number) => x0 + mm * K;
  const Y = (mm: number) => g - mm * K;
  const S = (mm: number) => mm * K;

  // ---- Ходовая (оценка радиусов по длине гусеницы на грунте: общая длина ленты ≈ 1,39 × TOG) ----
  const TOG = d.trackOnGround;
  // Элевированная ходовая (оценка радиусов по TOG): натяжные колёса на грунте, звёздочка поднята над задним колесом.
  // Положение гусеницы — из паспортных длин: задний край ленты = «длина с отвалом» (без рыхлителя).
  const Ri = elevated ? 0.15 * TOG : 0.19 * TOG; // натяжное колесо по грунтозацепам
  const Rs = elevated ? 0.16 * TOG : 0.205 * TOG; // звёздочка по грунтозацепам
  const Xri = elevated ? (d.lengthWithBlade ?? d.overallLength - d.sprocketToRipper) - Ri : 0; // ось заднего натяжного колеса
  const Hs = 2 * Ri + 0.55 * Rs; // высота оси поднятой звёздочки (оценка)
  const Xsc = elevated ? Xri - 0.06 * TOG : d.overallLength - d.sprocketToRipper; // ось звёздочки (из паспортного «звёздочка → рыхлитель»)
  const Xic = elevated ? Xri - TOG : Xsc - TOG; // ось натяжного колеса
  const Xtr0 = Xic - Ri;
  const Xtr1 = elevated ? Xri + Ri : Xsc + Rs;
  const trackT = S(0.055 * TOG + d.grouser);

  const idler = { cx: X(Xic), cy: Y(Ri), r: S(Ri) - trackT - 2 };
  const rearIdler = elevated ? { cx: X(Xri), cy: Y(Ri), r: S(Ri) - trackT - 2 } : undefined;
  const sprocket = elevated ? { cx: X(Xsc), cy: Y(Hs), r: S(Rs) - trackT - 2 } : { cx: X(Xsc), cy: Y(Rs), r: S(Rs) - trackT - 2 };
  const rr = S(0.052 * TOG);
  const rStart = idler.cx + idler.r * 0.75 + rr;
  const rEnd = rearIdler ? rearIdler.cx - rearIdler.r * 0.75 - rr : sprocket.cx - sprocket.r * 0.7 - rr;
  const rollers = Array.from({ length: p.trackRollers }, (_, k) => {
    const n = p.trackRollers;
    let t = k / Math.max(1, n - 1);
    // K-Bogie: катки сгруппированы попарно на тележках
    if (p.bogie) t = t + (k % 2 === 0 ? 0.012 : -0.012);
    return { cx: rStart + (rEnd - rStart) * t, cy: g - trackT - rr, r: rr };
  });
  const topInner = (x: number) => {
    const y1 = idler.cy - (idler.r + 2);
    const y2 = sprocket.cy - (sprocket.r + 2);
    return y1 + ((y2 - y1) * (x - idler.cx)) / (sprocket.cx - idler.cx);
  };
  const rc = S(0.034 * TOG);
  const carriers = Array.from({ length: p.carrierRollers }, (_, k) => {
    const cx = idler.cx + (sprocket.cx - idler.cx) * ((k + 1) / (p.carrierRollers + 1));
    return { cx, cy: topInner(cx) + rc, r: rc };
  });
  const frameTop = Math.max(...carriers.map((c) => c.cy + c.r)) + 2;
  const frameBot = g - trackT - rr * 2 + 6;
  const frameTopE = rearIdler ? Math.min(frameTop, idler.cy - idler.r * 0.35) : frameTop;
  const frame = rearIdler
    ? { x: idler.cx, y: frameTopE, w: rearIdler.cx - idler.cx, h: Math.max(14, frameBot - frameTopE) }
    : { x: idler.cx, y: frameTop, w: sprocket.cx - sprocket.r * 0.4 - idler.cx, h: Math.max(14, frameBot - frameTop) };

  // ---- Корпус ----
  const deckY = elevated ? Y(2 * Ri) - S(260) : Y(2 * Math.max(Ri, Rs)) - S(70);
  const hullBottom = Y(d.groundClearance);
  const cabEndMm = Xtr1 - d.tankLength;
  const cabStartMm = cabEndMm - d.cabLength;
  const hf = X(Xtr0 - d.hoodOverhang);
  const he = X(cabStartMm);
  const hl = he - hf;
  const hoodTop = Y(d.hoodHeight);
  const noseK = p.hood === 'slant' ? 0.84 : p.hood === 'big' ? 0.95 : p.hood === 'cat' ? 0.93 : 0.97;
  const strip = p.hood === 'slant' ? 22 : 0;
  const hood = { front: hf, end: he, top: hoodTop, noseTop: Y(d.hoodHeight * noseK), bottom: deckY, strip };
  const hh = deckY - hoodTop;
  const slantTop = (x: number) => hood.noseTop + ((hoodTop - hood.noseTop) * Math.max(0, x - hf - 8)) / (he - hf - 8);

  const radiator = { x: hf + hl * 0.035, y: hood.noseTop + hh * 0.08, w: Math.max(26, hl * 0.09), h: deckY - hood.noseTop - hh * 0.14 };
  // Верхняя полоса боковины капота остаётся «жёлтой» (жалюзи, надпись), двигатель показан в вырезе ниже
  const engine =
    p.hood === 'slant'
      ? // Наклонный капот D155AX-8: окно разреза идёт параллельно линии капота, под полосой с надписью
        { x: hf + hl * 0.2, y: slantTop(hf + hl * 0.2) + strip + 6, w: hl * 0.66, h: hh * 0.34 }
      : { x: hf + hl * 0.2, y: hoodTop + hh * 0.24, w: hl * 0.66, h: hh * (p.hood === 'big' ? 0.46 : 0.42) };
  const pumps = { x: he - 92, y: deckY - 40, w: 72, h: 30 };
  const alternator = { cx: engine.x + 16, cy: engine.y + engine.h + 14, r: 12 };
  const starter = { cx: engine.x + engine.w * 0.55, cy: engine.y + engine.h + 14, r: 11 };

  const cabTop = Y(d.cabHeight) + 12;
  const cabW = S(d.cabLength);
  const floor = deckY - 0.16 * (deckY - cabTop);
  const cab = { x: he, w: cabW, top: cabTop, floor };
  const ch = floor - cabTop;

  const ptEnd = sprocket.cx - sprocket.r * 0.3;
  const powertrain = { x: he + 2, y: floor + 3, w: ptEnd - he - 2, h: deckY + S(260) - floor };
  const pw = powertrain.w;
  const torqueConverter = { x: powertrain.x + 6, y: powertrain.y + 6, w: pw * 0.2, h: powertrain.h - 12 };
  const gearbox = { x: torqueConverter.x + torqueConverter.w + 6, y: powertrain.y + 4, w: pw * 0.3, h: powertrain.h - 8 };
  const steering = { x: gearbox.x + gearbox.w + 6, y: powertrain.y + 5, w: powertrain.x + pw - 6 - (gearbox.x + gearbox.w + 6), h: powertrain.h - 10 };
  const finalDrive = { cx: sprocket.cx, cy: sprocket.cy, r: sprocket.r * 0.5 };

  const dash = { x: cab.x + cabW * 0.08, y: cabTop + ch * 0.42, w: 78, h: 54 };
  const controllers = { x: cab.x + cabW - 44, y: cabTop + ch * 0.3, w: 30, h: 34 };
  const fuseBox = { x: cab.x + cabW - 44, y: controllers.y + 42, w: 30, h: 28 };

  const tankTop = Y(d.cabHeight * 0.52);
  const tank = { x: X(cabEndMm) + 2, y: tankTop, w: X(Xtr1) - X(cabEndMm) + S(60), h: deckY - tankTop + S(120) };
  // АКБ — в батарейном ящике на заднем крыле рядом с баком
  const batteries = { x: tank.x + Math.max(2, (tank.w - 60) / 2), y: deckY - 38, w: 60, h: 30 };

  const exPos = p.hood === 'slant' ? 0.42 : p.hood === 'big' ? 0.36 : p.hood === 'cat' ? 0.4 : 0.3;
  const exR = Math.max(6, S(150));
  const exhaust = [{ x: hf + hl * exPos, top: Y(d.exhaustHeight), r: exR }];
  if (p.stacks === 2) exhaust.push({ x: hf + hl * exPos + S(520), top: Y(d.exhaustHeight) + S(60), r: exR });
  const precPos = p.hood === 'slant' ? 0.76 : p.hood === 'big' ? 0.8 : p.hood === 'cat' ? 0.72 : 0.17;
  const precleaner = { x: hf + hl * precPos, top: hoodTop - S(520) };

  // ---- Отвал ----
  const H = S(d.bladeHeight);
  const depthK = p.bladeType === 'sigma' ? 0.52 : p.bladeType === 'u' ? 0.6 : 0.44;
  const bFront = X(0);
  const bBack = bFront + H * depthK;
  const bTop = g - H;
  let outline: string;
  if (p.bladeType === 'sigma') {
    // Sigmadozer: выступающая вперёд нижняя «V»-часть с режущей кромкой, вогнутый лоб, козырёк
    outline = [
      [bFront + H * 0.06, bTop], [bFront + H * 0.3, bTop - H * 0.04], [bBack, bTop + H * 0.16], [bBack + H * 0.02, g - H * 0.32],
      [bFront + H * 0.3, g - H * 0.05], [bFront + H * 0.2, g], [bFront, g], [bFront + H * 0.05, g - H * 0.18],
    ].map(([x, y]) => `${x},${y}`).join(' ');
  } else if (p.bladeType === 'u') {
    // U-отвал с козырьком и крупной боковой «щекой»
    outline = [
      [bFront + H * 0.02, bTop + H * 0.02], [bFront + H * 0.12, bTop - H * 0.05], [bFront + H * 0.42, bTop - H * 0.05], [bBack, bTop + H * 0.22],
      [bBack, g - H * 0.26], [bFront + H * 0.26, g], [bFront - H * 0.02, g], [bFront + H * 0.06, g - H * 0.4],
    ].map(([x, y]) => `${x},${y}`).join(' ');
  } else {
    // Прямой отвал старого образца: угловатая щека
    outline = [
      [bFront + H * 0.04, bTop], [bFront + H * 0.3, bTop], [bBack, bTop + H * 0.12], [bBack, g - H * 0.3],
      [bFront + H * 0.22, g], [bFront, g], [bFront + H * 0.08, g - H * 0.5],
    ].map(([x, y]) => `${x},${y}`).join(' ');
  }
  // Наклон (pitch) отвала вокруг шарнира толкающего бруса: только для моделей с animExtras (у Komatsu pitch = 0)
  const pitch = p.animExtras ? pose.bladePitch ?? 0 : 0;
  const pin = { x: bBack - 4, y: g - H * 0.24 };
  const pr = (pt: Pt) => (pitch ? rot(pt, pin, -pitch) : pt);
  if (pitch) {
    outline = outline
      .split(' ')
      .map((xy) => {
        const [x, y] = xy.split(',').map(Number);
        const q = pr({ x, y });
        return `${q.x},${q.y}`;
      })
      .join(' ');
  }
  const blade = { front: bFront, back: bBack, top: bTop, bottom: g, H, outline };

  const pivot = { x: X(Xic + 0.42 * TOG), y: frame.y + frame.h * 0.45 };
  const pushArmRest = { x1: bBack - 4, y1: g - H * 0.24, x2: pivot.x, y2: pivot.y };
  const R = pivot.x - (bFront + H * 0.1);
  const liftPx = Math.max(-S(d.bladeDrop), Math.min(S(d.bladeLift), S(pose.bladeLift)));
  const a = (Math.asin(Math.max(-0.9, Math.min(0.9, liftPx / R))) * 180) / Math.PI;
  const bladeRot = { a, cx: pivot.x, cy: pivot.y };
  const rp = (pt: Pt) => rot(pt, pivot, a);

  const liftTop = { x: hf + S(160), y: hood.noseTop + hh * 0.22 };
  const liftEnd = rp(pr({ x: bBack - H * 0.06, y: bTop + H * 0.2 }));
  const liftCyl = { x1: liftTop.x, y1: liftTop.y, x2: liftEnd.x, y2: liftEnd.y };
  const liftRestLen = Math.hypot(bBack - H * 0.06 - liftTop.x, bTop + H * 0.2 - liftTop.y);
  const t1 = rp(pr({ x: bBack - 2, y: bTop + H * 0.42 }));
  const t2 = rp({ x: pushArmRest.x1 + (pivot.x - pushArmRest.x1) * 0.32, y: pushArmRest.y1 + (pivot.y - pushArmRest.y1) * 0.32 - 4 });
  const tiltCyl = { x1: t1.x, y1: t1.y, x2: t2.x, y2: t2.y };
  // длина корпуса цилиндра перекоса — по позе без наклона (иначе шток не «выдвигается» при pitch)
  const t1r = rp({ x: bBack - 2, y: bTop + H * 0.42 });
  const tiltRestLen = Math.hypot(t2.x - t1r.x, t2.y - t1r.y);

  // ---- Рыхлитель ----
  const n = p.ripperShanks;
  const shankW = Math.max(14, S(300));
  const stagger = n > 1 ? Math.max(8, S(220)) : 0;
  const tipY = Y(pose.ripperTip);
  const restTipY = Y(Math.round(d.ripperLift * 0.4));
  const shankLen = S(d.ripperDepth + 350);
  const beamH = Math.max(28, S(430));
  const beamDy = tipY - restTipY;
  const tipX = X(d.overallLength);
  const shankX = Array.from({ length: n }, (_, k) => tipX - shankW - S(180) - k * stagger);
  const beamRestY = restTipY - shankLen - beamH;
  const beam = { x: shankX[n - 1] - S(260), y: beamRestY + beamDy, w: shankX[0] + shankW + S(120) - (shankX[n - 1] - S(260)), h: beamH };
  const mount = { x: X(Xtr1) - S(300), y: deckY - S(120), w: S(520), h: hullBottom - deckY + S(220) };
  const mx = mount.x + mount.w * 0.7;
  const ripper = {
    mount,
    upper: { x1: mx, y1: mount.y + mount.h * 0.2, x2: beam.x + 6, y2: beam.y + beam.h * 0.25 },
    lower: { x1: mx, y1: mount.y + mount.h * 0.85, x2: beam.x + 6, y2: beam.y + beam.h * 0.85 },
    beam,
    shankX,
    shankW,
    tipY,
  };
  const ripperLift = { x1: mount.x + mount.w * 0.25, y1: tank.y + tank.h * 0.45, x2: beam.x + beam.w * 0.3, y2: beam.y + 3 };
  const ripperTilt = { x1: mount.x + mount.w * 0.55, y1: mount.y + mount.h * 0.5, x2: beam.x + beam.w - 6, y2: beam.y + beam.h * 0.35 };
  const ripLiftRest = Math.hypot(ripperLift.x2 - ripperLift.x1, ripperLift.y2 - beamDy - ripperLift.y1);
  const ripTiltRest = Math.hypot(ripperTilt.x2 - ripperTilt.x1, ripperTilt.y2 - beamDy - ripperTilt.y1);

  // ---- Электрика ----
  const lights = [
    { x: cab.x + 26, y: cabTop - 6, dir: -1 as const },
    { x: cab.x + cabW - 22, y: cabTop - 6, dir: 1 as const },
    { x: hf + 22, y: hood.noseTop - 12, dir: -1 as const },
    { x: tank.x + tank.w - 18, y: tank.y - 9, dir: 1 as const },
  ];
  const bc = { x: batteries.x + batteries.w / 2, y: batteries.y + batteries.h };
  const bus = deckY - 3;
  const fx = fuseBox.x + fuseBox.w / 2;
  const routeStarter = `M ${bc.x} ${bc.y - 2} L ${bc.x} ${bus} L ${starter.cx} ${bus} L ${starter.cx} ${starter.cy}`;
  const routeCab = `M ${starter.cx} ${bus} L ${cab.x + 4} ${bus} L ${cab.x + 4} ${floor - 8} L ${fx} ${floor - 8} L ${fx} ${fuseBox.y + fuseBox.h}`;
  const wiring = [
    routeStarter,
    `M ${bc.x} ${bus} L ${alternator.cx} ${bus} L ${alternator.cx} ${alternator.cy}`,
    `M ${alternator.cx - 8} ${bus} L ${hf + 22} ${bus} L ${hf + 22} ${hood.noseTop - 6}`,
    routeCab,
    `M ${fx} ${fuseBox.y} L ${controllers.x + controllers.w / 2} ${controllers.y + controllers.h}`,
    `M ${fuseBox.x + fuseBox.w} ${fuseBox.y + 10} L ${cab.x + cabW - 6} ${fuseBox.y + 10} L ${cab.x + cabW - 6} ${cabTop + 4} L ${cab.x + 26} ${cabTop + 4}`,
    `M ${cab.x + cabW - 6} ${cabTop + ch * 0.2} L ${tank.x + tank.w - 18} ${cabTop + ch * 0.2} L ${tank.x + tank.w - 18} ${tank.y - 3}`,
    `M ${dash.x + dash.w} ${dash.y + dash.h - 6} L ${fuseBox.x} ${fuseBox.y + fuseBox.h - 6}`,
  ].join(' ');
  const connectors = [
    { x: bc.x, y: bus },
    { x: starter.cx, y: bus },
    { x: hf + 22, y: (bus + hood.noseTop) / 2 },
    { x: cab.x + 4, y: (bus + floor) / 2 },
    { x: cab.x + cabW - 6, y: cabTop + ch * 0.2 },
    { x: tank.x + tank.w - 18, y: (cabTop + ch * 0.2 + tank.y) / 2 },
  ];

  // ---- Гидролинии (для анимации потока масла) ----
  const pc = { x: pumps.x + 10, y: pumps.y + 4 };
  const hoses = {
    blade: `M ${pc.x} ${pc.y} L ${pc.x} ${deckY - 4} L ${hf + S(260)} ${deckY - 4} L ${liftTop.x} ${liftTop.y}`,
    ripper: `M ${pumps.x + pumps.w - 8} ${pumps.y + 4} L ${pumps.x + pumps.w - 8} ${floor - 2} L ${ripperLift.x1} ${floor - 2} L ${ripperLift.x1} ${ripperLift.y1}`,
  };

  return {
    p, K, g, trackT, tx0: X(Xtr0), tx1: X(Xtr1), idler, rearIdler, sprocket, rollers, carriers, frame, deckY, hullBottom,
    fender: { x: X(Xtr0) + 4, y: deckY, w: X(Xtr1) - X(Xtr0) - 4, h: Math.max(10, S(140)) },
    hood, radiator, engine, pumps, powertrain, torqueConverter, gearbox, steering, finalDrive, cab, dash, fuseBox, controllers, tank,
    exhaust, precleaner, blade, bladeRot, pushArm: pushArmRest, liftCyl, tiltCyl, ripper, ripperLift, ripperTilt,
    batteries, alternator, starter, lights, wiring, wiringStart: `${routeStarter} ${routeCab}`, connectors, hoses,
    barrels: { lift: liftRestLen * 0.5, tilt: tiltRestLen * 0.55, ripLift: ripLiftRest * 0.5, ripTilt: ripTiltRest * 0.5 },
  };
}

const rect = (b: Box, rx = 4) => ({ kind: 'rect' as const, x: b.x, y: b.y, w: b.w, h: b.h, rx });
const circ = (c: Circle) => ({ kind: 'circle' as const, ...c });
const line = (s: Seg, width: number) => ({ kind: 'line' as const, ...s, width });
const mid = (s: Seg) => ({ x: (s.x1 + s.x2) / 2, y: (s.y1 + s.y2) / 2 });
const center = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

export function shankPolygon(geo: Geometry, k: number): string {
  const r = geo.ripper;
  const x = r.shankX[k];
  const w = r.shankW;
  const top = r.beam.y - 6 - k * 3;
  const tip = r.tipY - k * 2;
  // Стойка с изгибом вперёд и наконечником
  return `${x},${top} ${x + w},${top} ${x + w * 1.05},${tip - w * 2.2} ${x + w * 0.5},${tip - w * 0.4} ${x - w * 0.55},${tip} ${x - w * 0.1},${tip - w * 1.4} ${x},${tip - w * 2.6}`;
}

/** Узлы схемы: области клика, точки выносок и сторона подписи */
export function buildNodes(geo: Geometry): SchemaNode[] {
  const { p, g, blade: b, ripper: r } = geo;
  const shanks = r.shankX.map((_, k) => ({ kind: 'polygon' as const, points: shankPolygon(geo, k) }));
  const lightR = 11;

  return [
    // Ходовая
    { id: 'trackChain', system: 'undercarriage', label: 'Гусеница (звенья и башмаки)', shapes: [{ kind: 'path', d: trackPath(geo, geo.trackT) }], anchor: { x: (geo.tx0 + geo.tx1) / 2 + 40, y: g - 4 }, labelSide: 'bottom' },
    { id: 'trackFrame', system: 'undercarriage', label: p.bogie ? (p.brand ? 'Рама тележки, bogie' : 'Рама тележки, K-Bogie') : 'Рама тележки', shapes: [rect(geo.frame, 5)], anchor: center(geo.frame), labelSide: 'bottom' },
    { id: 'carrierRollers', system: 'undercarriage', label: p.carrierOptional ? 'Поддерживающий каток (опция)' : 'Поддерживающие катки', shapes: geo.carriers.map((c) => circ({ ...c, r: c.r + 3 })), anchor: { x: geo.carriers[0].cx, y: geo.carriers[0].cy }, labelSide: 'bottom' },
    { id: 'trackRollers', system: 'undercarriage', label: `Опорные катки ×${p.trackRollers}`, shapes: geo.rollers.map(circ), anchor: { x: geo.rollers[2].cx, y: geo.rollers[2].cy + 6 }, labelSide: 'bottom' },
    { id: 'idler', system: 'undercarriage', label: geo.rearIdler ? 'Натяжные колёса (2)' : 'Натяжное колесо', shapes: geo.rearIdler ? [circ(geo.idler), circ(geo.rearIdler)] : [circ(geo.idler)], anchor: { x: geo.idler.cx, y: geo.idler.cy + geo.idler.r * 0.4 }, labelSide: 'bottom' },
    { id: 'sprocket', system: 'undercarriage', label: 'Ведущая звёздочка', shapes: [circ({ ...geo.sprocket, r: geo.sprocket.r + 4 })], anchor: { x: geo.sprocket.cx - geo.sprocket.r * 0.6, y: geo.sprocket.cy + geo.sprocket.r * 0.6 }, labelSide: 'bottom' },
    // Мотор
    { id: 'cooling', system: 'engine', label: 'Радиатор и вентилятор', shapes: [rect(geo.radiator)], anchor: { x: geo.radiator.x + geo.radiator.w / 2, y: geo.radiator.y + 16 }, labelSide: 'top', xray: true },
    { id: 'engine', system: 'engine', label: p.engineLabel, shapes: [rect(geo.engine, 8)], anchor: { x: geo.engine.x + geo.engine.w * 0.55, y: geo.engine.y + 12 }, labelSide: 'top', xray: true },
    // Гидравлика — насосы
    { id: 'pumps', system: 'hydraulics', label: 'Гидронасосы', shapes: [rect(geo.pumps)], anchor: center(geo.pumps), labelSide: 'bottom', xray: true },
    // Трансмиссия
    { id: 'torqueConverter', system: 'transmission', label: 'Гидротрансформатор', shapes: [rect(geo.torqueConverter, 14)], anchor: center(geo.torqueConverter), labelSide: 'top', xray: true },
    { id: 'gearbox', system: 'transmission', label: p.brand && p.brand !== 'KOMATSU' ? 'КПП powershift' : 'КПП TORQFLOW', shapes: [rect(geo.gearbox, 6)], anchor: center(geo.gearbox), labelSide: 'top', xray: true },
    { id: 'steering', system: 'transmission', label: p.steeringLabel, shapes: [rect(geo.steering, 6)], anchor: center(geo.steering), labelSide: 'top', xray: true },
    { id: 'finalDrive', system: 'transmission', label: 'Бортовой редуктор', shapes: [circ(geo.finalDrive)], anchor: { x: geo.finalDrive.cx + 6, y: geo.finalDrive.cy + 6 }, labelSide: 'bottom' },
    // Гидравлика — отвал и рыхлитель (фигуры отвала — в «рабочих» координатах; поворот задаёт bladeRot)
    { id: 'blade', system: 'hydraulics', label: p.bladeLabel, shapes: [{ kind: 'polygon', points: b.outline }, line(geo.pushArm, Math.max(14, b.H * 0.09))], anchor: { x: b.front + b.H * 0.12, y: g - b.H * 0.35 }, labelSide: 'bottom' },
    { id: 'bladeCylinders', system: 'hydraulics', label: p.dualTilt ? 'Цилиндры подъёма / двойного перекоса' : 'Цилиндры подъёма / перекоса', shapes: [line(geo.liftCyl, 18), line(geo.tiltCyl, 14)], anchor: mid(geo.liftCyl), labelSide: 'top' },
    { id: 'ripper', system: 'hydraulics', label: p.ripperShanks > 1 ? `Рыхлитель (${p.ripperShanks} зуба)` : 'Рыхлитель (1 зуб)', shapes: [rect(r.beam), line(r.upper, 12), line(r.lower, 12), ...shanks], anchor: { x: r.shankX[0] + r.shankW * 0.5, y: r.tipY - r.shankW * 1.6 }, labelSide: 'bottom' },
    { id: 'ripperCylinders', system: 'hydraulics', label: 'Цилиндры рыхлителя', shapes: [line(geo.ripperLift, 16), line(geo.ripperTilt, 14)], anchor: mid(geo.ripperLift), labelSide: 'top' },
    // Электрика
    { id: 'wiring', system: 'electrics', label: 'Жгуты и разъёмы', shapes: [{ kind: 'path', d: geo.wiring, width: 12 }], anchor: geo.connectors[3], labelSide: 'top' },
    { id: 'batteries', system: 'electrics', label: 'АКБ 2×12 В', shapes: [rect(geo.batteries)], anchor: center(geo.batteries), labelSide: 'bottom', xray: true },
    { id: 'alternator', system: 'electrics', label: 'Генератор', shapes: [circ({ ...geo.alternator, r: geo.alternator.r + 3 })], anchor: { x: geo.alternator.cx, y: geo.alternator.cy }, labelSide: 'bottom', xray: true },
    { id: 'starter', system: 'electrics', label: 'Стартер', shapes: [circ({ ...geo.starter, r: geo.starter.r + 5 })], anchor: { x: geo.starter.cx, y: geo.starter.cy }, labelSide: 'bottom', xray: true },
    { id: 'monitor', system: 'electrics', label: p.cab === 'modern' ? 'Монитор и приборы' : 'Приборная панель', shapes: [rect(geo.dash, 4)], anchor: { x: geo.dash.x + 20, y: geo.dash.y + 10 }, labelSide: 'top' },
    { id: 'controllers', system: 'electrics', label: p.cab === 'modern' ? 'ЭБУ / контроллеры' : 'Реле и датчики', shapes: [rect(geo.controllers, 3)], anchor: center(geo.controllers), labelSide: 'top' },
    { id: 'fuseBox', system: 'electrics', label: 'Предохранители и реле', shapes: [rect(geo.fuseBox, 3)], anchor: center(geo.fuseBox), labelSide: 'top' },
    { id: 'lights', system: 'electrics', label: 'Фары', shapes: geo.lights.map((l) => ({ kind: 'rect' as const, x: l.x - lightR, y: l.y - 8, w: lightR * 2, h: 16, rx: 4 })), anchor: { x: geo.lights[0].x, y: geo.lights[0].y }, labelSide: 'top' },
  ];
}
