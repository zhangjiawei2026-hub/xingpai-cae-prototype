import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { moveFocus } from "../../components/keyboard";
import { commandTitle, type Menu } from "./workspaceCommands";
import s from "./Workspace.module.css";

export function WorkspaceMenu({
  menus,
  help,
  helpDisabled,
}: {
  menus: readonly Menu[];
  help: () => void;
  helpDisabled: boolean;
}) {
  const [open, setOpen] = useState("");
  const root = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen("");
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  function closeAndFocus() {
    setOpen("");
    trigger.current?.focus();
  }

  return (
    <nav
      className={s.mainMenu}
      ref={root}
      aria-label="主菜单"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen("");
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !open) return;
        event.preventDefault();
        event.stopPropagation();
        closeAndFocus();
      }}
    >
      {menus.map(({ label, groups }, index) => (
        <div className={s.menuSlot} key={label}>
          <button
            className={s.menuTrigger}
            type="button"
            aria-haspopup="menu"
            aria-controls={`workspace-menu-${index}`}
            aria-expanded={open === label}
            onClick={(event) => {
              trigger.current = event.currentTarget;
              setOpen(open === label ? "" : label);
            }}
            onKeyDown={(event) => {
              if (event.key !== "ArrowDown") return;
              event.preventDefault();
              trigger.current = event.currentTarget;
              setOpen(label);
              requestAnimationFrame(() => {
                const popup = document.getElementById(
                  `workspace-menu-${index}`,
                );
                (
                  popup?.querySelector<HTMLButtonElement>(
                    "button:not(:disabled)",
                  ) ?? popup
                )?.focus();
              });
            }}
          >
            {label}
            <ChevronDown size={10} aria-hidden="true" />
          </button>
          <div
            id={`workspace-menu-${index}`}
            className={s.menuPopup}
            data-wide={groups.length > 3 || undefined}
            role="menu"
            aria-label={label}
            tabIndex={-1}
            hidden={open !== label}
            onKeyDown={(event) => moveFocus(event, "menuitem")}
          >
            {groups.map((group) => (
              <div role="group" aria-label={group.label} key={group.label}>
                <span className={s.menuGroupLabel} aria-hidden="true">
                  {group.label}
                </span>
                {group.commands.map((command) => (
                  <button
                    role={
                      command.pressed === undefined
                        ? "menuitem"
                        : "menuitemcheckbox"
                    }
                    aria-checked={command.pressed}
                    type="button"
                    disabled={!command.run}
                    title={commandTitle(command)}
                    key={command.label}
                    onClick={() => {
                      if (!command.run) return;
                      closeAndFocus();
                      command.run();
                    }}
                  >
                    {command.icon}
                    <span>{command.label}</span>
                    {!command.run && (
                      <small>{command.unavailable ?? "未接入"}</small>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button
        className={s.menuTrigger}
        disabled={helpDisabled}
        onClick={() => {
          setOpen("");
          help();
        }}
      >
        帮助
      </button>
    </nav>
  );
}
