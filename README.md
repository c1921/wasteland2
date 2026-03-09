# Wasteland2

`wasteland2` 是一个面向 Web 的 RimWorld-like colony simulation MVP。目标不是先堆内容，而是先验证一个可持续扩展的闭环：

`玩家下命令 -> 小人接任务 -> 移动到目标 -> 执行工作 -> 世界状态变化 -> 小人继续维持生存`

当前仓库已完成 React + Pixi + fixed tick runtime skeleton、Phase 2 地图系统基础，以及 Phase 3 的相机与输入底座：固定尺寸地图、默认世界生成、可缩放平移视角、格子/对象选中与命令意图桥接。玩法闭环仍处于待实现状态。

## 当前状态

已完成：

- React 页面壳与 Pixi 画布挂载
- `PixiGameView` 生命周期已兼容 React `StrictMode` 重挂载，避免半初始化 `Application` 清理崩溃
- 游戏面板初始化失败时由局部 error boundary 承接，并支持手动 `Retry`
- `GameLoop` 固定 tick 驱动
- `Game` 组合世界、管理器与系统骨架
- tick 计数与模拟时间累计
- `MapGrid` 地图模型与 `Cell { terrain, object? }` 约束
- 固定 seed 的默认世界生成：spawn 点、`12` 棵 tree、`20 meal`
- Pixi 地图渲染支持网格、object 区分、选中高亮与命令模式预览
- 相机支持 fit-to-world、滚轮缩放、中键拖拽与 `Space + 左键拖拽`
- React UI 已接入命令模式切换、重置视角、选中摘要与最近一次命令意图摘要
- Vitest 已覆盖地图层、相机数学、相机到渲染同步与命令意图映射

未完成：

- 角色实体与世界状态完整展示
- 移动与寻路
- 命令系统真正落地到世界状态：tree 标记、blueprint 放置 / 取消、job 派生
- Job / Reservation / Needs / Build 闭环
- 资源面板、速度控制、完整调试面板

## 技术方向

- React：UI、菜单、信息面板、调试视图
- PixiJS：地图、实体、建筑、物品渲染
- TypeScript：模拟层与渲染层的类型约束
- Simulation / Game Core：固定 tick 驱动的世界逻辑

Zustand、`EventBus` 等可以作为后续实现手段，但不是当前 MVP 文档中的强制要求。

## 快速启动

```bash
npm install
npm run dev
```

常用命令：

```bash
npm run build
npm run lint
npm run typecheck
```
