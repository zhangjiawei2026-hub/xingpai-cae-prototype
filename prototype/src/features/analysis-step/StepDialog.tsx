import { useState } from "react";
import { Check } from "lucide-react";
import { useStore } from "../../app/Store";
import { Dialog, FormRow, formStyles as s } from "../../components/Dialog";
export function StepDialog() {
  const { state, dispatch } = useStore();
  const model = state.models[state.model];
  const [phase, setPhase] = useState(1),
    [name, setName] = useState(`Step-${model.steps.length + 1}`),
    [error, setError] = useState("");
  const [nonlinear, setNonlinear] = useState(false),
    [increment, setIncrement] = useState<"auto" | "manual">("auto");
  const [values, setValues] = useState({
    initial: "",
    min: "",
    max: "",
    iterations: "",
  });
  const validate = () => {
    if (!name.trim()) {
      setError("请输入分析步名称。");
      return false;
    }
    if (
      name.trim() === "Initial" ||
      model.steps.some((step) => step.name === name.trim())
    ) {
      setError("本演示中分析步名称需唯一。");
      return false;
    }
    setError("");
    return true;
  };
  return (
    <Dialog
      title="创建分析步"
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
            onClick={() => {
              if (!validate()) return;
              if (phase === 1) setPhase(2);
              else
                dispatch({
                  type: "addStep",
                  value: {
                    id: crypto.randomUUID(),
                    name: name.trim(),
                    procedure: "静力，通用",
                    nonlinear,
                    increment,
                    ...values,
                  },
                });
            }}
          >
            {phase === 1 ? "继续" : "创建分析步"}
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
            <input
              readOnly
              aria-label="插入位置"
              value={`在 ${state.step} 之后（演示）`}
            />
          </FormRow>
          <FormRow label="过程分类">
            <select aria-label="过程分类">
              <option>通用分析过程</option>
            </select>
          </FormRow>
          <p className={s.hint}>分析过程类型</p>
          <div className={s.procedure}>
            <button aria-pressed="true">
              <Check size={13} /> 静力，通用
            </button>
            <button disabled title="本轮未覆盖其他分析类型">
              其他分析类型 · 待补充
            </button>
          </div>
          <p className={s.hint}>
            当前仅覆盖来源中可辨识的代表类型。此步骤不会开始求解。
          </p>
        </>
      ) : (
        <>
          <FormRow label="分析类型">
            <input readOnly aria-label="分析类型" value="静力，通用" />
          </FormRow>
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
                  手动
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
                      disabled={increment === "auto"}
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
            <FormRow label="最大迭代次数">
              <input
                inputMode="numeric"
                aria-label="最大迭代次数"
                value={values.iterations}
                placeholder="待确认"
                onChange={(e) =>
                  setValues({ ...values, iterations: e.target.value })
                }
              />
            </FormRow>
          </fieldset>
          <p className={s.hint}>
            字段值为可选演示草稿，未配置工程默认值或范围校验。自动/手动禁用关系为原型假设。
          </p>
        </>
      )}
    </Dialog>
  );
}
