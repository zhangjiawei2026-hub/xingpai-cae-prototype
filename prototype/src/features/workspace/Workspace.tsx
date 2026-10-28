import { rememberDialogTrigger } from "../../components/dialogFocus";
import { moveFocus } from "../../components/keyboard";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Check,
  FileBox,
  RefreshCcw,
  Terminal,
  Info,
  ChevronsUpDown,
  FolderOpen,
} from "lucide-react";
import { useStore } from "../../app/Store";
import { DockLayout } from "./DockLayout";
import { ModuleBar } from "./ModuleBar";
import { QuickToolbar, type ViewAction } from "./QuickToolbar";
import { CAEIcon } from "../../components/CAEIcon";
import { Ribbon } from "../ribbon/Ribbon";
import { ModelTree } from "../model-tree/ModelTree";
import { Viewport } from "../../viewport/Viewport";
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
  const [loadOpen, setLoadOpen] = useState(false);
  const [loads, setLoads] = useState<Record<string, LoadDraft>>({});
  const [aiVisible, setAiVisible] = useState(false);
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
      if (e.key === "Escape" && state.selection) {
        e.preventDefault();
        e.stopPropagation();
        dispatch({ type: "pickCancel" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.selection, dispatch]);
  const context = workspaceContext(state);
  const viewAction = (action: ViewAction) => {
    const title = {
      fit: "适合窗口",
      iso: "等轴测视图",
      zoomIn: "放大模型",
      zoomOut: "缩小模型",
    }[action];
    document
      .querySelector<HTMLButtonElement>(
        `[aria-label="视图工具"] button[title="${title}"]`,
      )
      ?.click();
  };
  return (
    <div className={s.app}>
      <div className={s.menubar}>

        <button disabled title="首轮编辑命令通过 Ribbon 提供">
          编辑
        </button>
        <button onClick={() => setTreeVisible(!treeVisible)}>视图</button>
        <button disabled={!!state.command} onClick={() => setHelp(true)}>
          帮助
        </button>
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
      <ModuleBar fileMenu={
        <details className={s.fileMenu}>
          <summary>
            <span>文件</span>
            <ChevronDown size={10} aria-hidden="true" />
          </summary>
          <div>
            <button
              disabled={!!state.command}
              onClick={(e) => {
                rememberDialogTrigger(
                  e.currentTarget
                    .closest("details")
                    ?.querySelector("summary") ?? null,
                );
                setResetPending(true);
                document
                  .querySelector("details[open]")
                  ?.removeAttribute("open");
              }}
            >
              恢复初始演示
            </button>
            <button disabled>打开文件 · 未接入</button>
            <button disabled>保存工程 · 未接入</button>
            <button disabled>另存为 · 未接入</button>
          </div>
        </details>
      } />
      <Ribbon
        onLoad={() => setLoadOpen(true)}
        onFit={() => viewAction("fit")}
        onIso={() => viewAction("iso")}
        onToggleTree={() => setTreeVisible(!treeVisible)}
        onToggleLog={() => setLogVisible(!logVisible)}
        treeVisible={treeVisible}
        logVisible={logVisible}
      />
      <QuickToolbar
        onView={viewAction}
        treeVisible={treeVisible}
        logVisible={logVisible}
        onToggleTree={() => setTreeVisible(!treeVisible)}
        onToggleLog={() => setLogVisible(!logVisible)}
      />
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
        <button className={s.iconButton} aria-pressed={aiVisible} onClick={() => setAiVisible(!aiVisible)}>AI 对话</button>
      </div>
      <DockLayout tree={treeVisible ? <ModelTree onClose={() => setTreeVisible(false)} /> : null} viewport={<Viewport />} log={logVisible ? (
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
      ) : null} ai={aiVisible ? <div className={s.helpText} style={{ padding: 16 }}><strong>AI 对话</strong><p>AI 服务尚未接入。可拖动标题栏调整面板位置。</p><textarea aria-label="AI 问题" placeholder="AI 服务尚未接入" disabled /><button disabled>发送</button></div> : null} />
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
                  setResetPending(false);
                }}
              >
                确认恢复
              </button>
            </>
          }
        >
          <p>
            本次会话中新建和修改的节点集合、分析步与设计域将被清除。此操作不可撤销。
          </p>
        </Dialog>
      )}
    </div>
  );
}
