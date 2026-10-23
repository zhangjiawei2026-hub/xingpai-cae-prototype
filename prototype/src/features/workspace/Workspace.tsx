import { useEffect, useRef, useState } from "react";
import {
  Box,
  ChevronDown,
  Check,
  FileBox,
  RefreshCcw,
  Terminal,
  Info,
  CircleHelp,
  ChevronsUpDown,
  FolderOpen,
} from "lucide-react";
import { useStore } from "../../app/Store";
import { MODULES, MODULE_LABELS } from "../../data/demo";
import { CAEIcon } from "../../components/CAEIcon";
import { Ribbon } from "../ribbon/Ribbon";
import { ModelTree } from "../model-tree/ModelTree";
import { Viewport } from "../../viewport/Viewport";
import { NodeSetDialog } from "../node-set/NodeSetDialog";
import { StepDialog } from "../analysis-step/StepDialog";
import { DomainDialog } from "../design-domain/DomainDialog";
import { Dialog, formStyles } from "../../components/Dialog";
import s from "./Workspace.module.css";
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
        <p>灰色功能暂未覆盖；专业图标为语义占位。Windows 桌面集成尚未验证。</p>
      </div>
    </Dialog>
  );
}
export function Workspace() {
  const { state, dispatch } = useStore();
  const [treeVisible, setTreeVisible] = useState(true),
    [logVisible, setLogVisible] = useState(true),
    [help, setHelp] = useState(false),
    [treeWidth, setTreeWidth] = useState(253),
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
  const fit = () =>
    document.querySelector<HTMLButtonElement>('[title="适合窗口"]')?.click();
  return (
    <div className={s.app}>
      <header className={s.titlebar}>
        <div className={s.brand}>
          <span className={s.brandmark}>
            <Box size={19} strokeWidth={1.7} />
          </span>
          <b>
            SiPESC<span>.PRE</span>
          </b>
          <i />
        </div>
        <span className={s.projectName}>
          安装支架<small> / 工作区</small>
        </span>
        <span className={s.titleBadge}>交互原型</span>
        <div className={s.titleRight}>
          <span>星派科技</span>
          <button
            disabled={!!state.command}
            onClick={() => setHelp(true)}
            aria-label="原型说明"
          >
            <CircleHelp size={16} />
          </button>
        </div>
      </header>
      <div className={s.menubar}>
        <details className={s.fileMenu}>
          <summary>
            文件 <ChevronDown size={10} />
          </summary>
          <div>
            <button
              onClick={() => {
                dispatch({ type: "reset" });
                document
                  .querySelector("details[open]")
                  ?.removeAttribute("open");
              }}
            >
              恢复初始演示
            </button>
            <button disabled>导入模型 · 未接入</button>
            <button disabled>保存工程 · 未接入</button>
          </div>
        </details>
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
          onClick={() => dispatch({ type: "reset" })}
        >
          <RefreshCcw size={13} />
        </button>
        <span className={s.breadcrumb}>
          <FolderOpen size={12} />
          演示工程<span>/</span>
          <span>{state.model}</span>
        </span>
        <span className={s.menuSession}>
          本次会话 <Check size={11} />
        </span>
      </div>
      <nav className={s.modules} aria-label="分析模块">
        {MODULES.map((module, index) => (
          <button
            key={module}
            disabled={!!state.command}
            aria-current={state.module === module ? "page" : undefined}
            onClick={() => dispatch({ type: "module", value: module })}
          >
            <span>{MODULE_LABELS[index]}</span>
          </button>
        ))}
      </nav>
      <Ribbon
        onFit={fit}
        onIso={() =>
          document
            .querySelector<HTMLButtonElement>('[title="等轴测视图"]')
            ?.click()
        }
        onToggleTree={() => setTreeVisible(!treeVisible)}
        onToggleLog={() => setLogVisible(!logVisible)}
        treeVisible={treeVisible}
        logVisible={logVisible}
        onHelp={() => setHelp(true)}
      />
      <div className={s.contextbar}>
        {!treeVisible && (
          <button
            className={s.iconButton}
            title="展开模型树"
            onClick={() => setTreeVisible(true)}
          >
            <CAEIcon name="treePanel" size={16} />
          </button>
        )}
        <label>
          <span>模型</span>
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
        <span className={s.contextHint}>上下文工作区</span>
      </div>
      <div className={s.workarea}>
        {treeVisible && (
          <div style={{ width: treeWidth }} className={s.treeWrapper}>
            <ModelTree onClose={() => setTreeVisible(false)} />
          </div>
        )}
        {treeVisible && (
          <div
            role="separator"
            aria-label="调整模型树宽度"
            aria-valuenow={treeWidth}
            aria-valuemin={210}
            aria-valuemax={390}
            aria-orientation="vertical"
            tabIndex={0}
            className={s.splitter}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                setTreeWidth(
                  Math.max(
                    210,
                    Math.min(
                      390,
                      treeWidth + (e.key === "ArrowRight" ? 10 : -10),
                    ),
                  ),
                );
              }
            }}
            onPointerDown={(e) =>
              e.currentTarget.setPointerCapture(e.pointerId)
            }
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId))
                setTreeWidth(Math.max(210, Math.min(390, e.clientX)));
            }}
            onPointerUp={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId))
                e.currentTarget.releasePointerCapture(e.pointerId);
            }}
          />
        )}
        <div className={s.center}>
          <Viewport />
          {logVisible && (
            <section className={s.log} aria-label="信息窗口">
              <header>
                <div role="tablist" aria-label="信息类型">
                  <button
                    role="tab"
                    aria-selected={logTab === "messages"}
                    onClick={() => setLogTab("messages")}
                  >
                    <Terminal size={13} />
                    消息<span>{state.logs.length}</span>
                  </button>
                  <button
                    role="tab"
                    aria-selected={logTab === "guide"}
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
          )}
        </div>
      </div>
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
      {help && <Help close={() => setHelp(false)} />}
    </div>
  );
}
