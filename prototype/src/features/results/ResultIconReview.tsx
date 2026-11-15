import { useState } from "react";
import { CAEIcon, type CAEIconName } from "../../components/CAEIcon";
import { Dialog, formStyles } from "../../components/Dialog";
import ws from "../workspace/Workspace.module.css";
import s from "./Results.module.css";

const examples: readonly (readonly [string, CAEIconName, boolean])[] = [
  ["云图", "resultContour", true],
  ["常规线性", "resultLinear", true],
  ["简谐", "resultHarmonic", true],
  ["变形", "resultDeform", true],
  ["剖切", "resultCut", true],
  ["图例", "resultLegend", true],
  ["上一帧 / 阶", "resultPrev", false],
  ["播放", "resultPlay", false],
  ["暂停", "resultPause", false],
  ["下一帧 / 阶", "resultNext", false],
  ["停止", "resultStop", false],
  ["结果探针", "resultProbe", true],
  ["清除探针", "resultClear", false],
  ["极大值", "resultMax", true],
  ["极小值", "resultMin", true],
  ["导出", "resultExport", false],
  ["报告", "resultReport", false],
  ["自定义运算", "resultFormula", false],
  ["密度云图", "topologyDensity", true],
  ["保留形态", "topologyRetained", true],
  ["移除区域", "topologyRemoved", true],
  ["目标历史", "topologyObjective", false],
  ["约束历史", "topologyConstraint", false],
  ["复位密度阈值", "topologyThresholdReset", false],
  ["左右两窗口", "resultSide", true],
  ["上二下一", "resultThree", true],
  ["四窗口", "resultFour", true],
  ["单窗口", "resultSingle", true],
];
export function ResultIconReview() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={ws.iconButton} onClick={() => setOpen(true)}>
        图标与状态
      </button>
      {open && (
        <Dialog
          title="结果功能图标与控件状态"
          subtitle="图标样例"
          wide
          onDismiss={() => setOpen(false)}
          footer={
            <button
              className={formStyles.primary}
              onClick={() => setOpen(false)}
            >
              知道了
            </button>
          }
        >
          <div className={s.iconGallery}>
            {examples.map(([label, glyph, toggle]) => (
              <div key={label} className={s.iconCard}>
                <strong>{label}</strong>
                <div className={s.iconSamples}>
                  {(toggle ? ["默认", "选中", "禁用"] : ["默认", "禁用"]).map(
                    (mode) => (
                      <span
                        className={s.iconSample}
                        key={mode}
                        data-state={mode}
                      >
                        <CAEIcon name={glyph} size={22} />
                        {mode}
                      </span>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </Dialog>
      )}
    </>
  );
}
