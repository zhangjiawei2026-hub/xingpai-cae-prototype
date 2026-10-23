import { describe, expect, it } from "vitest";
import { reducer } from "../src/app/reducer";
import { initialState } from "../src/data/demo";
import type { Action, SelectionSession } from "../src/types/domain";
const open = () =>
  reducer(initialState(), { type: "open", command: "nodeSet" });
const session: SelectionSession = {
  owner: "nodeSet",
  target: "nodes",
  entity: "Node",
  ids: [1],
};
const add: Action = {
  type: "addSet",
  value: { id: "new", name: "Set-review", nodes: [1, 2] },
};
describe("工作区状态边界", () => {
  it("拾取取消不生成对象，且不修改进入时传入的选择", () => {
    const picking = reducer(open(), { type: "pick", session });
    const changed = reducer(picking, { type: "toggle", id: 2 });
    expect(session.ids).toEqual([1]);
    expect(changed.selection?.ids).toEqual([1, 2]);
    const canceled = reducer(changed, { type: "pickCancel" });
    expect(canceled.selection).toBeNull();
    expect(canceled.selectionResult).toBeNull();
    expect(canceled.models["Model-1"].sets).toEqual(
      initialState().models["Model-1"].sets,
    );
  });
  it("确认结果带回正确目标，消费后不泄漏到后续字段", () => {
    const picking = reducer(open(), { type: "pick", session });
    const confirmed = reducer(picking, { type: "pickConfirm" });
    expect(confirmed.selectionResult).toEqual({ target: "nodes", ids: [1] });
    expect(
      reducer(confirmed, { type: "consumeResult" }).selectionResult,
    ).toBeNull();
  });
  it("再次点击同一对象取消选中", () => {
    const picking = reducer(open(), { type: "pick", session });
    expect(reducer(picking, { type: "toggle", id: 1 }).selection?.ids).toEqual(
      [],
    );
  });
  it("未发起命令、错误 owner 或选择中不能提交", () => {
    const state = initialState();
    expect(reducer(state, add)).toBe(state);
    expect(
      reducer(open(), {
        type: "pick",
        session: { ...session, owner: "domain" },
      }).selection,
    ).toBeNull();
    const picking = reducer(open(), { type: "pick", session });
    expect(reducer(picking, add)).toBe(picking);
  });
  it("活动命令锁定模型、模块和分析步上下文", () => {
    const state = open();
    expect(reducer(state, { type: "model", value: "Model-Empty" })).toBe(state);
    expect(reducer(state, { type: "module", value: "Step" })).toBe(state);
    expect(reducer(state, { type: "step", value: "Initial" })).toBe(state);
  });
  it("提交只修改当前模型并释放命令，不改变基线", () => {
    const state = open();
    const next = reducer(state, add);
    expect(next.models["Model-1"].sets).toHaveLength(2);
    expect(next.models["Model-Empty"]).toBe(state.models["Model-Empty"]);
    expect(state.models["Model-1"].sets).toHaveLength(1);
    expect(next.command).toBeNull();
    expect(next.selectedTree).toBe("new");
  });
  it("空模型不能发起演示创建命令", () => {
    const state = reducer(initialState(), {
      type: "model",
      value: "Model-Empty",
    });
    expect(reducer(state, { type: "open", command: "domain" })).toBe(state);
  });
  it("取消表单清空选择与回传结果，随后命令切换到合适模块", () => {
    const canceled = reducer(reducer(open(), { type: "pick", session }), {
      type: "close",
    });
    expect(canceled.command).toBeNull();
    expect(canceled.selection).toBeNull();
    const next = reducer(canceled, { type: "open", command: "domain" });
    expect(next.module).toBe("Optimization");
    expect(next.selectionResult).toBeNull();
  });
});

describe("已有对象编辑", () => {
  it("取消保留原对象，保存按 ID 替换且不新增", () => {
    const original = initialState();
    const editing = reducer(original, {
      type: "open",
      command: "nodeSet",
      id: "fixture",
    });
    expect(reducer(editing, { type: "close" }).models).toBe(original.models);
    const saved = reducer(editing, {
      type: "addSet",
      value: { id: "fixture", name: "Changed", nodes: [8] },
    });
    expect(saved.models["Model-1"].sets).toEqual([
      { id: "fixture", name: "Changed", nodes: [8] },
    ]);
    expect(original.models["Model-1"].sets[0].name).toBe("Fixture-nodes");
    expect(saved.editingId).toBeUndefined();
  });
  it("拒绝不存在的对象及提交 ID 错配", () => {
    const state = initialState();
    expect(
      reducer(state, { type: "open", command: "domain", id: "fixture" }),
    ).toBe(state);
    const editing = reducer(state, {
      type: "open",
      command: "nodeSet",
      id: "fixture",
    });
    expect(reducer(editing, add)).toBe(editing);
  });
});
