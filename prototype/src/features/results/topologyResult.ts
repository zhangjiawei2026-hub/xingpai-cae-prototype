export const resultKinds = {
  structural: "结构结果",
  topology: "拓扑优化结果",
} as const;
export type ResultKind = keyof typeof resultKinds;

export const topologyEvaluation = {
  目标历史:
    "用于查看目标函数随迭代变化的曲线和表格。当前示例没有目标历史数据。",
  约束历史: "用于查看约束实际值、限制值和满足状态。当前示例没有约束历史数据。",
  结果摘要: "用于查看体积、质量、目标变化和停止原因。当前示例没有摘要数据。",
} as const;

export const materialDisplays = [
  { id: "density", label: "密度云图", icon: "topologyDensity" },
  { id: "retained", label: "保留形态", icon: "topologyRetained" },
  { id: "removed", label: "移除区域", icon: "topologyRemoved" },
] as const;
export type MaterialDisplay = (typeof materialDisplays)[number]["id"];

const mainRegion = { id: "main", label: "主设计域（示例）" };
export const topologyTasks = {
  complete: {
    label: "拓扑优化任务（示例）",
    regions: [mainRegion, { id: "local", label: "局部设计域（示例）" }],
    iterations: [0, 5, 10, 20],
    final: 20,
    threshold: 0.5,
  },
  intermediate: {
    label: "中间迭代任务（示例）",
    regions: [mainRegion],
    iterations: [0, 4, 8],
    final: null,
    threshold: 0.5,
  },
};
type TaskId = keyof typeof topologyTasks;

export type TopologyResult = {
  task: TaskId;
  region: string;
  iteration: number;
  display: MaterialDisplay;
  threshold: number;
};

export function initialTopology(task: TaskId = "complete"): TopologyResult {
  const data = topologyTasks[task];
  return {
    task,
    region: data.regions[0].id,
    iteration: data.final ?? data.iterations[data.iterations.length - 1],
    display: "retained",
    threshold: data.threshold,
  };
}

export function iterationControls(state: TopologyResult) {
  const { iterations, final } = topologyTasks[state.task];
  const index = iterations.indexOf(state.iteration);
  return [
    { label: "初始迭代", icon: "resultPrev", target: iterations[0] },
    {
      label: "上一迭代",
      icon: "resultPlay",
      target: iterations[index - 1],
      backward: true,
    },
    { label: "下一迭代", icon: "resultPlay", target: iterations[index + 1] },
    { label: "最终迭代", icon: "resultNext", target: final ?? undefined },
  ] as const;
}

export function materialRule(display: MaterialDisplay, threshold: number) {
  switch (display) {
    case "density":
      return "全场云图 · 阈值用于形态筛选";
    case "removed":
      return `移除：ρ < ${threshold}`;
    case "retained":
      return `保留：ρ ≥ ${threshold}`;
  }
}

// Deterministic cells for the review fixture. Values are illustrative densities.
export function demoDensity(
  column: number,
  row: number,
  state: TopologyResult,
) {
  const progress = state.iteration / (topologyTasks[state.task].final ?? 8);
  const diagonal = Math.max(0, 0.9 - Math.abs(row - (column % 7) / 2) * 0.29);
  const alternate = Math.max(0, 0.93 - Math.abs(row - 3 + column / 6) * 0.33);
  const regionWeight =
    state.region === "local" ? (column >= 4 && column <= 8 ? 0.11 : -0.2) : 0;
  const density = Math.max(diagonal, alternate) + regionWeight;
  return (
    Math.round(
      Math.min(
        1,
        Math.max(0, density * (0.45 + 0.55 * progress) + 0.44 * (1 - progress)),
      ) * 100,
    ) / 100
  );
}

export function showDensity(density: number, state: TopologyResult) {
  if (state.display === "density") return true;
  return state.display === "retained"
    ? density >= state.threshold
    : density < state.threshold;
}
