import { useState, type ReactNode } from "react";
import s from "./DockLayout.module.css";
type Side = "left" | "right" | "top" | "bottom";
type PanelId = "tree" | "log" | "ai";
const labels: Record<Side, string> = { left: "左侧", right: "右侧", top: "顶部", bottom: "底部" };
export function DockLayout({ tree, log, viewport, ai }: { tree: ReactNode; log: ReactNode; viewport: ReactNode; ai: ReactNode }) {
  const [locations, setLocations] = useState<Record<PanelId, Side>>({ tree: "left", log: "bottom", ai: "right" });
  const [sizes, setSizes] = useState<Record<PanelId, number>>({ tree: 253, log: 140, ai: 260 });
  const [dragging, setDragging] = useState<PanelId | null>(null);
  const panels = [{ id: "tree" as const, title: "目录树", content: tree }, { id: "log" as const, title: "消息", content: log }, { id: "ai" as const, title: "AI 对话", content: ai }];
  const move = (id: PanelId, side: Side) => { setLocations(previous => ({ ...previous, [id]: side })); setSizes(previous => ({ ...previous, [id]: side === "left" || side === "right" ? 253 : 180 })); setDragging(null); };
  return <div className={s.layout}>
    <main className={s.viewport}>{viewport}</main>
    {(Object.keys(labels) as Side[]).map(side => <div key={side} className={s.zone} data-side={side}>
      {panels.filter(panel => locations[panel.id] === side && panel.content).map(panel => {
        const vertical = side === "left" || side === "right";
        const min = vertical ? 210 : 100, max = vertical ? 390 : 300;
        const resize = (value: number) => setSizes(previous => ({ ...previous, [panel.id]: Math.max(min, Math.min(max, value)) }));
        return <section key={panel.id} className={s.panel} style={vertical ? { width: sizes[panel.id] } : { height: sizes[panel.id] }}>
          <header draggable onDragStart={event => { event.dataTransfer.setData("text/plain", panel.id); setDragging(panel.id); }} onDragEnd={() => setDragging(null)}>
            <span title="拖到视图区边缘停靠">⠿ {panel.title}</span>
            <select aria-label={`${panel.title}停靠位置`} value={side} onChange={event => move(panel.id, event.target.value as Side)}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </header>
          <div className={s.content}>{panel.content}</div>
          <div role="separator" tabIndex={0} aria-label={panel.id === "tree" ? "调整模型树宽度" : `调整${panel.title}尺寸`} aria-orientation={vertical ? "vertical" : "horizontal"} aria-valuemin={min} aria-valuemax={max} aria-valuenow={sizes[panel.id]} className={s.resize} data-side={side}
            onKeyDown={event => { if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); resize(sizes[panel.id] + (["ArrowRight", "ArrowDown"].includes(event.key) ? 10 : -10) * (side === "right" || side === "bottom" ? -1 : 1)); } }}
            onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.dataset.origin = String(vertical ? event.clientX : event.clientY); event.currentTarget.dataset.size = String(sizes[panel.id]); }}
            onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) resize(Number(event.currentTarget.dataset.size) + ((vertical ? event.clientX : event.clientY) - Number(event.currentTarget.dataset.origin)) * (side === "right" || side === "bottom" ? -1 : 1)); }}
            onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}/>
        </section>;
      })}
    </div>)}
    {dragging && <div className={s.targets}>{(Object.keys(labels) as Side[]).map(side => <div key={side} data-side={side} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); move(dragging, side); }}>{labels[side]}停靠</div>)}</div>}
  </div>;
}
