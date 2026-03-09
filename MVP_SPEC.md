# Wasteland MVP Spec

## 1. 文档目标

本文件定义 `wasteland2` 第一版可实现、可验证的最小玩法规格，用于指导数据结构、系统拆分和测试验收。

MVP 目标是形成一个可闭环的沙盒：

`砍树 -> 掉落 wood -> 搬运 wood -> 放置 blueprint -> 送材料 -> 施工 -> 完成 wall / bed`

同时角色具备最基础的生存优先级：

`普通工作 < 吃饭 < 睡觉`

本规格优先保证实现边界清晰，不追求完整玩法。

## 2. MVP 范围

### 2.1 包含内容

- 50x50 的格子地图
- 32x32 px 的单格显示尺寸
- 单位移动、邻近交互、基础 job 系统
- tree 采集
- wood / meal 掉落与搬运
- wall / bed 的 blueprint 与建造
- hunger / rest 的下降与优先级打断

### 2.2 不包含内容

- 多种 terrain
- 多格建筑
- stockpile zone
- 战斗、受伤、死亡
- 食物生产链
- 门、房间、温度、天气
- UI 优先级配置
- 批量命令和复杂自动化

## 3. 地图规则

### 3.1 地图尺寸

- 地图大小固定为 `50 x 50` 格
- 每格显示尺寸固定为 `32 x 32 px`
- 地图采用正交网格，不支持六边形或自由坐标

### 3.2 格子模型

每个格子由两层组成：

- `terrain`：每格必须且只能有一种 terrain
- `object`：每格最多存在一个 object

MVP 中 terrain 只有一种：

- `ground`

MVP 中 object 只允许以下类型：

- `tree`
- `wall`
- `bed`
- `blueprint`
- `itemPile`

### 3.3 占格规则

- 每个格子只能有 `1` 个 terrain
- 每个格子最多有 `1` 个 object
- 所有 object 都是 `1x1` 占格
- 建筑和树都不能与其他 object 叠放
- `itemPile` 也占用 object 槽位

### 3.4 阻挡规则

- `tree` 阻挡移动
- `wall` 阻挡移动
- `bed` 不阻挡移动
- `blueprint` 不阻挡移动
- `itemPile` 不阻挡移动

### 3.5 可放置规则

- 玩家只能在 `ground` 上放置 blueprint
- 目标格已有任意 object 时，不能再放置 blueprint
- wall 和 bed 都是单格建筑

## 4. 单位规则

### 4.1 基本限制

- 每个角色同一时间只能有 `1` 个 active job
- 每个角色同一时间只能搬运 `1` 个 item stack
- 每个 item stack 只能包含 `1` 种 item
- 角色移动速度固定，不受装备、地形或状态影响

### 4.2 移动速度

- 角色移动速度固定为 `4 tiles / second`

### 4.3 交互距离

- 角色必须邻近目标才能执行 job
- 邻近定义为四方向相邻：上、下、左、右
- 对角线不算邻近

### 4.4 对不同目标的执行位置

- 对 `tree`、`wall`、`blueprint` 这类不可在其格内执行的目标，角色必须站在相邻格执行
- 对 `itemPile`、`bed` 这类不阻挡目标，角色可以站在目标格或相邻格执行

### 4.5 搬运规则

- 一个 stack 的最大数量为 `5`
- 角色拿起 stack 后，在交付、吃掉或因 job 回滚而掉落之前，不得再拿第二种物品

## 5. 资源规则

### 5.1 资源类型

MVP 只定义两种 loose item：

- `wood`
- `meal`

### 5.2 树木采集

- `tree` 可被玩家标记为采集目标
- 采集 tree 的 job 类型为 `harvest`
- 角色执行砍树动作时必须邻近 tree
- 单棵 tree 的砍伐耗时为 `2 秒`
- tree 被砍掉后从地图移除
- tree 被砍掉后在原地生成 `itemPile(wood x5)`

### 5.3 木材搬运

- `wood` 可以被搬运
- 角色一次最多搬运 `wood x5`
- 若某 pile 少于 `5`，则搬运 pile 内剩余全部数量

### 5.4 建造成本

- `wall` 需要 `2 wood`
- `bed` 需要 `4 wood`

### 5.5 开局资源

- 地图开局生成若干 meal 作为初始口粮
- 默认生成总量为 `20 meal`
- 推荐按 `4` 个 pile 分布，每 pile `5 meal`
- meal 只作为生存闭环验证资源，不参与生产链

## 6. 生存规则

### 6.1 需求数值

每个角色都有两条需求：

- `hunger`
- `rest`

两者取值范围统一为：

- `0 ~ 100`

### 6.2 自然下降

- `hunger` 每秒下降 `1`
- `rest` 每秒下降 `0.5`

### 6.3 优先级阈值

- 当 `hunger <= 30` 时，角色必须优先处理吃饭
- 当 `rest <= 25` 时，角色必须优先处理睡觉
- 两者同时低于阈值时，优先级为 `hunger > rest`

### 6.4 吃饭规则

- 角色吃饭时必须获取 `meal x1`
- 吃饭动作耗时 `2 秒`
- 吃完后恢复 `40 hunger`
- 吃饭会消耗 `1 meal`
- 若地图上没有可达 meal，则角色保持饥饿状态并持续尝试重新调度

### 6.5 睡觉规则

- 若地图上存在可达且已建成的 `bed`，角色优先去 bed 睡觉
- 在 bed 上睡觉时，`rest` 每秒恢复 `4`
- 角色在 bed 上恢复到 `80` 后结束睡眠
- 若没有可达 bed，角色允许在原地睡地板
- 睡地板时，`rest` 每秒恢复 `2`
- 角色在地板上恢复到 `50` 后结束睡眠

## 7. 任务规则

### 7.1 玩家命令与系统 job 的关系

玩家只直接下达高层命令：

- `chop tree`
- `place blueprint`

系统根据世界状态自动生成具体 job：

- `harvest`
- `pickup`
- `deliver`
- `construct`
- `eat`
- `sleep`

### 7.2 单位领取规则

- 空闲角色只能领取 `pending` job
- 一旦领取，job 状态变为 `claimed`
- 同一 job 在任意时刻只能被一个角色领取
- 角色开始实际执行后，job 状态变为 `in_progress`

### 7.3 Job 生命周期

job 状态统一为：

- `pending`
- `claimed`
- `in_progress`
- `completed`
- `failed`
- `cancelled`

状态定义如下：

- `completed`：目标成功完成
- `failed`：执行过程中失败，但原始目标仍然存在，可等待后续重试
- `cancelled`：目标被移除、玩家取消、或前置条件永久失效

### 7.4 调度优先级

空闲角色选择 job 时采用以下优先级：

1. `eat`
2. `sleep`
3. 玩家命令派生的普通工作

同优先级下，优先选择最短路径可达的 job。

### 7.5 可失败情形

job 在执行中允许失败，常见失败条件包括：

- 目标不可达
- 目标已被其他 job 消耗
- 目标 object 已消失
- 前置资源不足

### 7.6 失败与重试

- `failed` job 必须释放角色占用与 claim
- 若原始意图仍有效，系统可以重新生成或重新开放 job
- `failed` 不应导致角色卡死在旧 job 上

### 7.7 目标失效后的回滚

若 job 目标失效，系统必须执行回滚：

- 清除 job 的 claim
- 清除角色的 active job
- 清除相关 reservation

若角色手中正搬运材料：

- 优先将材料掉在当前格
- 如果当前格不能容纳掉落物，则掉在最近的四方向可放置格

若被取消的是 blueprint：

- blueprint 内已送达的材料也要回滚为地图上的 `itemPile`
- 随后移除 blueprint

## 8. 建造规则

### 8.1 Blueprint 放置

- 玩家放下的不是成品建筑，而是 `blueprint`
- blueprint 记录目标建筑类型：`wall` 或 `bed`
- blueprint 放下后立即占用目标格的 object 槽位
- blueprint 在施工完成前不阻挡移动

### 8.2 Blueprint 数据

每个 blueprint 至少需要记录：

- `recipeType`
- `requiredWood`
- `deliveredWood`
- `buildProgress`
- `state`

### 8.3 送材规则

- blueprint 需要材料才能进入施工阶段
- `deliveredWood < requiredWood` 时，只允许生成 `deliver` job
- 材料送齐前，不允许进行 `construct`

### 8.4 施工规则

- 当 `deliveredWood == requiredWood` 后，blueprint 才能生成 `construct` job
- 施工时角色必须邻近 blueprint
- 单格建筑默认施工耗时为 `2 秒`

### 8.5 完工替换

- `construct` 完成后，blueprint 从地图移除
- 原格替换为目标成品 building
- `wall blueprint` 完工后替换为 `wall`
- `bed blueprint` 完工后替换为 `bed`

## 9. 默认世界初始化

为便于 MVP 验证，默认世界按以下参数生成：

- 地图：`50 x 50`
- 初始角色：`3`
- 初始 tree：`12`
- 初始 meal：总量 `20`
- 初始成品建筑：`0`
- 初始 blueprint：`0`

推荐出生区布置：

- 角色出生在地图中心附近
- meal piles 放在出生点附近几格内
- tree 分散在周边可达区域

## 10. 数据结构建议

本节不是代码接口定义，但实现应满足以下结构约束：

### 10.1 地图

- `Cell { terrain, object? }`
- `terrain` 固定为枚举
- `object` 固定为单对象引用或空

### 10.2 角色

角色最少应包含：

- 位置
- 当前 active job id
- 固定移速
- 携带 stack
- hunger
- rest

### 10.3 物品堆

`itemPile` 最少应包含：

- item 类型
- 数量
- 所在格坐标

### 10.4 Job

job 最少应包含：

- job type
- state
- target
- claimed worker id
- 失败原因或取消原因

## 11. 验收场景

以下场景全部通过，视为 MVP 规格落地正确：

### 11.1 砍树与掉落

- 玩家标记 tree
- 某角色领取 `harvest`
- 角色移动到 tree 四方向相邻格
- 2 秒后 tree 消失
- 原地出现 `wood x5`

### 11.2 木材搬运与建墙

- 玩家放置 `wall blueprint`
- 系统生成 `pickup/deliver`
- 某角色搬运 `wood`
- blueprint 收到 `2 wood` 后进入可施工状态
- 某角色完成施工
- blueprint 替换成 `wall`
- `wall` 变为阻挡

### 11.3 建床与睡眠

- 玩家放置 `bed blueprint`
- blueprint 收到 `4 wood`
- 施工完成后变成 `bed`
- 某角色 `rest <= 25` 时优先前往 bed 睡觉
- 恢复到 `80` 后返回正常调度

### 11.4 饥饿打断普通工作

- 角色正在执行普通 job
- `hunger` 下降到 `30` 或以下
- 当前普通工作被中断或挂起
- 角色去获取 `meal`
- 吃饭完成后恢复普通调度

### 11.5 无床时睡地板

- 地图上没有可用 bed
- 角色 `rest <= 25`
- 系统生成 `sleep`
- 角色原地睡地板
- `rest` 恢复到 `50` 后结束

### 11.6 目标失效回滚

- 角色已领取或执行中的 job 对应目标失效
- job 被标记为 `cancelled` 或 `failed`
- 角色释放 active job
- 若手中有材料，材料掉回地图
- 系统不保留脏 claim

## 12. 实现约束

- 不允许同一角色同时持有多个 active job
- 不允许一个格子同时存在多个 object
- 不允许 tree 和 wall 被角色穿过
- 不允许 blueprint 在材料未齐时直接施工
- 不允许角色绕过 hunger / rest 优先级持续做普通工作

## 13. 后续扩展预留

以下内容明确留到 MVP 之后：

- 多 terrain 与移动代价
- 多资源与制作链
- storage / stockpile
- 房间需求
- 多人协作建造加速
- 优先级系统
- 门、路径保留、碰撞优化
