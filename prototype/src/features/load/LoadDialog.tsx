import { useState } from "react";
import { Dialog, FormRow, formStyles as s } from "../../components/Dialog";
import { useStore } from "../../app/Store";
export interface LoadDraft { name: string; step: string; region: string; cf1: string; cf2: string; cf3: string; follow: boolean; csys?: string; distribution?: string; field?: string; amplitude?: string }
export function LoadDialog({ initial, close, save }: { initial?: LoadDraft; close: () => void; save: (value: LoadDraft) => void }) {
  const { state } = useStore();
  const [draft, setDraft] = useState<LoadDraft>(initial ?? { name: "Load-1", step: state.models[state.model].steps[0]?.name ?? "", region: "", cf1: "", cf2: "", cf3: "", follow: false });
  const [error, setError] = useState("");
  return <Dialog title="编辑载荷" subtitle="集中力 · 演示参数配置" onDismiss={close} error={error} footer={<><button onClick={close}>取消</button><button className={s.primary} onClick={() => { if (!draft.name.trim()) return setError("请输入载荷名称。"); if ([draft.cf1, draft.cf2, draft.cf3].some(value => value.trim() && !Number.isFinite(Number(value)))) return setError("分量需填写有效数值或留空。"); save({ ...draft, name: draft.name.trim() }); }}>保存载荷草稿</button></>}>
    <FormRow label="名称"><input aria-label="载荷名称" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}/></FormRow>
    <FormRow label="类型"><input readOnly value="集中力"/></FormRow>
    <FormRow label="分析步"><select aria-label="载荷分析步" value={draft.step} onChange={e => setDraft({ ...draft, step: e.target.value })}><option value="">未指定</option>{state.models[state.model].steps.map(step => <option key={step.id}>{step.name}</option>)}</select></FormRow>
    <FormRow label="区域"><select aria-label="载荷区域" value={draft.region} onChange={e => setDraft({ ...draft, region: e.target.value })}><option value="">选择已有节点集合</option>{state.models[state.model].sets.map(set => <option key={set.id} value={set.id}>{set.name}</option>)}</select></FormRow>
    <fieldset className={s.group}><legend>力与方向</legend>
      <FormRow label="坐标系"><select aria-label="载荷坐标系" value={draft.csys ?? "global"} onChange={e => setDraft({ ...draft, csys: e.target.value })}><option value="global">全局</option><option value="datum">局部坐标系 1 · 示例引用</option></select></FormRow>
      <FormRow label="分布"><select aria-label="载荷分布" value={draft.distribution ?? "uniform"} onChange={e => setDraft({ ...draft, distribution: e.target.value })}><option value="uniform">均匀</option><option value="field">解析场</option></select></FormRow>
      {draft.distribution === "field" && <FormRow label="场"><input aria-label="载荷场引用" value={draft.field ?? ""} placeholder="示例参数引用" onChange={e => setDraft({ ...draft, field: e.target.value })}/></FormRow>}
      {(["cf1", "cf2", "cf3"] as const).map(key => <FormRow key={key} label={key.toUpperCase()}><input aria-label={key.toUpperCase()} inputMode="decimal" value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })}/></FormRow>)}
      <FormRow label="幅值"><select aria-label="载荷幅值" value={draft.amplitude ?? "ramp"} onChange={e => setDraft({ ...draft, amplitude: e.target.value })}><option value="ramp">斜坡</option><option value="step">阶跃</option><option value="amplitude">幅值 1 · 示例引用</option></select></FormRow>
      <label><input type="checkbox" checked={draft.follow} onChange={e => setDraft({ ...draft, follow: e.target.checked })}/>跟随节点转动</label>
    </fieldset>
    <p className={s.hint}>力施加于每个节点。区域仅引用本会话节点集合；未接入坐标系、场或幅值数据库，不执行载荷计算。</p>
  </Dialog>;
}
