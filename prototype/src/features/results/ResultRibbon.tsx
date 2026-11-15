import { useEffect, useRef, useState } from "react";

import { Dialog, formStyles } from "../../components/Dialog";
import { CAEIcon } from "../../components/CAEIcon";
import {
  currentResult,
  datasets,
  demoScaleLimit,
  fields,
  layouts,
  type Dataset,
  type ResultReview,
  type ResultState,
} from "./resultState";
import s from "./Results.module.css";

import { Group, Numeric, Select, Toggle } from "./ResultRibbonControls";
import { TopologyGroups, TopologySource } from "./TopologyRibbon";
import {
  resultKinds,
  topologyEvaluation,
  type ResultKind,
} from "./topologyResult";

const modes = [
  ["auto", "自动"],
  ["manual", "手动"],
] as const;
const layoutGlyphs = {
  side: "resultSide",
  three: "resultThree",
  four: "resultFour",
  single: "resultSingle",
} as const;
const details = {
  导出: "导出格式与结果字段待确认。",
  报告: "报告模板与数据范围待确认。",
  自定义运算: "表达式语法、输入变量和校验规则待确认。",
  ...topologyEvaluation,
} as const;

export function ResultRibbon({ review }: { review: ResultReview }) {
  const { result, change, choose } = review;
  const isTopology = review.kind === "topology";
  const context = currentResult(result);
  const [detail, setDetail] = useState<keyof typeof details>();
  const [clearOpen, setClearOpen] = useState(false);
  const clear = useRef<HTMLButtonElement>(null);
  const probe = useRef<HTMLButtonElement>(null);
  const clearActive = useRef<HTMLButtonElement>(null);
  const clearAll = useRef<HTMLButtonElement>(null);
  const hasCurrent = result.markers[result.activePane].length;
  const total = result.markers.reduce((count, pane) => count + pane.length, 0);
  useEffect(() => {
    if (clearOpen) (hasCurrent ? clearActive : clearAll).current?.focus();
  }, [clearOpen, hasCurrent]);
  const deformReady = result.deform && context.hasDisplacement;
  const autoScale = result.scaleMode === "auto";
  const manualRange = result.cloud && result.range === "manual";
  const frameWord = context.modal ? "阶" : "帧";
  const lastFrame = context.step.frames.length - 1;
  const closeClear = (all?: boolean) => {
    const nextCount = all === undefined ? total : all ? 0 : total - hasCurrent;
    if (all !== undefined) review.clearMarkers(all);
    setClearOpen(false);
    (nextCount ? clear : probe).current?.focus();
  };
  const numeric = (
    key: "scale" | "offset" | "phase" | "minimum" | "maximum",
    value: number,
  ) => {
    if (key === "scale" && (value <= 0 || value > demoScaleLimit))
      return `示意倍数须大于 0 且不超过 ${demoScaleLimit}，已保留上次输入。`;
    if (key === "offset" && Math.abs(value) > 100)
      return "剖切偏移须在 −100% 至 100% 之间。";
    if (key === "phase" && (value < 0 || value > 360))
      return "相位须在 0° 至 360° 之间。";
    if (key === "minimum" && value >= result.maximum)
      return "最小值必须小于最大值。";
    if (key === "maximum" && value <= result.minimum)
      return "最大值必须大于最小值。";
    change(
      key === "phase" ? { phase: value, playing: false } : { [key]: value },
    );
  };

  return (
    <div
      className={s.ribbon}
      aria-label="结果 Ribbon 功能区"
      data-result-kind={review.kind}
    >
      <Group label={isTopology ? "结果与迭代" : "结果数据"}>
        <Select
          label="结果"
          name="结果类型"
          value={review.kind}
          options={Object.entries(resultKinds)}
          set={(kind) => review.chooseKind(kind as ResultKind)}
        />
        {isTopology ? (
          <TopologySource review={review} />
        ) : (
          <>
            <Select
              label="数据"
              name="结果文件"
              value={result.dataset}
              options={Object.entries(datasets).map(([key, data]) => [
                key,
                data.label,
              ])}
              set={(dataset) => choose({ dataset: dataset as Dataset })}
            />
            <Select
              label="分析步"
              name="结果分析步"
              value={result.step}
              options={datasets[result.dataset].steps.map((step, index) => [
                index,
                step.label,
              ])}
              set={(step) => choose({ step: Number(step) })}
            />
            <Select
              label={context.modal ? "振型" : "帧/时刻"}
              name={context.modal ? "模态阶次与固有频率" : "结果帧与时刻"}
              value={result.frame}
              options={context.step.frames.map((frame, index) => [
                index,
                frame.label,
              ])}
              set={(frame) => choose({ frame: Number(frame) })}
            />
          </>
        )}
      </Group>
      {isTopology ? (
        <TopologyGroups review={review} onEvaluation={setDetail} />
      ) : (
        <>
          <Group label="显示模式">
            <button
              aria-pressed={!result.harmonic}
              onClick={() =>
                change({ harmonic: false, phase: 0, playing: false })
              }
            >
              <CAEIcon name="resultLinear" size={18} />
              常规线性
            </button>
            <button
              aria-pressed={result.harmonic}
              disabled={!context.hasDisplacement}
              onClick={() =>
                change({ harmonic: true, phase: 0, playing: false })
              }
            >
              <CAEIcon name="resultHarmonic" size={18} />
              简谐
            </button>
          </Group>
          <Group label="云图">
            <button
              aria-pressed={result.cloud}
              onClick={() => change({ cloud: !result.cloud })}
            >
              <CAEIcon name="resultContour" size={19} />
              云图
            </button>
            <Select
              label="变量"
              name="结果变量"
              value={result.field}
              options={context.frame.fields.map((field) => [
                field,
                context.modal ? "U · 振型" : fields[field][0],
              ])}
              set={(field) => choose({ field: field as keyof typeof fields })}
            />
            <Select
              label="分量"
              name="结果分量"
              value={result.component}
              options={
                context.components.length
                  ? context.components.map((item) => [item, item])
                  : [["", "标量"]]
              }
              disabled={!result.cloud || !context.components.length}
              set={(component) => change({ component })}
            />
          </Group>
          <Group label="变形">
            <div className={s.row}>
              <button
                disabled={!context.hasDisplacement}
                aria-pressed={result.deform}
                onClick={() => {
                  if (result.deform)
                    change({
                      deform: false,
                      overlay: false,
                      playing: result.harmonic ? false : result.playing,
                    });
                  else change({ deform: true });
                }}
              >
                <CAEIcon name="resultDeform" size={18} />
                变形
              </button>
              <Select
                label=""
                name="变形比例模式"
                value={result.scaleMode}
                options={modes}
                disabled={!deformReady}
                set={(scaleMode) =>
                  change({ scaleMode: scaleMode as ResultState["scaleMode"] })
                }
              />
            </div>
            <Numeric
              label="倍数"
              name="变形放大倍数"
              value={autoScale ? undefined : result.scale}
              disabled={!deformReady || autoScale}
              placeholder="自动"
              unit={
                deformReady && !autoScale ? `≤${demoScaleLimit}×` : undefined
              }
              max={demoScaleLimit}
              change={(value) => numeric("scale", value)}
              error={review.setFeedback}
            />
            <div className={s.row}>
              <Toggle
                label="叠加原形"
                checked={result.overlay}
                disabled={!deformReady}
                change={(overlay) => change({ overlay })}
              />
              <button
                disabled={!result.deform && !result.cloud}
                onClick={() =>
                  change({
                    deform: false,
                    cloud: false,
                    overlay: false,
                    phase: 0,
                    playing: false,
                  })
                }
              >
                原形
              </button>
            </div>
          </Group>
        </>
      )}
      <Group label="结果剖切">
        <div className={s.row}>
          <button
            aria-pressed={result.cut}
            onClick={() => change({ cut: !result.cut })}
          >
            <CAEIcon name="resultCut" size={18} />
            剖切
          </button>
          <Select
            label=""
            name="切面方向"
            value={result.plane}
            options={[
              ["XY", "XY 平面"],
              ["YZ", "YZ 平面"],
              ["XZ", "XZ 平面"],
            ]}
            disabled={!result.cut}
            set={(plane) => change({ plane: plane as ResultState["plane"] })}
          />
        </div>
        <Numeric
          label="偏移"
          name="切面偏移百分比"
          value={result.offset}
          disabled={!result.cut}
          unit="%"
          min={-100}
          max={100}
          change={(value) => numeric("offset", value)}
          error={review.setFeedback}
        />
        <div className={s.row}>
          <button
            disabled={!result.cut}
            aria-pressed={result.flip}
            onClick={() => change({ flip: !result.flip })}
          >
            反向
          </button>
          <button
            disabled={!result.cut}
            onClick={() => change({ plane: "XY", offset: 0, flip: false })}
          >
            复位
          </button>
        </div>
      </Group>
      {!isTopology && (
        <>
          <Group label="图例与范围">
            <div className={s.row}>
              <Toggle
                label="图例"
                checked={result.legend}
                disabled={!result.cloud}
                change={(legend) => change({ legend })}
              />
              <Select
                label=""
                name="云图范围模式"
                value={result.range}
                options={[
                  ["auto", "自动范围"],
                  ["manual", "手动范围"],
                ]}
                disabled={!result.cloud}
                set={(range) =>
                  change({ range: range as ResultState["range"] })
                }
              />
            </div>
            <Numeric
              label="最小"
              name="范围最小值"
              value={manualRange ? result.minimum : undefined}
              placeholder="自动"
              disabled={!manualRange}
              change={(value) => numeric("minimum", value)}
              error={review.setFeedback}
            />
            <Numeric
              label="最大"
              name="范围最大值"
              value={manualRange ? result.maximum : undefined}
              placeholder="自动"
              disabled={!manualRange}
              change={(value) => numeric("maximum", value)}
              error={review.setFeedback}
            />
          </Group>
          <Group label="动画">
            <div className={s.playback}>
              <button
                title={`上一${frameWord}`}
                aria-label={`上一${frameWord}`}
                disabled={result.frame === 0}
                onClick={() => choose({ frame: result.frame - 1 })}
              >
                <CAEIcon name="resultPrev" size={18} />
              </button>
              <button
                title={result.playing ? "暂停动画" : "播放动画"}
                aria-label={result.playing ? "暂停动画" : "播放动画"}
                disabled={!context.canPlay}
                onClick={review.rotatePlayback}
              >
                {result.playing ? (
                  <CAEIcon name="resultPause" size={18} />
                ) : (
                  <CAEIcon name="resultPlay" size={18} />
                )}
              </button>
              <button
                title={`下一${frameWord}`}
                aria-label={`下一${frameWord}`}
                disabled={result.frame === lastFrame}
                onClick={() => choose({ frame: result.frame + 1 })}
              >
                <CAEIcon name="resultNext" size={18} />
              </button>
              <button
                title="停止动画"
                aria-label="停止动画"
                disabled={
                  !result.playing &&
                  result.phase === 0 &&
                  (context.modal || result.frame === 0)
                }
                onClick={review.stop}
              >
                <CAEIcon name="resultStop" size={18} />
              </button>
            </div>
            {result.harmonic ? (
              <Numeric
                label="相位"
                name="显示相位"
                value={result.phase}
                disabled={!deformReady}
                unit="°"
                min={0}
                max={360}
                change={(value) => numeric("phase", value)}
                error={review.setFeedback}
              />
            ) : (
              <span className={s.unit}>
                {context.modal ? "静态振型" : "已保存结果帧"}
              </span>
            )}
          </Group>
        </>
      )}
      <Group label="查找关键位置">
        <button
          ref={probe}
          aria-pressed={result.probe}
          onClick={() => change({ probe: !result.probe })}
        >
          <CAEIcon name="resultProbe" size={18} />
          结果探针
        </button>
        <div
          className={s.clearSlot}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setClearOpen(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && clearOpen) {
              event.stopPropagation();
              closeClear();
            }
          }}
        >
          <button
            ref={clear}
            disabled={!total}
            aria-expanded={clearOpen}
            aria-controls="result-clear-options"
            onClick={() => setClearOpen(!clearOpen)}
          >
            <CAEIcon name="resultClear" size={18} />
            清除探针 ▾
          </button>
          <div
            id="result-clear-options"
            className={s.clearOptions}
            hidden={!clearOpen}
          >
            <button
              ref={clearActive}
              disabled={!hasCurrent}
              onClick={() => closeClear(false)}
            >
              清除当前视图
            </button>
            <button ref={clearAll} onClick={() => closeClear(true)}>
              清除全部视图
            </button>
          </div>
        </div>
        <div className={s.row}>
          <Toggle
            label="极大值"
            checked={result.maximumMark}
            change={(maximumMark) => change({ maximumMark })}
          />
          <Toggle
            label="极小值"
            checked={result.minimumMark}
            change={(minimumMark) => change({ minimumMark })}
          />
        </div>
        <span className={s.unit}>
          当前 {hasCurrent} / 全部 {total}
        </span>
      </Group>
      <Group label="导出与报告">
        <button onClick={() => setDetail("导出")}>
          <CAEIcon name="resultExport" size={18} />
          导出
        </button>
        <button onClick={() => setDetail("报告")}>
          <CAEIcon name="resultReport" size={18} />
          报告
        </button>
      </Group>
      {!isTopology && (
        <Group label="自定义运算">
          <button className={s.large} onClick={() => setDetail("自定义运算")}>
            <CAEIcon name="resultFormula" size={28} />
            <span>
              自定义
              <br />
              运算
            </span>
          </button>
        </Group>
      )}
      <Group label="多窗口对比">
        <div className={s.layouts}>
          {layouts.map(({ id, label, count }) => {
            return (
              <button
                key={id}
                title={label}
                aria-label={label}
                aria-pressed={result.layout === id}
                onClick={() =>
                  change({
                    layout: id,
                    activePane: Math.min(result.activePane, count - 1),
                  })
                }
              >
                <CAEIcon name={layoutGlyphs[id]} size={19} />
              </button>
            );
          })}
        </div>
      </Group>
      {detail && (
        <Dialog
          title={detail}
          subtitle="结果模块入口"
          onDismiss={() => setDetail(undefined)}
          footer={
            <button
              className={formStyles.primary}
              onClick={() => setDetail(undefined)}
            >
              知道了
            </button>
          }
        >
          <p>{details[detail]}</p>
        </Dialog>
      )}
    </div>
  );
}
