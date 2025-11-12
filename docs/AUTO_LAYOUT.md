# Socket 自动布局功能

## 概述

当通过 Socket 接收到图操作命令时，GraphView 会自动重新布局图形，确保节点和边的位置合理。用户可以随时开启或关闭此功能。

## 功能特点

### 1. 自动触发

当接收到以下命令时，会自动触发布局：
- `meta-class:create` - 创建节点
- `meta-class:set-parent` - 设置继承关系
- `meta-class:add-extension` - 添加扩展
- `meta-class:remove-extension` - 移除扩展
- `meta-class:add-interface` - 添加接口
- `meta-class:remove-interface` - 移除接口

### 2. 延迟执行

布局会延迟 100ms 执行，避免频繁触发。如果在 100ms 内收到多个命令，只会执行一次布局。

### 3. 动画效果

布局变化带有 300ms 的平滑动画，视觉效果更好。

## 使用方法

### UI 控制

在 GraphView 工具栏中，Socket 服务器启动后会显示两个按钮：

```
🟢 [1]  🔄
```

- **🟢** - Socket 服务器状态（绿色=运行中）
- **[1]** - 活动会话数
- **🔄** - 自动布局开启（点击切换）
- **⏸️** - 自动布局关闭（点击切换）

### 切换自动布局

点击 🔄/⏸️ 按钮即可切换自动布局状态。

**开启时（🔄）：**
- 每次图操作后自动重新布局
- 按钮背景高亮显示

**关闭时（⏸️）：**
- 不会自动布局
- 需要手动点击布局按钮

### 代码配置

在创建 Socket 服务器时可以配置：

```typescript
const {
  autoLayout,
  toggleAutoLayout,
  setLayoutName,
  runLayout
} = useGraphSocket(cyRef, {
  port: 8080,
  autoStart: false,
  autoLayout: true,        // 默认开启自动布局
  layoutName: 'dagre'      // 使用 dagre 布局算法
})
```

## 配置选项

### autoLayout

**类型：** `boolean`  
**默认值：** `true`  
**说明：** 是否开启自动布局

```typescript
// 开启自动布局
autoLayout: true

// 关闭自动布局
autoLayout: false
```

### layoutName

**类型：** `string`  
**默认值：** `'dagre'`  
**说明：** 布局算法名称

**可选值：**
- `dagre` - 层次布局（推荐用于有向图）
- `cose` - 力导向布局
- `circle` - 圆形布局
- `grid` - 网格布局
- `concentric` - 同心圆布局
- `breadthfirst` - 广度优先布局
- `cola` - 约束布局

```typescript
// 使用层次布局
layoutName: 'dagre'

// 使用力导向布局
layoutName: 'cose'
```

## API

### toggleAutoLayout(enabled: boolean)

切换自动布局状态。

```typescript
// 开启自动布局
toggleAutoLayout(true)

// 关闭自动布局
toggleAutoLayout(false)
```

### setLayoutName(name: string)

设置布局算法。

```typescript
// 切换到力导向布局
setLayoutName('cose')

// 切换到圆形布局
setLayoutName('circle')
```

### runLayout()

手动触发布局。

```typescript
// 立即执行布局
runLayout()
```

## 布局参数

当前布局使用以下参数：

```typescript
{
  name: layoutName,           // 布局算法名称
  animate: true,              // 启用动画
  animationDuration: 300,     // 动画时长 300ms
  fit: true,                  // 自动适应视图
  padding: 50                 // 边距 50px
}
```

## 使用场景

### 场景 1：实时监控

当监控系统实时发送类层次结构变化时，自动布局确保图形始终清晰可读。

```javascript
// 监控系统发送命令
socket.send(JSON.stringify({
  framework: 'System',
  command: 'meta-class:create',
  payload: { name: 'NewClass' }
}))

// GraphView 自动创建节点并重新布局
```

### 场景 2：批量导入

导入大量数据时，可以临时关闭自动布局，导入完成后手动触发一次布局。

```typescript
// 关闭自动布局
toggleAutoLayout(false)

// 批量发送命令
for (const cmd of commands) {
  socket.send(JSON.stringify(cmd))
}

// 手动触发布局
setTimeout(() => {
  runLayout()
  toggleAutoLayout(true)
}, 1000)
```

### 场景 3：演示模式

演示时开启自动布局，让观众清楚看到图形的变化过程。

```typescript
// 开启自动布局
toggleAutoLayout(true)

// 逐步发送命令，每次都会重新布局
sendCommandWithDelay(commands, 1000)
```

## 性能考虑

### 节点数量

- **< 50 个节点**：自动布局流畅
- **50-200 个节点**：可能有轻微延迟
- **> 200 个节点**：建议关闭自动布局

### 优化建议

1. **批量操作时关闭自动布局**
   ```typescript
   toggleAutoLayout(false)
   // 批量操作
   toggleAutoLayout(true)
   runLayout()
   ```

2. **使用更快的布局算法**
   ```typescript
   setLayoutName('circle')  // 圆形布局更快
   ```

3. **增加延迟时间**
   修改 `useGraphSocket.ts` 中的延迟：
   ```typescript
   setTimeout(runLayout, 500)  // 从 100ms 改为 500ms
   ```

## 故障排除

### Q: 自动布局不工作

**检查：**
1. 是否点击了 🔄 按钮？
2. Socket 服务器是否运行？
3. 浏览器控制台是否有错误？

**解决：**
```typescript
// 检查状态
console.log('Auto layout:', socketAutoLayout.value)
console.log('Layout name:', socketLayoutName.value)

// 手动触发
runLayout()
```

### Q: 布局太频繁

**原因：** 命令发送间隔太短

**解决：**
1. 增加测试脚本中的延迟
2. 修改 `useGraphSocket.ts` 中的延迟时间
3. 临时关闭自动布局

### Q: 布局效果不理想

**解决：** 尝试不同的布局算法

```typescript
// 尝试不同算法
setLayoutName('dagre')      // 层次布局
setLayoutName('cose')       // 力导向
setLayoutName('cola')       // 约束布局
```

## 示例

### 完整示例

```vue
<script setup>
import { ref } from 'vue'
import { useGraphSocket } from './useGraphSocket'

const cy = ref(null)

const {
  isRunning,
  autoLayout,
  layoutName,
  toggleAutoLayout,
  setLayoutName,
  runLayout,
  start
} = useGraphSocket(cy, {
  port: 8080,
  autoLayout: true,
  layoutName: 'dagre'
})

// 启动服务器
await start()

// 切换布局算法
const changeLayout = (name: string) => {
  setLayoutName(name)
  runLayout()  // 立即应用新布局
}

// 批量导入
const importData = async (commands: any[]) => {
  // 关闭自动布局
  toggleAutoLayout(false)
  
  // 发送所有命令
  for (const cmd of commands) {
    await sendCommand(cmd)
  }
  
  // 手动布局一次
  runLayout()
  
  // 重新开启自动布局
  toggleAutoLayout(true)
}
</script>

<template>
  <div>
    <button @click="toggleAutoLayout(!autoLayout)">
      {{ autoLayout ? '关闭' : '开启' }}自动布局
    </button>
    
    <select @change="changeLayout($event.target.value)">
      <option value="dagre">层次布局</option>
      <option value="cose">力导向</option>
      <option value="circle">圆形</option>
    </select>
    
    <button @click="runLayout">手动布局</button>
  </div>
</template>
```

## 下一步

- 查看 `docs/SOCKET_SYSTEM.md` 了解 Socket 系统
- 查看 `docs/TESTING_GUIDE.md` 了解测试方法
- 查看 `docs/GRAPH_SOCKET_INTEGRATION.md` 了解集成细节
