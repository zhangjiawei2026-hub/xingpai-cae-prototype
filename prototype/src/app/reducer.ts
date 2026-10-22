import { MODULES, MODULE_LABELS } from "../data/demo";
import { initialState } from "../data/demo";
import type { Action, WorkState } from "../types/domain";

export function reducer(state: WorkState, action: Action): WorkState {
  const current = state.models[state.model];
  const changed = (message: string) => ({
    logs: [...state.logs, message],
    notice: message,
  });
  switch (action.type) {
    case "module":
      return state.command
        ? state
        : {
            ...state,
            module: action.value,
            selection: null,
            selectedTree: "",
            notice: `当前模块：${MODULE_LABELS[MODULES.indexOf(action.value)]}`,
          };
    case "model":
      return state.command || !state.models[action.value]
        ? state
        : {
            ...state,
            model: action.value,
            step: "Initial",
            selectedTree: "",
            selection: null,
            notice: `当前模型：${action.value}`,
          };
    case "step":
      return state.command ||
        (action.value !== "Initial" &&
          !current.steps.some((step) => step.name === action.value))
        ? state
        : { ...state, step: action.value };
    case "tree":
      return { ...state, selectedTree: action.value };
    case "open":
      return state.command || state.model === "Model-Empty"
        ? state
        : {
            ...state,
            module: (
              { nodeSet: "Mesh", step: "Step", domain: "Optimization" } as const
            )[action.command],
            command: action.command,
            selection: null,
            selectionResult: null,
          };
    case "close":
      return {
        ...state,
        command: null,
        selection: null,
        selectionResult: null,
        notice: "已取消编辑，演示数据未更改",
      };
    case "pick":
      return state.command !== action.session.owner || state.selection
        ? state
        : {
            ...state,
            selection: { ...action.session, ids: [...action.session.ids] },
            selectionResult: null,
          };
    case "toggle":
      return !state.selection
        ? state
        : {
            ...state,
            selection: {
              ...state.selection,
              ids: state.selection.ids.includes(action.id)
                ? state.selection.ids.filter((id) => id !== action.id)
                : [...state.selection.ids, action.id],
            },
          };
    case "pickCancel":
      return {
        ...state,
        selection: null,
        selectionResult: null,
        notice: "已取消拾取，保留原字段值",
      };
    case "pickConfirm":
      return !state.selection
        ? state
        : {
            ...state,
            selectionResult: {
              target: state.selection.target,
              ids: [...state.selection.ids],
            },
            selection: null,
          };
    case "consumeResult":
      return { ...state, selectionResult: null };
    case "addSet": {
      if (state.command !== "nodeSet" || state.selection) return state;
      return {
        ...state,
        models: {
          ...state.models,
          [state.model]: { ...current, sets: [...current.sets, action.value] },
        },
        command: null,
        selectionResult: null,
        selectedTree: action.value.id,
        ...changed(
          `[演示] 已创建节点集合 ${action.value.name} · ${action.value.nodes.length} 个节点`,
        ),
      };
    }
    case "addStep": {
      if (state.command !== "step" || state.selection) return state;
      return {
        ...state,
        models: {
          ...state.models,
          [state.model]: {
            ...current,
            steps: [...current.steps, action.value],
          },
        },
        step: action.value.name,
        command: null,
        selectionResult: null,
        selectedTree: action.value.id,
        ...changed(`[演示] 已创建分析步 ${action.value.name} · 未执行计算`),
      };
    }
    case "addDomain": {
      if (state.command !== "domain" || state.selection) return state;
      return {
        ...state,
        models: {
          ...state.models,
          [state.model]: {
            ...current,
            domains: [...current.domains, action.value],
          },
        },
        command: null,
        selectionResult: null,
        selectedTree: action.value.id,
        ...changed(
          `[演示] 已创建设计域 ${action.value.name} · ${action.value.elements.length} 个演示单元`,
        ),
      };
    }
    case "notice":
      return { ...state, notice: action.value };
    case "reset":
      return initialState();
  }
}
