import { commandTitle, type CommandGroup } from "./workspaceCommands";
import s from "./Workspace.module.css";

export function QuickToolbar({
  groups,
  result,
}: {
  groups: readonly CommandGroup[];
  result: boolean;
}) {
  return (
    <div
      className={s.quickToolbar}
      role="toolbar"
      aria-label={result ? "结果常用工具栏" : "常用工具栏"}
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
          return;
        const buttons = [
          ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
            "button:not(:disabled)",
          ),
        ];
        if (!buttons.length) return;
        event.preventDefault();
        const index = buttons.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        const offset = event.key === "ArrowRight" ? 1 : -1;
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? buttons.length - 1
              : (index + offset + buttons.length) % buttons.length;
        buttons[next].focus();
      }}
    >
      <span className={s.toolbarLabel}>常用</span>
      {groups.map(({ label, commands }) => (
        <div
          role="group"
          aria-label={label}
          key={label}
          className={s.quickGroup}
        >
          {commands.map((command) => (
            <button
              type="button"
              key={command.label}
              title={commandTitle(command)}
              aria-label={command.label}
              disabled={!command.run}
              aria-pressed={command.pressed}
              onClick={command.run}
            >
              {command.icon}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
