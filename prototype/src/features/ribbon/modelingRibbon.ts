import type { CAEIconBadge, CAEIconName } from "../../components/CAEIcon";
import type { Module } from "../../types/domain";

type RibbonAction =
  | "nodeSet"
  | "step"
  | "domain"
  | "load"
  | "editNodeSet"
  | "editStep"
  | "editDomain"
  | "topologyResult"
  | "structuralResult";
type RibbonCommand = {
  label: string;
  icon: CAEIconName;
  badge?: CAEIconBadge;
  action?: RibbonAction;
  reason?: string;
};
type Column = { size: "large" | "small"; commands: RibbonCommand[] };
type RibbonGroup = { label: string; columns: Column[] };

const command = (
  label: string,
  icon: CAEIconName,
  badge?: CAEIconBadge,
  action?: RibbonAction,
  reason?: string,
): RibbonCommand => ({ label, icon, badge, action, reason });
const large = (entry: RibbonCommand): Column => ({
  size: "large",
  commands: [entry],
});
const small = (...commands: RibbonCommand[]): Column => ({
  size: "small",
  commands,
});
const group = (label: string, ...columns: Column[]): RibbonGroup => ({
  label,
  columns,
});

const nodes = command("创建节点集合", "nodes", "add", "nodeSet");
const elements = command("单元集合", "elements");
const surface = command("表面", "surface");
const local = command("节点局部坐标系", "referencePoint");

export const modelingRibbon: Record<
  Exclude<Module, "Results">,
  RibbonGroup[]
> = {
  Part: [
    group(
      "导入",
      small(
        command("导入几何", "part", "assign"),
        command("导入网格", "mesh", "assign"),
      ),
    ),
    group(
      "部件创建",
      large(command("创建部件", "part", "add")),
      large(command("部件管理器", "part", "manage")),
    ),
    group(
      "几何处理",
      small(
        command("中面抽取", "surface", "assign"),
        command("几何清理", "part", "edit"),
      ),
    ),
    group("集合与表面", large(nodes), small(elements, surface)),
    group("基准", large(local)),
  ],
  Property: [
    group(
      "材料",
      large(command("创建材料", "material", "add")),
      small(command("材料管理器", "material", "manage")),
    ),
    group(
      "截面定义",
      large(command("截面定义", "section")),
      small(command("截面管理器", "section", "manage")),
    ),
    group(
      "属性指派",
      small(
        command("截面指派", "section", "assign"),
        command("属性检查", "section", "view"),
      ),
    ),
    group(
      "方向与铺层",
      small(
        command("复合材料截面", "section"),
        command("材料方向", "referencePoint"),
        command("梁截面方向", "section", "rotate"),
      ),
    ),
    group("集中属性", large(command("质量与转动惯量", "material"))),
  ],
  Assembly: [
    group(
      "实例",
      large(command("创建实例", "instance", "add")),
      large(command("实例管理器", "instance", "manage")),
    ),
    group(
      "位置变换",
      small(
        command("平移实例", "instance", "move"),
        command("旋转实例", "instance", "rotate"),
        command(
          "位置转移",
          "transfer",
          undefined,
          undefined,
          "操作方式与参数待确认",
        ),
      ),
    ),
    group("阵列", large(command("线性阵列", "elements", "move"))),
    group(
      "装配区域",
      large(nodes),
      large(elements),
      large(surface),
      small(command("参考点", "referencePoint"), local),
    ),
  ],
  Step: [
    group(
      "分析步",
      large(command("创建分析步", "step", "add", "step")),
      small(
        command("编辑分析步", "step", "edit", "editStep"),
        command("分析步管理器", "step", "manage"),
      ),
    ),
    group("过程控制", large(command("分析设置", "step", "manage"))),
    group("专项控制", large(command("质量缩放", "material", "edit"))),
    group(
      "输出请求",
      small(
        command("场输出请求", "resultContour", "assign"),
        command("历史输出请求", "topologyObjective", "assign"),
      ),
    ),
  ],
  Interaction: [
    group("接触属性", large(command("接触属性", "interaction", "edit"))),
    group(
      "接触定义",
      small(
        command("接触对", "interaction"),
        command("通用接触", "interaction", "add"),
      ),
    ),
    group(
      "约束",
      small(
        command("运动学耦合", "nodes", "assign"),
        command("柔性耦合", "surface", "assign"),
        command("绑定（Tie）", "interaction", "assign"),
      ),
      small(command("刚体", "part"), command("多点约束", "nodes", "manage")),
    ),
    group(
      "连接器",
      large(
        command(
          "CONN3D2",
          "connector",
          undefined,
          undefined,
          "二节点三维连接器，工程创建流程待确认",
        ),
      ),
    ),
    group(
      "相互作用管理",
      large(command("相互作用管理器", "interaction", "manage")),
    ),
  ],
  Load: [
    group(
      "边界条件",
      small(
        command("位移 / 固定边界", "boundary"),
        command("速度边界", "boundary", "move"),
        command("加速度边界", "boundary", "assign"),
      ),
    ),
    group(
      "机械载荷",
      large(command("编辑载荷", "load", "edit", "load")),
      small(
        command("集中力", "load"),
        command("压力", "surface", "assign"),
        command("重力", "load", "assign"),
      ),
    ),
    group("连接器运动", large(command("连接器运动", "connector", "move"))),
    group(
      "温度与预定义场",
      small(
        command("预定义场", "resultContour"),
        command("温度边界", "boundary", "edit"),
      ),
    ),
    group(
      "幅值与管理",
      small(
        command("幅值", "topologyObjective"),
        command("工况条件管理器", "load", "manage"),
      ),
    ),
  ],
  Mesh: [
    group(
      "网格尺寸",
      small(command("全局尺寸", "seed"), command("局部尺寸", "seed", "edit")),
    ),
    group("划分控制", large(command("网格控制", "mesh", "manage"))),
    group("单元类型", large(command("单元类型", "elementType"))),
    group(
      "网格生成",
      large(command("划分网格", "mesh", "add")),
      small(
        command("重新划分", "mesh", "edit"),
        command("清除网格", "mesh", "delete"),
      ),
    ),
    group(
      "质量检查",
      small(
        command("网格质量", "mesh", "view"),
        command("法向检查", "referencePoint", "view"),
        command("自由边检查", "surface", "view"),
      ),
    ),
    group(
      "网格编辑",
      small(
        command("节点编辑", "nodes", "edit"),
        command("编辑节点集合", "nodes", "edit", "editNodeSet"),
      ),
      small(nodes, elements),
    ),
  ],
  Solve: [
    group(
      "作业",
      large(command("创建作业", "task", "add")),
      large(command("作业管理器", "task", "manage")),
    ),
  ],
  Optimization: [
    group(
      "拓扑优化",
      large(command("创建设计域", "domain", "add", "domain")),
      small(
        command("编辑设计域", "domain", "edit", "editDomain"),
        command("响应", "topologyObjective"),
        command("组合响应", "topologyObjective", "assign"),
      ),
      small(
        command("目标约束", "topologyConstraint"),
        command("优化任务管理", "task", "manage"),
      ),
    ),
    group("求解控制", large(command("优化控制参数", "task", "edit"))),
    group("优化算法", large(command("优化算法", "mesh", "manage"))),
    group(
      "高级算法控制",
      small(
        command("插值函数", "resultFormula"),
        command("过滤算法", "mesh", "view"),
      ),
    ),
    group(
      "求解",
      small(
        command("优化求解", "task", "add"),
        command("运行监控", "topologyObjective", "view"),
      ),
    ),
    group(
      "后处理",
      large(
        command("拓扑优化结果", "topologyDensity", undefined, "topologyResult"),
      ),
      large(
        command("有限元结果", "resultContour", undefined, "structuralResult"),
      ),
    ),
    group("光顺", large(command("光顺", "surface", "edit"))),
  ],
};
