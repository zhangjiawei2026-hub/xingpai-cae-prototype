export type Module =
  | "Part"
  | "Property"
  | "Assembly"
  | "Step"
  | "Interaction"
  | "Load"
  | "Mesh"
  | "Optimization";
export type Command = "nodeSet" | "step" | "domain";
export type EntityType = "Node" | "Element";
export interface NodeSet {
  id: string;
  name: string;
  nodes: number[];
}
export interface AnalysisStep {
  stabilization?: "none" | "energy" | "damping";
  stabilizationValue?: string;
  adiabatic?: boolean;
  extrapolation?: string;
  matrix?: string;
  unsymmetric?: boolean;
  description?: string;
  period?: string;
  id: string;
  name: string;
  procedure: string;
  nonlinear: boolean;
  increment: "auto" | "manual";
  initial: string;
  min: string;
  max: string;
  iterations: string;
}
export interface DesignDomain {
  id: string;
  name: string;
  regionType: "shell" | "solid";
  elements: number[];
  minSize: string;
  maxSize: string;
  drawEnabled: boolean;
  drawMaxSize?: string;
  multiEnabled?: boolean;
  multiType?: "section" | "material";
  base: number[];
  direction: number[];
}
export interface ModelData {
  sets: NodeSet[];
  steps: AnalysisStep[];
  domains: DesignDomain[];
}
export interface SelectionSession {
  owner: Command;
  target: "nodes" | "elements" | "base" | "direction";
  entity: EntityType;
  ids: number[];
}
export interface WorkState {
  module: Module;
  model: string;
  step: string;
  selectedTree: string;
  models: Record<string, ModelData>;
  command: Command | null;
  editingId?: string;
  selection: SelectionSession | null;
  selectionResult: { target: SelectionSession["target"]; ids: number[] } | null;
  logs: string[];
  notice: string;
}
export type Action =
  | { type: "module"; value: Module }
  | { type: "model"; value: string }
  | { type: "step"; value: string }
  | { type: "tree"; value: string }
  | { type: "open"; command: Command; id?: string }
  | { type: "close" }
  | { type: "pick"; session: SelectionSession }
  | { type: "toggle"; id: number }
  | { type: "pickCancel" }
  | { type: "pickConfirm" }
  | { type: "consumeResult" }
  | { type: "addSet"; value: NodeSet }
  | { type: "addStep"; value: AnalysisStep }
  | { type: "addDomain"; value: DesignDomain }
  | { type: "notice"; value: string }
  | { type: "reset" };
