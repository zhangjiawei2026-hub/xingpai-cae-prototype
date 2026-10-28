import { useState, type ReactNode } from "react";
import { useStore } from "../../app/Store";
import { MODULES, MODULE_LABELS } from "../../data/demo";
import s from "./Workspace.module.css";

const styles = [
  { value: "line", label: "线条" },
  { value: "tabs", label: "页签" },
  { value: "block", label: "色块" },
] as const;
export function ModuleBar({ fileMenu }: { fileMenu: ReactNode }) {
  const { state, dispatch } = useStore();
  const [style, setStyle] = useState<(typeof styles)[number]["value"]>("tabs");
  return (
    <div className={s.moduleBar} data-module-style={style}>
      {fileMenu}
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
      <div className={s.styleCompare}>
        <span id="module-style-label">样式对比</span>
        <div
          role="radiogroup"
          aria-labelledby="module-style-label"
          className={s.styleOptions}
        >
          {styles.map((option) => (
            <label key={option.value} title={`预览${option.label}标签栏`}>
              <input
                type="radio"
                name="module-style"
                value={option.value}
                checked={style === option.value}
                disabled={!!state.command}
                onChange={() => setStyle(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
