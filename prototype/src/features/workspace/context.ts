import type { WorkState } from "../../types/domain";
import { MODULES, MODULE_LABELS } from "../../data/demo";

export function workspaceContext(state: WorkState) {
  const empty = state.model === "Model-Empty";
  const kind = ["Part", "Property", "Mesh"].includes(state.module)
    ? "part"
    : ["Step", "Interaction", "Load"].includes(state.module)
      ? "step"
      : state.module === "Optimization"
        ? "task"
        : "model";
  const label = {
    part: "部件",
    step: "分析步",
    task: "优化任务",
    model: "模型",
  }[kind];
  const value =
    kind === "part"
      ? empty
        ? "无部件"
        : "Part-1"
      : kind === "step"
        ? state.step
        : kind === "task"
          ? empty
            ? "无优化任务"
            : "Task-1"
          : state.model;
  return {
    kind,
    label,
    value,
    moduleLabel: MODULE_LABELS[MODULES.indexOf(state.module)],
  };
}
