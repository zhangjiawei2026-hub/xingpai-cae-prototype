import { moveFocus } from "../../components/keyboard";
import { ChevronDown } from "lucide-react";
import { rememberDialogTrigger } from "../../components/dialogFocus";
import { useState } from "react";
import { useStore } from "../../app/Store";
import { CAEIcon } from "../../components/CAEIcon";
import type { ResultKind } from "../results/topologyResult";
import { modelingRibbon } from "./modelingRibbon";
import s from "../workspace/Workspace.module.css";
export function Ribbon({
  onLoad,
  onOpenResults,
  onFit,
  onIso,
  onToggleTree,
  onToggleLog,
  treeVisible,
  logVisible,
}: {
  onLoad: () => void;
  onOpenResults: (kind: ResultKind) => void;
  onFit: () => void;
  onIso: () => void;
  onToggleTree: () => void;
  onToggleLog: () => void;
  treeVisible: boolean;
  logVisible: boolean;
}) {
  const { state, dispatch } = useStore();
  const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 });
  if (state.module === "Results") return null;
  const model = state.models[state.model];
  const empty = state.model === "Model-Empty";
  const locked = empty || !!state.command;
  const edits = {
    editNodeSet: {
      command: "nodeSet",
      id: model.sets.find((item) => item.id === state.selectedTree)?.id,
    },
    editStep: {
      command: "step",
      id: model.steps.find((item) => item.id === state.selectedTree)?.id,
    },
    editDomain: {
      command: "domain",
      id: model.domains.find((item) => item.id === state.selectedTree)?.id,
    },
  } as const;
  const actions = {
    nodeSet: () => dispatch({ type: "open", command: "nodeSet" }),
    step: () => dispatch({ type: "open", command: "step" }),
    domain: () => dispatch({ type: "open", command: "domain" }),
    load: onLoad,
    topologyResult: () => onOpenResults("topology"),
    structuralResult: () => onOpenResults("structural"),
  } satisfies Record<string, () => void>;
  return (
    <div className={s.ribbon} aria-label="Ribbon 功能区">
      {modelingRibbon[state.module].map(({ label, columns }) => (
        <div
          className={s.ribbonGroup}
          role="group"
          aria-label={label}
          key={label}
        >
          <div className={s.ribbonItems}>
            {columns.map(({ size, commands }) => (
              <div
                className={size === "small" ? s.smallCommands : s.largeColumn}
                key={commands[0].label}
              >
                {commands.map(({ label, icon, badge, action, reason }) => {
                  const selected =
                    action && action in edits
                      ? edits[action as keyof typeof edits]
                      : undefined;
                  const edit = selected?.id
                    ? () =>
                        dispatch({
                          type: "open",
                          command: selected.command,
                          id: selected.id,
                        })
                    : undefined;
                  const run = selected
                    ? edit
                    : action
                      ? actions[action as keyof typeof actions]
                      : undefined;
                  const unavailable =
                    selected && !selected.id
                      ? "请先在模型树中选中要编辑的对象"
                      : (reason ?? "当前原型仅展示入口");
                  const reviewResult =
                    action === "topologyResult" ||
                    action === "structuralResult";
                  return (
                    <button
                      key={label}
                      className={size === "large" ? s.largeCommand : undefined}
                      onClick={run}
                      disabled={
                        !run || !!state.command || (empty && !reviewResult)
                      }
                      data-reference={!action || undefined}
                      title={run ? label : `${label} · ${unavailable}`}
                    >
                      <CAEIcon
                        name={icon}
                        size={size === "large" ? 32 : 18}
                        badge={badge}
                      />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className={s.ribbonGroup} role="group" aria-label="视图">
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
            <button
              disabled
              data-reference
              title="显示 / 隐藏 · 原型仅显示一个演示部件"
            >
              <CAEIcon name="part" size={18} badge="view" />
              显示 / 隐藏
              <ChevronDown className={s.caret} size={10} />
            </button>
          </div>
        </div>
      </div>
      <div className={s.ribbonGroup} role="group" aria-label="工作区">
        <div className={s.ribbonItems}>
          <div className={s.smallCommands}>
            <button aria-pressed={treeVisible} onClick={onToggleTree}>
              <CAEIcon name="treePanel" size={18} />
              模型树
            </button>
            <button aria-pressed={logVisible} onClick={onToggleLog}>
              <CAEIcon name="logPanel" size={18} />
              信息窗口
            </button>
          </div>
        </div>
      </div>
      <div
        className={`${s.ribbonGroup} ${s.demoCommands}`}
        role="group"
        aria-label="代表性流程"
      >
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
              disabled={locked}
              onClick={() => dispatch({ type: "open", command: i.command })}
            >
              <CAEIcon name={i.icon} size={32} />
              <span>{i.label}</span>
            </button>
          ))}
          <button
            className={s.commandDropdown}
            id="ribbon-menu-trigger"
            aria-label="创建命令下拉菜单"
            popoverTarget="ribbon-command-menu"
            disabled={locked}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setMenuAnchor({
                x: Math.min(rect.left, window.innerWidth - 165),
                y: rect.bottom + 4,
              });
            }}
          >
            <ChevronDown size={12} />
          </button>
        </div>
      </div>
      <div
        id="ribbon-command-menu"
        popover="auto"
        role="menu"
        aria-label="Ribbon 创建命令"
        className={s.contextMenu}
        style={{ left: menuAnchor.x, top: menuAnchor.y, margin: 0 }}
        onToggle={(e) => {
          if (e.newState === "open")
            e.currentTarget.querySelector<HTMLButtonElement>("button")?.focus();
        }}
        onKeyDown={(e) => {
          moveFocus(e, "menuitem");
          if (e.key === "Escape" || e.key === "Tab") {
            e.preventDefault();
            e.currentTarget.hidePopover();
            document.getElementById("ribbon-menu-trigger")?.focus();
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
