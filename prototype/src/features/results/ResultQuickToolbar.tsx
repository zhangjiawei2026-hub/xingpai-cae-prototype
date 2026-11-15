import {
  ClipboardPen,
  Focus,
  FolderOpen,
  Import,
  Redo2,
  RotateCcw,
  Ruler,
  Save,
  Undo2,
} from "lucide-react";
import { CAEIcon } from "../../components/CAEIcon";
import ws from "../workspace/Workspace.module.css";

const orientations = [
  ["等轴测视图", "viewIso"],
  ["前视图", "viewFront"],
  ["后视图", "viewFront"],
  ["左视图", "viewRight"],
  ["右视图", "viewRight"],
  ["顶视图", "viewTop"],
  ["底视图", "viewTop"],
] as const;
const reason = "仅展示入口；当前结果视图使用二维示意网格";
export function ResultQuickToolbar({
  wire,
  setWire,
  legend,
  legendAvailable,
  toggleLegend,
  resetView,
}: {
  wire: boolean;
  setWire: (wire: boolean) => void;
  legend: boolean;
  legendAvailable: boolean;
  toggleLegend: () => void;
  resetView: () => void;
}) {
  return (
    <div
      className={ws.quickToolbar}
      role="toolbar"
      aria-label="结果常用工具栏"
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
          return;
        const items = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>(
            "button:not(:disabled)",
          ),
        );
        if (!items.length) return;
        const index = items.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        event.preventDefault();
        const offset = event.key === "ArrowLeft" ? -1 : 1;
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : (index + offset + items.length) % items.length;
        items[next].focus();
      }}
    >
      <span className={ws.toolbarLabel}>常用</span>
      <div className={ws.quickGroup} role="group" aria-label="文件">
        <button aria-label="打开文件" title={`打开文件 · ${reason}`} disabled>
          <FolderOpen size={17} />
        </button>
        <button aria-label="保存工程" title={`保存工程 · ${reason}`} disabled>
          <Save size={17} />
        </button>
        <button
          aria-label="导入 INP 模型"
          title={`导入 INP 模型 · ${reason}`}
          disabled
        >
          <Import size={17} />
        </button>
      </div>
      <div className={ws.quickGroup} role="group" aria-label="编辑">
        <button aria-label="撤销" title={`撤销 · ${reason}`} disabled>
          <Undo2 size={17} />
        </button>
        <button aria-label="重做" title={`重做 · ${reason}`} disabled>
          <Redo2 size={17} />
        </button>
      </div>
      <div className={ws.quickGroup} role="group" aria-label="视图导航">
        <button
          aria-label="适配可见对象"
          title="示意网格已随视图调整大小"
          disabled
        >
          <CAEIcon name="fit" size={19} />
        </button>
        <button
          aria-label="聚焦当前节点"
          title={`聚焦当前节点 · ${reason}`}
          disabled
        >
          <Focus size={17} />
        </button>
        <button
          aria-label="重置视图"
          title="重置示意视图布局、显示方式与剖切"
          onClick={resetView}
        >
          <RotateCcw size={17} />
        </button>
      </div>
      <div className={ws.quickGroup} role="group" aria-label="标准视图">
        {orientations.map(([label, icon]) => (
          <button
            key={label}
            aria-label={label}
            title={`${label} · ${reason}`}
            disabled
          >
            <CAEIcon name={icon} size={19} />
          </button>
        ))}
      </div>
      <div className={ws.quickGroup} role="group" aria-label="显示方式">
        <button
          aria-label="实体显示"
          title="实体显示"
          aria-pressed={!wire}
          onClick={() => setWire(false)}
        >
          <CAEIcon name="part" size={19} />
        </button>
        <button
          aria-label="线框显示"
          title="线框显示"
          aria-pressed={wire}
          onClick={() => setWire(true)}
        >
          <CAEIcon name="wireframe" size={19} />
        </button>
        <button
          aria-label="显示控制"
          title={legendAvailable ? "显示控制 · 切换示意色阶图例" : "当前显示方式没有色阶图例"}
          aria-pressed={legendAvailable && legend}
          disabled={!legendAvailable}
          onClick={toggleLegend}
        >
          <ClipboardPen size={17} />
        </button>
      </div>
      <div className={ws.quickGroup} role="group" aria-label="测量">
        <button aria-label="测量" title={`测量 · ${reason}`} disabled>
          <Ruler size={17} />
        </button>
      </div>
    </div>
  );
}
