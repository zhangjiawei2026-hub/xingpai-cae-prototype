import { useRef } from "react";
import {
  ArrowUp,
  Check,
  ChevronRight,
  PencilLine,
  Trash2,
  Unplug,
} from "lucide-react";
import { CAEIcon } from "../../components/CAEIcon";
import s from "./AiPanel.module.css";

const suggestions = [
  {
    icon: "nodes" as const,
    label: "节点集合",
    prompt: "如何创建节点集合并检查选择结果？",
  },
  {
    icon: "step" as const,
    label: "分析步设置",
    prompt: "创建分析步时，需要确认哪些设置？",
  },
  {
    icon: "load" as const,
    label: "载荷与约束",
    prompt: "施加载荷前，需要检查哪些模型条件？",
  },
];

export function AiPanel({
  model,
  moduleLabel,
  draft,
  onDraftChange,
}: {
  model: string;
  moduleLabel: string;
  draft: string;
  onDraftChange: (value: string) => void;
}) {
  const input = useRef<HTMLTextAreaElement>(null);
  const feedback = draft.trim() ? "held" : "idle";
  return (
    <section className={s.panel} aria-label="AI 辅助面板">
      <div className={s.context}>
        <CAEIcon name="part" size={16} />
        <span title={model}>{model}</span>
        <span className={s.module}>{moduleLabel}</span>
      </div>
      <div className={s.body}>
        <div className={s.intro}>
          <span className={s.mark}>
            <img src="/assistant-icons/assistant-mark.png" alt="" width={28} height={28} />
          </span>
          <h2>CAE 工作助手</h2>
          <p>整理建模问题，梳理操作思路。</p>
        </div>
        <div className={s.status} role="status">
          <Unplug size={12} strokeWidth={1.75} aria-hidden="true" />
          <span>AI 服务未连接</span>
        </div>
        <p className={s.hint}>可以先编辑问题草稿，当前暂不支持发送或生成回答。</p>
        <div className={s.suggestions}>
          <h3>从一个问题开始</h3>
          {suggestions.map(({ icon, label, prompt }) => {
            const pressed = draft === prompt;
            return (
              <button
                key={label}
                type="button"
                aria-pressed={pressed}
                onClick={() => {
                  onDraftChange(prompt);
                  input.current?.focus();
                }}
                title="填入问题草稿"
              >
                <CAEIcon name={icon} size={20} />
                <span className={s.suggestionCopy}>
                  <strong>{label}</strong>
                  <small>{prompt}</small>
                </span>
                {pressed ? (
                  <Check size={13} strokeWidth={2} aria-hidden="true" />
                ) : (
                  <ChevronRight size={13} strokeWidth={1.75} aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className={s.composer} data-feedback={feedback}>
        <div className={s.draftHeader}>
          <span>
            <PencilLine size={12} strokeWidth={1.75} aria-hidden="true" />
            问题草稿
          </span>
          <button
            className={s.clear}
            type="button"
            aria-label="清空问题草稿"
            title="清空草稿"
            disabled={!draft}
            onClick={() => {
              onDraftChange("");
              input.current?.focus();
            }}
          >
            <Trash2 size={13} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        <textarea
          ref={input}
          aria-label="AI 问题"
          aria-describedby="ai-send-reason"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="描述模型问题或操作需求…"
        />
        <div className={s.composerFooter}>
          <span>仅保留在当前会话</span>
          <button
            className={s.send}
            type="button"
            disabled
            data-feedback={feedback}
            aria-label="发送问题"
            title="AI 服务尚未接入"
          >
            <ArrowUp size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        <p id="ai-send-reason" className={s.reason}>
          服务未连接，发送不可用
        </p>
      </div>
    </section>
  );
}
