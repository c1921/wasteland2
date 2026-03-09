# Wasteland MVP Architecture

## 1. 文档定位

本文件只定义 `wasteland2` MVP 的实现约定与代码组织建议，不承担进度追踪。

文档优先级：

1. `MVP_SPEC.md`
2. `MVP_ARCHITECTURE.md`
3. `MVP_IMPLEMENTATION_CHECKLIST.md`
4. `README.md`

若文档冲突：

- 玩法规则、数值、验收标准以 `MVP_SPEC.md` 为准
- 代码组织与默认实现方式以 `MVP_ARCHITECTURE.md` 为准
- 当前完成状态以代码事实为准，`MVP_IMPLEMENTATION_CHECKLIST.md` 负责反映状态

## 2. 技术职责

推荐技术栈：

- React
- TypeScript
- PixiJS
- Zustand（可选）
- A* 寻路或等价网格寻路实现

职责划分：

- React：菜单、面板、资源显示、选中信息、速度控制、调试信息
- PixiJS：地图、单位、建筑、物品、overlay 渲染
- Simulation / Game Core：世界状态、tick、任务、需求、建造、寻路、决策
- UI 状态管理：只保存 UI 状态和少量全局控制状态，不直接承载模拟真相

## 3. 核心约定

- 先闭环，后扩展：优先实现 `砍树 -> 搬运 -> 建床/建墙 -> 吃饭/睡觉`
- 渲染与逻辑分离：React 和 Pixi 不直接维护模拟真相
- 固定逻辑 tick：simulation 固定步长，render 走浏览器帧
- 核心模拟自己写：Job、Reservation、Needs、Pawn 决策、建造流程由项目自身实现
- 先单 Pawn 调试，再回到 `2 ~ 3` 个 Pawn 验证并发、回滚与 reservation
- 不为 MVP 引入不必要抽象；可选组件只有在当前复杂度确实需要时再引入

## 4. 推荐模块边界

### 4.1 Core

- `Game`
- `GameLoop`
- `TickManager`
- `EventBus`（可选）

### 4.2 World

- `MapGrid`
- `Tile`
- 默认世界生成

### 4.3 Entities

- `Pawn`
- `Item`
- `Blueprint`
- `Building`
- `EntityManager`

### 4.4 Pathfinding / Movement

- `Pathfinder`
- `MovementSystem`

### 4.5 Jobs / Reservation

- `Job`
- `JobManager`
- `ReservationManager`

### 4.6 Needs / Decision

- `NeedSystem`
- `NeedEvaluator`
- `PawnBrain`
- `JobSelector`

### 4.7 Build

- `BuildSystem`

### 4.8 Render

- `PixiGameView`
- Terrain Layer
- Building Layer
- Pawn Layer
- Overlay Layer

### 4.9 Input / UI

- `InputController`
- `SelectionManager`
- `CommandController`
- React UI panels

## 5. 默认实现约束

- 地图采用 `Cell { terrain, object? }`，`ground` 是唯一 terrain
- `tree`、`wall`、`bed`、`blueprint`、`itemPile` 都是 object，不把树或墙混入 terrain
- `meal` 保留在 MVP 中，但仅用于生存闭环，不参与生产链
- Reservation 以“对象或 pile 独占”为最低实现粒度，不要求按数量拆分
- Zustand、`EventBus`、动画层、复杂相机都不是 MVP 阻塞项
- 若修改玩法规则、数值或验收行为，必须同步更新 `MVP_SPEC.md`
- 完成功能后，必须同步更新 `MVP_IMPLEMENTATION_CHECKLIST.md`
