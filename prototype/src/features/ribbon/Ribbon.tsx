import { ChevronDown, ListTree, PanelBottom, Info } from "lucide-react";
import { rememberDialogTrigger } from "../../components/dialogFocus";
import { useState } from "react";
import { useStore } from "../../app/Store";
import type { Command, Module } from "../../types/domain";
import {
  CAEIcon,
  type CAEIconBadge,
  type CAEIconName,
} from "../../components/CAEIcon";
import s from "../workspace/Workspace.module.css";
type SmallCommand = { label: string; icon: CAEIconName; badge?: CAEIconBadge };
const primary: Record<
  Module,
  { icon: CAEIconName; label: string; command?: Command; small: SmallCommand[] }
> = {
  Part: {
    icon: "part",
    label: "创建部件",
    small: [
      { label: "编辑部件", icon: "part", badge: "edit" },
      { label: "删除部件", icon: "part", badge: "delete" },
    ],
  },
  Property: {
    icon: "material",
    label: "创建材料",
    small: [
      { label: "截面定义", icon: "section" },
      { label: "属性指派", icon: "section", badge: "assign" },
    ],
  },
  Assembly: {
    icon: "instance",
    label: "创建实例",
    small: [
      { label: "平移实例", icon: "instance", badge: "move" },
      { label: "旋转实例", icon: "instance", badge: "rotate" },
    ],
  },
  Step: {
    icon: "step",
    label: "创建分析步",
    command: "step",
    small: [
      { label: "编辑分析步", icon: "step", badge: "edit" },
      { label: "分析步管理", icon: "step", badge: "manage" },
    ],
  },
  Interaction: {
    icon: "interaction",
    label: "创建相互作用",
    small: [
      { label: "接触属性", icon: "interaction", badge: "edit" },
      { label: "约束管理", icon: "interaction", badge: "manage" },
    ],
  },
  Load: {
    icon: "load",
    label: "创建载荷",
    small: [
      { label: "边界条件", icon: "boundary" },
      { label: "载荷管理", icon: "load", badge: "manage" },
    ],
  },
  Mesh: {
    icon: "nodes",
    label: "创建节点集合",
    command: "nodeSet",
    small: [
      { label: "编辑节点集合", icon: "nodes", badge: "edit" },
      { label: "集合管理", icon: "nodes", badge: "manage" },
    ],
  },
  Optimization: {
    icon: "domain",
    label: "创建设计域",
    command: "domain",
    small: [
      { label: "编辑设计域", icon: "domain", badge: "edit" },
      { label: "优化任务管理", icon: "task", badge: "manage" },
    ],
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
  const model = state.models[state.model];
  const selected =
    item.command === "nodeSet"
      ? model.sets.find((v) => v.id === state.selectedTree)
      : item.command === "step"
        ? model.steps.find(
            (v) => v.id === state.selectedTree || v.name === state.step,
          )
        : item.command === "domain"
          ? model.domains.find((v) => v.id === state.selectedTree)
          : undefined;
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
            <CAEIcon
              name={item.icon}
              size={32}
              badge="add"
              hiddenNodes={item.icon === "nodes" ? [3] : undefined}
            />
            <span>{item.label}</span>
          </button>
          <div className={s.smallCommands}>
            {item.small.map(({ label, icon, badge }, i) => (
              <button
                key={label}
                disabled={
                  i !== 0 || !item.command || !selected || !!state.command
                }
                title={
                  i === 0 && item.command
                    ? "选中已有对象后编辑；模型树也支持双击或 F2"
                    : "此命令未纳入首轮原型"
                }
                onClick={() =>
                  item.command &&
                  selected &&
                  dispatch({
                    type: "open",
                    command: item.command,
                    id: selected.id,
                  })
                }
              >
                <CAEIcon name={icon} size={18} badge={badge} />
                {label}
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
            <CAEIcon name="mesh" size={32} />
            <span className={s.splitLabel}>
              生成网格
              <ChevronDown size={10} />
            </span>
          </button>
          <div className={s.smallCommands}>
            <button disabled title="未接入真实网格能力">
              <CAEIcon name="seed" size={18} />
              种子布置
            </button>
            <button disabled title="未接入真实网格能力">
              <CAEIcon name="elementType" size={18} />
              单元类型
            </button>
          </div>
        </div>
        <span className={s.groupCaption}>网格工具 · 待接入</span>
      </div>
      <div className={s.ribbonGroup}>
        <div className={s.ribbonItems}>
          <button className={s.largeCommand} onClick={onFit}>
            <CAEIcon name="fit" size={32} />
            <span>适合窗口</span>
          </button>
          <div className={s.smallCommands}>
            <button onClick={onIso}>
              <CAEIcon name="iso" size={18} />
              等轴测视图
            </button>
            <button disabled title="首轮仅显示一个演示部件">
              <CAEIcon name="part" size={18} badge="view" />
              显示 / 隐藏
              <ChevronDown className={s.caret} size={10} />
            </button>
          </div>
        </div>
        <span className={s.groupCaption}>视图</span>
      </div>
      <div className={s.ribbonGroup}>
        <div className={s.ribbonItems}>
          <div className={s.smallCommands}>
            <button aria-pressed={treeVisible} onClick={onToggleTree}>
              <ListTree size={18} strokeWidth={1.5} />
              模型树
            </button>
            <button aria-pressed={logVisible} onClick={onToggleLog}>
              <PanelBottom size={18} strokeWidth={1.5} />
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
              <CAEIcon name={i.icon} size={32} />
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
