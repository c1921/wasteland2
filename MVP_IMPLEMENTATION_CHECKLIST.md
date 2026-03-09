# Wasteland MVP 实现清单

判定依据：

- `MVP_SPEC.md`：定义必须交付的玩法、交互与验收规则
- `MVP_ARCHITECTURE.md`：定义推荐的实现约定、技术职责与模块边界
- 当前仓库代码：只有在现有实现已经满足对应文档时才标记为 `[x]`

说明：

- `JobManager`、`NeedSystem`、`BuildSystem` 目前只有占位 `tick()`，相关玩法功能仍按未完成处理
- `EventBus`、Zustand 等属于可选实现手段，不单独作为完成定义

## 0. 现有基础骨架

- [x] `MVP_SPEC.md` 已定义核心玩法边界
- [x] `MVP_ARCHITECTURE.md` 已落地并与 spec 对齐
- [x] React 页面壳中挂载 Pixi 画布
- [x] `PixiGameView` 在 React `StrictMode` 重挂载下可安全初始化与清理
- [x] 游戏面板初始化异常由局部 error boundary 承接，并支持手动重试挂载
- [x] 固定步长 `GameLoop` 已建立，simulation tick 与 render 解耦
- [x] `Game` 已组合 `World`、`EntityManager`、`JobManager`、`NeedSystem`、`BuildSystem`、`TickManager`
- [x] 世界已记录 tick 计数与累计模拟时间
- [ ] 运行时展示真实世界状态（地图、角色、资源、建筑）

## 1. 地图与格子

- [x] 固定 `50 x 50` 地图
- [x] 固定 `32 x 32 px` 单格显示尺寸
- [x] 实现 `Cell { terrain, object? }` 数据结构
- [x] `terrain` 仅支持 `ground`
- [x] `object` 限定为 `tree | wall | bed | blueprint | itemPile`
- [x] 每格最多存在 `1` 个 object
- [x] 所有 object 均为 `1x1`
- [x] 实现阻挡规则：`tree` / `wall` 阻挡，`bed` / `blueprint` / `itemPile` 不阻挡
- [x] 实现 blueprint 放置规则：只能放在空的 `ground` 上
- [x] 支持 tile 查询、walkable 判断、buildable 判断

## 2. 世界初始化

- [x] 默认生成 `50 x 50` 世界
- [ ] 初始生成 `3` 名角色
- [x] 初始生成 `12` 棵 tree
- [x] 初始生成总量 `20 meal`
- [x] 角色出生在地图中心附近
- [x] meal piles 与 trees 按推荐区域分布
- [ ] 支持先用 `1` 名角色调试，再切回 `2 ~ 3` 名角色做并发验证

## 3. 单位数据、移动与寻路

- [ ] 角色数据包含位置、`activeJobId`、移速、携带 stack、`hunger`、`rest`
- [ ] 角色移动速度固定为 `4 tiles / second`
- [ ] 同一角色同一时间只能有 `1` 个 active job
- [ ] 同一角色同一时间只能搬运 `1` 个 item stack
- [ ] 单个 stack 最大数量为 `5`
- [ ] 实现四方向邻近判定
- [ ] `tree` / `wall` / `blueprint` 只能在相邻格执行
- [ ] `itemPile` / `bed` 可在目标格或相邻格执行
- [ ] 实现基础寻路与可达性判断
- [ ] 不可达目标会正确返回失败而非卡死

## 4. 资源与采集

- [ ] loose item 类型仅包含 `wood` 与 `meal`
- [ ] `meal` 仅作为生存 bootstrap 资源，不参与生产链
- [ ] 实现 `itemPile` 数据结构：item 类型、数量、所在格坐标
- [ ] 支持玩家标记 `tree` 为 `chop tree`
- [ ] 系统自动生成 `harvest` job
- [ ] 砍树动作耗时 `2` 秒
- [ ] tree 被砍掉后从地图移除
- [ ] tree 被砍掉后原地生成 `itemPile(wood x5)`
- [ ] 支持 `wood` 的拾取、搬运、交付
- [ ] 单次搬运最多拿 `wood x5`

## 5. 生存需求

- [ ] `hunger` / `rest` 数值范围为 `0 ~ 100`
- [ ] `hunger` 每秒下降 `1`
- [ ] `rest` 每秒下降 `0.5`
- [ ] `hunger <= 30` 时必须优先吃饭
- [ ] `rest <= 25` 时必须优先睡觉
- [ ] 两者同时触发时优先级为 `hunger > rest`
- [ ] `eat` 必须先获取 `meal x1`
- [ ] 吃饭耗时 `2` 秒，完成后恢复 `40 hunger`
- [ ] 吃饭会消耗 `1 meal`
- [ ] 无可达 meal 时保持饥饿并持续重新调度
- [ ] 有可达已建成 `bed` 时优先前往 bed 睡觉
- [ ] bed 睡眠时 `rest` 每秒恢复 `4`，恢复到 `80` 后结束
- [ ] 无可达 bed 时允许原地睡地板
- [ ] 地板睡眠时 `rest` 每秒恢复 `2`，恢复到 `50` 后结束

## 6. Job、Reservation 与决策

- [ ] 玩家高层命令只直接下达 `chop tree` / `place blueprint` / `cancel blueprint`
- [ ] 系统可自动派生 `harvest` / `pickup` / `deliver` / `construct` / `eat` / `sleep`
- [ ] job 状态覆盖 `pending` / `claimed` / `in_progress` / `completed` / `failed` / `cancelled`
- [ ] 空闲角色只能领取 `pending` job
- [ ] 同一 job 任意时刻只能被一个角色 claim
- [ ] 角色开始实际执行后，job 状态切换为 `in_progress`
- [ ] 调度优先级为 `eat > sleep > 普通工作`
- [ ] 同优先级按最短路径或最近可达目标分配
- [ ] 实现 reservation：唯一 object 同时只能被一个角色保留
- [ ] `itemPile` 按整 pile reservation，不做按数量拆分
- [ ] 需求打断普通工作时会释放相关 reservation
- [ ] job 失败后会释放 claim 与角色占用
- [ ] 原始意图仍有效时支持重试或重新开放 job
- [ ] 目标失效时清除 active job、claim、reservation
- [ ] 携带中材料在回滚时掉落到当前格或最近可放置格

## 7. 建造系统

- [ ] 玩家放置的是 `blueprint` 而不是成品建筑
- [ ] blueprint 记录 `recipeType` / `requiredWood` / `deliveredWood` / `buildProgress` / `state`
- [ ] `wall` 建造成本为 `2 wood`
- [ ] `bed` 建造成本为 `4 wood`
- [ ] `deliveredWood < requiredWood` 时只允许生成 `deliver`
- [ ] 材料送齐后才允许生成 `construct`
- [ ] 施工时角色必须邻近 blueprint
- [ ] 单格建筑施工耗时 `2` 秒
- [ ] `construct` 完成后 blueprint 替换为 `wall` 或 `bed`
- [ ] 支持玩家取消未完成的 blueprint
- [ ] blueprint 被取消时，已送达材料回滚为地图上的 `itemPile`

## 8. 渲染、输入与可观测性

- [x] 地图按 `32 x 32` 网格可视化
- [x] `tree` / `wall` / `bed` / `blueprint` / `itemPile` 有基础视觉区分
- [ ] 角色位置与移动过程可视化
- [ ] 支持选中格子或对象
- [ ] 提供选中对象信息面板
- [ ] 提供建造菜单，可选择 `wall` / `bed`
- [ ] 支持玩家点击或指令标记 tree
- [ ] 支持玩家放置 `wall` / `bed` blueprint
- [ ] 提供资源显示，至少包含 `wood` / `meal`
- [ ] 提供速度控制：`pause` / `1x` / `2x`
- [ ] 可观察 tick、`hunger`、`rest`、`active job` 等调试信息

## 9. 鲁棒性与并发验证

- [ ] 路径失败时 job 正确失败并释放占用
- [ ] 目标对象消失时 job 正确 `failed` 或 `cancelled`
- [ ] 材料不足时不会错误进入施工
- [ ] 同一 tree 不会被多个角色重复采集
- [ ] 同一 `itemPile` 不会被多个角色重复搬运
- [ ] 同一 `blueprint` 不会出现脏 reservation
- [ ] `2 ~ 3` 名角色可并行工作且不会互相锁死

## 10. 验收场景

- [ ] 场景 12.1：砍树与掉落通过
- [ ] 场景 12.2：木材搬运与建墙通过
- [ ] 场景 12.3：建床与睡眠通过
- [ ] 场景 12.4：饥饿打断普通工作通过
- [ ] 场景 12.5：无床时睡地板通过
- [ ] 场景 12.6：目标失效回滚通过
- [ ] 场景 12.7：多角色并发稳定性通过

## 11. 推荐开发阶段

- [x] Phase 0：规格定义
- [x] Phase 1：项目骨架
- [x] Phase 2：地图系统
- [ ] Phase 3：相机与输入
- [ ] Phase 4：实体系统
- [ ] Phase 5：移动与寻路
- [ ] Phase 6：命令系统
- [ ] Phase 7：Job 系统
- [ ] Phase 8：Reservation
- [ ] Phase 9：采集闭环
- [ ] Phase 10：搬运闭环
- [ ] Phase 11：建造闭环
- [ ] Phase 12：Needs 系统
- [ ] Phase 13：Pawn 决策
- [ ] Phase 14：UI 与调试
- [ ] Phase 15：多 Pawn 验证
- [ ] Phase 16：失败恢复
- [ ] Phase 17：轻度打磨

## 12. 规格约束校验

- [ ] 不允许同一角色同时持有多个 active job
- [ ] 不允许一个格子同时存在多个 object
- [ ] 不允许 tree 和 wall 被角色穿过
- [ ] 不允许 blueprint 在材料未齐时直接施工
- [ ] 不允许角色绕过 `hunger` / `rest` 优先级持续做普通工作
- [ ] 不允许在 reservation 未释放时保留脏占用
