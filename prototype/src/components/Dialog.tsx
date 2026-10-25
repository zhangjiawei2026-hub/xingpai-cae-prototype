import { takeDialogTrigger } from "./dialogFocus";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X, Info, Box } from "lucide-react";
import { useStore } from "../app/Store";
import s from "./Dialog.module.css";
export { s as formStyles };
export function Dialog({
  title,
  subtitle,
  children,
  footer,
  error,
  wide = false,
  onDismiss,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  error?: string;
  wide?: boolean;
  onDismiss?: () => void;
}) {
  const { state, dispatch } = useStore();
  const ref = useRef<HTMLDialogElement>(null);
  const origin = useRef<HTMLElement | null>(null);
  const picking = !!state.selection;
  useEffect(() => {
    origin.current ??=
      takeDialogTrigger() ?? (document.activeElement as HTMLElement);
    return () => {
      requestAnimationFrame(() => {
        const target = origin.current;
        // A later user action may already have focused another command/menu.
        // The deferred restoration must not steal that newer focus.
        const active = document.activeElement;
        if (active instanceof HTMLElement && active !== document.body &&
            active.isConnected && active !== target) return;
        if (
          target?.isConnected &&
          target !== document.body &&
          !target.matches(":disabled") && target.getClientRects().length > 0
        )
          target.focus();
        else document.getElementById("tree-menu-trigger")?.focus();
      });
    };
  }, []);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (picking) {
      dialog.close();
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLButtonElement>(
            '[aria-label="键盘选择演示对象"] button',
          )
          ?.focus(),
      );
    } else if (!dialog.open) {
      dialog.showModal();
      dialog
        .querySelector<HTMLInputElement>("input:not(:disabled):not([readonly])")
        ?.focus();
    }
  }, [picking]);
  const dismiss = onDismiss ?? (() => dispatch({ type: "close" }));
  return (
    <dialog
      className={`${s.dialog} ${wide ? s.wide : ""}`}
      ref={ref}
      aria-labelledby="dialog-title"
      aria-describedby="dialog-subtitle"
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const controls = [
          ...e.currentTarget.querySelectorAll<HTMLElement>(
            "button,input,select,[tabindex]",
          ),
        ].filter(
          (element) =>
            !element.matches(":disabled") &&
            element.tabIndex >= 0 &&
            element.getClientRects().length,
        );
        const first = controls[0],
          last = controls.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        dismiss();
      }}
    >
      <header className={s.title}>
        <span className={s.titleIcon}>
          <Box size={18} />
        </span>
        <div>
          <h2 id="dialog-title">{title}</h2>
          <p id="dialog-subtitle">{subtitle}</p>
        </div>
        <button className={s.close} aria-label="关闭弹窗" onClick={dismiss}>
          <X size={17} />
        </button>
      </header>
      <div className={s.context}>
        <span>当前模型</span>
        <strong>{state.model}</strong>
        <span className={s.session}>会话内演示</span>
      </div>
      <div className={s.body}>{children}</div>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      <div className={s.note}>
        <Info size={13} />
        <span>仅保存本次演示配置，不执行工程计算。</span>
      </div>
      <footer className={s.footer}>{footer}</footer>
    </dialog>
  );
}
export function FormRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={s.row}>
      <span className={s.label}>{label}</span>
      <div className={s.control}>{children}</div>
    </div>
  );
}
