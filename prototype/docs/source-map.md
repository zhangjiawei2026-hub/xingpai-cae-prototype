# 来源映射 · v0.1

日期：2026-10-22。以下映射指向本地既有资料，本轮不覆盖原稿。已观察内容不等于当前产品已经实现的行为。

| 实现区域 | 依据 | 本轮处理与缺口 |
| --- | --- | --- |
| Ribbon 大小混排 | `../../outputs/meeting-20261021/会议读取纪要.md` 04:31–06:29、11:46–14:47；分析报告“原型读取” | 配置驱动；顺序与重要性仅为代表排列。尚未制作所有模块 |
| 模型树/上下文 | 会议 06:31–07:02、09:55–11:46、16:51–18:31；`prototype-main.jpg` | 保留模块与模型/对象层级；Model-Empty 为原型演示空态 |
| Node 集合 | 会议 22:08–25:30；`prototype-controls.jpg`、`prototype-analysis-load.jpg` | 保留名称、Region、Node 限制；原稿“继续”在本演示中作为末阶段创建动作，真实提交语义待确认 |
| 分析步 | `prototype-analysis-load.jpg`，Abaqus 用户截图 | 类型选择与参数分开；非线性、增量步、初始/最小/最大尺寸、最大迭代次数来自可辨识字段。未照抄截图示例数值；2026-10-23 将插入提示修正为追加末尾；编辑保留列表位置，不建立工程步骤排序规则 |
| 设计域 | `prototype-design-domain.jpg`、`prototype-domain-notes.jpg` | 保留名称、任务、壳/实体、优化区域、基础/最大尺寸/脱模及后续页签入口。前三页为局部演示，其他页签禁用；未覆盖原型全部依赖 |
| 设计域基准对象 | `prototype-design-domain.jpg` 脱模示例中“基准点”“第一点” | 暂以显示网格顶点替代；真实基准对象类型及数量限制待确认 |
| 视觉与图标 | 原参考 `reference-demo02.jpg`、`reference-demo03.jpg`、`reference-design-notes.jpg`；会议 SVG 要求 | 中性色、蓝色操作强调、青色模型为新原型设计取值；不声称品牌定稿或截图精确测量 |
| 模型/视图/取消/空态 | 既有报告的设计建议及本轮假设 | 程序支架、显示三角面、快捷选择和焦点行为由本轮实现，不冒充运行程序证据 |

上述截图均位于 `../../outputs/cae-source-analysis-20261021/evidence/`。本轮沿用已有代表性读取结果，未重新逐项审查 MasterGo 全部图层或连线。

实现参考：[React reducer 与 Context](https://react.dev/learn/scaling-up-with-reducer-and-context)、[Vite](https://vite.dev/guide/)、[Three.js](https://threejs.org/docs/)。这些是技术依据，不是产品需求来源。

## 2026-10-23 字段恢复依据

对照 `../../outputs/prototype-review-20261023/customer-audit/source-domain-crop.png`（原图 `prototype-domain-notes.jpg` 的局部）恢复多材料/多截面分组，以及脱模方向最大尺寸、类型、基准点、第一点、障碍物结构。只对 SINGLE 路径保留显示网格拾取示意；其余类型和数据库入口禁用。会议 18:32–20:22 支持选择方式的视觉展示，不构成真实选择算法定义。

逐项结果及新截图：`../../outputs/prototype-review-20261023/customer-fixes-2118/修复记录.md`。原审核报告及原始证据保留。
