let pendingTrigger: HTMLElement | null = null;
export function rememberDialogTrigger(element: HTMLElement | null) {
  pendingTrigger = element;
}
export function takeDialogTrigger() {
  const element = pendingTrigger;
  pendingTrigger = null;
  return element;
}
