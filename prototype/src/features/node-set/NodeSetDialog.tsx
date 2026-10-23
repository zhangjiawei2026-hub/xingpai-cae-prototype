import { useEffect, useState } from "react";
import { MousePointer2, List } from "lucide-react";
import { useStore } from "../../app/Store";
import { Dialog, FormRow, formStyles as s } from "../../components/Dialog";
export function NodeSetDialog() {
  const { state, dispatch } = useStore();
  const model = state.models[state.model];
  const existing = model.sets.find((v) => v.id === state.editingId);
  const [name, setName] = useState(
      existing?.name ?? `Nset-${model.sets.length + 1}`,
    ),
    [nodes, setNodes] = useState<number[]>(existing?.nodes ?? []),
    [error, setError] = useState("");
  const [collections, setCollections] = useState(false);
  useEffect(() => {
    if (state.selectionResult?.target === "nodes") {
      setNodes(state.selectionResult.ids);
      dispatch({ type: "consumeResult" });
    }
  }, [state.selectionResult, dispatch]);
  const save = () => {
    if (!name.trim()) return setError("请输入集合名称。");
    if (
      model.sets.some(
        (set) => set.id !== existing?.id && set.name === name.trim(),
      )
    )
      return setError("本演示中集合名称需唯一，请修改名称。");
    if (!nodes.length)
      return setError("请先拾取至少一个演示节点，或从已有集合读取。");
    dispatch({
      type: "addSet",
      value: {
        id: existing?.id ?? crypto.randomUUID(),
        name: name.trim(),
        nodes,
      },
    });
  };
  return (
    <Dialog
      title={existing ? "编辑节点集合" : "创建节点集合"}
      subtitle="定义一组可重复使用的节点"
      error={error}
      footer={
        <>
          <button onClick={() => dispatch({ type: "close" })}>取消</button>
          <button className={s.primary} onClick={save}>
            {existing ? "保存集合" : "创建集合"}
          </button>
        </>
      }
    >
      <FormRow label="集合名称">
        <input
          autoFocus
          aria-label="集合名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </FormRow>
      <fieldset className={s.group}>
        <legend>区域</legend>
        <FormRow label="对象类型">
          <select aria-label="节点集合对象类型" disabled value="Node">
            <option>Node</option>
          </select>
        </FormRow>
        <FormRow label="节点选择">
          <div className={s.region}>
            <button
              className={s.pick}
              onClick={() =>
                dispatch({
                  type: "pick",
                  session: {
                    owner: "nodeSet",
                    target: "nodes",
                    entity: "Node",
                    ids: nodes,
                  },
                })
              }
            >
              <MousePointer2 size={13} />
              拾取节点
            </button>
            <span data-testid="node-count">已选 {nodes.length} 项</span>
          </div>
        </FormRow>
        {nodes.length > 0 && (
          <div className={s.selectionList}>
            {nodes.map((id) => `N${String(id).padStart(3, "0")}`).join(" · ")}
          </div>
        )}
        <button
          className={s.listButton}
          aria-expanded={collections}
          onClick={() => setCollections(!collections)}
        >
          <List size={13} /> 从已有集合读取
        </button>
        {collections &&
          model.sets.map((set) => (
            <button
              className={s.listButton}
              key={set.id}
              onClick={() => {
                setNodes([...set.nodes]);
                setCollections(false);
              }}
            >
              {set.name} ({set.nodes.length} 个节点)
            </button>
          ))}
        <p className={s.hint}>
          此命令固定选择 Node。已有集合将复制节点列表，不建立关联。
        </p>
      </fieldset>
      <p className={s.hint}>
        演示提交要求：名称唯一、至少选择一个节点。真实产品规则待研发确认。
      </p>
    </Dialog>
  );
}
