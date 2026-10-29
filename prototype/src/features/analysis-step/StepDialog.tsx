import { moveFocus } from "../../components/keyboard";
import { useState } from "react";
import { useStore } from "../../app/Store";
import { Dialog, FormRow, formStyles as s } from "../../components/Dialog";
export function StepDialog() {
  const { state, dispatch } = useStore();
  const model = state.models[state.model];
  const existing = model.steps.find((v) => v.id === state.editingId);
  const [afterId, setAfterId] = useState(model.steps.at(-1)?.id ?? "initial");
  const [category, setCategory] = useState("general");
  const procedures = category === "general"
    ? ["动态温度位移，显式", "地应力", "热传导", "质量扩散", "土壤", "静力，通用", "静力，Riks", "黏弹性"]
    : ["屈曲", "频率", "静力，线性摄动", "稳态动力学，直接法", "子结构生成"];
  const [extra, setExtra] = useState({
    stabilization: existing?.stabilization ?? "none",
    stabilizationValue: existing?.stabilizationValue ?? "",
    adiabatic: existing?.adiabatic ?? false,
    extrapolation: existing?.extrapolation ?? "",
    matrix: existing?.matrix ?? "",
    unsymmetric: existing?.unsymmetric ?? false,
  });
  const [parameterTab, setParameterTab] = useState("basic");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [period, setPeriod] = useState(existing?.period ?? "");
  const [phase, setPhase] = useState(1),
    [name, setName] = useState(
      existing?.name ?? `Step-${model.steps.length + 1}`,
    ),
    [error, setError] = useState("");
  const [nonlinear, setNonlinear] = useState(existing?.nonlinear ?? false),
    [increment, setIncrement] = useState<"auto" | "manual">(
      existing?.increment ?? "auto",
    );
  const [values, setValues] = useState({
    initial: existing?.initial ?? "",
    min: existing?.min ?? "",
    max: existing?.max ?? "",
    iterations: existing?.iterations ?? "",
  });
  const validate = () => {
    if (!name.trim()) {
      setError("请输入分析步名称。");
      return false;
    }
    if (
      name.trim() === "Initial" ||
      model.steps.some(
        (step) => step.id !== existing?.id && step.name === name.trim(),
      )
    ) {
      setError("本演示中分析步名称需唯一。");
      return false;
    }
    setError("");
    return true;
  };
  return (
    <Dialog
      title={existing ? "编辑分析步" : "创建分析步"}
      subtitle="类型选择与参数配置"
      error={error}
      footer={
        <>
          {phase === 2 && (
            <button className={s.back} onClick={() => setPhase(1)}>
              上一步
            </button>
          )}
          <button onClick={() => dispatch({ type: "close" })}>取消</button>
          <button
            className={s.primary}
            disabled={phase === 1 && category !== "general"}
            onClick={() => {
              if (!validate()) return;
              if (phase === 1) setPhase(2);
              else
                dispatch({
                  type: "addStep",
                  afterId: existing ? undefined : afterId,
                  value: {
                    id: existing?.id ?? crypto.randomUUID(),
                    name: name.trim(),
                    procedure: "静力，通用",
                    description,
                    period,
                    nonlinear,
                    increment,
                    ...values,
                    ...extra,
                  },
                });
            }}
          >
            {phase === 1 ? "继续" : existing ? "保存分析步" : "创建分析步"}
          </button>
        </>
      }
    >
      <p className={s.progress}>
        <b>{phase === 1 ? "01 / 类型" : "02 / 参数"}</b>{" "}
        {phase === 1 ? "02 / 参数" : "01 / 类型"}
      </p>
      <FormRow label="分析步名称">
        <input
          autoFocus
          aria-label="分析步名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </FormRow>
      {phase === 1 ? (
        <>
          <FormRow label="插入位置">
            {existing ? <input readOnly aria-label="插入位置" value="保留当前列表位置" /> : (
              <select aria-label="插入位置" value={afterId} onChange={e => setAfterId(e.target.value)}>
                <option value="initial">Initial 之后</option>
                {model.steps.map(step => <option key={step.id} value={step.id}>{step.name} 之后</option>)}
              </select>
            )}
          </FormRow>
          <FormRow label="过程分类">
            <select aria-label="过程分类" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="general">通用分析过程</option>
              <option value="perturbation">线性摄动 · 类型预览</option>
            </select>
          </FormRow>
          <p className={s.hint}>分析过程类型</p>
          <select className={s.processList} size={6} aria-label="分析过程类型" value={category === "general" ? "静力，通用" : ""} onChange={() => {}}>
            {procedures.map(type => (
              <option key={type} value={type} disabled={type !== "静力，通用"}>{type}{type !== "静力，通用" ? " · 参数未接入" : ""}</option>
            ))}
          </select>
          <p className={s.hint}>
            名称和列表顺序参照客户 HTML。仅静力，通用支持参数草稿；新步骤在所选步骤之后插入，不执行求解。
          </p>
        </>
      ) : (
        <>
          <FormRow label="分析类型">
            <input readOnly aria-label="分析类型" value="静力，通用" />
          </FormRow>
          <div className={s.radios} role="tablist" aria-label="分析步参数页" onKeyDown={e => moveFocus(e, "tab")}>
            {[["basic", "基本"], ["increment", "增量"], ["other", "其他"]].map(([value, label]) => <button key={value} role="tab" tabIndex={parameterTab === value ? 0 : -1} aria-selected={parameterTab === value} onClick={() => setParameterTab(value)}>{label}</button>)}
          </div>
          <div hidden={parameterTab !== "basic"}>
          <FormRow label="描述"><input aria-label="分析步描述" value={description} onChange={e => setDescription(e.target.value)} /></FormRow>
          <FormRow label="时间周期"><input aria-label="时间周期" inputMode="decimal" placeholder="待确认" value={period} onChange={e => setPeriod(e.target.value)} /></FormRow>
          <FormRow label="非线性">
            <div className={s.radios}>
              <label>
                <input
                  type="radio"
                  name="nonlinear"
                  checked={nonlinear}
                  onChange={() => setNonlinear(true)}
                />
                开
              </label>
              <label>
                <input
                  type="radio"
                  name="nonlinear"
                  checked={!nonlinear}
                  onChange={() => setNonlinear(false)}
                />
                关
              </label>
            </div>
          </FormRow>
          <FormRow label="自动稳定"><select aria-label="自动稳定" value={extra.stabilization} onChange={e => setExtra({ ...extra, stabilization: e.target.value as typeof extra.stabilization })}><option value="none">无</option><option value="energy">指定耗散能量比例</option><option value="damping">指定阻尼系数</option></select></FormRow>
          {extra.stabilization !== "none" && <FormRow label={extra.stabilization === "energy" ? "耗散能量比例" : "阻尼系数"}><input aria-label="稳定参数值" inputMode="decimal" value={extra.stabilizationValue} onChange={e => setExtra({ ...extra, stabilizationValue: e.target.value })} /></FormRow>}
          <label><input type="checkbox" checked={extra.adiabatic} onChange={e => setExtra({ ...extra, adiabatic: e.target.checked })} />包含绝热加热效应</label>
          </div>
          <div hidden={parameterTab !== "increment"}>
          <fieldset className={s.group}>
            <legend>增量步</legend>
            <FormRow label="类型">
              <div className={s.radios}>
                <label>
                  <input
                    type="radio"
                    name="increment"
                    checked={increment === "auto"}
                    onChange={() => setIncrement("auto")}
                  />
                  自动
                </label>
                <label>
                  <input
                    type="radio"
                    name="increment"
                    checked={increment === "manual"}
                    onChange={() => setIncrement("manual")}
                  />
                  固定
                </label>
              </div>
            </FormRow>
            <FormRow label="增量尺寸">
              <div className={s.columns}>
                {(["initial", "min", "max"] as const).map((key, i) => (
                  <label key={key}>
                    {["初始", "最小", "最大"][i]}
                    <input
                      inputMode="decimal"
                      aria-label={`${["初始", "最小", "最大"][i]}增量尺寸`}
                      disabled={increment === "manual" && key !== "initial"}
                      value={values[key]}
                      placeholder="待确认"
                      onChange={(e) =>
                        setValues({ ...values, [key]: e.target.value })
                      }
                    />
                  </label>
                ))}
              </div>
            </FormRow>
            <FormRow label="最大增量数">
              <input
                inputMode="numeric"
                aria-label="最大增量数"
                value={values.iterations}
                placeholder="待确认"
                onChange={(e) =>
                  setValues({ ...values, iterations: e.target.value })
                }
              />
            </FormRow>
          </fieldset>
          </div>
          {parameterTab === "other" && <>
            <FormRow label="外推"><select aria-label="外推" value={extra.extrapolation} onChange={e => setExtra({ ...extra, extrapolation: e.target.value })}><option value="">未指定</option><option value="linear">线性</option><option value="parabolic">抛物线</option><option value="none">无</option></select></FormRow>
            <FormRow label="矩阵存储"><select aria-label="矩阵存储" value={extra.matrix} onChange={e => setExtra({ ...extra, matrix: e.target.value })}><option value="">未指定</option><option value="default">使用求解器默认设置</option><option value="symmetric">对称</option><option value="unsymmetric">非对称</option></select></FormRow>
            <label><input type="checkbox" checked={extra.unsymmetric} onChange={e => setExtra({ ...extra, unsymmetric: e.target.checked })} />使用非对称矩阵求解方案</label>
          </>}
          <p className={s.hint}>
            字段值为可选演示草稿，未配置工程默认值或范围校验。按客户 HTML 的界面关系：固定增量仅编辑初始尺寸；参数仅保存草稿，不执行求解。
          </p>
        </>
      )}
    </Dialog>
  );
}
