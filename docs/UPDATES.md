# 最新更新

## 2025-11-12 更新

### 1. 扩展测试脚本 ✅

**文件：** `test/socket-debug-test.js`

**更新内容：**
- 从 5 个命令扩展到 35+ 个命令
- 创建完整的类层次结构：
  - Object → Animal → Mammal/Bird/Fish
  - Mammal → Dog/Cat/Horse
  - Bird → Eagle/Penguin
- 添加多种扩展类型（data, cache, code）
- 添加多种接口类型（tie, tie-chain, boa）
- 包含完整的查询测试

**测试结构：**
```
Object
  └─ Animal
      ├─ Mammal
      │   ├─ Dog (+ Barking, IPet)
      │   ├─ Cat (+ Meowing, IPet)
      │   └─ Horse (+ Running, IFarm)
      ├─ Bird
      │   ├─ Eagle (+ Flying, IWild)
      │   └─ Penguin
      └─ Fish
```

### 2. 增量式布局 ✅

**文件：** `src/components/views/useGraphSocket.ts`

**更新内容：**
- 改为增量式布局算法
- 保持现有节点位置尽量稳定
- 只调整新节点的位置

**关键改进：**
```typescript
{
  fit: false,           // 不自动适应视图，保持当前缩放
  randomize: false,     // 不随机化初始位置
  animationDuration: 500,  // 更长的动画时间
  animationEasing: 'ease-out',  // 平滑缓动
  // dagre 布局参数优化
  rankDir: 'TB',        // 从上到下
  nodeSep: 80,          // 节点间距
  rankSep: 100,         // 层级间距
}
```

**效果：**
- ✅ 新节点添加时，现有节点位置变化最小
- ✅ 动画更平滑（500ms）
- ✅ 不会自动缩放，保持用户当前视图
- ✅ 层次结构更清晰

### 3. 删除默认示例图 ✅

**文件：** `src/components/views/GraphView.vue`

**更新内容：**
- 注释掉 `createSampleGraph()` 调用
- 注释掉 `saveLayoutSnapshot()` 调用
- 图从空白状态开始

**修改位置：**
```typescript
// 创建示例图（已注释，使用 Socket 动态创建）
// createSampleGraph()

// 保存初始布局
// saveLayoutSnapshot('cose')
```

**效果：**
- ✅ 启动时图为空白
- ✅ 通过 Socket 动态创建所有节点和边
- ✅ 更适合实际使用场景

## 测试方法

### 1. 启动应用

```bash
npm run electron:dev
```

### 2. 启动 Socket 服务器

在 GraphView 中点击 🔴 按钮，变为 🟢

### 3. 运行扩展测试

```bash
node test/socket-debug-test.js
```

### 4. 观察效果

你会看到：
- ✅ 从空白图开始
- ✅ 节点逐个出现（35+ 个命令）
- ✅ 每次添加节点/边后自动布局
- ✅ 现有节点位置保持相对稳定
- ✅ 新节点平滑插入到合适位置
- ✅ 最终形成清晰的层次结构

## 布局对比

### 之前（全量布局）
```
问题：
- 每次添加节点，所有节点都会重新排列
- 位置变化大，难以追踪
- fit: true 导致视图不断缩放
- 动画时间短（300ms），变化突兀
```

### 现在（增量布局）
```
优点：
- 现有节点位置基本保持不变
- 只有新节点和相关边会调整
- 保持用户当前缩放级别
- 动画时间长（500ms），变化平滑
- 更符合用户心理预期
```

## 性能优化

### 延迟执行
```typescript
// 延迟 100ms 执行布局，避免频繁触发
setTimeout(runLayout, 100)
```

### 批量操作建议
```typescript
// 如果需要批量添加节点
toggleAutoLayout(false)  // 关闭自动布局
// ... 批量操作
runLayout()              // 手动触发一次布局
toggleAutoLayout(true)   // 重新开启
```

## 配置选项

### 布局算法

当前默认使用 `dagre`（层次布局），适合有向图。

可选算法：
- `dagre` - 层次布局（推荐）
- `cose` - 力导向布局
- `cola` - 约束布局
- `circle` - 圆形布局
- `grid` - 网格布局

### 修改布局算法

```typescript
// 在 GraphView.vue 中
useGraphSocket(cyRef, {
  port: 8080,
  autoLayout: true,
  layoutName: 'cose'  // 改为力导向布局
})
```

### 布局参数调整

在 `useGraphSocket.ts` 的 `runLayout()` 函数中：

```typescript
// 调整节点间距
nodeSep: 80,     // 增大 → 节点更分散
nodeSep: 50,     // 减小 → 节点更紧凑

// 调整层级间距
rankSep: 100,    // 增大 → 层次更明显
rankSep: 60,     // 减小 → 层次更紧凑

// 调整动画时间
animationDuration: 500,  // 更长 → 更平滑
animationDuration: 300,  // 更短 → 更快速
```

## 故障排除

### Q: 布局还是跳动太大

**解决：**
1. 增加动画时间到 800ms
2. 尝试使用 `cose` 布局（力导向更稳定）
3. 减小 `nodeSep` 和 `rankSep` 参数

### Q: 新节点位置不理想

**解决：**
1. 调整 `rankDir`（TB/LR/BT/RL）
2. 增大 `nodeSep` 参数
3. 手动调整后再开启自动布局

### Q: 性能问题

**解决：**
1. 关闭自动布局进行批量操作
2. 增加延迟时间（从 100ms 到 500ms）
3. 使用更快的布局算法（circle）

## 下一步计划

### 可能的改进

1. **智能布局选择**
   - 根据节点数量自动选择布局算法
   - < 20 节点：dagre
   - 20-100 节点：cose
   - > 100 节点：circle

2. **布局缓存**
   - 缓存节点位置
   - 只重新布局受影响的子图

3. **手动调整**
   - 允许用户拖动节点
   - 保存用户调整的位置
   - 新节点插入时尊重手动位置

4. **布局预设**
   - 提供多种预设配置
   - 用户可以快速切换

## 相关文档

- `docs/AUTO_LAYOUT.md` - 自动布局详细说明
- `docs/TESTING_GUIDE.md` - 测试指南
- `docs/SOCKET_SYSTEM.md` - Socket 系统文档
- `docs/TROUBLESHOOTING.md` - 故障排除
