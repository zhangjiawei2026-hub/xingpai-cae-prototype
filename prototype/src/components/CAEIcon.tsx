// Professional CAE icon placeholders. Semantics and source status: docs/icon-manifest.md.
// Shared 32×32 grid, isometric duotone style; colours come from --ci-* tokens.
import type { ReactNode } from "react";
import c from "./CAEIcon.module.css";

export type CAEIconName =
  | "part"
  | "instance"
  | "material"
  | "section"
  | "step"
  | "interaction"
  | "load"
  | "boundary"
  | "nodes"
  | "elements"
  | "mesh"
  | "seed"
  | "elementType"
  | "domain"
  | "task"
  | "fit"
  | "iso"
  // Legacy alias kept for existing call sites.
  | "box";

export type CAEIconBadge =
  | "add"
  | "edit"
  | "manage"
  | "delete"
  | "move"
  | "rotate"
  | "view"
  | "assign";

type P = [number, number];
const pts = (...p: P[]) => p.map(([x, y]) => `${x},${y}`).join(" ");
const mix = (a: P, b: P, t: number): P => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

/** Isometric box: apex (cx, y), half-width w, wall height h. */
function iso(cx: number, y: number, w: number, h: number) {
  const d = w / 2;
  const top: P = [cx, y],
    r: P = [cx + w, y + d],
    f: P = [cx, y + w],
    l: P = [cx - w, y + d];
  const rb: P = [r[0], r[1] + h],
    fb: P = [f[0], f[1] + h],
    lb: P = [l[0], l[1] + h];
  return { top, r, f, l, rb, fb, lb };
}

function Box({
  cx = 16,
  y = 4,
  w = 11,
  h = 12,
  tone = "geo",
  ghost = false,
}: {
  cx?: number;
  y?: number;
  w?: number;
  h?: number;
  tone?: "geo" | "acc" | "pale";
  ghost?: boolean;
}) {
  const v = iso(cx, y, w, h);
  if (ghost)
    return (
      <polygon
        className={c.dash}
        points={pts(v.top, v.r, v.rb, v.fb, v.lb, v.l)}
      />
    );
  return (
    <g className={c[tone]}>
      <polygon className={c.f1} points={pts(v.top, v.r, v.f, v.l)} />
      <polygon className={c.f2} points={pts(v.l, v.f, v.fb, v.lb)} />
      <polygon className={c.f3} points={pts(v.f, v.r, v.rb, v.fb)} />
    </g>
  );
}

/** Grid lines across the three visible faces of an iso box. */
function boxGrid(cx: number, y: number, w: number, h: number, n: number) {
  const v = iso(cx, y, w, h);
  const seg = (a: P, b: P) => `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;
  const d: string[] = [];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    d.push(seg(mix(v.l, v.f, t), mix(v.top, v.r, t)));
    d.push(seg(mix(v.l, v.top, t), mix(v.f, v.r, t)));
    d.push(seg(mix(v.l, v.f, t), mix(v.lb, v.fb, t)));
    d.push(seg(mix(v.l, v.lb, t), mix(v.f, v.fb, t)));
    d.push(seg(mix(v.f, v.r, t), mix(v.fb, v.rb, t)));
    d.push(seg(mix(v.f, v.fb, t), mix(v.r, v.rb, t)));
  }
  return d.join("");
}

const Dot = ({ at, r = 2.4 }: { at: P; r?: number }) => (
  <circle className={c.node} cx={at[0]} cy={at[1]} r={r} />
);

function glyph(name: CAEIconName, fine: boolean): ReactNode {
  switch (name) {
    case "part":
    case "box":
      return <Box />;
    case "instance":
      return (
        <>
          <Box cx={19} y={3} w={9} h={9} ghost />
          <Box cx={13} y={10} w={9} h={10} />
        </>
      );
    case "material":
      return (
        <>
          <circle className={c.matFill} cx="16" cy="16" r="12" />
          <path
            className={c.matShade}
            d="M27.6 13.2A12 12 0 0 1 8 25.1c6.6 1.3 15.8-3.2 19.6-11.9Z"
          />
          {fine && (
            <ellipse className={c.thin} cx="16" cy="16" rx="12" ry="4.2" />
          )}
          <circle className={c.matOutline} cx="16" cy="16" r="12" />
          <ellipse className={c.shine} cx="11.5" cy="10.5" rx="3.4" ry="2.2" />
        </>
      );
    case "section": {
      const profile = "M0 0h17v4.5h-6v9h6V18H0v-4.5h6v-9H0Z";
      return (
        <>
          <path className={c.matBack} d={profile} transform="translate(10 4)" />
          {fine && (
            <path
              className={c.thin}
              d="M5 8l5-4M22 8l5-4M22 26l5-4M5 26l5-4"
            />
          )}
          <path className={c.matFront} d={profile} transform="translate(5 8)" />
        </>
      );
    }
    case "step":
      return (
        <>
          <path className={c.anaSoft} d="M4 28V23h7v-6h7v-6h7v17Z" />
          <path className={c.axis} d="M3 28h26" />
          <path className={c.anaLine} d="M4 23h7v-6h7v-6h7" />
          <path
            className={c.anaArrow}
            d="M25 11h3.5m-2.5-2.6 2.6 2.6-2.6 2.6"
          />
          <circle className={c.anaDot} cx="11" cy="17" r="2.2" />
          <circle className={c.anaDot} cx="18" cy="11" r="2.2" />
        </>
      );
    case "interaction":
      return (
        <>
          <Box cx={16} y={13} w={12} h={5} tone="pale" />
          <polygon
            className={c.contact}
            points={pts([16, 14.5], [25, 19], [16, 23.5], [7, 19])}
          />
          <Box cx={16} y={4.5} w={7} h={7.5} />
        </>
      );
    case "load":
      return (
        <>
          <Box cx={16} y={16} w={11} h={4} tone="pale" />
          <path className={c.force} d="M7.5 4h17" />
          {[8.5, 16, 23.5].map((x) => (
            <path
              key={x}
              className={c.force}
              d={`M${x} 4v15m-3-3.4 3 3.4 3-3.4`}
            />
          ))}
        </>
      );
    case "boundary":
      return (
        <>
          <Box cx={16} y={2.5} w={8} h={7.5} />
          <path className={c.support} d="M16 18.5 10.5 25h11Z" />
          <path className={c.axis} d="M7 25.5h18" />
          {fine && (
            <path
              className={c.thin}
              d="M9.5 25.5 7.5 29M13.5 25.5l-2 3.5M17.5 25.5l-2 3.5M21.5 25.5l-2 3.5M25 25.5 23 29"
            />
          )}
        </>
      );
    case "nodes": {
      const v = iso(16, 4, 11, 12);
      return (
        <>
          <Box tone="pale" />
          {[v.top, v.r, v.l, v.f, v.lb, v.fb, v.rb].map((p) => (
            <Dot key={p.join()} at={p} r={fine ? 2.5 : 3} />
          ))}
        </>
      );
    }
    case "elements":
      return (
        <>
          <Box cx={11} y={4} w={7} h={7} tone="pale" />
          <Box cx={21} y={9} w={7} h={7} tone="pale" />
          <Box cx={14} y={14} w={7} h={7} tone="acc" />
        </>
      );
    case "mesh":
      return (
        <>
          <Box />
          <path className={c.grid} d={boxGrid(16, 4, 11, 12, fine ? 3 : 2)} />
        </>
      );
    case "seed": {
      const v = iso(16, 4, 11, 12);
      const seeds = [0.2, 0.4, 0.6, 0.8].flatMap((t) => [
        mix(v.lb, v.fb, t),
        mix(v.fb, v.rb, t),
      ]);
      return (
        <>
          <Box tone="pale" />
          <path
            className={c.seedEdge}
            d={`M${v.lb.join(" ")}L${v.fb.join(" ")}L${v.rb.join(" ")}`}
          />
          {seeds.map((p) => (
            <Dot key={p.join()} at={p} r={fine ? 1.6 : 1.9} />
          ))}
        </>
      );
    }
    case "elementType":
      return (
        <>
          <polygon
            className={c.tetA}
            points={pts([16, 3], [4, 24], [19, 29])}
          />
          <polygon
            className={c.tetB}
            points={pts([16, 3], [19, 29], [28, 20])}
          />
          {fine && <path className={c.hidden} d="M4 24 28 20" />}
          {(
            [
              [16, 3],
              [4, 24],
              [19, 29],
              [28, 20],
            ] as P[]
          ).map((p) => (
            <Dot key={p.join()} at={p} r={fine ? 2.2 : 2.6} />
          ))}
        </>
      );
    case "domain":
      return (
        <>
          <Box ghost />
          {fine && (
            <path className={c.dashThin} d="M5 9.5 16 15l11-5.5M16 15v12" />
          )}
          <Box cx={16} y={10} w={6} h={7} tone="acc" />
        </>
      );
    case "task":
      return (
        <>
          <path className={c.anaSoft} d="M7 7c3 10 7 14 21 15.5V27H7Z" />
          <path className={c.axis} d="M5 4v23h23" />
          {fine && <path className={c.dashThin} d="M5 22.5h23" />}
          <path className={c.anaLine} d="M7 7c3 10 7 14 21 15.5" />
          <circle className={c.target} cx="27" cy="22.4" r="2.6" />
        </>
      );
    case "fit":
      return (
        <>
          <path
            className={c.axis}
            d="M4 10V4h6M22 4h6v6M28 22v6h-6M10 28H4v-6"
          />
          <Box cx={16} y={8.5} w={7} h={7.5} />
        </>
      );
    case "iso":
      return (
        <>
          <Box cx={19} y={3} w={9} h={9} />
          <path className={c.axY} d="M6 27V17.5m-2.2 2.4L6 17.5l2.2 2.4" />
          <path className={c.axX} d="M6 27h9.5m-2.4-2.2 2.4 2.2-2.4 2.2" />
          <path className={c.axZ} d="m6 27-3.2 3.2" />
          <circle className={c.origin} cx="6" cy="27" r="1.4" />
        </>
      );
  }
}

const badgeGlyph: Record<CAEIconBadge, string> = {
  add: "M25 21.6v6.8M21.6 25h6.8",
  edit: "m22.2 27.8.7-2.7 4.1-4.1 2 2-4.1 4.1Z",
  manage: "M21.8 22.6h6.4M21.8 25h6.4M21.8 27.4h6.4",
  delete: "m22.4 22.4 5.2 5.2m0-5.2-5.2 5.2",
  move: "M25 21.2v7.6M21.2 25h7.6M23.7 22.5 25 21.2l1.3 1.3M23.7 27.5l1.3 1.3 1.3-1.3",
  rotate: "M28.3 25a3.3 3.3 0 1 1-1-2.4m.4-1.8v2.2h-2.2",
  view: "M21.2 25c2.2-3.4 5.4-3.4 7.6 0-2.2 3.4-5.4 3.4-7.6 0Zm3.8-.9v1.8",
  assign: "M21.4 25h6.4M25.4 22.4 28 25l-2.6 2.6",
};

export function CAEIcon({
  name,
  size = 24,
  badge,
}: {
  name: CAEIconName;
  size?: number;
  badge?: CAEIconBadge;
}) {
  // Optical sizing: strokes stay crisp in screen pixels; fine detail drops below 20px.
  const fine = size >= 20;
  const stroke = size >= 24 ? 1.35 : size >= 16 ? 1.15 : 1;
  return (
    <svg
      className={c.icon}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-icon={name}
    >
      {glyph(name, fine)}
      {badge && (
        <g>
          <circle
            className={`${c.badge} ${badge === "delete" ? c.badgeDanger : ""}`}
            cx="25"
            cy="25"
            r="7"
          />
          <path className={c.badgeGlyph} d={badgeGlyph[badge]} />
        </g>
      )}
    </svg>
  );
}
