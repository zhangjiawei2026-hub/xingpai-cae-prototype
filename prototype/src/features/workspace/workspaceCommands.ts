import type { ReactNode } from "react";

export type WorkspaceCommand = {
  label: string;
  icon?: ReactNode;
  run?: () => void;
  unavailable?: string;
  pressed?: boolean;
};

export type CommandGroup = {
  label: string;
  commands: readonly WorkspaceCommand[];
};

export type Menu = {
  label: string;
  groups: readonly CommandGroup[];
};

export function commandTitle(command: WorkspaceCommand) {
  return command.run
    ? command.label
    : `${command.label} · ${command.unavailable ?? "未接入"}`;
}
