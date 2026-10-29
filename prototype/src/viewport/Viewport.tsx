import { useEffect, useRef, useState } from "react";
import { Box, Check, X, MousePointer2, MoreHorizontal } from "lucide-react";
import { CAEIcon, type CAEIconName } from "../components/CAEIcon";
import { moveFocus } from "../components/keyboard";
import { useStore } from "../app/Store";
import { createViewport } from "./adapter";
import type { ViewMode } from "./adapter";
import s from "./Viewport.module.css";
import type { EntityType } from "../types/domain";

const viewIcon: Record<ViewMode, CAEIconName> = {
  iso: "viewIso",
  top: "viewTop",
  front: "viewFront",
  right: "viewRight",
};

export function Viewport() {
  const { state, dispatch } = useStore();
  const host = useRef<HTMLDivElement>(null),
    adapter = useRef<ReturnType<typeof createViewport> | null>(null);
  const [error, setError] = useState(""),
    [wire, setWire] = useState(true),
    [view, setView] = useState<ViewMode | null>("iso");
  const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 });
  const [inspectionActive, setInspectionActive] = useState(false);
  const [counts, setCounts] = useState({ nodes: 0, elements: 0 });
  const axes = useRef<SVGSVGElement>(null);
  const [inspection, setInspection] = useState<{ model: string; entity: EntityType; ids: number[] }>({ model: state.model, entity: "Element", ids: [] });
  const inspectIds = inspection.model === state.model ? inspection.ids : [];
  const pickHandler = useRef<(id: number) => void>(() => {});
  useEffect(() => {
    pickHandler.current = id => {
      if (state.selection) dispatch({ type: "toggle", id });
      else setInspection(previous => ({ ...previous, model: state.model, ids: previous.model !== state.model ? [id] : previous.ids.includes(id) ? previous.ids.filter(value => value !== id) : [...previous.ids, id] }));
    };
  }, [state.selection, state.model, dispatch]);
  const selection = state.selection;
  const pointActive = !!selection || (inspectionActive && !state.command && state.model !== "Model-Empty");
  useEffect(() => {
    if (!host.current) return;
    try {
      adapter.current = createViewport(
        host.current,
        (id) => pickHandler.current(id),
        (directions) => {
          directions.forEach(({ x, y }, index) => {
            const axis = axes.current?.children[index];
            axis?.querySelector("line")?.setAttribute("x2", String(x));
            axis?.querySelector("line")?.setAttribute("y2", String(y));
            axis?.querySelector("text")?.setAttribute("x", String(x));
            axis?.querySelector("text")?.setAttribute("y", String(y - 4));
          });
        },
        () => setView(null),
      );
      setCounts(adapter.current.counts);
      setView("iso");
    } catch {
      setError(
        "三维视图不可用。请使用支持 WebGL 的浏览器；仍可通过下方列表体验选择。",
      );
    }
    return () => adapter.current?.dispose();
  }, [dispatch]);
  useEffect(() => {
    adapter.current?.setSelection(
      selection?.entity ?? (inspectionActive && !state.command ? inspection.entity : null),
      selection?.ids ?? (inspection.model === state.model ? inspection.ids : []),
    );
  }, [selection, inspection, inspectionActive, state.command, state.model]);
  useEffect(() => {
    adapter.current?.setVisible(state.model !== "Model-Empty");
  }, [state.model]);
  const changeView = (value: ViewMode) => {
    adapter.current?.view(value);
    setView(value);
  };
  return (
    <section className={s.viewport} aria-label="模型视图区">
      <header className={s.tabbar}>
        <span>
          <Box size={14} />{" "}
          {state.model === "Model-Empty" ? "空模型" : "安装支架"}
        </span>
        <span className={s.demo}>演示模型</span>
      </header>
      <div className={s.stage}>
        <div ref={host} className={s.canvas} data-testid="viewport" />
        <div className={s.selectionToolbar} role="group" aria-label="视图区选择工具">
          <select aria-label="选择对象类型" disabled={!!selection || state.model === "Model-Empty" || !!state.command} value={selection?.entity ?? inspection.entity} onChange={e => setInspection({ model: state.model, entity: e.target.value as EntityType, ids: [] })}>
            <option value="Element">Element · 单元</option><option value="Node">Node · 节点</option><option disabled>Nset · 节点集合（未接入）</option><option disabled>Elset · 单元集合（未接入）</option>
          </select>
          <button aria-label="点选显示网格" aria-pressed={pointActive} title={pointActive ? "点选已激活，逐项累积选择" : "激活点选显示网格"} disabled={!!selection || !!state.command || state.model === "Model-Empty"} onClick={() => setInspectionActive(!inspectionActive)}><MousePointer2 size={13} />点选</button>
          <span aria-label="已选数量" className={(selection?.ids ?? inspectIds).length ? s.selectedCount : ""} aria-live="polite">{(selection?.ids ?? inspectIds).length}</span>
          <button id="selection-method-trigger" aria-label="更多选择方式" aria-haspopup="menu" popoverTarget="selection-method-menu" onClick={event => {
            const box = event.currentTarget.getBoundingClientRect();
            setMenuAnchor({ x: Math.max(8, Math.min(box.left, window.innerWidth - 232)), y: box.bottom + 208 < window.innerHeight ? box.bottom + 4 : Math.max(8, box.top - 208) });
          }}><MoreHorizontal size={15} /></button>
          <button title="清除全部选择" aria-label="清除全部选择" disabled={!(selection?.ids ?? inspectIds).length} onClick={() => { if (selection) selection.ids.forEach(id => dispatch({ type: "toggle", id })); else setInspection({ ...inspection, ids: [] }); }}><X size={14} /></button>
        </div>
        <div id="selection-method-menu" popover="auto" role="menu" tabIndex={-1} aria-label="选择方式菜单" className={s.methodMenu} style={{ left: menuAnchor.x, top: menuAnchor.y }}
          onToggle={event => { if (event.newState === "open") (event.currentTarget.querySelector<HTMLButtonElement>("button:not(:disabled)") ?? event.currentTarget).focus(); }}
          onKeyDown={event => {
            moveFocus(event, "menuitem");
            if (event.key === "Escape" || event.key === "Tab") {
              event.preventDefault(); event.stopPropagation(); event.currentTarget.hidePopover();
              document.getElementById("selection-method-trigger")?.focus();
            }
          }}>
          <p>选择方式 <span>{selection ? "字段选择中" : pointActive ? "已激活" : "未激活"}</span></p>
          <button role="menuitem" aria-label={pointActive ? "退出点选" : "激活点选"} disabled={!!selection || !!state.command || state.model === "Model-Empty"} onClick={event => {
            setInspectionActive(!inspectionActive); event.currentTarget.closest<HTMLElement>("[popover]")?.hidePopover(); document.getElementById("selection-method-trigger")?.focus();
          }}><MousePointer2 size={14} /><span>点选</span>{pointActive && <Check size={14} aria-label="已激活" />}</button>
          {["框选", "几何面关联", "角度关联", "集合选择"].map(method => <button role="menuitem" key={method} disabled title="专业选择算法未接入"><span>{method}</span><small>未接入</small></button>)}
        </div>
        <div className={s.viewControls} role="group" aria-label="视图导航工具">
          <div className={s.navigator} aria-label="视图方向">
            {(
              [
                { value: "top", label: "顶", title: "顶视图" },
                { value: "iso", label: "等轴测", title: "等轴测视图" },
                { value: "front", label: "前", title: "前视图" },
                { value: "right", label: "右", title: "右视图" },
              ] as const
            ).map((v) => (
              <button
                key={v.value}
                aria-label={v.label}
                title={v.title}
                onClick={() => changeView(v.value)}
                aria-pressed={view === v.value}
              >
                <CAEIcon name={viewIcon[v.value]} size={20} />
              </button>
            ))}
          </div>
          <div className={s.tools} aria-label="视图工具">
            <button title="等轴测视图" onClick={() => changeView("iso")}>
              <CAEIcon name="iso" size={20} />
            </button>
            <button title="适合窗口" onClick={() => adapter.current?.fit()}>
              <CAEIcon name="fit" size={20} />
            </button>
            <i />
            <button
              title="放大模型"
              onClick={() => adapter.current?.zoom(0.85)}
            >
              <CAEIcon name="zoomIn" size={20} />
            </button>
            <button
              title="缩小模型"
              onClick={() => adapter.current?.zoom(1.15)}
            >
              <CAEIcon name="zoomOut" size={20} />
            </button>
            <i />
            <button
              title="显示三角面边线"
              aria-pressed={wire}
              className={wire ? s.active : ""}
              onClick={() => {
                setWire(!wire);
                adapter.current?.setWireframe(!wire);
              }}
            >
              <CAEIcon name="wireframe" size={20} />
            </button>
          </div>
        </div>
        {error && (
          <div className={s.empty} role="alert">
            {error}
          </div>
        )}
        {state.model === "Model-Empty" && (
          <div className={s.empty}>
            <Box size={32} />
            <h2>当前模型没有部件</h2>
            <p>切换到 Model-1，体验三条代表性操作流程。</p>
          </div>
        )}
        <div className={s.axes}>
          <svg
            ref={axes}
            width="78"
            height="72"
            aria-label="相机联动坐标轴"
            role="img"
          >
            {["X", "Y", "Z"].map((label, index) => (
              <g key={label} fill={["#cda085", "#82b491", "#7badd5"][index]}>
                <line
                  x1="38"
                  y1="36"
                  x2="38"
                  y2="36"
                  stroke="currentColor"
                  style={{ color: ["#cda085", "#82b491", "#7badd5"][index] }}
                />
                <text fontSize="10" textAnchor="middle">
                  {label}
                </text>
              </g>
            ))}
            <circle cx="38" cy="36" r="3" fill="#7c8796" />
          </svg>
        </div>
        <div className={s.stats}>
          {state.model !== "Model-Empty" && (
            <>
              <span>几何显示网格</span>
              <span>{counts.nodes.toLocaleString()} 顶点</span>
              <span>{counts.elements.toLocaleString()} 三角面</span>
            </>
          )}
        </div>
        {selection && (
          <div className={s.pickbar}>
            <div className={s.picklist} role="group" aria-label="专业选择方式">
              <span>
                当前字段：
                {
                  {
                    nodes: "节点集合",
                    elements: "优化区域",
                    base: "基准点",
                    direction: "第一点",
                  }[selection.target]
                }
              </span>
              <button aria-pressed="true" title="逐项点选，可累积多个演示对象">
                点选 · 已激活
              </button>
              {["框选", "几何面关联", "角度关联", "集合选择"].map((method) => (
                <button key={method} disabled title="专业选择算法未接入">
                  {method} · 未接入
                </button>
              ))}
            </div>
            <div className={s.pickhead}>
              <span className={s.pulse} />
              <strong>正在选择 {selection.entity}</strong>
              <span data-testid="pick-count">
                已选 {selection.ids.length} 项
              </span>
              <button
                className={s.confirm}
                onClick={() => dispatch({ type: "pickConfirm" })}
              >
                <Check size={14} />
                确认选择
              </button>
              <button onClick={() => dispatch({ type: "pickCancel" })}>
                <X size={14} />
                取消拾取
              </button>
            </div>
            <div
              className={s.picklist}
              role="group"
              aria-label="键盘选择演示对象"
            >
              <span>快捷选择</span>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((id) => (
                <button
                  key={id}
                  aria-label={`选择${selection.entity} ${id}`}
                  aria-pressed={selection.ids.includes(id)}
                  onClick={() => dispatch({ type: "toggle", id })}
                >
                  {selection.entity === "Node" ? "N" : "E"}
                  {String(id).padStart(3, "0")}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
