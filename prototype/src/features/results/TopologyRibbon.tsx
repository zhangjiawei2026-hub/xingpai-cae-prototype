import { CAEIcon } from "../../components/CAEIcon";
import { Group, Numeric, Select } from "./ResultRibbonControls";
import type { ResultReview } from "./resultState";
import {
  initialTopology,
  iterationControls,
  materialDisplays,
  materialRule,
  topologyEvaluation,
  topologyTasks,
} from "./topologyResult";
import s from "./Results.module.css";

export function TopologySource({ review }: { review: ResultReview }) {
  const { topology, setTopology, setFeedback } = review;
  const task = topologyTasks[topology.task];
  function setIteration(iteration: number) {
    setFeedback("");
    setTopology((current) => ({ ...current, iteration }));
  }
  return (
    <div className={s.topologySourceFields}>
      <Select
        label="任务"
        name="拓扑结果任务"
        value={topology.task}
        options={Object.entries(topologyTasks).map(([id, data]) => [
          id,
          data.label,
        ])}
        set={(id) => {
          setFeedback("");
          setTopology(initialTopology(id as keyof typeof topologyTasks));
        }}
      />
      <Select
        label="设计域"
        name="拓扑结果设计域"
        value={topology.region}
        options={task.regions.map(({ id, label }) => [id, label])}
        set={(region) => {
          setFeedback("");
          setTopology((current) => ({ ...current, region }));
        }}
      />
      <Select
        label="迭代"
        name="已保存的优化迭代"
        value={topology.iteration}
        options={task.iterations.map((value, index) => [
          value,
          value === task.final
            ? `最终 · 迭代 ${value}`
            : index === 0
              ? `初始 · 迭代 ${value}`
              : `迭代 ${value}`,
        ])}
        set={(value) => setIteration(Number(value))}
      />
      <div className={s.iterationButtons}>
        {iterationControls(topology).map(
          ({ label, target, icon, ...options }) => (
            <button
              key={label}
              type="button"
              title={
                target === undefined && label === "最终迭代"
                  ? "当前任务没有已保存的最终迭代"
                  : label
              }
              aria-label={label}
              data-backward={"backward" in options ? true : undefined}
              disabled={target === undefined || target === topology.iteration}
              onClick={() => {
                if (target !== undefined) setIteration(target);
              }}
            >
              <CAEIcon name={icon} size={17} />
            </button>
          ),
        )}
      </div>
    </div>
  );
}

export function TopologyGroups({
  review,
  onEvaluation,
}: {
  review: ResultReview;
  onEvaluation: (title: keyof typeof topologyEvaluation) => void;
}) {
  const { topology, setTopology, setFeedback } = review;
  const task = topologyTasks[topology.task];
  function setThreshold(value: number) {
    setTopology((current) => ({ ...current, threshold: value }));
    setFeedback("");
  }
  const evaluations = [
    { label: "目标历史", icon: "topologyObjective" },
    { label: "约束历史", icon: "topologyConstraint" },
    { label: "结果摘要", icon: "resultReport" },
  ] as const;
  return (
    <>
      <Group label="材料显示">
        <div className={s.topologyChoices}>
          {materialDisplays.map(({ id, label, icon }) => (
            <button
              key={id}
              className={s.large}
              aria-pressed={topology.display === id}
              onClick={() => {
                setFeedback("");
                setTopology((current) => ({ ...current, display: id }));
              }}
            >
              <CAEIcon name={icon} size={28} />
              {label}
            </button>
          ))}
        </div>
      </Group>
      <Group label="密度阈值">
        <div className={s.threshold}>
          <div className={s.row}>
            <Numeric
              label="阈值"
              name="相对密度阈值"
              value={topology.threshold}
              min={0}
              max={1}
              step={0.01}
              change={(value) => {
                if (value < 0 || value > 1)
                  return "相对密度阈值须在 0 至 1 之间，已保留上次输入。";
                setThreshold(value);
              }}
              error={setFeedback}
            />
            <button
              aria-label="复位密度阈值"
              title="复位密度阈值"
              onClick={() => setThreshold(task.threshold)}
            >
              <CAEIcon name="topologyThresholdReset" size={17} />
            </button>
          </div>
          <div className={s.row}>
            <span>0</span>
            <input
              type="range"
              min={0}
              max={1}
              step="any"
              aria-label="相对密度阈值滑块"
              value={topology.threshold}
              onChange={(event) =>
                setThreshold(Math.round(event.target.valueAsNumber * 100) / 100)
              }
            />
            <span>1</span>
          </div>
          <span className={s.unit}>
            {materialRule(topology.display, topology.threshold)}
          </span>
        </div>
      </Group>
      <Group label="优化评价">
        <div className={s.topologyChoices}>
          {evaluations.map(({ label, icon }) => (
            <button
              key={label}
              className={s.large}
              onClick={() => onEvaluation(label)}
            >
              <CAEIcon name={icon} size={28} />
              {label}
            </button>
          ))}
        </div>
      </Group>
    </>
  );
}
