import {
  ChevronDown,
  Expand,
  RotateCcw,
  ListTree,
  PanelBottom,
  Info,
} from "lucide-react";
import { rememberDialogTrigger } from "../../components/dialogFocus";
import { useState } from "react";
import { useStore } from "../../app/Store";
import type { Command, Module } from "../../types/domain";
import { CAEIcon } from "../../components/CAEIcon";
import s from "../workspace/Workspace.module.css";
const primary: Record<
  Module,
  { icon: string; label: string; command?: Command; small: string[] }
> = {
  Part: { icon: "box", label: "创建部件", small: ["编辑部件", "删除部件"] },
  Property: {
    icon: "material",
    label: "创建材料",
    small: ["截面定义", "属性指派"],
  },
  Assembly: { icon: "box", label: "创建实例", small: ["平移实例", "旋转实例"] },
  Step: {
    icon: "step",
    label: "创建分析步",
    command: "step",
    small: ["编辑分析步", "分析步管理"],
  },
  Interaction: {
    icon: "domain",
    label: "创建相互作用",
    small: ["接触属性", "约束管理"],
  },
  Load: { icon: "load", label: "创建载荷", small: ["边界条件", "载荷管理"] },
  Mesh: {
    icon: "nodes",
    label: "创建节点集合",
    command: "nodeSet",
    small: ["创建单元集合", "集合管理"],
  },
  Optimization: {
    icon: "domain",
    label: "创建设计域",
    command: "domain",
    small: ["优化指标函数", "优化任务管理"],
  },
};
export function Ribbon({
  onFit,
  onIso,
  onToggleTree,
  onToggleLog,
  treeVisible,
  logVisible,
  onHelp,
}: {
  onFit: () => void;
  onIso: () => void;
  onToggleTree: () => void;
  onToggleLog: () => void;
  treeVisible: boolean;
  logVisible: boolean;
  onHelp: () => void;
}) {
  const { state, dispatch } = useStore();
  const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 });
  const item = primary[state.module],
    empty = state.model === "Model-Empty";
  return (
    <div className={s.ribbon} aria-label="Ribbon 功能区">
      <div className={s.ribbonGroup}>
        <div className={s.ribbonItems}>
          <button
            className={`${s.largeCommand} ${item.command ? s.featured : ""}`}
            disabled={!item.command || empty || !!state.command}
            title={item.command ? item.label : "此命令未纳入首轮原型"}
            onClick={() =>
              item.command && dispatch({ type: "open", command: item.command })
            }
          >
            <CAEIcon name={item.icon} size={32} />
            <span>{item.label}</span>
            {item.command && <small>新建</small>}
          </button>
          <div className={s.smallCommands}>
            {item.small.map((label, i) => (
              <button key={label} disabled title="此命令未纳入首轮原型">
                <CAEIcon name={i ? "box" : item.icon} size={17} />
                {label}
                <ChevronDown size={10} />
              </button>
            ))}
          </div>
          <button
            className={s.commandDropdown}
            id="ribbon-menu-trigger"
            aria-label="创建命令下拉菜单"
            popoverTarget="ribbon-command-menu"
            disabled={empty || !!state.command}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setMenuAnchor({ x: rect.left, y: rect.bottom + 4 });
            }}
          >
            <ChevronDown size={12} />
          </button>
        </div>
        <span className={s.groupCaption}>创建与编辑</span>
      </div>
      <div className={s.ribbonGroup}>
        <div className={s.ribbonItems}>
          <button
            className={s.largeCommand}
            disabled
            title="真实网格生成功能未接入"
          >
            <CAEIcon name="mesh" size={31} />
            <span>生成网格</span>
            <ChevronDown size={10} />
          </button>
          <div className={s.smallCommands}>
            <button disabled title="未接入真实网格能力">
              <CAEIcon name="nodes" size={17} />
              种子布置
            </button>
            <button disabled title="未接入真实网格能力">
              <CAEIcon name="domain" size={17} />
              单元类型
            </button>
          </div>
        </div>
        <span className={s.groupCaption}>网格工具 · 待接入</span>
      </div>
      <div className={s.ribbonGroup}>
        <div className={s.ribbonItems}>
          <button className={s.largeCommand} onClick={onFit}>
            <Expand size={27} strokeWidth={1.3} />
            <span>适合窗口</span>
          </button>
          <div className={s.smallCommands}>
            <button onClick={onIso}>
              <RotateCcw size={16} />
              等轴测视图
            </button>
            <button disabled title="首轮仅显示一个演示部件">
              <CAEIcon name="box" size={16} />
              显示 / 隐藏
              <ChevronDown size={10} />
            </button>
          </div>
        </div>
        <span className={s.groupCaption}>视图</span>
      </div>
      <div className={s.ribbonGroup}>
        <div className={s.ribbonItems}>
          <div className={s.smallCommands}>
            <button aria-pressed={treeVisible} onClick={onToggleTree}>
              <ListTree size={16} />
              模型树
            </button>
            <button aria-pressed={logVisible} onClick={onToggleLog}>
              <PanelBottom size={16} />
              信息窗口
            </button>
          </div>
        </div>
        <span className={s.groupCaption}>工作区</span>
      </div>
      <div className={`${s.ribbonGroup} ${s.demoCommands}`}>
        <div className={s.ribbonItems}>
          {(
            [
              { command: "nodeSet", icon: "nodes", label: "节点集合" },
              { command: "step", icon: "step", label: "分析步" },
              { command: "domain", icon: "domain", label: "设计域" },
            ] as const
          ).map((i) => (
            <button
              key={i.command}
              className={s.largeCommand}
              disabled={empty || !!state.command}
              onClick={() => dispatch({ type: "open", command: i.command })}
            >
              <CAEIcon name={i.icon} size={26} />
              <span>{i.label}</span>
            </button>
          ))}
        </div>
        <span className={s.groupCaption}>代表性流程</span>
      </div>
      <button
        className={s.ribbonHelp}
        disabled={!!state.command}
        onClick={onHelp}
        title="查看原型说明"
      >
        <Info size={17} />
      </button>
      <div
        id="ribbon-command-menu"
        popover="auto"
        role="menu"
        aria-label="Ribbon 创建命令"
        className={s.contextMenu}
        style={{ left: menuAnchor.x, top: menuAnchor.y, margin: 0 }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            const buttons = [...e.currentTarget.querySelectorAll("button")];
            const index = buttons.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            buttons[
              (index + (e.key === "ArrowDown" ? 1 : buttons.length - 1)) %
                buttons.length
            ]?.focus();
          }
        }}
      >
        {(
          [
            { command: "nodeSet", label: "创建节点集合" },
            { command: "step", label: "创建分析步" },
            { command: "domain", label: "创建设计域" },
          ] as const
        ).map((entry) => (
          <button
            key={entry.command}
            role="menuitem"
            onClick={() => {
              rememberDialogTrigger(
                document.getElementById("ribbon-menu-trigger"),
              );
              document.getElementById("ribbon-command-menu")?.hidePopover();
              dispatch({ type: "open", command: entry.command });
            }}
          >
            {entry.label}
          </button>
        ))}
      </div>
    </div>
  );
}
