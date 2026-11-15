// Professional CAE icon placeholders. Semantics and source status: docs/icon-manifest.md.
// Shared 32×32 grid, isometric duotone style; colours come from --ci-* tokens.
// Finish (prototype design decision): one light from the upper left, face gradients,
// tonal outlines, a bevel highlight and a soft ground shadow above 20px.
import { useId, type CSSProperties, type ReactNode } from "react";
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
  | "treePanel"
  | "logPanel"
  | "viewIso"
  | "viewTop"
  | "viewFront"
  | "viewRight"
  | "zoomIn"
  | "zoomOut"
  | "wireframe"
  | "resultLinear"
  | "resultHarmonic"
  | "resultContour"
  | "resultDeform"
  | "resultCut"
  | "resultLegend"
  | "resultPrev"
  | "resultPlay"
  | "resultPause"
  | "resultNext"
  | "resultStop"
  | "resultProbe"
  | "resultClear"
  | "resultMax"
  | "resultMin"
  | "resultExport"
  | "resultReport"
  | "resultFormula"
  | "resultSide"
  | "resultThree"
  | "resultFour"
  | "resultSingle"
  // Legacy alias kept for existing call sites.
  | "box";

export type CAEIconBadge =
  "add" | "edit" | "manage" | "delete" | "move" | "rotate" | "view" | "assign";

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
      <path className={c.edge} d={`M${v.f.join(" ")}L${v.fb.join(" ")}`} />
      <polyline
        className={c.bevel}
        points={pts(
          ...[v.l, v.f, v.r].map((p) => mix(p, [cx, y + w / 2], 0.16)),
        )}
      />
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

type CubeFace = "top" | "front" | "right";
/** View-orientation cube: the viewed face(s) are lit blue, the rest stay pale. */
function ViewCube({ lit }: { lit: CubeFace[] }) {
  const v = iso(16, 4.5, 11, 12);
  const faces: [CubeFace, "f1" | "f2" | "f3", P[]][] = [
    ["top", "f1", [v.top, v.r, v.f, v.l]],
    ["front", "f2", [v.l, v.f, v.fb, v.lb]],
    ["right", "f3", [v.f, v.r, v.rb, v.fb]],
  ];
  return (
    <>
      {faces.map(([k, f, p]) => (
        <g key={k} className={lit.includes(k) ? c.geo : c.pale}>
          <polygon
            className={`${c[f]} ${c.vface} ${lit.length === 1 && lit[0] === k ? c.vlit : ""}`}
            points={pts(...p)}
          />
        </g>
      ))}
      <path
        className={c.cubeEdge}
        d={`M${v.top}L${v.r}L${v.rb}L${v.fb}L${v.lb}L${v.l}ZM${v.l}L${v.f}L${v.r}M${v.f}L${v.fb}`}
      />
    </>
  );
}

function glyph(
  name: CAEIconName,
  fine: boolean,
  hiddenNodes: number[] = [],
): ReactNode {
  switch (name) {
    case "resultContour": {
      const v = iso(16, 4, 11, 12);
      return (
        <>
          <Box />
          <polygon
            className={c.contourWarm}
            points={pts(v.top, v.r, v.f, v.l)}
          />
          <polygon
            className={c.contourMid}
            points={pts(v.l, v.f, v.fb, v.lb)}
          />
          <polygon
            className={c.contourCool}
            points={pts(v.f, v.r, v.rb, v.fb)}
          />
          <path className={c.grid} d={boxGrid(16, 4, 11, 12, fine ? 3 : 2)} />
        </>
      );
    }
    case "resultDeform":
      return (
        <>
          <Box cx={16} y={7} w={11} h={11} ghost />
          <g className={c.geo}>
            <path className={c.f1} d="M5 12 14 4 27 8 17 16Z" />
            <path className={c.f2} d="M5 12 17 16 15 27 5 23Z" />
            <path className={c.f3} d="M17 16 27 8 26 19 15 27Z" />
          </g>
          <path className={c.bevel} d="m6 12 11 3 8-6" />
        </>
      );
    case "resultCut":
      return (
        <>
          <Box y={6} tone="pale" />
          <path className={c.cutPlane} d="M11 8 23 2v21l-12 7Z" />
          <path className={c.cutTrace} d="m8 21 16-8" />
          <path className={c.bevel} d="m12.5 9 9-5" />
        </>
      );
    case "resultLinear":
    case "resultHarmonic":
      return (
        <>
          <rect
            className={c.resultTile}
            x="3.5"
            y="5"
            width="25"
            height="22"
            rx="2"
          />
          <path className={c.thin} d="M8 9v13h17" />
          {name === "resultLinear" ? (
            <path className={c.anaLine} d="m9 20 14-10" />
          ) : (
            <path
              className={c.anaLine}
              d="M8 16c3.2-7.5 5.1-7.5 8 0s4.7 7.5 8 0"
            />
          )}
          <Dot at={name === "resultLinear" ? [23, 10] : [16, 16]} r={2.5} />
        </>
      );
    case "resultLegend":
      return (
        <>
          <rect
            className={c.resultTile}
            x="5"
            y="4"
            width="22"
            height="24"
            rx="2"
          />
          <path className={c.contourWarm} d="M9 8h7v5H9z" />
          <path className={c.contourMid} d="M9 13h7v6H9z" />
          <path className={c.contourCool} d="M9 19h7v5H9z" />
          <path className={c.axis} d="M19 9h4m-4 7h3m-3 7h4" />
        </>
      );
    case "resultPlay":
    case "resultPrev":
    case "resultNext": {
      const reverse = name === "resultPrev";
      return (
        <>
          <rect
            className={c.resultTile}
            x="3.5"
            y="5"
            width="25"
            height="22"
            rx="3"
          />
          <path
            className={c.playbackFill}
            d={
              reverse
                ? "M21 10 12 16l9 6Z"
                : name === "resultNext"
                  ? "m11 10 9 6-9 6Z"
                  : "m11 9 12 7-12 7Z"
            }
          />
          {name !== "resultPlay" && (
            <path className={c.axis} d={reverse ? "M9 10v12" : "M23 10v12"} />
          )}
        </>
      );
    }
    case "resultPause":
    case "resultStop":
      return (
        <>
          <rect
            className={c.resultTile}
            x="3.5"
            y="5"
            width="25"
            height="22"
            rx="3"
          />
          {name === "resultPause" ? (
            <>
              <rect
                className={c.playbackFill}
                x="10"
                y="10"
                width="4"
                height="12"
                rx="1"
              />
              <rect
                className={c.playbackFill}
                x="18"
                y="10"
                width="4"
                height="12"
                rx="1"
              />
            </>
          ) : (
            <rect
              className={c.playbackFill}
              x="10"
              y="10"
              width="12"
              height="12"
              rx="1"
            />
          )}
        </>
      );
    case "resultProbe":
    case "resultClear":
      return (
        <>
          <Box cx={13.5} y={9} w={9} h={9} tone="pale" />
          <path className={c.probePin} d="m25 5-8 11" />
          <circle className={c.playbackFill} cx="25" cy="6" r="3.5" />
          <Dot at={[16.5, 17]} r={3} />
          {name === "resultClear" && (
            <>
              <circle
                className={c.badgeDanger + " " + c.badge}
                cx="24.5"
                cy="24.5"
                r="5.5"
              />
              <path className={c.badgeGlyph} d="m22.5 22.5 4 4m0-4-4 4" />
            </>
          )}
        </>
      );
    case "resultMax":
    case "resultMin":
      return (
        <>
          <rect
            className={c.resultTile}
            x="3.5"
            y="5"
            width="25"
            height="22"
            rx="2"
          />
          <path className={c.axis} d="M8 9v13h17" />
          <path
            className={c.anaLine}
            d={name === "resultMax" ? "m9 18 5-4 4 3 7-7" : "m9 11 5 4 4-3 7 8"}
          />
          <Dot at={name === "resultMax" ? [25, 10] : [25, 20]} r={2.6} />
        </>
      );
    case "resultExport":
    case "resultReport":
    case "resultFormula":
      return (
        <>
          <path className={c.documentBack} d="M10 3h13l6 6v17H10Z" />
          <path className={c.resultTile} d="M5 6h13l6 6v16H5Z" />
          <path className={c.documentFold} d="M18 6v6h6" />
          {name === "resultExport" && (
            <path
              className={c.exportArrow}
              d="M10 23h10l-3 3m3-3-3-3M10 14v9"
            />
          )}
          {name === "resultReport" && (
            <>
              <path className={c.axis} d="M9 15h10m-10 3h10" />
              <path className={c.anaLine} d="M10 24v-2m4 2v-3m4 3v-4" />
            </>
          )}
          {name === "resultFormula" && (
            <text x="8" y="23.5" className={c.formulaMark}>
              ƒ(x)
            </text>
          )}
        </>
      );
    case "resultSide":
    case "resultThree":
    case "resultFour":
    case "resultSingle": {
      const sections = {
        resultSide: [
          [6, 8, 9, 16],
          [17, 8, 9, 16],
        ],
        resultThree: [
          [6, 8, 9, 7],
          [17, 8, 9, 7],
          [6, 17, 20, 7],
        ],
        resultFour: [
          [6, 8, 9, 7],
          [17, 8, 9, 7],
          [6, 17, 9, 7],
          [17, 17, 9, 7],
        ],
        resultSingle: [[6, 8, 20, 16]],
      }[name];
      return (
        <>
          <rect
            className={c.documentBack}
            x="5"
            y="4"
            width="25"
            height="21"
            rx="2"
          />
          <rect
            className={c.resultTile}
            x="3"
            y="6"
            width="26"
            height="21"
            rx="2"
          />
          {sections.map(([x, y, width, height]) => (
            <rect
              className={c.playbackFill}
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={width}
              height={height}
              rx=".7"
            />
          ))}
        </>
      );
    }
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
            <path className={c.thin} d="M5 8l5-4M22 8l5-4M22 26l5-4M5 26l5-4" />
          )}
          <path className={c.matFront} d={profile} transform="translate(5 8)" />
        </>
      );
    }
    case "step":
      // Three load steps of increasing intensity on a shared time axis.
      return (
        <>
          <rect
            className={c.stepA}
            x="4.5"
            y="18"
            width="6"
            height="9"
            rx="1.6"
          />
          <rect
            className={c.stepB}
            x="13"
            y="12"
            width="6"
            height="15"
            rx="1.6"
          />
          <rect
            className={c.stepC}
            x="21.5"
            y="5"
            width="6"
            height="22"
            rx="1.6"
          />
          <path className={c.axis} d="M2.5 27.5h27" />
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
          {[v.top, v.r, v.l, v.f, v.lb, v.fb, v.rb].map((p, i) =>
            hiddenNodes.includes(i) ? null : (
              <Dot key={p.join()} at={p} r={fine ? 2.5 : 3} />
            ),
          )}
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
    // Panel toggles: the governed pane is the lit, filled region; white marks name its content.
    case "treePanel":
      return (
        <>
          <rect
            className={c.pnlBody}
            x="2.5"
            y="4.5"
            width="27"
            height="23"
            rx="3"
          />
          <path
            className={c.pnlPane}
            d="M2.5 7.5a3 3 0 0 1 3-3H15v23H5.5a3 3 0 0 1-3-3Z"
          />
          <path className={c.pnlDivider} d="M15 4.5v23" />
          <rect
            className={c.pnlFrame}
            x="2.5"
            y="4.5"
            width="27"
            height="23"
            rx="3"
          />
          <path className={c.pnlMark} d="M6 10h5.5M8.5 15.5h3M8.5 21h3" />
        </>
      );
    case "logPanel":
      return (
        <>
          <rect
            className={c.pnlBody}
            x="2.5"
            y="4.5"
            width="27"
            height="23"
            rx="3"
          />
          <path
            className={c.pnlPane}
            d="M2.5 17h27v7.5a3 3 0 0 1-3 3h-21a3 3 0 0 1-3-3Z"
          />
          <path className={c.pnlDivider} d="M2.5 17h27" />
          <rect
            className={c.pnlFrame}
            x="2.5"
            y="4.5"
            width="27"
            height="23"
            rx="3"
          />
          <path className={c.pnlMark} d="m6.5 20 2.3 2.3-2.3 2.3M12 24.6h6" />
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
    case "viewIso":
      return <ViewCube lit={["top", "front", "right"]} />;
    case "viewTop":
      return <ViewCube lit={["top"]} />;
    case "viewFront":
      return <ViewCube lit={["front"]} />;
    case "viewRight":
      return <ViewCube lit={["right"]} />;
    case "zoomIn":
    case "zoomOut":
      return (
        <>
          <path className={c.lensHandle} d="M20.6 20.6 27.5 27.5" />
          <circle className={c.lens} cx="13.5" cy="13.5" r="9.5" />
          <path
            className={c.lensMark}
            d={
              name === "zoomIn" ? "M9.3 13.5h8.4M13.5 9.3v8.4" : "M9.3 13.5h8.4"
            }
          />
        </>
      );
    case "wireframe": {
      // Triangulated faces: one diagonal per visible face over a pale box.
      const v = iso(16, 4.5, 11, 12);
      return (
        <>
          <g className={c.wireBox}>
            <Box y={4.5} tone="pale" />
          </g>
          <path
            className={c.wire}
            d={`M${v.l}L${v.r}M${v.l}L${v.fb}M${v.f}L${v.rb}`}
          />
        </>
      );
    }
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

/** Soft contact shadow [cx, cy, rx] for objects that rest on the ground plane. */
const ground: Partial<Record<CAEIconName, [number, number, number]>> = {
  part: [16, 27.4, 12],
  box: [16, 27.4, 12],
  mesh: [16, 27.4, 12],
  resultContour: [16, 27.4, 12],
  resultDeform: [16, 27.4, 12],
  seed: [16, 27.4, 12],
  nodes: [16, 27.4, 12],
  instance: [13, 29.2, 9.5],
  material: [16, 28.8, 9.5],
};

type Stop = [offset: number, color: string, opacity?: number];
const lin = (id: string, stops: Stop[], x2 = 1, y2 = 1) => (
  <linearGradient key={id} id={id} x1="0" y1="0" x2={x2} y2={y2}>
    {stops.map(([o, col, op = 1]) => (
      <stop key={o} offset={o} style={{ stopColor: col, stopOpacity: op }} />
    ))}
  </linearGradient>
);
const rad = (id: string, stops: Stop[], cx = 0.5, cy = 0.5, r = 0.5) => (
  <radialGradient key={id} id={id} cx={cx} cy={cy} r={r}>
    {stops.map(([o, col, op = 1]) => (
      <stop key={o} offset={o} style={{ stopColor: col, stopOpacity: op }} />
    ))}
  </radialGradient>
);
const shade = (a: string, b: string, pct: number) =>
  `color-mix(in srgb, var(${a}), var(${b}) ${pct}%)`;
const TONES = ["geo", "acc", "pale"] as const;

/** Per-instance gradients; CSS picks them up via --cig-* custom properties. */
function finish(u: string) {
  const defs: ReactNode[] = [];
  const vars: Record<string, string> = {};
  const add = (key: string, el: (id: string) => ReactNode) => {
    const id = `${u}-${key}`;
    defs.push(el(id));
    vars[`--cig-${key}`] = `url(#${id})`;
  };
  for (const t of TONES) {
    add(`${t}-t`, (id) =>
      lin(id, [
        [0, "var(--ci-paper)"],
        [1, shade(`--ci-${t}-1`, `--ci-${t}-2`, 30)],
      ]),
    );
    add(`${t}-l`, (id) =>
      lin(
        id,
        [
          [0, `var(--ci-${t}-2)`],
          [1, shade(`--ci-${t}-2`, `--ci-${t}-3`, 45)],
        ],
        0,
      ),
    );
    add(`${t}-r`, (id) =>
      lin(
        id,
        [
          [0, `var(--ci-${t}-3)`],
          [1, shade(`--ci-${t}-3`, `--ci-shade`, 22)],
        ],
        0,
      ),
    );
  }
  add("mat", (id) =>
    rad(
      id,
      [
        [0, "var(--ci-paper)"],
        [0.38, "var(--ci-mat-1)"],
        [0.82, "var(--ci-mat-2)"],
        [1, shade("--ci-mat-2", "--ci-mat-ink", 30)],
      ],
      0.36,
      0.3,
      0.78,
    ),
  );
  add("mat-l", (id) =>
    lin(
      id,
      [
        [0, "var(--ci-mat-1)"],
        [1, shade("--ci-mat-1", "--ci-mat-2", 55)],
      ],
      0,
    ),
  );
  add("node", (id) =>
    rad(
      id,
      [
        [0, shade("--ci-acc-3", "--ci-paper", 55)],
        [0.55, "var(--ci-acc-3)"],
        [1, "var(--ci-acc-ink)"],
      ],
      0.35,
      0.3,
      0.75,
    ),
  );
  add("ana", (id) =>
    lin(
      id,
      [
        [0, "var(--ci-ana-1)"],
        [1, "var(--ci-ana-1)", 0.15],
      ],
      0,
    ),
  );
  add("ana-s", (id) =>
    lin(
      id,
      [
        [0, shade("--ci-ana-ink", "--ci-paper", 25)],
        [1, "var(--ci-ana-ink)"],
      ],
      0,
    ),
  );
  add("badge", (id) =>
    lin(
      id,
      [
        [0, shade("--ci-badge", "--ci-paper", 22)],
        [1, "var(--ci-badge)"],
      ],
      0,
    ),
  );
  add("badge-danger", (id) =>
    lin(
      id,
      [
        [0, shade("--ci-badge-danger", "--ci-paper", 20)],
        [1, "var(--ci-badge-danger)"],
      ],
      0,
    ),
  );
  add("ground", (id) =>
    rad(id, [
      [0, "var(--ci-shade)", 0.3],
      [1, "var(--ci-shade)", 0],
    ]),
  );
  return { defs, vars };
}

export function CAEIcon({
  name,
  size = 24,
  badge,
  hiddenNodes,
}: {
  name: CAEIconName;
  size?: number;
  badge?: CAEIconBadge;
  /** Indices of "nodes" vertex dots to omit for a specific instance. */
  hiddenNodes?: number[];
}) {
  const u = `ci${useId().replace(/[^A-Za-z0-9_-]/g, "")}`;
  // Optical sizing: strokes stay crisp in screen pixels; fine detail drops below 20px.
  const fine = size >= 20;
  const stroke = size >= 24 ? 1.35 : size >= 16 ? 1.15 : 1;
  const { defs, vars } = finish(u);
  const g = fine ? ground[name] : undefined;
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
      data-fine={fine || undefined}
      style={vars as CSSProperties}
    >
      <defs>{defs}</defs>
      {g && (
        <ellipse
          className={c.ground}
          cx={g[0]}
          cy={g[1]}
          rx={g[2]}
          ry={g[2] * 0.28}
        />
      )}
      {glyph(name, fine, hiddenNodes)}
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
