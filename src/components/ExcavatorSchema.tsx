import { useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { EXC_REST, type ExcFrame, type ExcPose } from "../anim/excavator";
import { SYSTEMS } from "../data/systems";
import type { AnyNodeId, ExcavatorModel, Shape, SystemId } from "../types";
import { SchemaDefs } from "./schema/Defs";

/*
 * Схема гидравлического экскаватора, вид сбоку, в масштабе.
 * Координаты машины в мм: x — вперёд (на экране влево), y — вверх, начало — на грунте под осью поворота.
 * Паспортные размеры — HEHH4376-02, с. 18–19 (model.dims); поля dims с пометкой «оценка» — только для рисунка.
 */

const W = 1200;
const H = 660;
const GY = 520;
/** Ось поворота на экране */
const SC = 880;
/** Масштаб, px/мм: свой для экскаватора (машина длиннее бульдозеров), показан линейкой «1 м» */
export const EXC_K = 0.07;

type Pt = [number, number];
const X = (x: number) => SC - x * EXC_K;
const Y = (y: number) => GY - y * EXC_K;
const P = (p: Pt): Pt => [X(p[0]), Y(p[1])];
const pts = (list: Pt[]) =>
  list
    .map((p) =>
      P(p)
        .map((v) => v.toFixed(1))
        .join(","),
    )
    .join(" ");
const dir = (deg: number): Pt => [
  Math.cos((deg * Math.PI) / 180),
  Math.sin((deg * Math.PI) / 180),
];
const add = (a: Pt, b: Pt, k = 1): Pt => [a[0] + b[0] * k, a[1] + b[1] * k];
const perp = (u: Pt): Pt => [-u[1], u[0]];
const rectMm = (
  x1: number,
  x2: number,
  y1: number,
  y2: number,
  rx = 0,
): Shape => ({
  kind: "rect",
  x: X(Math.max(x1, x2)),
  y: Y(Math.max(y1, y2)),
  w: Math.abs(x2 - x1) * EXC_K,
  h: Math.abs(y2 - y1) * EXC_K,
  rx,
});
const circleMm = (x: number, y: number, r: number): Shape => ({
  kind: "circle",
  cx: X(x),
  cy: Y(y),
  r: r * EXC_K,
});
const lineMm = (a: Pt, b: Pt, w: number): Shape => ({
  kind: "line",
  x1: X(a[0]),
  y1: Y(a[1]),
  x2: X(b[0]),
  y2: Y(b[1]),
  width: w,
});
const polyMm = (list: Pt[]): Shape => ({ kind: "polygon", points: pts(list) });

interface ExcNode {
  id: AnyNodeId;
  layer: "lower" | "upper";
  art: ReactNode;
  hit: Shape[];
  xray?: boolean;
}

/** Кинематика рабочего оборудования для позы */
export function linkage(m: ExcavatorModel, pose: ExcPose) {
  const d = m.dims;
  const F: Pt = [d.boomFootX, d.boomFootY];
  const u = dir(pose.boom);
  const n = perp(u);
  const T = add(F, u, d.boomLength);
  const knee = add(add(F, u, 0.45 * d.boomLength), n, 700);
  const v = dir(pose.stick);
  const mv = perp(v);
  const S = add(T, v, d.stickLength);
  const heel = add(add(T, v, -950), mv, -150);
  const b = dir(pose.bucket);
  const bp = perp(b);
  const tip = add(S, b, d.bucketTipRadius);
  return { F, u, n, T, knee, v, mv, S, heel, b, bp, tip };
}

function cylinder(a: Pt, bEnd: Pt, barrelLen: number, dia: number) {
  const L = Math.hypot(bEnd[0] - a[0], bEnd[1] - a[1]);
  const e: Pt = [(bEnd[0] - a[0]) / L, (bEnd[1] - a[1]) / L];
  const bl = Math.min(barrelLen, L - 150);
  const be = add(a, e, bl);
  const [ax, ay] = P(a);
  const [bx, by] = P(be);
  const [rx, ry] = P(bEnd);
  return (
    <>
      <line
        x1={bx}
        y1={by}
        x2={rx}
        y2={ry}
        stroke="url(#kd-chrome)"
        strokeWidth={dia * EXC_K * 0.55}
        strokeLinecap="round"
      />
      <line
        x1={ax}
        y1={ay}
        x2={bx}
        y2={by}
        stroke="#3d3d3d"
        strokeWidth={dia * EXC_K + 2}
        strokeLinecap="round"
      />
      <line
        x1={ax}
        y1={ay}
        x2={bx}
        y2={by}
        stroke="url(#kd-barrel)"
        strokeWidth={dia * EXC_K}
        strokeLinecap="round"
      />
      <circle cx={ax} cy={ay} r={3.2} fill="#222" />
      <circle cx={rx} cy={ry} r={3.2} fill="#222" />
    </>
  );
}

function buildNodes(
  m: ExcavatorModel,
  pose: ExcPose,
  travel: number,
): ExcNode[] {
  const d = m.dims;
  const L = linkage(m, pose);
  const r = d.trackLength / 2 - d.rollerCenters / 2; // радиус обвода колёс (из длины гусеницы и базы)
  const cy = r;
  const xI = d.rollerCenters / 2; // направляющее колесо — спереди
  const xS = -d.rollerCenters / 2; // звёздочка — сзади
  const trackTop = 2 * r;
  const deck = d.upperClearance; // низ платформы — оценка
  const deckTop = deck + 450;
  const rot = (travel / (r * 0.8)) * (180 / Math.PI); // поворот колёс (визуально)
  const rollerRot = (travel / 125) * (180 / Math.PI);

  const trackPath = `M ${X(xI)} ${Y(trackTop)} L ${X(xS)} ${Y(trackTop)} A ${r * EXC_K} ${r * EXC_K} 0 0 1 ${X(xS)} ${Y(0)} L ${X(xI)} ${Y(0)} A ${r * EXC_K} ${r * EXC_K} 0 0 1 ${X(xI)} ${Y(trackTop)} Z`;
  const spokes = (cx: number, cyy: number, rr: number, n: number, a0: number) =>
    Array.from({ length: n }, (_, k) => {
      const a = ((a0 + (k * 360) / n) * Math.PI) / 180;
      return (
        <line
          key={k}
          x1={X(cx)}
          y1={Y(cyy)}
          x2={X(cx) + Math.cos(a) * rr * EXC_K}
          y2={Y(cyy) + Math.sin(a) * rr * EXC_K}
          stroke="#2b2b2b"
          strokeWidth={2}
        />
      );
    });

  const rollersX = Array.from({ length: 8 }, (_, k) => -1950 + (k * 3900) / 7);
  const carriersX = [-1300, 0, 1300];

  // Стрела: изогнутая балка по оси «пята — колено — оголовок»
  const boomPoly: Pt[] = [
    add(L.F, L.n, 380),
    add(L.knee, L.n, 520),
    add(L.T, L.n, 330),
    add(L.T, L.n, -300),
    add(L.knee, L.n, -520),
    add(L.F, L.n, -380),
  ];
  const stickPoly: Pt[] = [
    add(L.heel, L.mv, 360),
    add(L.S, L.mv, 230),
    add(L.S, L.mv, -230),
    add(add(L.T, L.v, 150), L.mv, -330),
    add(L.heel, L.mv, -330),
  ];
  const bk = (a: number, p: number): Pt => add(add(L.S, L.b, a), L.bp, p);
  const bucketPoly: Pt[] = [
    bk(-120, 330),
    bk(700, 980),
    bk(1650, 900),
    bk(2251, 80),
    bk(2150, -60),
    bk(1300, -330),
    bk(250, -380),
  ];
  const teeth = [0, 1, 2].map((k) => {
    const base = bk(2160 - k * 80, 60 - k * 120);
    return [base, add(base, L.b, 260), add(base, L.bp, -110)] as Pt[];
  });

  // Точки цилиндров
  const boomCylBase: Pt = [1650, deckTop - 200];
  const boomCylRod = add(add(L.F, L.u, 0.36 * d.boomLength), L.n, -260);
  const stickCylBase = add(add(L.F, L.u, 0.5 * d.boomLength), L.n, 1150);
  const stickCylRod = add(L.heel, L.mv, 250);
  const bucketCylBase = add(add(L.T, L.v, 250), L.mv, 450);
  const ear = bk(250, 600);
  const linkTop = add(add(L.S, L.v, -620), L.mv, 330);
  const joint: Pt = add(
    [(ear[0] + linkTop[0]) / 2, (ear[1] + linkTop[1]) / 2],
    L.mv,
    330,
  );

  const xr = (s: Shape) => {
    if (s.kind === "rect")
      return (
        <rect
          className="xr-fill"
          x={s.x}
          y={s.y}
          width={s.w}
          height={s.h}
          rx={s.rx ?? 3}
        />
      );
    if (s.kind === "circle")
      return <circle className="xr-fill" cx={s.cx} cy={s.cy} r={s.r} />;
    return null;
  };

  const engineBox = rectMm(-2380, -1100, deckTop + 80, deckTop + 950, 4);
  const coolBox = rectMm(-2900, -2430, deckTop + 60, deckTop + 1050, 3);
  const pumpBox = rectMm(-1060, -520, deckTop + 80, deckTop + 620, 4);
  const tankBox = rectMm(-470, 170, deckTop + 420, deckTop + 1130, 4);
  const valveBox = rectMm(-470, 170, deckTop + 40, deckTop + 380, 3);
  const swDriveL = rectMm(520, 820, deck - 50, deckTop + 380, 3);
  const swDriveR = rectMm(-820, -520, deck - 50, deckTop + 380, 3);
  const swMotL = rectMm(540, 800, deckTop + 400, deckTop + 760, 3);
  const swMotR = rectMm(-800, -540, deckTop + 400, deckTop + 760, 3);
  const cab1 = d.cabFrontX;
  const batt = rectMm(1350, 1950, deck + 60, deck + 380, 2);
  const ctrl = rectMm(260, 640, deckTop + 120, deckTop + 420, 2);
  const fuse = rectMm(260, 640, deckTop + 470, deckTop + 700, 2);
  const mon = rectMm(1600, 1880, deckTop + 900, deckTop + 1130, 2);
  const alt = circleMm(-1230, deckTop + 820, 130);
  const starter = circleMm(-2240, deckTop + 200, 120);
  const travelMotor = rectMm(xS + 380, xS + 900, cy - 220, cy + 220, 3);
  const wirePts: Pt[] = [
    [1650, deck + 380],
    [1650, deckTop + 20],
    [450, deckTop + 20],
    [450, deckTop + 470],
    [-1100, deckTop + 470],
    [-2240, deckTop + 200],
  ];
  const wireD =
    "M " +
    wirePts
      .map((p) =>
        P(p)
          .map((v) => v.toFixed(1))
          .join(" "),
      )
      .join(" L ");
  const boomLight = add(add(L.F, L.u, 0.3 * d.boomLength), L.n, 520);
  const cabLight: Pt = [cab1 - 150, d.cabHeight + 40];

  const nodes: ExcNode[] = [
    /* ---------- Ходовая (не поворачивается) ---------- */
    {
      id: "trackFrame",
      layer: "lower",
      hit: [rectMm(xS + 300, xI - 300, cy - 300, cy + 330, 6)],
      art: (
        <>
          <rect
            x={X(xI - 250)}
            y={Y(cy + 330)}
            width={(xI - xS - 500) * EXC_K}
            height={630 * EXC_K}
            rx={6}
            fill="url(#kd-dark)"
            stroke="#1d1d1d"
          />
          <rect
            x={X(1000)}
            y={Y(deck)}
            width={2000 * EXC_K}
            height={(deck - trackTop + 40) * EXC_K}
            fill="url(#kd-dark)"
            stroke="#1d1d1d"
          />
        </>
      ),
    },
    {
      id: "trackChain",
      layer: "lower",
      hit: [{ kind: "path", d: trackPath, width: 16 }],
      art: (
        <>
          <path
            d={trackPath}
            fill="none"
            stroke="#262626"
            strokeWidth={13}
            strokeLinejoin="round"
          />
          <path
            d={trackPath}
            fill="none"
            stroke="url(#kd-shoe)"
            strokeWidth={9}
            strokeDasharray="7 3"
            strokeDashoffset={(-travel * EXC_K) % 10}
          />
        </>
      ),
    },
    {
      id: "idler",
      layer: "lower",
      hit: [circleMm(xI, cy, r - 90)],
      art: (
        <>
          <circle
            cx={X(xI)}
            cy={Y(cy)}
            r={(r - 90) * EXC_K}
            fill="url(#kd-wheel)"
            stroke="#222"
          />
          <g>{spokes(xI, cy, r - 160, 5, -rot)}</g>
          <circle cx={X(xI)} cy={Y(cy)} r={7} fill="url(#kd-hub)" />
        </>
      ),
    },
    {
      id: "sprocket",
      layer: "lower",
      hit: [circleMm(xS, cy, r - 60)],
      art: (
        <>
          <circle
            cx={X(xS)}
            cy={Y(cy)}
            r={(r - 60) * EXC_K}
            fill="#3a3a3a"
            stroke="#1b1b1b"
            strokeWidth={2}
            strokeDasharray="5 3"
            transform={`rotate(${-rot} ${X(xS)} ${Y(cy)})`}
          />
          <circle
            cx={X(xS)}
            cy={Y(cy)}
            r={(r - 140) * EXC_K}
            fill="url(#kd-wheel)"
          />
        </>
      ),
    },
    {
      id: "finalDrive",
      layer: "lower",
      hit: [circleMm(xS, cy, 290)],
      art: (
        <>
          <circle
            cx={X(xS)}
            cy={Y(cy)}
            r={290 * EXC_K}
            fill="url(#kd-hub)"
            stroke="#222"
          />
          <g>{spokes(xS, cy, 260, 8, -rot)}</g>
        </>
      ),
    },
    {
      id: "travelMotors",
      layer: "lower",
      xray: true,
      hit: [travelMotor],
      art: xr(travelMotor),
    },
    {
      id: "trackRollers",
      layer: "lower",
      hit: rollersX.map((x) => circleMm(x, 190, 150)),
      art: (
        <>
          {rollersX.map((x) => (
            <g key={x}>
              <circle
                cx={X(x)}
                cy={Y(190)}
                r={150 * EXC_K}
                fill="url(#kd-wheel)"
                stroke="#1d1d1d"
              />
              <line
                x1={X(x)}
                y1={Y(190)}
                x2={X(x) + Math.cos((rollerRot * Math.PI) / 180) * 8}
                y2={Y(190) - Math.sin((rollerRot * Math.PI) / 180) * 8}
                stroke="#111"
                strokeWidth={2}
              />
            </g>
          ))}
        </>
      ),
    },
    {
      id: "carrierRollers",
      layer: "lower",
      hit: carriersX.map((x) => circleMm(x, trackTop - 130, 120)),
      art: (
        <>
          {carriersX.map((x) => (
            <circle
              key={x}
              cx={X(x)}
              cy={Y(trackTop - 130)}
              r={120 * EXC_K}
              fill="url(#kd-wheel)"
              stroke="#1d1d1d"
              strokeDasharray="3 2"
              strokeDashoffset={-rollerRot / 30}
            />
          ))}
        </>
      ),
    },
    {
      id: "swivel",
      layer: "lower",
      xray: true,
      hit: [rectMm(-170, 170, trackTop - 250, deck + 380, 3)],
      art: xr(rectMm(-170, 170, trackTop - 250, deck + 380, 3)),
    },
    {
      id: "swingBearing",
      layer: "lower",
      hit: [rectMm(-1500, 1500, deck - 90, deck + 60, 3)],
      art: (
        <rect
          x={X(1500)}
          y={Y(deck + 60)}
          width={3000 * EXC_K}
          height={150 * EXC_K}
          rx={3}
          fill="url(#kd-steel)"
          stroke="#222"
        />
      ),
    },
    /* ---------- Поворотная платформа ---------- */
    {
      id: "swingDrive",
      layer: "upper",
      xray: true,
      hit: [swDriveL, swDriveR],
      art: (
        <>
          {xr(swDriveL)}
          {xr(swDriveR)}
        </>
      ),
    },
    {
      id: "swingMotors",
      layer: "upper",
      xray: true,
      hit: [swMotL, swMotR],
      art: (
        <>
          {xr(swMotL)}
          {xr(swMotR)}
        </>
      ),
    },
    {
      id: "cooling",
      layer: "upper",
      xray: true,
      hit: [coolBox],
      art: xr(coolBox),
    },
    {
      id: "engine",
      layer: "upper",
      xray: true,
      hit: [engineBox],
      art: xr(engineBox),
    },
    {
      id: "pumps",
      layer: "upper",
      xray: true,
      hit: [pumpBox],
      art: xr(pumpBox),
    },
    {
      id: "hydTank",
      layer: "upper",
      xray: true,
      hit: [tankBox],
      art: xr(tankBox),
    },
    {
      id: "mainValve",
      layer: "upper",
      xray: true,
      hit: [valveBox],
      art: xr(valveBox),
    },
    { id: "alternator", layer: "upper", xray: true, hit: [alt], art: xr(alt) },
    {
      id: "starter",
      layer: "upper",
      xray: true,
      hit: [starter],
      art: xr(starter),
    },
    { id: "batteries", layer: "upper", xray: true, hit: [batt], art: xr(batt) },
    {
      id: "controllers",
      layer: "upper",
      xray: true,
      hit: [ctrl],
      art: xr(ctrl),
    },
    { id: "fuseBox", layer: "upper", xray: true, hit: [fuse], art: xr(fuse) },
    { id: "monitor", layer: "upper", xray: true, hit: [mon], art: xr(mon) },
    {
      id: "wiring",
      layer: "upper",
      xray: true,
      hit: [{ kind: "path", d: wireD, width: 9 }],
      art: (
        <path
          d={wireD}
          fill="none"
          className="xr-wire"
          stroke="var(--c)"
          strokeWidth={2.6}
          strokeDasharray="5 3"
          strokeLinejoin="round"
        />
      ),
    },
    {
      id: "boomCylinders",
      layer: "upper",
      hit: [lineMm(boomCylBase, boomCylRod, 15)],
      art: cylinder(boomCylBase, boomCylRod, 2350, 190 + 60),
    },
    {
      id: "boom",
      layer: "upper",
      hit: [polyMm(boomPoly)],
      art: (
        <>
          <polygon
            points={pts(boomPoly)}
            fill="url(#kd-body)"
            stroke="#5c4400"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <circle
            cx={P(L.F)[0]}
            cy={P(L.F)[1]}
            r={6}
            fill="url(#kd-hub)"
            stroke="#222"
          />
        </>
      ),
    },
    {
      id: "stickCylinder",
      layer: "upper",
      hit: [lineMm(stickCylBase, stickCylRod, 15)],
      art: cylinder(stickCylBase, stickCylRod, 2700, 210 + 60),
    },
    {
      id: "stick",
      layer: "upper",
      hit: [polyMm(stickPoly)],
      art: (
        <>
          <polygon
            points={pts(stickPoly)}
            fill="url(#kd-body)"
            stroke="#5c4400"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <circle
            cx={P(L.T)[0]}
            cy={P(L.T)[1]}
            r={5}
            fill="url(#kd-hub)"
            stroke="#222"
          />
        </>
      ),
    },
    {
      id: "bucketCylinder",
      layer: "upper",
      hit: [lineMm(bucketCylBase, joint, 13)],
      art: (
        <>
          {cylinder(bucketCylBase, joint, 1750, 190 + 60)}
          <polyline
            points={pts([linkTop, joint, ear])}
            fill="none"
            stroke="#4a4a4a"
            strokeWidth={5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </>
      ),
    },
    {
      id: "bucket",
      layer: "upper",
      hit: [polyMm(bucketPoly)],
      art: (
        <>
          <polygon
            points={pts(bucketPoly)}
            fill="url(#kd-body)"
            stroke="#5c4400"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          {teeth.map((t, k) => (
            <polygon
              key={k}
              points={pts(t)}
              fill="#555"
              stroke="#222"
              strokeWidth={0.8}
            />
          ))}
          <circle
            cx={P(L.S)[0]}
            cy={P(L.S)[1]}
            r={4.5}
            fill="url(#kd-hub)"
            stroke="#222"
          />
        </>
      ),
    },
    {
      id: "lights",
      layer: "upper",
      hit: [
        circleMm(boomLight[0], boomLight[1], 170),
        circleMm(cabLight[0], cabLight[1], 170),
      ],
      art: (
        <>
          <rect
            x={P(boomLight)[0] - 6}
            y={P(boomLight)[1] - 4}
            width={12}
            height={8}
            rx={2}
            fill="url(#kd-lens)"
            stroke="#222"
          />
          <rect
            x={P(cabLight)[0] - 6}
            y={P(cabLight)[1] - 4}
            width={12}
            height={8}
            rx={2}
            fill="url(#kd-lens)"
            stroke="#222"
          />
        </>
      ),
    },
  ];
  return nodes;
}

/** Неподвижный рисунок поворотной платформы (не узлы): настил, капот, противовес, кабина */
function UpperBody({ m, flip = false }: { m: ExcavatorModel; flip?: boolean }) {
  const d = m.dims;
  const deck = d.upperClearance;
  const deckTop = deck + 450;
  const tail = -d.tailSwingRadius;
  const cab0 = 200;
  const cab1 = d.cabFrontX;
  return (
    <g className="exc-upper-body" aria-hidden="true">
      {/* Настил платформы */}
      <polygon
        points={pts([
          [cab1 + 150, deck],
          [tail + 900, deck],
          [tail + 900, deckTop],
          [cab1 + 150, deckTop],
        ])}
        fill="url(#kd-dark)"
        stroke="#1d1d1d"
      />
      {/* Капот двигательного отсека */}
      <polygon
        points={pts([
          [cab0 - 20, deckTop],
          [cab0 - 20, d.hoodHeight - 250],
          [-700, d.hoodHeight],
          [-2950, d.hoodHeight],
          [-2950, deckTop],
        ])}
        fill="url(#kd-body)"
        stroke="#5c4400"
        strokeWidth={1.4}
      />
      {/* Противовес (на рисунке не кликается) — масса 10 200 / 10 960 кг, HEHH4376-02, с. 20 */}
      <path
        d={`M ${X(-2900)} ${Y(deck - 30)} L ${X(tail + 300)} ${Y(deck - 30)} Q ${X(tail)} ${Y(deck - 30)} ${X(tail)} ${Y(deck + 400)} L ${X(tail)} ${Y(d.hoodHeight - 300)} Q ${X(tail)} ${Y(d.hoodHeight + 60)} ${X(tail + 450)} ${Y(d.hoodHeight + 60)} L ${X(-2900)} ${Y(d.hoodHeight + 60)} Z`}
        fill="url(#kd-body)"
        stroke="#5c4400"
        strokeWidth={1.4}
      />
      <text
        className="exc-cw"
        x={X(tail + 520)}
        y={Y(deck + 650)}
        textAnchor="middle"
        transform={
          flip ? `translate(${2 * X(tail + 520)} 0) scale(-1 1)` : undefined
        }
      >
        CAT
      </text>
      {/* Выхлоп */}
      <rect
        x={X(-1600)}
        y={Y(d.hoodHeight + 420)}
        width={110 * EXC_K}
        height={420 * EXC_K}
        fill="url(#kd-pipe)"
        stroke="#222"
      />
      {/* Поручни */}
      <line
        x1={X(-2900)}
        y1={Y(d.hoodHeight + 320)}
        x2={X(-800)}
        y2={Y(d.hoodHeight + 320)}
        stroke="#e8b000"
        strokeWidth={2}
      />
    </g>
  );
}

/** Кабина — слева по ходу, ближе к зрителю, чем стрела (вид с левого борта); не кликается */
function Cab({ m }: { m: ExcavatorModel }) {
  const d = m.dims;
  const deckTop = d.upperClearance + 450;
  const cab0 = 200;
  const cab1 = d.cabFrontX;
  return (
    <g className="exc-cab" aria-hidden="true">
      {/* Кабина */}
      <path
        d={`M ${X(cab1)} ${Y(deckTop)} L ${X(cab1)} ${Y(d.cabHeight - 450)} L ${X(cab1 - 260)} ${Y(d.cabHeight)} L ${X(cab0)} ${Y(d.cabHeight)} L ${X(cab0)} ${Y(deckTop)} Z`}
        fill="url(#kd-body)"
        stroke="#5c4400"
        strokeWidth={1.4}
      />
      <path
        d={`M ${X(cab1 - 120)} ${Y(deckTop + 450)} L ${X(cab1 - 120)} ${Y(d.cabHeight - 480)} L ${X(cab1 - 330)} ${Y(d.cabHeight - 120)} L ${X(cab0 + 160)} ${Y(d.cabHeight - 120)} L ${X(cab0 + 160)} ${Y(deckTop + 450)} Z`}
        fill="url(#kd-glass)"
        stroke="#333"
      />
    </g>
  );
}

function Hit({ s }: { s: Shape }) {
  switch (s.kind) {
    case "rect":
      return (
        <rect
          className="node__hit"
          x={s.x}
          y={s.y}
          width={s.w}
          height={s.h}
          rx={s.rx ?? 0}
        />
      );
    case "circle":
      return <circle className="node__hit" cx={s.cx} cy={s.cy} r={s.r} />;
    case "line":
      return (
        <line
          className="node__hit node__hit--stroke"
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          style={{ strokeWidth: s.width }}
          strokeLinecap="round"
        />
      );
    case "polygon":
      return <polygon className="node__hit" points={s.points} />;
    case "path":
      return s.width ? (
        <path
          className="node__hit node__hit--stroke"
          d={s.d}
          style={{ strokeWidth: s.width }}
          fill="none"
          strokeLinejoin="round"
        />
      ) : (
        <path className="node__hit" d={s.d} />
      );
  }
}

function area(shapes: Shape[]): number {
  let a = 0;
  for (const s of shapes) {
    if (s.kind === "rect") a += s.w * s.h;
    else if (s.kind === "circle") a += Math.PI * s.r * s.r;
    else if (s.kind === "line")
      a += Math.hypot(s.x2 - s.x1, s.y2 - s.y1) * s.width;
    else if (s.kind === "polygon") {
      const p = s.points
        .trim()
        .split(/[\s,]+/)
        .map(Number);
      let sum = 0;
      for (let i = 0; i < p.length; i += 2) {
        const j = (i + 2) % p.length;
        sum += p[i] * p[j + 1] - p[j] * p[i + 1];
      }
      a += Math.abs(sum) / 2;
    } else a += s.width ? 30000 : 20000; // обвод гусеницы и жгут — снизу
  }
  return a;
}

const fmtM = (mm: number) => (mm / 1000).toFixed(2).replace(".", ",");

interface Props {
  model: ExcavatorModel;
  selectedId: AnyNodeId | null;
  activeSystem: SystemId | null;
  onSelect: (id: AnyNodeId) => void;
  anim?: ExcFrame | null;
}

export function ExcavatorSchema({
  model,
  selectedId,
  activeSystem,
  onSelect,
  anim = null,
}: Props) {
  const pose = anim?.pose ?? EXC_REST;
  const travel = anim?.travel ?? 0;
  const nodes = useMemo(
    () => buildNodes(model, pose, travel),
    [model, pose.boom, pose.stick, pose.bucket, travel],
  ); // eslint-disable-line react-hooks/exhaustive-deps
  const [hoverId, setHoverId] = useState<AnyNodeId | null>(null);
  const highlight = new Set(anim?.highlight ?? []);
  const d = model.dims;
  const c = Math.cos((pose.swing * Math.PI) / 180);
  /** Камера следует за поворотом: при развороте платформы рабочее оборудование уходит вправо, сцена сдвигается влево */
  const pan = (-470 * (1 - c)) / 2;
  const panTf =
    Math.abs(pan) < 0.01 ? undefined : `translate(${pan.toFixed(1)} 0)`;
  const upperTf =
    Math.abs(c - 1) < 1e-6
      ? undefined
      : `translate(${SC} 0) scale(${c.toFixed(4)} 1) translate(${-SC} 0)`;

  const cls = (n: ExcNode) => {
    const info = model.nodes[n.id]!;
    const dimmed = activeSystem !== null && activeSystem !== info.system;
    return [
      "node",
      `node--${info.system}`,
      `node--${n.id}`,
      n.xray && "node--xray",
      n.id === selectedId && "is-selected",
      n.id === hoverId && "is-hovered",
      dimmed && "is-dimmed",
      highlight.has(n.id) && "is-anim",
    ]
      .filter(Boolean)
      .join(" ");
  };
  const onKey = (e: KeyboardEvent<SVGGElement>, id: AnyNodeId) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(id);
    }
  };
  const art = (layer: ExcNode["layer"]) =>
    nodes
      .filter((n) => n.layer === layer && model.nodes[n.id])
      .map((n) => (
        <g
          key={n.id}
          className={`${cls(n)} node--art`}
          data-node-art={n.id}
          style={{
            ["--c" as string]: SYSTEMS[model.nodes[n.id]!.system].color,
          }}
          aria-hidden="true"
        >
          <g className="node__art">{n.art}</g>
        </g>
      ));
  const hits = (layer: ExcNode["layer"]) =>
    nodes
      .filter((n) => n.layer === layer && model.nodes[n.id])
      .sort((a, b) => area(b.hit) - area(a.hit))
      .map((n) => {
        const info = model.nodes[n.id]!;
        const dimmed = activeSystem !== null && activeSystem !== info.system;
        return (
          <g
            key={n.id}
            className={`${cls(n)} node--hitlayer`}
            data-node={n.id}
            style={{ ["--c" as string]: SYSTEMS[info.system].color }}
            role="button"
            tabIndex={dimmed ? -1 : 0}
            aria-label={`${info.title} — система «${SYSTEMS[info.system].name}». Открыть карточку узла`}
            aria-pressed={n.id === selectedId}
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
            {n.hit.map((s, k) => (
              <Hit key={k} s={s} />
            ))}
          </g>
        );
      });
  const shown = hoverId ?? selectedId;
  const shownInfo = shown ? model.nodes[shown] : undefined;
  const shift = travel * EXC_K;

  return (
    <figure className="schema schema--excavator">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="group"
        aria-label={`Схема экскаватора ${model.fullName}, вид сбоку`}
        className="schema__svg"
      >
        <SchemaDefs />
        <rect x={0} y={0} width={W} height={H} fill="url(#kd-sky)" />
        <rect x={0} y={GY} width={W} height={H - GY} fill="url(#kd-ground)" />
        <line x1={0} y1={GY} x2={W} y2={GY} stroke="#8d7b62" strokeWidth={2} />
        <line
          x1={0}
          y1={GY + 7}
          x2={W}
          y2={GY + 7}
          stroke="#5f513f"
          strokeWidth={3}
          strokeDasharray="3 37 6 54"
          strokeDashoffset={-shift}
          opacity={0.6}
        />
        <line
          x1={0}
          y1={GY + 19}
          x2={W}
          y2={GY + 19}
          stroke="#6e5e48"
          strokeWidth={2}
          strokeDasharray="2 61 4 29"
          strokeDashoffset={-shift}
          opacity={0.5}
        />
        <g transform={panTf}>
          {/* Ось поворота */}
          <line
            x1={SC}
            y1={Y(d.upperClearance + 900)}
            x2={SC}
            y2={GY + 4}
            stroke="#495057"
            strokeWidth={1}
            strokeDasharray="6 4"
            opacity={0.5}
          />

          <g className="machine">
            {art("lower")}
            <g className="exc-upper" transform={upperTf}>
              <UpperBody m={model} flip={c < 0} />
              {art("upper")}
              <Cab m={model} />
            </g>
            {hits("lower")}
            <g className="exc-upper" transform={upperTf}>
              {hits("upper")}
            </g>
          </g>
        </g>

        {/* Масштабная линейка «1 м» — масштаб экскаватора (свой, см. подпись) */}
        <g
          className="scalebar"
          aria-hidden="true"
          transform={`translate(14 ${GY + 30})`}
        >
          <rect
            x={-4}
            y={-12}
            width={EXC_K * 1000 + 64}
            height={22}
            rx={4}
            fill="#ffffffcc"
          />
          <rect x={0} y={-3} width={EXC_K * 500} height={5} fill="#212529" />
          <rect
            x={EXC_K * 500}
            y={-3}
            width={EXC_K * 500}
            height={5}
            fill="#fff"
            stroke="#212529"
          />
          <text x={EXC_K * 1000 + 6} y={3}>
            1 м
          </text>
        </g>
        {/* Размерные линии по паспорту (HEHH4376-02, с. 18) */}
        {!upperTf && (
          <g className="exc-dims" aria-hidden="true">
            <line
              x1={X(d.trackLength / 2)}
              y1={GY + 52}
              x2={X(-d.trackLength / 2)}
              y2={GY + 52}
            />
            <text x={X(0)} y={GY + 66} textAnchor="middle">
              длина гусеницы {fmtM(d.trackLength)} м
            </text>
            <line
              x1={X(-d.tailSwingRadius)}
              y1={GY + 86}
              x2={X(0)}
              y2={GY + 86}
            />
            <text
              x={X(-d.tailSwingRadius / 2)}
              y={GY + 100}
              textAnchor="middle"
            >
              радиус хвоста {fmtM(d.tailSwingRadius)} м
            </text>
            <line x1={W - 14} y1={GY} x2={W - 14} y2={Y(d.cabHeight)} />
            <line
              x1={X(d.cabFrontX)}
              y1={Y(d.cabHeight)}
              x2={W - 14}
              y2={Y(d.cabHeight)}
              strokeDasharray="3 4"
              opacity={0.6}
            />
            <text x={W - 20} y={Y(d.cabHeight) - 6} textAnchor="end">
              по кабине {fmtM(d.cabHeight)} м
            </text>
          </g>
        )}
        {shownInfo && (
          <g
            className="exc-tag"
            aria-hidden="true"
            transform="translate(14 14)"
          >
            <rect
              x={0}
              y={0}
              width={shownInfo.title.length * 7.4 + 30}
              height={24}
              rx={12}
              style={{ ["--c" as string]: SYSTEMS[shownInfo.system].color }}
            />
            <circle
              cx={13}
              cy={12}
              r={5}
              fill={SYSTEMS[shownInfo.system].color}
            />
            <text x={24} y={16}>
              {shownInfo.title}
            </text>
          </g>
        )}
      </svg>
      <figcaption className="schema__caption">
        <strong>{model.fullName}</strong> · вид сбоку, в масштабе (1 м ={" "}
        {Math.round(EXC_K * 1000)} px; масштаб экскаватора свой — машина длиннее
        бульдозеров) · по HEHH4376-02, с. 18–19: транспортная длина{" "}
        {fmtM(d.shippingLength)} м, высота по кабине {fmtM(d.cabHeight)} м,
        радиус поворота хвоста {fmtM(d.tailSwingRadius)} м, длина гусеницы{" "}
        {fmtM(d.trackLength)} м, база {fmtM(d.rollerCenters)} м, стрела{" "}
        {fmtM(d.boomLength)} м, рукоять {fmtM(d.stickLength)} м, радиус ковша{" "}
        {fmtM(d.bucketTipRadius)} м. Положение пяты стрелы, высота гусеницы,
        капота и платформы — <em>оценка</em> для рисунка. Внутренние узлы
        показаны «рентгеном»; противовес и кабина не кликаются. Нажмите на узел
        (или Tab, затем Enter / Пробел) — откроется страница каталога SEBP5244.
      </figcaption>
    </figure>
  );
}
