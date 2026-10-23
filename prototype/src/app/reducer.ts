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
      return state.command ||
        state.model === "Model-Empty" ||
        (action.id !== undefined &&
          !(
            action.command === "nodeSet"
              ? current.sets
              : action.command === "step"
                ? current.steps
                : current.domains
          ).some((v) => v.id === action.id))
        ? state
        : {
            ...state,
            module: (
              { nodeSet: "Mesh", step: "Step", domain: "Optimization" } as const
            )[action.command],
            command: action.command,
            editingId: action.id,
            selection: null,
            selectionResult: null,
          };
    case "close":
      return {
        ...state,
        command: null,
        editingId: undefined,
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
      if (
        state.command !== "nodeSet" ||
        state.selection ||
        (state.editingId && action.value.id !== state.editingId)
      )
        return state;
      return {
        ...state,
        models: {
          ...state.models,
          [state.model]: {
            ...current,
            sets: state.editingId
              ? current.sets.map((v) =>
                  v.id === state.editingId ? action.value : v,
                )
              : [...current.sets, action.value],
          },
        },
        command: null,
        editingId: undefined,
        selectionResult: null,
        selectedTree: action.value.id,
        ...changed(
          `[演示] 已${state.editingId ? "更新" : "创建"}节点集合 ${action.value.name} · ${action.value.nodes.length} 个节点`,
        ),
      };
    }
    case "addStep": {
      if (
        state.command !== "step" ||
        state.selection ||
        (state.editingId && action.value.id !== state.editingId)
      )
        return state;
      return {
        ...state,
        models: {
          ...state.models,
          [state.model]: {
            ...current,
            steps: state.editingId
              ? current.steps.map((v) =>
                  v.id === state.editingId ? action.value : v,
                )
              : [...current.steps, action.value],
          },
        },
        step: action.value.name,
        command: null,
        editingId: undefined,
        selectionResult: null,
        selectedTree: action.value.id,
        ...changed(
          `[演示] 已${state.editingId ? "更新" : "创建"}分析步 ${action.value.name} · 未执行计算`,
        ),
      };
    }
    case "addDomain": {
      if (
        state.command !== "domain" ||
        state.selection ||
        (state.editingId && action.value.id !== state.editingId)
      )
        return state;
      return {
        ...state,
        models: {
          ...state.models,
          [state.model]: {
            ...current,
            domains: state.editingId
              ? current.domains.map((v) =>
                  v.id === state.editingId ? action.value : v,
                )
              : [...current.domains, action.value],
          },
        },
        command: null,
        editingId: undefined,
        selectionResult: null,
        selectedTree: action.value.id,
        ...changed(
          `[演示] 已${state.editingId ? "更新" : "创建"}设计域 ${action.value.name} · ${action.value.elements.length} 个演示单元`,
        ),
      };
    }
    case "notice":
      return { ...state, notice: action.value };
    case "reset":
      return initialState();
  }
}
