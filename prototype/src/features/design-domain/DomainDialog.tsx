import { useEffect, useState } from "react";
import { MousePointer2 } from "lucide-react";
import { useStore } from "../../app/Store";
import { Dialog, FormRow, formStyles as s } from "../../components/Dialog";
import type { SelectionSession } from "../../types/domain";
export function DomainDialog() {
  const { state, dispatch } = useStore();
  const [name, setName] = useState(
      `Design-${state.models[state.model].domains.length + 1}`,
    ),
    [regionType, setRegionType] = useState<"shell" | "solid">("solid");
  const [tab, setTab] = useState("基础"),
    [elements, setElements] = useState<number[]>([]),
    [base, setBase] = useState<number[]>([]),
    [direction, setDirection] = useState<number[]>([]);
  const [minSize, setMinSize] = useState(""),
    [maxSize, setMaxSize] = useState(""),
    [drawEnabled, setDrawEnabled] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const result = state.selectionResult;
    if (!result) return;
    if (result.target === "elements") setElements(result.ids);
    if (result.target === "base") setBase(result.ids);
    if (result.target === "direction") setDirection(result.ids);
    dispatch({ type: "consumeResult" });
  }, [state.selectionResult, dispatch]);
  const pick = (target: SelectionSession["target"], ids: number[]) =>
    dispatch({
      type: "pick",
      session: {
        owner: "domain",
        target,
        entity: target === "elements" ? "Element" : "Node",
        ids,
      },
    });
  const pickButton = (
    target: SelectionSession["target"],
    ids: number[],
    label: string,
  ) => (
    <div className={s.region}>
      <button className={s.pick} onClick={() => pick(target, ids)}>
        <MousePointer2 size={13} />
        {label}
      </button>
      <span>已选 {ids.length} 项</span>
    </div>
  );
  return (
    <Dialog
      wide
      title="创建设计域"
      subtitle="拓扑优化区域与约束"
      error={error}
      footer={
        <>
          <button onClick={() => dispatch({ type: "close" })}>取消</button>
          <button
            className={s.primary}
            onClick={() => {
              if (!name.trim()) return setError("请输入设计域名称。");
              if (
                state.models[state.model].domains.some(
                  (d) => d.name === name.trim(),
                )
              )
                return setError("本演示中设计域名称需唯一。");
              if (!elements.length)
                return setError("请先选择至少一个演示单元作为优化区域。");
              if (drawEnabled && (!base.length || !direction.length))
                return setError("已激活脱模约束，请选择基准点与第一点。");
              dispatch({
                type: "addDomain",
                value: {
                  id: crypto.randomUUID(),
                  name: name.trim(),
                  regionType,
                  elements,
                  minSize,
                  maxSize,
                  drawEnabled,
                  base: drawEnabled ? base : [],
                  direction: drawEnabled ? direction : [],
                },
              });
            }}
          >
            创建设计域
          </button>
        </>
      }
    >
      <FormRow label="名称">
        <input
          autoFocus
          aria-label="设计域名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </FormRow>
      <FormRow label="优化任务">
        <input readOnly value="Task-1 · 拓扑优化" aria-label="优化任务" />
      </FormRow>
      <FormRow label="优化区域类型">
        <div className={s.radios}>
          <label>
            <input
              type="radio"
              name="region"
              checked={regionType === "shell"}
              onChange={() => setRegionType("shell")}
            />
            壳
          </label>
          <label>
            <input
              type="radio"
              name="region"
              checked={regionType === "solid"}
              onChange={() => setRegionType("solid")}
            />
            实体
          </label>
        </div>
      </FormRow>
      <FormRow label="优化区域">
        {pickButton("elements", elements, "拾取单元")}
      </FormRow>
      <div className={s.tabs} role="tablist" aria-label="设计域配置">
        {["基础", "最大尺寸", "脱模", "挤压", "对称", "重复"].map(
          (value, index) => (
            <button
              key={value}
              role="tab"
              id={`domain-tab-${index}`}
              aria-controls="domain-panel"
              aria-selected={tab === value}
              tabIndex={tab === value ? 0 : -1}
              disabled={index > 2}
              title={index > 2 ? "本轮仅展示入口，字段依赖待确认" : undefined}
              onClick={() => setTab(value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  const next = (index + (e.key === "ArrowRight" ? 1 : 2)) % 3;
                  setTab(["基础", "最大尺寸", "脱模"][next]);
                  document.getElementById(`domain-tab-${next}`)?.focus();
                }
              }}
            >
              {value}
            </button>
          ),
        )}
      </div>
      <div
        role="tabpanel"
        id="domain-panel"
        aria-labelledby={`domain-tab-${["基础", "最大尺寸", "脱模"].indexOf(tab)}`}
        style={{ minHeight: 138 }}
      >
        {tab === "基础" && (
          <>
            <FormRow label="最小尺寸值">
              <input
                aria-label="最小尺寸值"
                inputMode="decimal"
                value={minSize}
                onChange={(e) => setMinSize(e.target.value)}
                placeholder="请输入（可选）"
              />
            </FormRow>
            <p className={s.hint}>
              保留原型中的基础尺寸字段。单位、范围和工程默认值待确认。
            </p>
          </>
        )}
        {tab === "最大尺寸" && (
          <>
            <FormRow label="最大尺寸值">
              <input
                aria-label="最大尺寸值"
                inputMode="decimal"
                value={maxSize}
                onChange={(e) => setMaxSize(e.target.value)}
                placeholder="请输入（可选）"
              />
            </FormRow>
            <p className={s.hint}>此页为独立编辑草稿；切换页签保留当前输入。</p>
          </>
        )}
        {tab === "脱模" && (
          <>
            <FormRow label="脱模约束">
              <label>
                <input
                  type="checkbox"
                  checked={drawEnabled}
                  onChange={(e) => setDrawEnabled(e.target.checked)}
                />
                激活
              </label>
            </FormRow>
            <fieldset className={s.group} disabled={!drawEnabled}>
              <legend>直线 · 基准对象</legend>
              <FormRow label="基准点">
                {pickButton("base", base, "选择基准点")}
              </FormRow>
              <FormRow label="第一点">
                {pickButton("direction", direction, "选择第一点")}
              </FormRow>
            </fieldset>
            <p className={s.hint}>
              仅演示拾取字段；当前以显示网格顶点替代基准对象，不能用于工程约束计算。
            </p>
          </>
        )}
      </div>
    </Dialog>
  );
}
