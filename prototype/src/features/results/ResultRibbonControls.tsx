import { useState, type ReactNode } from "react";
import s from "./Results.module.css";

export function Group({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className={s.group} role="group" aria-label={label}>
      <div className={s.controls}>{children}</div>
      <span className={s.caption} aria-hidden="true">
        {label}
      </span>
    </section>
  );
}

export function Select({
  label,
  name = label,
  value,
  options,
  disabled,
  set,
}: {
  label: string;
  name?: string;
  value: string | number;
  options: readonly (readonly [string | number, string])[];
  disabled?: boolean;
  set: (value: string) => void;
}) {
  return (
    <label className={s.row}>
      {label && <span>{label}</span>}
      <select
        aria-label={name}
        value={value}
        disabled={disabled}
        title={options.find(([key]) => key === value)?.[1]}
        onChange={(event) => set(event.target.value)}
      >
        {options.map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Numeric({
  label,
  name,
  value,
  disabled,
  unit,
  min,
  max,
  step = "any",
  placeholder,
  change,
  error,
}: {
  label: string;
  name: string;
  value?: number;
  disabled?: boolean;
  unit?: string;
  min?: number;
  max?: number;
  step?: number | "any";
  placeholder?: string;
  change: (value: number) => string | void;
  error: (message: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <label className={s.row}>
      <span>{label}</span>
      <input
        type="number"
        step={step}
        aria-label={name}
        min={min}
        max={max}
        placeholder={placeholder}
        disabled={disabled}
        value={draft ?? value ?? ""}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => {
          if (draft === null) return;
          const next = event.target.valueAsNumber;
          setDraft(null);
          if (!Number.isFinite(next)) {
            error("请输入有效数值，已保留上次输入。");
            return;
          }
          const message = change(next);
          if (message) error(message);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
      />
      {unit && <span className={s.unit}>{unit}</span>}
    </label>
  );
}

export function Toggle({
  label,
  checked,
  disabled,
  change,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  change: (checked: boolean) => void;
}) {
  return (
    <label className={s.check}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => change(event.target.checked)}
      />
      {label}
    </label>
  );
}
