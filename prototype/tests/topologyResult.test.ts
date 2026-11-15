import { describe, expect, it } from "vitest";

import {
  demoDensity,
  initialTopology,
  iterationControls,
  showDensity,
} from "../src/features/results/topologyResult";

describe("拓扑结果示意状态", () => {
  it("按已保存的迭代前后跳转，并识别最终迭代", () => {
    const state = { ...initialTopology(), iteration: 5 };
    expect(iterationControls(state).map((item) => item.target)).toEqual([
      0, 0, 10, 20,
    ]);
    const intermediate = initialTopology("intermediate");
    expect(intermediate.iteration).toBe(8);
    expect(iterationControls(intermediate).map((item) => item.target)).toEqual([
      0,
      4,
      undefined,
      undefined,
    ]);
  });

  it("将恰好等于阈值的密度归入保留形态", () => {
    const state = initialTopology();
    expect(showDensity(0.5, state)).toBe(true);
    expect(showDensity(0.5, { ...state, display: "removed" })).toBe(false);
    expect(showDensity(0.49, { ...state, display: "removed" })).toBe(true);
    expect(showDensity(0.1, { ...state, display: "density" })).toBe(true);
  });

  it("切换迭代和设计域会改变示意密度", () => {
    const state = initialTopology();
    const first = demoDensity(2, 2, { ...state, iteration: 0 });
    const final = demoDensity(2, 2, state);
    const local = demoDensity(2, 2, { ...state, region: "local" });
    expect(new Set([first, final, local]).size).toBe(3);
    expect(
      [first, final, local].every((value) => value >= 0 && value <= 1),
    ).toBe(true);
  });
});
