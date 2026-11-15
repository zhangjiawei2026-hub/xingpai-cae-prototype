import { useId } from "react";
import {
  currentResult,
  fields,
  layouts,
  type ResultReview,
  type ResultState,
} from "./resultState";
import s from "./Results.module.css";

const colors = [
  "#3b7dbf",
  "#4b9bc7",
  "#6eb5bb",
  "#97cd9f",
  "#d4d88e",
  "#f1c472",
  "#e69a5a",
  "#d97056",
];

function ResultMesh({ result, wire }: { result: ResultState; wire: boolean }) {
  const clip = useId();
  const phase = result.harmonic
    ? Math.sin((result.phase * Math.PI) / 180)
    : 0.65;
  const scale = result.scaleMode === "manual" ? result.scale : 1;
  const power = 1.6 + result.frame * 0.3;
  const point = (column: number, row: number, original = false) => {
    const u = column / 12;
    const v = row / 4;
    const bend =
      !original && result.deform ? phase * scale * 28 * Math.pow(u, power) : 0;
    return [74 + u * 468 - v * 50, 156 + v * 105 - u * 23 - bend];
  };
  const poly = (points: number[][]) =>
    points.map((p) => p.map((n) => n.toFixed(2)).join(",")).join(" ");
  const outline = (original = false) =>
    poly([
      ...Array.from({ length: 13 }, (_, index) => point(index, 0, original)),
      ...Array.from({ length: 13 }, (_, index) =>
        point(12 - index, 4, original),
      ),
    ]);
  const side = poly([
    ...Array.from({ length: 13 }, (_, index) => point(index, 4)),
    ...Array.from({ length: 13 }, (_, index) => {
      const [x, y] = point(12 - index, 4);
      return [x, y + 19];
    }),
  ]);
  const viewTop = Math.min(0, point(12, 0)[1] - 26);
  const viewBottom = Math.max(360, point(12, 4)[1] + 44);
  const height = viewBottom - viewTop;
  const x = 300 + result.offset * 2.72;
  const y = 184 + result.offset * 1.6;
  const slantTop = x + 72 - 0.4 * viewTop;
  const slantBottom = x + 72 - 0.4 * viewBottom;
  const line =
    result.plane === "XY"
      ? [x, viewTop, x, viewBottom]
      : result.plane === "XZ"
        ? [0, y, 620, y]
        : [slantTop, viewTop, slantBottom, viewBottom];
  const clipBounds =
    result.plane === "XY" ? (
      <rect
        x={result.flip ? x : 0}
        y={viewTop}
        width={result.flip ? 620 - x : x}
        height={height}
      />
    ) : result.plane === "XZ" ? (
      <rect
        x={0}
        y={result.flip ? y : viewTop}
        width={620}
        height={result.flip ? viewBottom - y : y - viewTop}
      />
    ) : (
      <polygon
        points={poly(
          result.flip
            ? [
                [slantTop, viewTop],
                [620, viewTop],
                [620, viewBottom],
                [slantBottom, viewBottom],
              ]
            : [
                [0, viewTop],
                [slantTop, viewTop],
                [slantBottom, viewBottom],
                [0, viewBottom],
              ],
        )}
      />
    );
  const low = result.range === "manual" ? result.minimum : 0;
  const high = result.range === "manual" ? result.maximum : 100;
  const variables: readonly string[] = fields[result.field][1];
  const fieldShift =
    3 * (result.frame + Object.keys(fields).indexOf(result.field)) +
    variables.indexOf(result.component) * 2;
  return (
    <svg
      className={s.mesh}
      viewBox={`0 ${viewTop} 620 ${height}`}
      role="img"
      aria-label="示意结果网格"
    >
      <defs>
        <clipPath id={clip}>{clipBounds}</clipPath>
      </defs>
      {result.overlay && result.deform && (
        <polygon
          points={outline(true)}
          fill="none"
          stroke="#526c87"
          strokeWidth="1.5"
          strokeDasharray="5 4"
        />
      )}
      <g clipPath={result.cut ? `url(#${clip})` : undefined}>
        {!wire && <polygon points={side} fill="#829bb3" opacity={0.75} />}
        <g stroke="#426786" strokeWidth={0.65}>
          {Array.from({ length: 48 }, (_, index) => {
            const column = Math.floor(index / 4);
            const row = index % 4;
            const demoValue =
              column * 6 +
              row * 4 +
              fieldShift +
              (result.harmonic ? phase * 6 : 0);
            const band = Math.round(
              Math.max(0, Math.min(1, (demoValue - low) / (high - low))) *
                (colors.length - 1),
            );
            const lower = point(column, row + 1);
            const upper = point(column + 1, row);
            const fill = wire
              ? "none"
              : result.cloud
                ? colors[band]
                : "#9ab1c7";
            return (
              <g key={index}>
                <polygon
                  data-result-face={index}
                  points={poly([
                    point(column, row),
                    upper,
                    point(column + 1, row + 1),
                    lower,
                  ])}
                  fill={fill}
                />
                <polyline
                  points={poly([lower, upper])}
                  fill="none"
                  opacity={0.48}
                />
              </g>
            );
          })}
        </g>
        <polygon
          points={outline()}
          fill="none"
          stroke="#355879"
          strokeWidth={1.45}
        />
      </g>
      {result.cut && (
        <line
          x1={line[0]}
          y1={line[1]}
          x2={line[2]}
          y2={line[3]}
          stroke="#436c9a"
          strokeWidth={1.5}
          strokeDasharray="6 5"
        />
      )}
    </svg>
  );
}

export function ResultViewport({
  review,
  wire,
}: {
  review: ResultReview;
  wire: boolean;
}) {
  const { result, change } = review;
  const panes =
    layouts.find((layout) => layout.id === result.layout)?.count ?? 1;
  const context = currentResult(result);
  return (
    <section className={s.viewport} aria-label="结果视图区">
      <div className={s.viewportHeader}>
        <strong>
          {context.frame.label} · {context.label}
          {result.component ? ` / ${result.component}` : ""}
        </strong>
        <span>结果示意 · 会话内数据</span>
      </div>
      <div className={s.views} data-layout={result.layout}>
        {Array.from({ length: panes }, (_, index) => (
          <section
            key={index}
            className={s.pane}
            data-current={index === result.activePane}
            aria-label={`结果视图 ${index + 1}`}
          >
            <div className={s.paneHeader}>
              <button
                aria-pressed={index === result.activePane}
                onClick={() => change({ activePane: index })}
              >
                视图 {index + 1}
              </button>
              {index === result.activePane && <span>当前视图</span>}
            </div>
            <div
              className={s.plot}
              data-probe={result.probe}
              tabIndex={0}
              aria-label={`视图 ${index + 1} 示意网格`}
              onClick={(event) => {
                if (!result.probe) {
                  change({ activePane: index });
                  return;
                }
                const rect = event.currentTarget.getBoundingClientRect();
                review.addMarker(
                  index,
                  Math.max(
                    6,
                    Math.min(
                      94,
                      ((event.clientX - rect.left) / rect.width) * 100,
                    ),
                  ),
                  Math.max(
                    8,
                    Math.min(
                      92,
                      ((event.clientY - rect.top) / rect.height) * 100,
                    ),
                  ),
                );
              }}
              onKeyDown={(event) => {
                if (
                  event.target !== event.currentTarget ||
                  !result.probe ||
                  !["Enter", " "].includes(event.key)
                )
                  return;
                event.preventDefault();
                review.addMarker(index, 50, 50);
              }}
            >
              <ResultMesh result={result} wire={wire} />
              {result.legend && result.cloud && (
                <div className={s.legend} aria-label="示意色阶">
                  <span>
                    {result.range === "manual" ? result.maximum : "高"}
                  </span>
                  <i />
                  <span>
                    {result.range === "manual" ? result.minimum : "低"}
                  </span>
                </div>
              )}
              {result.maximumMark && (
                <span className={s.extreme} style={{ left: "72%", top: "39%" }}>
                  极大值 · 示意
                </span>
              )}
              {result.minimumMark && (
                <span className={s.extreme} style={{ left: "26%", top: "62%" }}>
                  极小值 · 示意
                </span>
              )}
              {result.markers[index].map((marker) => (
                <span
                  key={marker.id}
                  className={s.marker}
                  style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                >
                  P{marker.id}
                  <button
                    aria-label={`删除探针 P${marker.id}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      event.currentTarget
                        .closest<HTMLElement>("[data-probe]")
                        ?.focus();
                      review.removeMarker(index, marker.id);
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className={s.viewportStatus} role="status">
        {review.feedback ||
          (result.probe
            ? "点击或按 Enter 添加探针，按 Esc 退出。"
            : "各窗口共享示意结果，探针按窗口独立保存。")}
      </div>
    </section>
  );
}
