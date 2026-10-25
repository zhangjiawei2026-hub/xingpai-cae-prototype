import type { KeyboardEvent } from "react";

/** Horizontal tabs activate with arrows; menus move focus without activation. */
export function moveFocus(
  event: KeyboardEvent<HTMLElement>,
  role: "tab" | "menuitem",
) {
  const keys =
    role === "tab" ? ["ArrowLeft", "ArrowRight"] : ["ArrowUp", "ArrowDown"];
  if (![...keys, "Home", "End"].includes(event.key)) return;
  const items = [
    ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
      `[role="${role}"]:not(:disabled)`,
    ),
  ];
  if (!items.length) return;
  event.preventDefault();
  const index = items.indexOf(document.activeElement as HTMLButtonElement);
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? items.length - 1
        : (index + (event.key === keys[1] ? 1 : items.length - 1)) %
          items.length;
  items[next].focus();
  if (role === "tab") items[next].click();
}
