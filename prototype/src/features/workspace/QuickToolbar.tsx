import { CAEIcon } from "../../components/CAEIcon";
import type { CAEIconName } from "../../components/CAEIcon";
import { useStore } from "../../app/Store";
import type { Command } from "../../types/domain";
import s from "./Workspace.module.css";

export type ViewAction = "fit" | "iso" | "zoomIn" | "zoomOut";
export function QuickToolbar({
  onView,
  treeVisible,
  logVisible,
  onToggleTree,
  onToggleLog,
}: {
  onView: (action: ViewAction) => void;
  treeVisible: boolean;
  logVisible: boolean;
  onToggleTree: () => void;
  onToggleLog: () => void;
}) {
  const { state, dispatch } = useStore();
  const commands: { command: Command; icon: CAEIconName; label: string }[] = [
    { command: "nodeSet", icon: "nodes", label: "创建节点集合" },
    { command: "step", icon: "step", label: "创建分析步" },
    { command: "domain", icon: "domain", label: "创建设计域" },
  ];
  const views: { action: ViewAction; icon: CAEIconName; label: string }[] = [
    { action: "fit", icon: "fit", label: "适合窗口" },
    { action: "iso", icon: "iso", label: "等轴测视图" },
    { action: "zoomIn", icon: "zoomIn", label: "放大模型" },
    { action: "zoomOut", icon: "zoomOut", label: "缩小模型" },
  ];
  return (
    <div
      className={s.quickToolbar}
      role="toolbar"
      aria-label="常用工具栏"
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
          return;
        const buttons = [
          ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
            "button:not(:disabled)",
          ),
        ];
        if (!buttons.length) return;
        event.preventDefault();
        const index = buttons.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? buttons.length - 1
              : (index +
                  (event.key === "ArrowRight" ? 1 : buttons.length - 1)) %
                buttons.length;
        buttons[next].focus();
      }}
    >
      <span className={s.toolbarLabel}>常用</span>
      <div role="group" aria-label="创建对象" className={s.quickGroup}>
        {commands.map(({ command, icon, label }) => (
          <button
            key={command}
            title={label}
            aria-label={label}
            disabled={!!state.command || state.model === "Model-Empty"}
            onClick={() => dispatch({ type: "open", command })}
          >
            <CAEIcon name={icon} size={20} badge="add" />
          </button>
        ))}
      </div>
      <div role="group" aria-label="视图操作" className={s.quickGroup}>
        {views.map(({ action, icon, label }) => (
          <button
            key={action}
            title={label}
            aria-label={label}
            onClick={() => onView(action)}
          >
            <CAEIcon name={icon} size={20} />
          </button>
        ))}
      </div>
      <div role="group" aria-label="面板显隐" className={s.quickGroup}>
        <button
          title="模型树"
          aria-label="模型树"
          aria-pressed={treeVisible}
          onClick={onToggleTree}
        >
          <CAEIcon name="treePanel" size={20} />
        </button>
        <button
          title="信息窗口"
          aria-label="信息窗口"
          aria-pressed={logVisible}
          onClick={onToggleLog}
        >
          <CAEIcon name="logPanel" size={20} />
        </button>
      </div>
    </div>
  );
}
