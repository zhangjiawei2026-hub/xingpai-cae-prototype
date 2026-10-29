import { useRef } from "react";
import { ArrowUp, Box, ChevronRight, MessageSquareText, PencilLine, Layers, Workflow, Trash2 } from "lucide-react";
import s from "./AiPanel.module.css";
const suggestions = [
  { icon: Layers, label: "节点集合", prompt: "如何创建节点集合并检查选择结果？" },
  { icon: Workflow, label: "分析步设置", prompt: "创建分析步时，需要确认哪些设置？" },
  { icon: Box, label: "载荷与约束", prompt: "施加载荷前，需要检查哪些模型条件？" },
];
export function AiPanel({ model, moduleLabel, draft, onDraftChange }: {
  model: string; moduleLabel: string; draft: string; onDraftChange: (value: string) => void;
}) {
  const input = useRef<HTMLTextAreaElement>(null);
  return <section className={s.panel} aria-label="AI 辅助面板">
    <div className={s.context}><Box size={14} aria-hidden="true" /><span title={model}>{model}</span><span className={s.module}>{moduleLabel}</span></div>
    <div className={s.body}>
      <div className={s.intro}><span className={s.mark}><MessageSquareText size={22} strokeWidth={1.6} aria-hidden="true" /></span><h2>CAE 工作助手</h2><p>整理建模问题，梳理操作思路。</p></div>
      <div className={s.status}><span />AI 服务未连接</div>
      <p className={s.hint}>可以先编辑问题草稿，当前暂不支持发送或生成回答。</p>
      <div className={s.suggestions}><h3>从一个问题开始</h3>{suggestions.map(({ icon: Icon, label, prompt }) => <button key={label} onClick={() => { onDraftChange(prompt); input.current?.focus(); }} title="填入问题草稿"><Icon size={15} aria-hidden="true" /><span>{label}<small>{prompt}</small></span><ChevronRight size={13} aria-hidden="true" /></button>)}</div>
    </div>
    <div className={s.composer}>
      <div className={s.draftHeader}><span><PencilLine size={12} aria-hidden="true" />问题草稿</span><button aria-label="清空问题草稿" title="清空草稿" disabled={!draft} onClick={() => { onDraftChange(""); input.current?.focus(); }}><Trash2 size={13} /></button></div>
      <textarea ref={input} aria-label="AI 问题" aria-describedby="ai-send-reason" value={draft} onChange={event => onDraftChange(event.target.value)} placeholder="描述模型问题或操作需求…" />
      <div className={s.composerFooter}><span>仅保留在当前会话</span><button className={s.send} disabled aria-label="发送问题" title="AI 服务尚未接入"><ArrowUp size={15} aria-hidden="true" /></button></div>
      <p id="ai-send-reason" className={s.reason}>服务未连接，发送不可用</p>
    </div>
  </section>;
}
