import { moveFocus } from "../../components/keyboard";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  FileBox,
  RefreshCcw,
  Terminal,
  Info,
  ChevronsUpDown,
  FolderOpen,
  Save,
  Undo2,
  Redo2,
  Focus,
  RotateCcw,
  Ruler,
} from "lucide-react";
import { useStore } from "../../app/Store";
import { AiPanel } from "../ai-chat/AiPanel";
import { DockLayout } from "./DockLayout";
import { ModuleBar } from "./ModuleBar";
import { QuickToolbar } from "./QuickToolbar";
import { WorkspaceMenu } from "./WorkspaceMenu";
import type { WorkspaceCommand, CommandGroup, Menu } from "./workspaceCommands";
import { CAEIcon, type CAEIconName } from "../../components/CAEIcon";
import type { Command } from "../../types/domain";
import { Ribbon } from "../ribbon/Ribbon";
import { ResultIconReview } from "../results/ResultIconReview";
import { ResultRibbon } from "../results/ResultRibbon";
import { ResultViewport } from "../results/ResultViewport";
import { useResultReview } from "../results/resultState";
import type { ResultKind } from "../results/topologyResult";
import { ModelTree, initialTreeView } from "../model-tree/ModelTree";
import { Viewport, type ViewportControls } from "../../viewport/Viewport";
import type { ModelDisplay, ViewMode } from "../../viewport/adapter";
import { NodeSetDialog } from "../node-set/NodeSetDialog";
import { StepDialog } from "../analysis-step/StepDialog";
import { DomainDialog } from "../design-domain/DomainDialog";
import { Dialog, formStyles } from "../../components/Dialog";
import s from "./Workspace.module.css";
import { LoadDialog, type LoadDraft } from "../load/LoadDialog";
import { workspaceContext } from "./context";
function Help({ close }: { close: () => void }) {
  return (
    <Dialog
      onDismiss={close}
      title="SiPESC.PRE 交互原型"
      subtitle="第一轮 · 视觉与操作流程评审"
      footer={
        <button className={formStyles.primary} onClick={close}>
          知道了
        </button>
      }
    >
      <div className={s.helpText}>
        <p>
          已提供主界面、Ribbon 大小混排、模型树、三维演示模型及三条配置流程。
        </p>
        <ol>
          <li>
            <b>节点集合</b>：从 Ribbon 或模型树进入，拾取节点或读取已有集合。
          </li>
          <li>
            <b>分析步</b>：先选择类型，再配置参数并创建演示对象。
          </li>
          <li>
            <b>设计域</b>：拾取单元、编辑尺寸、切换页签并体验基准点选择。
          </li>
        </ol>
        <p>
          数据仅保留在本次会话，刷新后恢复初始状态。模型和选择 ID
          为程序生成的显示网格，未接入真实 FEM 数据或求解器。
        </p>
        <p>
          标记为未接入的命令仅提供原因说明；专业图标待确认。Windows
          桌面集成尚未验证。
        </p>
      </div>
    </Dialog>
  );
}
export function Workspace() {
  const { state, dispatch } = useStore();
  const resultModule = state.module === "Results";
  const review = useResultReview(resultModule);
  const [resultWire, setResultWire] = useState(false);
  const viewport = useRef<ViewportControls>(null);
  const [modelView, setModelView] = useState<ViewMode | null>("iso");
  const [modelDisplay, setModelDisplay] = useState<ModelDisplay>("edges");
  const [selectionCount, setSelectionCount] = useState(0);
  const resultProbe = review.result.probe;
  const hasResultLegend =
    review.kind === "topology"
      ? review.topology.display === "density"
      : review.result.cloud;
  const exitResultProbe = review.exitProbe;
  const [treeView, setTreeView] = useState(initialTreeView);
  const [loadOpen, setLoadOpen] = useState(false);
  const [loads, setLoads] = useState<Record<string, LoadDraft>>({});
  const [aiVisible, setAiVisible] = useState(false);
  const [aiDrafts, setAiDrafts] = useState<Record<string, string>>({});
  const [resetPending, setResetPending] = useState(false);
  const [treeVisible, setTreeVisible] = useState(true),
    [logVisible, setLogVisible] = useState(true),
    [help, setHelp] = useState(false),
    [logTab, setLogTab] = useState("messages");
  const logEnd = useRef<HTMLDivElement>(null);
  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: "nearest" });
  }, [state.logs]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key !== "Escape" ||
        e.defaultPrevented ||
        document.querySelector("dialog[open]")
      )
        return;
      if (resultModule && resultProbe) {
        e.preventDefault();
        exitResultProbe();
        return;
      }
      if (state.selection) {
        e.preventDefault();
        e.stopPropagation();
        dispatch({ type: "pickCancel" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.selection, dispatch, resultModule, resultProbe, exitResultProbe]);
  const context = workspaceContext(state);
  const openResults = (kind: ResultKind) => {
    review.chooseKind(kind);
    dispatch({ type: "module", value: "Results" });
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLSelectElement>('[aria-label="结果类型"]')
        ?.focus(),
    );
  };
  const viewAction = (action: "fit" | "iso" | "zoomIn" | "zoomOut") => {
    if (action === "fit") viewport.current?.fit();
    else if (action === "iso") viewport.current?.orient("iso");
    else viewport.current?.zoom(action === "zoomIn" ? 0.85 : 1.15);
  };
  const resetView = () => {
    if (resultModule) {
      setResultWire(false);
      review.change({
        layout: "single",
        activePane: 0,
        cut: false,
        plane: "XY",
        offset: 0,
        flip: false,
      });
    } else {
      viewport.current?.orient("iso");
      setModelDisplay("edges");
    }
  };
  const modelOnlyReason = "在建模模块可用";
  const cameraReason = "结果视图使用二维示意网格";
  const canChangeCamera = !resultModule && state.model !== "Model-Empty";
  const unavailableCamera = resultModule ? cameraReason : "当前模型没有部件";
  const canEditModel = canChangeCamera && !state.command;
  const model = state.models[state.model];
  const editCommands = [
    { objects: model.sets, command: "nodeSet" },
    { objects: model.steps, command: "step" },
    { objects: model.domains, command: "domain" },
  ] as const;
  const edit = editCommands.find(({ objects }) =>
    objects.some(({ id }) => id === state.selectedTree),
  );
  const open = (command: Command) => dispatch({ type: "open", command });
  const toggleTree = () => setTreeVisible(!treeVisible);
  const toggleLog = () => setLogVisible(!logVisible);
  const toggleAi = () => setAiVisible(!aiVisible);
  const fileCommands = [
    { label: "打开文件", icon: <FolderOpen size={17} /> },
    { label: "保存工程", icon: <Save size={17} /> },
    {
      label: "导入 INP 模型",
      icon: <CAEIcon name="part" size={19} badge="assign" />,
    },
  ] satisfies WorkspaceCommand[];
  const historyCommands = [
    { label: "撤销", icon: <Undo2 size={17} /> },
    { label: "重做", icon: <Redo2 size={17} /> },
  ] satisfies WorkspaceCommand[];
  const directions = [
    ["iso", "等轴测视图", "viewIso"],
    ["front", "前视图", "viewFront"],
    ["back", "后视图", "viewBack"],
    ["left", "左视图", "viewLeft"],
    ["right", "右视图", "viewRight"],
    ["top", "顶视图", "viewTop"],
    ["bottom", "底视图", "viewBottom"],
  ] as const satisfies readonly (readonly [ViewMode, string, CAEIconName])[];
  const navigation: CommandGroup = {
    label: "视图导航",
    commands: [
      {
        label: "适合窗口",
        icon: <CAEIcon name="fit" size={19} />,
        run: canChangeCamera ? () => viewAction("fit") : undefined,
        unavailable: resultModule ? "示意网格自动适配" : unavailableCamera,
      },
      {
        label: "聚焦当前节点",
        icon: <Focus size={17} />,
        unavailable: resultModule ? cameraReason : "节点聚焦待接入",
      },
      {
        label: "重置视图",
        icon: <RotateCcw size={17} />,
        run: resultModule || canChangeCamera ? resetView : undefined,
        unavailable: unavailableCamera,
      },
    ],
  };
  const standardViews: CommandGroup = {
    label: "标准视图",
    commands: directions.map(([mode, label, icon]) => ({
      label,
      icon: <CAEIcon name={icon} size={19} />,
      run: canChangeCamera ? () => viewport.current?.orient(mode) : undefined,
      unavailable: unavailableCamera,
      pressed: canChangeCamera ? modelView === mode : undefined,
    })),
  };
  const displayReady = resultModule || canChangeCamera;
  const displayControl = resultModule ? hasResultLegend : canChangeCamera;
  const solid = resultModule ? !resultWire : modelDisplay === "solid";
  const wire = resultModule ? resultWire : modelDisplay === "wire";
  const display: CommandGroup = {
    label: "显示方式",
    commands: [
      {
        label: "实体显示",
        icon: <CAEIcon name="part" size={19} />,
        pressed: displayReady && solid,
        unavailable: unavailableCamera,
        run: displayReady
          ? () =>
              resultModule ? setResultWire(false) : setModelDisplay("solid")
          : undefined,
      },
      {
        label: "线框显示",
        icon: <CAEIcon name="wireframe" size={19} />,
        pressed: displayReady && wire,
        unavailable: unavailableCamera,
        run: displayReady
          ? () => (resultModule ? setResultWire(true) : setModelDisplay("wire"))
          : undefined,
      },
      {
        label: "显示控制",
        icon: <CAEIcon name="resultLegend" size={19} />,
        pressed:
          displayControl &&
          (resultModule ? review.result.legend : modelDisplay === "edges"),
        unavailable: resultModule
          ? "当前显示方式没有色阶图例"
          : unavailableCamera,
        run: displayControl
          ? () => {
              if (resultModule)
                review.change({ legend: !review.result.legend });
              else
                setModelDisplay(modelDisplay === "edges" ? "solid" : "edges");
            }
          : undefined,
      },
    ],
  };
  const measure: CommandGroup = {
    label: "测量",
    commands: [{ label: "测量", icon: <Ruler size={17} /> }],
  };
  const panels: CommandGroup = {
    label: "面板显隐",
    commands: [
      {
        label: "模型树",
        icon: <CAEIcon name="treePanel" size={19} />,
        pressed: treeVisible,
        run: toggleTree,
      },
      {
        label: "信息窗口",
        icon: <CAEIcon name="logPanel" size={19} />,
        pressed: logVisible,
        run: toggleLog,
      },
    ],
  };
  const createCommands = [
    { label: "创建节点集合", command: "nodeSet", icon: "nodes" },
    { label: "创建分析步", command: "step", icon: "step" },
    { label: "创建设计域", command: "domain", icon: "domain" },
  ] as const;
  const create: CommandGroup = {
    label: "创建对象",
    commands: createCommands.map(({ label, command, icon }) => ({
      label,
      icon: <CAEIcon name={icon} size={20} badge="add" />,
      run: canEditModel ? () => open(command) : undefined,
      unavailable: resultModule
        ? modelOnlyReason
        : state.command
          ? "请先结束当前命令"
          : unavailableCamera,
    })),
  };
  const zoomControls: CommandGroup = {
    label: "视图缩放",
    commands: [
      {
        label: "放大模型",
        icon: <CAEIcon name="zoomIn" size={19} />,
        run: canChangeCamera ? () => viewAction("zoomIn") : undefined,
        unavailable: unavailableCamera,
      },
      {
        label: "缩小模型",
        icon: <CAEIcon name="zoomOut" size={19} />,
        run: canChangeCamera ? () => viewAction("zoomOut") : undefined,
        unavailable: unavailableCamera,
      },
    ],
  };
  const quickGroups = [
    { label: "文件", commands: fileCommands },
    { label: "编辑", commands: historyCommands },
    navigation,
    standardViews,
    display,
    measure,
    ...(!resultModule ? [create, zoomControls] : []),
    panels,
  ];
  const recover = {
    label: "恢复初始演示",
    run: state.command ? undefined : () => setResetPending(true),
    unavailable: "请先结束当前命令",
  };
  const selectionTools: CommandGroup = {
    label: "选择",
    commands: [
      {
        label: "选择对象",
        run: canEditModel
          ? () =>
              requestAnimationFrame(() =>
                viewport.current?.focusSelectionType(),
              )
          : undefined,
        unavailable: resultModule ? modelOnlyReason : "当前无法选择对象",
      },
      {
        label: "选择方式",
        run: canEditModel
          ? () =>
              requestAnimationFrame(() =>
                viewport.current?.openSelectionMethods(),
              )
          : undefined,
        unavailable: resultModule ? modelOnlyReason : "当前无法选择对象",
      },
      {
        label: "清除选择",
        run: canEditModel && selectionCount > 0
          ? () => viewport.current?.clearSelection()
          : undefined,
        unavailable: resultModule ? modelOnlyReason : "当前无可清除的选择",
      },
    ],
  };
  const menus: Menu[] = [
    {
      label: "文件",
      groups: [
        {
          label: "工程",
          commands: [fileCommands[0], fileCommands[1], { label: "另存为" }],
        },
        {
          label: "导入",
          commands: [
            fileCommands[2],
            { label: "导入几何" },
            { label: "导入网格" },
          ],
        },
        { label: "演示", commands: [recover] },
      ],
    },
    {
      label: "编辑",
      groups: [
        {
          label: "编辑操作",
          commands: [
            ...historyCommands,
            {
              label: "编辑选中对象",
              run:
                canEditModel && edit
                  ? () =>
                      dispatch({
                        type: "open",
                        command: edit.command,
                        id: state.selectedTree,
                      })
                  : undefined,
              unavailable: resultModule
                ? modelOnlyReason
                : "请先选中可编辑的模型对象",
            },
          ],
        },
      ],
    },
    {
      label: "视图",
      groups: [
        navigation,
        standardViews,
        display,
        {
          label: "窗口显示",
          commands: [
            ...panels.commands,
            { label: "AI 对话", pressed: aiVisible, run: toggleAi },
          ],
        },
        measure,
      ],
    },
    {
      label: "工具",
      groups: [
        {
          label: "集合与表面",
          commands: [
            create.commands[0],
            { label: "单元集合" },
            { label: "表面" },
          ],
        },
        { label: "坐标系", commands: [{ label: "节点局部坐标系" }] },
        selectionTools,
        { label: "原型演示辅助", commands: [create.commands[2], recover] },
        ...(resultModule
          ? [
              {
                label: "结果查看",
                commands: [
                  {
                    label: review.result.probe
                      ? "退出结果探针"
                      : "启动结果探针",
                    run: () => review.change({ probe: !review.result.probe }),
                  },
                ],
              },
            ]
          : []),
      ],
    },
  ];
  return (
    <div className={s.app}>
      <div className={s.menubar}>
        <WorkspaceMenu
          menus={menus}
          help={() => setHelp(true)}
          helpDisabled={!!state.command}
        />
        <span className={s.menuDivider} />
        <button
          title="恢复初始演示"
          disabled={!!state.command}
          onClick={() => setResetPending(true)}
        >
          <RefreshCcw size={13} />
        </button>
        <span className={s.breadcrumb}>
          <FolderOpen size={12} />
          演示工程<span>/</span>
          <span>{state.model}</span>
        </span>
        <label className={s.projectSwitch}>
          <span>项目 / 模型</span>
          <select
            aria-label="当前模型"
            value={state.model}
            disabled={!!state.command}
            onChange={(e) => dispatch({ type: "model", value: e.target.value })}
          >
            {Object.keys(state.models).map((model) => (
              <option key={model}>{model}</option>
            ))}
          </select>
        </label>
        <span className={s.menuSession}>
          本次会话 <Check size={11} />
        </span>
      </div>
      <ModuleBar />
      {resultModule ? (
        <ResultRibbon review={review} />
      ) : (
        <Ribbon
          onLoad={() => setLoadOpen(true)}
          onOpenResults={openResults}
          onFit={() => viewAction("fit")}
          onIso={() => viewAction("iso")}
          onToggleTree={() => setTreeVisible(!treeVisible)}
          onToggleLog={() => setLogVisible(!logVisible)}
          treeVisible={treeVisible}
          logVisible={logVisible}
        />
      )}
      <QuickToolbar groups={quickGroups} result={resultModule} />
      <div className={s.contextbar} data-testid="workspace-context">
        {!treeVisible && (
          <button
            className={s.iconButton}
            title="展开模型树"
            onClick={() => setTreeVisible(true)}
          >
            <CAEIcon name="treePanel" size={16} />
          </button>
        )}
        <span>{context.moduleLabel}</span>
        {context.kind === "model" && <span>{state.model}</span>}
        {context.kind === "part" && (
          <label>
            <span>部件</span>
            <select
              aria-label="当前部件"
              disabled={state.model === "Model-Empty" || !!state.command}
            >
              <option>
                {state.model === "Model-Empty" ? "无部件" : "Part-1"}
              </option>
            </select>
          </label>
        )}
        {context.kind === "step" && (
          <label>
            <span>分析步</span>
            <select
              aria-label="当前分析步"
              value={state.step}
              disabled={!!state.command}
              onChange={(e) =>
                dispatch({ type: "step", value: e.target.value })
              }
            >
              <option>Initial</option>
              {state.models[state.model].steps.map((v) => (
                <option key={v.id}>{v.name}</option>
              ))}
            </select>
          </label>
        )}
        {context.kind === "task" && (
          <label>
            <span>优化任务</span>
            <select
              aria-label="当前优化任务"
              disabled={state.model === "Model-Empty" || !!state.command}
            >
              <option>{context.value}</option>
            </select>
          </label>
        )}
        <div className={s.selectionSummary}>
          <span className={state.selection ? s.selectDot : s.idleDot} />
          <span>
            {state.selection
              ? `选择中 · ${state.selection.entity}`
              : "未激活选择"}
          </span>
          {state.selection && <b>{state.selection.ids.length} 项</b>}
        </div>
        {resultModule && <ResultIconReview />}
        <button
          className={s.iconButton}
          aria-pressed={aiVisible}
          onClick={() => setAiVisible(!aiVisible)}
        >
          AI 对话
        </button>
      </div>
      <DockLayout tree={treeVisible ? <ModelTree onClose={() => setTreeVisible(false)} viewState={treeView} onOpenResults={() => openResults(review.kind)} onViewChange={changes => setTreeView(previous => ({ ...previous, ...changes }))} /> : null} viewport={<>
        <div className={s.modelViewport} hidden={resultModule}><Viewport ref={viewport} display={modelDisplay} setDisplay={setModelDisplay} view={modelView} setView={setModelView} onSelectionCount={setSelectionCount} /></div>
        {resultModule && <ResultViewport review={review} wire={resultWire} />}
      </>} log={logVisible ? (
            <section className={s.log} aria-label="信息窗口">
              <header>
                <div
                  role="tablist"
                  aria-label="信息类型"
                  onKeyDown={(e) => moveFocus(e, "tab")}
                >
                  <button
                    role="tab"
                    aria-selected={logTab === "messages"}
                    tabIndex={logTab === "messages" ? 0 : -1}
                    onClick={() => setLogTab("messages")}
                  >
                    <Terminal size={13} />
                    消息<span>{state.logs.length}</span>
                  </button>
                  <button
                    role="tab"
                    aria-selected={logTab === "guide"}
                    tabIndex={logTab === "guide" ? 0 : -1}
                    onClick={() => setLogTab("guide")}
                  >
                    操作指引
                  </button>
                </div>
                <button
                  title="收起信息窗口"
                  onClick={() => setLogVisible(false)}
                >
                  <ChevronsUpDown size={12} />
                </button>
              </header>
              <div className={s.logBody} role="log">
                {logTab === "messages" ? (
                  state.logs.map((message, index) => (
                    <div key={index}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <i
                        className={
                          index === state.logs.length - 1 ? s.latest : ""
                        }
                      />
                      {message}
                    </div>
                  ))
                ) : (
                  <div className={s.guide}>
                    <Info size={13} />
                    先选择模块和上下文，再从 Ribbon 或模型树创建对象。Esc
                    取消拾取。
                  </div>
                )}
                <div ref={logEnd} />
              </div>
            </section>
      ) : null} ai={aiVisible ? <AiPanel model={state.model} moduleLabel={context.moduleLabel} draft={aiDrafts[state.model] ?? ""} onDraftChange={value => setAiDrafts(previous => ({ ...previous, [state.model]: value }))} /> : null} />
      <footer className={s.statusbar}>
        <span className={s.ready}>
          <i />
          {state.selection ? "选择中" : "就绪"}
        </span>
        <span className={s.notice} role="status">
          {state.notice}
        </span>
        <span>
          <FileBox size={11} />
          会话内演示
        </span>
        <span>显示网格 ≠ FEM 网格</span>
        <button disabled={!!state.command} onClick={() => setHelp(true)}>
          v0.2 <Info size={11} />
        </button>
      </footer>
      {state.command === "nodeSet" && <NodeSetDialog />}
      {state.command === "step" && <StepDialog />}
      {state.command === "domain" && <DomainDialog />}
      {loadOpen && <LoadDialog initial={loads[state.model]} close={() => setLoadOpen(false)} save={value => { setLoads({ ...loads, [state.model]: value }); setLoadOpen(false); dispatch({ type: "notice", value: `[演示] 已保存载荷草稿 ${value.name}，仅本次会话有效` }); }} />}
      {help && <Help close={() => setHelp(false)} />}
      {resetPending && (
        <Dialog
          title="恢复初始演示？"
          subtitle="清除本次会话修改"
          onDismiss={() => setResetPending(false)}
          footer={
            <>
              <button autoFocus onClick={() => setResetPending(false)}>
                保留当前会话
              </button>
              <button
                className={formStyles.primary}
                onClick={() => {
                  dispatch({ type: "reset" });
                  setLoads({});
                  review.reset();
                  setResultWire(false);
                  viewport.current?.orient("iso");
                  setModelDisplay("edges");
                  setResetPending(false);
                }}
              >
                确认恢复
              </button>
            </>
          }
        >
          <p>
            本次会话中新建和修改的节点集合、分析步、设计域及结果演示状态将被清除。此操作不可撤销。
          </p>
        </Dialog>
      )}
    </div>
  );
}
