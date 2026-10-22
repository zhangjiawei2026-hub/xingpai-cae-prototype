import type { WorkState } from "../types/domain";
export const MODULES = [
  "Part",
  "Property",
  "Assembly",
  "Step",
  "Interaction",
  "Load",
  "Mesh",
  "Optimization",
] as const;
export const MODULE_LABELS = [
  "部件",
  "属性",
  "装配",
  "分析步",
  "相互作用",
  "载荷",
  "网格",
  "优化",
];
export const MODEL_ID = "Model-1";
export function initialState(): WorkState {
  return {
    module: "Mesh",
    model: MODEL_ID,
    step: "Initial",
    selectedTree: "part",
    command: null,
    selection: null,
    selectionResult: null,
    models: {
      "Model-1": {
        sets: [{ id: "fixture", name: "Fixture-nodes", nodes: [1, 2, 3, 4] }],
        steps: [],
        domains: [],
      },
      "Model-Empty": { sets: [], steps: [], domains: [] },
    },
    logs: [
      "[会话] 已加载安装支架演示模型。",
      "[说明] 浏览器交互原型 · 数据仅在本次会话有效。",
    ],
    notice: "就绪",
  };
}
