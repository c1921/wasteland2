# Wasteland2

`wasteland2` 是一个面向 Web 的 RimWorld-like colony simulation MVP。目标不是先堆内容，而是先验证一个可持续扩展的闭环：

`玩家下命令 -> 小人接任务 -> 移动到目标 -> 执行工作 -> 世界状态变化 -> 小人继续维持生存`

当前仓库已完成 React + Pixi + fixed tick runtime skeleton，玩法系统仍处于待实现状态。

## 当前状态

已完成：

- React 页面壳与 Pixi 画布挂载
- `GameLoop` 固定 tick 驱动
- `Game` 组合世界、管理器与系统骨架
- tick 计数与模拟时间累计

未完成：

- 地图、实体与渲染层
- 移动与寻路
- Job / Reservation / Needs / Build 闭环
- 玩家输入、建造菜单、调试面板

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
