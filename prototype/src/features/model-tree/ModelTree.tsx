import { rememberDialogTrigger } from "../../components/dialogFocus";
import { useEffect, useState, useRef } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Box,
  Folder,
  Layers,
  X,
  Workflow,
} from "lucide-react";
import { useStore } from "../../app/Store";
import { CAEIcon, type CAEIconName } from "../../components/CAEIcon";
import type { Command } from "../../types/domain";
import s from "../workspace/Workspace.module.css";
interface Group {
  id: string;
  label: string;
  icon: CAEIconName;
  command?: Command;
  children: { id: string; name: string }[];
}
export function ModelTree({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const treeRef = useRef<HTMLDivElement>(null);
  const focusedId = useRef("");
  const model = state.models[state.model],
    empty = state.model === "Model-Empty";
  const [tab, setTab] = useState("model"),
    [search, setSearch] = useState(""),
    [expanded, setExpanded] = useState([
      "parts",
      "sets",
      "steps",
      "optimization",
      "task",
    ]);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    command?: Command;
  } | null>(null);
  useEffect(() => {
    const close = () => setMenu(null),
      escape = (e: KeyboardEvent) => {
        if (e.key === "Escape") close();
      };
    document.addEventListener("click", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const groups: Group[] = [
    {
      id: "parts",
      label: "部件",
      icon: "part",
      children: empty ? [] : [{ id: "part", name: "Part-1 · 安装支架" }],
    },
    { id: "materials", label: "材料", icon: "material", children: [] },
    { id: "sections", label: "截面", icon: "section", children: [] },
    {
      id: "assembly",
      label: "装配",
      icon: "instance",
      children: empty ? [] : [{ id: "instance", name: "Bracket-1" }],
    },
    {
      id: "steps",
      label: "分析步",
      icon: "step",
      command: "step",
      children: [
        { id: "initial", name: "Initial" },
        ...model.steps.map((v) => ({ id: v.id, name: v.name })),
      ],
    },
    { id: "interactions", label: "相互作用", icon: "interaction", children: [] },
    { id: "loads", label: "载荷", icon: "load", children: [] },
    { id: "boundaries", label: "边界条件", icon: "boundary", children: [] },
    {
      id: "sets",
      label: "节点集合",
      icon: "nodes",
      command: "nodeSet",
      children: model.sets.map((v) => ({ id: v.id, name: v.name })),
    },
    { id: "elements", label: "单元集合", icon: "elements", children: [] },
    {
      id: "optimization",
      label: "优化任务",
      icon: "task",
      command: "domain",
      children: empty ? [] : [{ id: "task", name: "Task-1 · 拓扑优化" }],
    },
  ];
  const matches = (g: Group) =>
    !search ||
    g.label.includes(search) ||
    g.children.some((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()),
    ) ||
    (g.id === "optimization" &&
      model.domains.some((domain) =>
        domain.name.toLowerCase().includes(search.toLowerCase()),
      ));
  const editObject = (id: string, trigger: HTMLElement) => {
    const command = model.sets.some((v) => v.id === id)
      ? "nodeSet"
      : model.steps.some((v) => v.id === id)
        ? "step"
        : model.domains.some((v) => v.id === id)
          ? "domain"
          : null;
    if (!command) return;
    rememberDialogTrigger(trigger);
    dispatch({ type: "open", command, id });
  };
  useEffect(() => {
    const items = Array.from(
      treeRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="treeitem"]',
      ) ?? [],
    );
    const current =
      items.find((item) => item.dataset.id === focusedId.current) ?? items[0];
    items.forEach((item) => {
      item.tabIndex = item === current ? 0 : -1;
    });
    if (current) focusedId.current = current.dataset.id ?? "";
  });
  return (
    <aside className={s.sidebar} aria-label="模型导航">
      <div className={s.treeTabs} role="tablist" aria-label="导航树类型">
        <button
          role="tab"
          aria-selected={tab === "model"}
          aria-controls="tree-panel"
          id="model-tab"
          onClick={() => setTab("model")}
        >
          模型
        </button>
        <button
          role="tab"
          aria-selected={tab === "result"}
          aria-controls="tree-panel"
          id="result-tab"
          onClick={() => setTab("result")}
        >
          结果
        </button>
        <button className={s.iconButton} title="收起模型树" onClick={onClose}>
          <X size={13} />
        </button>
      </div>
      <div
        className={s.treeContent}
        id="tree-panel"
        role="tabpanel"
        aria-labelledby={tab === "model" ? "model-tab" : "result-tab"}
      >
        {tab === "result" ? (
          <div className={s.resultEmpty}>
            <Workflow size={27} />
            <strong>暂无计算结果</strong>
            <p>
              当前原型未连接求解器。
              <br />
              切换到模型树体验配置流程。
            </p>
          </div>
        ) : (
          <>
            <div className={s.treeSearch}>
              <Search size={13} />
              <input
                aria-label="搜索模型树"
                value={search}
                placeholder="搜索对象…"
                onChange={(e) => setSearch(e.target.value)}
              />
              <kbd>⌕</kbd>
            </div>
            <div className={s.treeRoot}>
              <Layers size={15} />
              <strong>{state.model}</strong>
              <span>演示</span>
              <button
                id="tree-menu-trigger"
                title="创建对象菜单"
                aria-expanded={!!menu}
                onClick={(e) => {
                  e.stopPropagation();
                  const r = e.currentTarget.getBoundingClientRect();
                  setMenu({ x: r.left, y: r.bottom });
                }}
              >
                <Plus size={14} />
              </button>
            </div>
            <div
              ref={treeRef}
              role="tree"
              aria-label="模型对象"
              className={s.tree}
              onFocus={(e) => {
                const target = e.target as HTMLElement;
                if (target.getAttribute("role") !== "treeitem") return;
                focusedId.current = target.dataset.id ?? "";
                treeRef.current
                  ?.querySelectorAll<HTMLElement>('[role="treeitem"]')
                  .forEach((item) => {
                    item.tabIndex = item === target ? 0 : -1;
                  });
              }}
              onKeyDown={(e) => {
                const target = e.target as HTMLElement;
                if (target.getAttribute("role") !== "treeitem") return;
                const items = Array.from(
                  treeRef.current!.querySelectorAll<HTMLElement>(
                    '[role="treeitem"]',
                  ),
                );
                const index = items.indexOf(target);
                const id = target.dataset.id!;
                let next: HTMLElement | undefined;
                if (e.key === "ArrowDown")
                  next = items[Math.min(items.length - 1, index + 1)];
                else if (e.key === "ArrowUp")
                  next = items[Math.max(0, index - 1)];
                else if (e.key === "Home") next = items[0];
                else if (e.key === "End") next = items.at(-1);
                else if (e.key === "ArrowRight") {
                  if (target.getAttribute("aria-expanded") === "false")
                    setExpanded([...expanded, id]);
                  else if (items[index + 1]?.dataset.parent === id)
                    next = items[index + 1];
                } else if (e.key === "ArrowLeft") {
                  if (
                    target.getAttribute("aria-expanded") === "true" &&
                    !search
                  )
                    setExpanded(expanded.filter((v) => v !== id));
                  else
                    next = items.find(
                      (item) => item.dataset.id === target.dataset.parent,
                    );
                } else if (e.key === "F2") editObject(id, target);
                else return;
                e.preventDefault();
                next?.focus();
              }}
              onDoubleClick={(e) => {
                const target = (e.target as HTMLElement).closest<HTMLElement>(
                  '[role="treeitem"]',
                );
                if (target) editObject(target.dataset.id!, target);
              }}
              onContextMenu={(e) => {
                const target = (e.target as HTMLElement).closest<HTMLElement>(
                  '[role="treeitem"]',
                );
                if (target && !groups.some((g) => g.id === target.dataset.id)) {
                  e.preventDefault();
                  editObject(target.dataset.id!, target);
                }
              }}
            >
              {groups.filter(matches).map((group) => {
                const open = expanded.includes(group.id) || !!search;
                return (
                  <div key={group.id}>
                    <div
                      className={s.treeRow}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (group.command && !empty)
                          setMenu({
                            x: e.clientX,
                            y: e.clientY,
                            command: group.command,
                          });
                      }}
                    >
                      <button
                        role="treeitem"
                        data-id={group.id}
                        aria-level={1}
                        tabIndex={-1}
                        aria-expanded={open}
                        onClick={() =>
                          setExpanded(
                            open
                              ? expanded.filter((x) => x !== group.id)
                              : [...expanded, group.id],
                          )
                        }
                      >
                        {open ? (
                          <ChevronDown size={12} />
                        ) : (
                          <ChevronRight size={12} />
                        )}
                        <CAEIcon name={group.icon} size={16} />
                        <span>{group.label}</span>
                        <small>{group.children.length}</small>
                      </button>
                      {group.command && !empty && (
                        <button
                          className={s.treeCreate}
                          tabIndex={-1}
                          disabled={!!state.command}
                          aria-label={`从树创建${group.id === "steps" ? "分析步" : group.id === "sets" ? "节点集合" : "设计域"}`}
                          title="创建"
                          onClick={() =>
                            dispatch({ type: "open", command: group.command! })
                          }
                        >
                          <Plus size={12} />
                        </button>
                      )}
                    </div>
                    {open && group.children.length > 0 && (
                      <div role="group">
                        {group.children
                          .filter(
                            (c) =>
                              !search ||
                              group.label.includes(search) ||
                              (group.id === "optimization" &&
                                model.domains.some((domain) =>
                                  domain.name
                                    .toLowerCase()
                                    .includes(search.toLowerCase()),
                                )) ||
                              c.name
                                .toLowerCase()
                                .includes(search.toLowerCase()),
                          )
                          .map((c) => (
                            <button
                              key={c.id}
                              role="treeitem"
                              data-id={c.id}
                              data-parent={group.id}
                              aria-level={2}
                              tabIndex={-1}
                              aria-selected={state.selectedTree === c.id}
                              aria-expanded={
                                c.id === "task"
                                  ? expanded.includes("task") || !!search
                                  : undefined
                              }
                              aria-owns={
                                c.id === "task" &&
                                (expanded.includes("task") || !!search) &&
                                model.domains.length
                                  ? "task-domains"
                                  : undefined
                              }
                              className={s.treeChild}
                              title={c.name}
                              onClick={() => {
                                dispatch({ type: "tree", value: c.id });
                                if (c.id === "task")
                                  setExpanded(
                                    expanded.includes("task")
                                      ? expanded.filter((id) => id !== "task")
                                      : [...expanded, "task"],
                                  );
                                if (group.id === "steps")
                                  dispatch({ type: "step", value: c.name });
                              }}
                            >
                              <span className={s.treeLine} />
                              {group.id === "optimization" ? (
                                <Folder size={13} />
                              ) : (
                                <Box size={13} />
                              )}
                              <span>{c.name}</span>
                            </button>
                          ))}
                        {group.id === "optimization" &&
                          (expanded.includes("task") || !!search) &&
                          model.domains.length > 0 && (
                            <div
                              id="task-domains"
                              role="group"
                              aria-label="Task-1 设计域"
                              className={s.domainChildren}
                            >
                              {model.domains
                                .filter(
                                  (domain) =>
                                    !search ||
                                    domain.name
                                      .toLowerCase()
                                      .includes(search.toLowerCase()) ||
                                    group.label.includes(search),
                                )
                                .map((domain) => (
                                  <button
                                    key={domain.id}
                                    role="treeitem"
                                    data-id={domain.id}
                                    data-parent="task"
                                    aria-level={3}
                                    tabIndex={-1}
                                    className={s.treeChild}
                                    aria-selected={
                                      state.selectedTree === domain.id
                                    }
                                    onClick={() =>
                                      dispatch({
                                        type: "tree",
                                        value: domain.id,
                                      })
                                    }
                                    title={domain.name}
                                  >
                                    <span className={s.treeLine} />
                                    <CAEIcon name="domain" size={13} />
                                    <span>{domain.name}</span>
                                  </button>
                                ))}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {!groups.some(matches) && (
              <p className={s.noMatch}>未找到匹配对象</p>
            )}
          </>
        )}
      </div>
      <div className={s.treeFoot}>
        <span>
          <i />
          会话内数据
        </span>
        <MoreHorizontal size={15} />
      </div>
      {menu && (
        <div
          className={s.contextMenu}
          style={{
            left: Math.min(menu.x, window.innerWidth - 200),
            top: Math.min(menu.y, window.innerHeight - 130),
          }}
          role="menu"
          aria-label="创建对象"
        >
          {(
            [
              { command: "nodeSet", label: "创建节点集合" },
              { command: "step", label: "创建分析步" },
              { command: "domain", label: "创建设计域" },
            ] as const
          )
            .filter((i) => !menu.command || menu.command === i.command)
            .map((i) => (
              <button
                role="menuitem"
                key={i.command}
                disabled={empty}
                onClick={() => {
                  rememberDialogTrigger(
                    document.getElementById("tree-menu-trigger"),
                  );
                  dispatch({ type: "open", command: i.command });
                }}
              >
                {i.label}
              </button>
            ))}
        </div>
      )}
    </aside>
  );
}
