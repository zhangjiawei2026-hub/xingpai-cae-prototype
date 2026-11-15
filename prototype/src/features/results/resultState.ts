import { useCallback, useEffect, useState } from "react";
import { initialTopology, type ResultKind } from "./topologyResult";

export const fields = {
  S: ["S · 应力", ["Mises", "S11", "S22"]],
  U: ["U · 位移", ["幅值", "U1", "U2", "U3"]],
  LE: ["LE · 对数应变", ["LE11", "LE22"]],
  TEMP: ["TEMP · 温度", []],
} as const;
type Field = keyof typeof fields;
type Frame = { label: string; fields: readonly Field[] };
type Step = { label: string; frames: readonly Frame[] };
const frame = (label: string, ...available: Field[]): Frame => ({
  label,
  fields: available,
});
export const datasets = {
  modal: {
    label: "模态结果（示例）",
    steps: [
      {
        label: "Frequency-Step · 固有频率示例",
        frames: [
          frame("第 1 阶 · 12.5 Hz", "U"),
          frame("第 2 阶 · 31.8 Hz", "U"),
          frame("第 3 阶 · 67.2 Hz", "U"),
        ],
      },
    ],
  },
  structural: {
    label: "结构结果（示例）",
    steps: [
      {
        label: "Step-1 · 加载示例",
        frames: [
          frame("帧 0 · 时间 0.00", "S", "U", "LE", "TEMP"),
          frame("帧 1 · 时间 0.50", "S", "U", "LE", "TEMP"),
          frame("帧 2 · 时间 1.00", "S", "U", "TEMP"),
        ],
      },
      {
        label: "Step-2 · 字段变化示例",
        frames: [frame("帧 0 · 时间 0.00", "U", "TEMP")],
      },
    ],
  },
  thermal: {
    label: "温度结果（示例）",
    steps: [
      {
        label: "Step-1 · 温度示例",
        frames: [frame("帧 0 · 时间 0.00", "TEMP")],
      },
    ],
  },
} satisfies Record<string, { label: string; steps: Step[] }>;
export type Dataset = keyof typeof datasets;
export const layouts = [
  { id: "side", label: "左右两窗口", count: 2 },
  { id: "three", label: "上二下一", count: 3 },
  { id: "four", label: "四窗口", count: 4 },
  { id: "single", label: "单窗口", count: 1 },
] as const;
export type Layout = (typeof layouts)[number]["id"];
export const demoScaleLimit = 20;
type Marker = { id: number; x: number; y: number };
export type ResultState = {
  dataset: Dataset;
  step: number;
  frame: number;
  field: Field;
  component: string;
  harmonic: boolean;
  phase: number;
  playing: boolean;
  cloud: boolean;
  deform: boolean;
  scaleMode: "auto" | "manual";
  scale: number;
  overlay: boolean;
  cut: boolean;
  plane: "XY" | "YZ" | "XZ";
  offset: number;
  flip: boolean;
  legend: boolean;
  range: "auto" | "manual";
  minimum: number;
  maximum: number;
  probe: boolean;
  maximumMark: boolean;
  minimumMark: boolean;
  layout: Layout;
  activePane: number;
  markers: Marker[][];
  nextMarker: number;
};
export function initialResult(): ResultState {
  return {
    dataset: "modal",
    step: 0,
    frame: 0,
    field: "U",
    component: "幅值",
    harmonic: true,
    phase: 0,
    playing: false,
    cloud: true,
    deform: true,
    scaleMode: "auto",
    scale: 1,
    overlay: false,
    cut: false,
    plane: "XY",
    offset: 0,
    flip: false,
    legend: true,
    range: "auto",
    minimum: 0,
    maximum: 100,
    probe: false,
    maximumMark: false,
    minimumMark: false,
    layout: "single",
    activePane: 0,
    markers: [[], [], [], []],
    nextMarker: 1,
  };
}
export function currentResult(state: ResultState) {
  const step = datasets[state.dataset].steps[state.step];
  const frame = step.frames[state.frame];
  const components: readonly string[] = fields[state.field][1];
  const modal = state.dataset === "modal";
  const hasDisplacement = frame.fields.includes("U");
  return {
    step,
    frame,
    components,
    modal,
    hasDisplacement,
    label: modal ? "U · 振型" : fields[state.field][0],
    canPlay: state.harmonic
      ? state.deform && hasDisplacement
      : !modal && step.frames.length > 1,
  };
}
export function selectContext(
  state: ResultState,
  changes: Partial<Pick<ResultState, "dataset" | "step" | "frame" | "field">>,
): ResultState {
  const next = { ...state, ...changes, phase: 0, playing: false };
  if (changes.dataset !== undefined) {
    next.step = 0;
    next.frame = 0;
    next.harmonic = next.dataset === "modal";
    next.deform = next.dataset !== "thermal";
    next.overlay = false;
    next.field = datasets[next.dataset].steps[0].frames[0].fields[0];
  } else if (changes.step !== undefined) {
    next.frame = 0;
  }
  const { frame, hasDisplacement } = currentResult(next);
  if (!frame.fields.includes(next.field)) next.field = frame.fields[0];
  const components: readonly string[] = fields[next.field][1];
  if (!components.includes(next.component))
    next.component = components[0] ?? "";
  if (!hasDisplacement) {
    next.harmonic = false;
    next.deform = false;
    next.overlay = false;
  }
  return next;
}
export function useResultReview(active: boolean) {
  const [result, setResult] = useState(initialResult);
  const [kind, setKind] = useState<ResultKind>("structural");
  const [topology, setTopology] = useState(initialTopology);
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    if (!active || kind !== "structural" || !result.playing) return;
    const timer = window.setInterval(
      () => {
        setResult((previous) => {
          if (!previous.playing) return previous;
          if (previous.harmonic)
            return { ...previous, phase: (previous.phase + 12) % 360 };
          const last = currentResult(previous).step.frames.length - 1;
          if (previous.frame >= last) return { ...previous, playing: false };
          const next = selectContext(previous, { frame: previous.frame + 1 });
          return { ...next, playing: next.frame < last };
        });
      },
      result.harmonic ? 85 : 620,
    );
    return () => window.clearInterval(timer);
  }, [active, kind, result.harmonic, result.playing]);
  function change(changes: Partial<ResultState>) {
    setFeedback("");
    setResult((previous) => ({ ...previous, ...changes }));
  }
  function choose(changes: Parameters<typeof selectContext>[1]) {
    setFeedback("");
    setResult((previous) => selectContext(previous, changes));
  }
  function stop() {
    if (result.harmonic || currentResult(result).modal)
      change({ playing: false, phase: 0 });
    else choose({ frame: 0 });
  }
  const pause = useCallback(() => {
    setResult((previous) =>
      previous.playing || previous.probe
        ? { ...previous, playing: false, probe: false }
        : previous,
    );
  }, []);
  const exitProbe = useCallback(() => {
    setResult((previous) =>
      previous.probe ? { ...previous, probe: false } : previous,
    );
  }, []);
  useEffect(() => {
    if (active) return pause;
  }, [active, pause]);
  function chooseKind(next: ResultKind) {
    if (next === kind) return;
    pause();
    setFeedback("");
    setKind(next);
  }
  function rotatePlayback() {
    setFeedback("");
    setResult((previous) => {
      if (previous.playing) return { ...previous, playing: false };
      if (!currentResult(previous).canPlay) return previous;
      const atEnd =
        !previous.harmonic &&
        previous.frame === currentResult(previous).step.frames.length - 1;
      return {
        ...(atEnd ? selectContext(previous, { frame: 0 }) : previous),
        playing: true,
      };
    });
  }
  function addMarker(pane: number, x: number, y: number) {
    setResult((previous) => ({
      ...previous,
      activePane: pane,
      nextMarker: previous.nextMarker + 1,
      markers: previous.markers.map((items, index) =>
        index === pane ? [...items, { id: previous.nextMarker, x, y }] : items,
      ),
    }));
  }
  function clearMarkers(all: boolean) {
    change({
      markers: result.markers.map((items, index) =>
        all || index === result.activePane ? [] : items,
      ),
    });
  }
  function removeMarker(pane: number, id: number) {
    change({
      activePane: pane,
      markers: result.markers.map((items, index) =>
        index === pane ? items.filter((item) => item.id !== id) : items,
      ),
    });
  }
  function reset() {
    setResult(initialResult());
    setKind("structural");
    setTopology(initialTopology());
    setFeedback("");
  }
  return {
    result,
    kind,
    topology,
    setTopology,
    chooseKind,
    feedback,
    setFeedback,
    change,
    choose,
    stop,
    exitProbe,
    rotatePlayback,
    addMarker,
    clearMarkers,
    removeMarker,
    reset,
  };
}
export type ResultReview = ReturnType<typeof useResultReview>;
