# 图节点和边悬浮窗功能

## 功能概述

在图中鼠标悬浮在节点或边上时，会出现一个可以固定（pinned）的悬浮窗，显示元素的详细属性信息。支持递归查询和点击聚焦功能。

## 功能特性

### 1. 自动显示
- ✅ 鼠标悬浮在节点上 → 显示节点信息
- ✅ 鼠标悬浮在边上 → 显示边信息
- ✅ 鼠标移开后 300ms 自动隐藏

### 2. 固定功能
- ✅ 点击 📌 按钮固定悬浮窗
- ✅ 固定后不会自动隐藏
- ✅ 点击 📍 按钮取消固定
- ✅ 点击 ✕ 按钮关闭

### 3. 递归查询
- ✅ 悬浮在相关类名上显示嵌套悬浮窗
- ✅ 支持一层嵌套（防止无限递归）
- ✅ 嵌套悬浮窗显示相同的详细信息

### 4. 点击聚焦
- ✅ 点击类名聚焦到对应节点
- ✅ 高亮显示目标节点
- ✅ 平滑动画移动到节点位置
- ✅ 自动调整缩放级别

## 显示信息

### 节点信息

#### 基本信息
- **ID** - 节点唯一标识
- **Name** - 节点名称
- **Type** - 节点类型（带颜色标识）
  - `unknown` - 灰色
  - `component` - 蓝色
  - `interface` - 青色
  - `tie` - 紫色
  - `boa` - 橙色
  - `data-extension` - 绿色
  - `code-extension` - 深绿色
  - `transient-extension` - 黄绿色
  - `cache-extension` - 青绿色

#### 继承关系
- **Parent** - 父类（可点击）
- **Children** - 子类列表（可点击）

#### 扩展关系
- **Extensions** - 这个节点扩展了哪些类
  - 显示扩展类名和类型
  - 类名可点击和悬浮
- **Extended By** - 哪些节点扩展了这个类
  - 显示扩展者名称和类型
  - 名称可点击和悬浮

#### 接口实现
- **Implements** - 实现了哪些接口
  - 显示接口名和实现类型（tie/boa）
  - 接口名可点击和悬浮
- **Implemented By** - 被哪些类实现（如果是接口）
  - 显示实现者名称和类型
  - 名称可点击和悬浮

### 边信息

- **Source** - 源节点（可点击）
- **Target** - 目标节点（可点击）
- **Type** - 边类型
  - `inheritance` - 继承
  - `extension` - 扩展
  - `implementation` - 实现
- **Extension Type** - 扩展类型（如果是扩展边）
  - `data` / `code` / `transient` / `cache`
- **Implementation Type** - 实现类型（如果是实现边）
  - `tie` / `boa`

## 使用方法

### 基本使用

1. **查看节点信息**
   ```
   鼠标悬浮在节点上 → 自动显示悬浮窗
   ```

2. **固定悬浮窗**
   ```
   点击 📌 按钮 → 悬浮窗保持显示
   ```

3. **查看相关节点**
   ```
   悬浮在类名上 → 显示嵌套悬浮窗
   ```

4. **聚焦到节点**
   ```
   点击类名 → 图自动移动并高亮该节点
   ```

### 示例场景

#### 场景 1：查看类的继承关系

```
1. 悬浮在 Dog 节点上
2. 看到 Parent: Animal
3. 悬浮在 "Animal" 上
4. 看到 Animal 的详细信息
5. 点击 "Animal"
6. 图聚焦到 Animal 节点
```

#### 场景 2：查看扩展关系

```
1. 悬浮在 Dog 节点上
2. 看到 Extensions:
   - BarkingExt (code-extension)
   - WaggingTailExt (data-extension)
3. 悬浮在 "BarkingExt" 上
4. 看到 BarkingExt 的详细信息
```

#### 场景 3：查看接口实现

```
1. 悬浮在 Dog 节点上
2. 看到 Implements:
   - IPet (tie)
   - IAnimal (boa)
3. 点击 "IPet"
4. 图聚焦到 IPet 节点
5. 悬浮在 IPet 节点上
6. 看到 Implemented By:
   - Dog (tie)
   - Cat (tie)
```

#### 场景 4：固定悬浮窗对比

```
1. 悬浮在 Dog 节点上
2. 点击 📌 固定悬浮窗
3. 悬浮在 Cat 节点上
4. 现在可以同时看到 Dog 和 Cat 的信息
5. 对比它们的继承和扩展关系
```

## 技术实现

### 组件结构

```
GraphView.vue
  ├── GraphTooltip.vue (主悬浮窗)
  │   └── GraphTooltip.vue (嵌套悬浮窗)
  └── Cytoscape 实例
```

### 数据流

```
鼠标悬浮事件
  ↓
showTooltip(elementId, elementType, event)
  ↓
GraphTooltip 组件接收 props
  ↓
loadElementData() 从 Cytoscape 查询数据
  ↓
loadNodeInfo() / loadEdgeInfo()
  ↓
显示信息
```

### 查询逻辑

#### 节点查询

```typescript
// 获取父类
const parentEdges = cy.edges(`[source = "${nodeId}"][edgeType = "inheritance"]`)
const parent = parentEdges[0]?.data('target')

// 获取子类
const childEdges = cy.edges(`[target = "${nodeId}"][edgeType = "inheritance"]`)
const children = childEdges.map(edge => edge.data('source'))

// 获取扩展
const extensionEdges = cy.edges(`[source = "${nodeId}"][edgeType = "extension"]`)
const extensions = extensionEdges.map(edge => ({
  name: edge.data('target'),
  type: edge.data('extensionType')
}))

// 获取被扩展
const extendedByEdges = cy.edges(`[target = "${nodeId}"][edgeType = "extension"]`)
const extendedBy = extendedByEdges.map(edge => ({
  name: edge.data('source'),
  type: edge.data('extensionType')
}))

// 获取接口实现
const interfaceEdges = cy.edges(`[source = "${nodeId}"][edgeType = "implementation"]`)
const interfaces = interfaceEdges.map(edge => ({
  name: edge.data('target'),
  type: edge.data('implementationType')
}))

// 获取被实现
const implementedByEdges = cy.edges(`[target = "${nodeId}"][edgeType = "implementation"]`)
const implementedBy = implementedByEdges.map(edge => ({
  name: edge.data('source'),
  type: edge.data('implementationType')
}))
```

### 聚焦逻辑

```typescript
function focusNode(nodeId: string) {
  const node = cy.$id(nodeId)
  
  // 高亮节点
  cy.elements().removeClass('highlighted')
  node.addClass('highlighted')
  
  // 聚焦并缩放
  cy.animate({
    center: { eles: node },
    zoom: 1.5
  }, {
    duration: 500
  })
}
```

## 样式设计

### 悬浮窗样式

- **尺寸**：最小宽度 300px，最大宽度 400px
- **位置**：鼠标位置右下方，自动避免超出屏幕
- **背景**：白色，带阴影
- **边框**：
  - 普通状态：灰色边框
  - 固定状态：蓝色边框，蓝色阴影

### 交互样式

- **类名链接**
  - 颜色：蓝色 `#4a9eff`
  - 悬浮：浅蓝色背景 `#e3f2fd`
  - 字体：等宽字体
  
- **类型标签**
  - 背景：对应类型颜色
  - 文字：白色
  - 圆角：4px

- **扩展/接口项**
  - 背景：浅灰色 `#f8f9fa`
  - 圆角：4px
  - 间距：4px

## 性能优化

### 1. 延迟隐藏
```typescript
// 鼠标移开后 300ms 才隐藏
tooltipHideTimer = setTimeout(() => {
  hideTooltip()
}, 300)
```

### 2. 防止重复查询
```typescript
// 只在 visible 或 elementId 变化时重新查询
watch(() => [props.visible, props.elementId], () => {
  if (props.visible) {
    loadElementData()
  }
})
```

### 3. 限制嵌套层级
```typescript
// 嵌套悬浮窗不再显示更深层的悬浮窗
if (props.isNested) return
```

## 键盘快捷键

目前不支持键盘快捷键，所有操作通过鼠标完成。

## 已知限制

### 1. 嵌套层级
- 只支持一层嵌套
- 嵌套悬浮窗不能再显示更深层的悬浮窗

### 2. 位置计算
- 悬浮窗位置基于鼠标位置
- 可能在屏幕边缘被裁剪（已有自动调整）

### 3. 移动端
- 未针对触摸设备优化
- 建议在桌面浏览器使用

## 故障排除

### Q: 悬浮窗不显示

**检查：**
1. 确保鼠标悬浮在节点或边上
2. 检查浏览器控制台是否有错误
3. 确认 Cytoscape 实例已初始化

**解决：**
```typescript
// 检查 cy 实例
console.log('cy:', cy)
console.log('cyRef:', cyRef.value)
```

### Q: 点击类名没有聚焦

**检查：**
1. 确认节点存在于图中
2. 检查节点 ID 是否正确

**解决：**
```typescript
// 检查节点是否存在
const node = cy.$id(nodeId)
console.log('Node exists:', node.length > 0)
```

### Q: 嵌套悬浮窗不显示

**检查：**
1. 确认不是在嵌套悬浮窗中（只支持一层嵌套）
2. 检查鼠标是否真的悬浮在类名上

**解决：**
```typescript
// 检查是否嵌套
console.log('Is nested:', props.isNested)
```

### Q: 悬浮窗位置不对

**原因：** 位置计算基于鼠标坐标

**解决：**
```typescript
// 调整位置偏移
position: {
  x: event.renderedPosition?.x + 20,  // 增加偏移
  y: event.renderedPosition?.y + 20
}
```

## 测试方法

### 1. 基本功能测试

```bash
# 启动应用
npm run electron:dev

# 启动 Socket 服务器
# 在 GraphView 中点击 🟢

# 运行测试脚本
npm run test:large
```

### 2. 手动测试

```bash
# 使用 CLI 工具
npm run test:cli

# 创建测试数据
> connect
> create Dog
> type Dog component
> create Animal
> type Animal component
> parent Dog Animal
> create BarkingExt
> type BarkingExt code-extension
> ext Dog BarkingExt
> create IPet
> type IPet interface
> iface Dog IPet tie
```

### 3. 测试场景

#### 测试 1：节点悬浮
1. 悬浮在 Dog 节点上
2. 确认显示悬浮窗
3. 确认显示 Parent: Animal
4. 确认显示 Extensions
5. 确认显示 Implements

#### 测试 2：固定功能
1. 悬浮在 Dog 节点上
2. 点击 📌 按钮
3. 移开鼠标
4. 确认悬浮窗仍然显示
5. 点击 📍 按钮
6. 移开鼠标
7. 确认悬浮窗隐藏

#### 测试 3：递归查询
1. 悬浮在 Dog 节点上
2. 悬浮在 "Animal" 上
3. 确认显示 Animal 的嵌套悬浮窗
4. 移开鼠标
5. 确认嵌套悬浮窗隐藏

#### 测试 4：点击聚焦
1. 悬浮在 Dog 节点上
2. 点击 "Animal"
3. 确认图移动到 Animal 节点
4. 确认 Animal 节点高亮显示
5. 确认缩放级别调整

#### 测试 5：边悬浮
1. 悬浮在继承边上
2. 确认显示边信息
3. 确认显示 Source 和 Target
4. 确认显示 Type: inheritance

## 未来改进

### 1. 键盘支持
- `Esc` 键关闭悬浮窗
- `P` 键固定/取消固定
- 方向键在相关节点间导航

### 2. 更多信息
- 节点创建时间
- 最后修改时间
- 节点属性列表
- 自定义字段

### 3. 交互增强
- 拖动悬浮窗位置
- 调整悬浮窗大小
- 多个悬浮窗同时固定
- 悬浮窗历史记录

### 4. 视觉优化
- 动画效果
- 主题切换
- 自定义样式
- 图标美化

### 5. 性能优化
- 虚拟滚动（大量子类时）
- 懒加载相关信息
- 缓存查询结果

## 相关文件

### 新增文件
- `src/components/views/GraphTooltip.vue` - 悬浮窗组件

### 修改文件
- `src/components/views/GraphView.vue` - 集成悬浮窗
- `src/components/views/GraphMessageHandler.ts` - 已有查询逻辑

### 文档文件
- `docs/TOOLTIP_FEATURE.md` - 本文档

## 相关文档

- `docs/TYPE_SYSTEM.md` - 类型系统文档
- `docs/CLI_TOOL.md` - CLI 工具文档
- `docs/packages.md` - 协议规范
- `docs/SIDEBAR_FIX.md` - 侧边栏修复文档
