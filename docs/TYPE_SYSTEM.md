# 类型系统文档

## 概述

GraphView 支持完整的类型系统，每个节点可以有不同的类型，每种类型有独特的颜色标识。

## 节点类型

### 9种节点类型

| 类型 | 颜色 | 说明 |
|------|------|------|
| `unknown` | 灰色 (#9E9E9E) | 默认类型，未指定类型的节点 |
| `component` | 蓝色 (#2196F3) | 组件类型 |
| `interface` | 紫色 (#9C27B0) | 接口类型 |
| `tie` | 青色 (#00BCD4) | Tie 类型 |
| `boa` | 靛蓝 (#3F51B5) | Boa 类型 |
| `data-extension` | 绿色 (#4CAF50) | 数据扩展 |
| `code-extension` | 深绿 (#43A047) | 代码扩展 |
| `transient-extension` | 浅绿 (#66BB6A) | 临时扩展 |
| `cache-extension` | 更浅绿 (#81C784) | 缓存扩展 |

### 颜色分组

- **扩展类型**：4种扩展使用相似的绿色系，便于识别
- **接口类型**：interface, tie, boa 使用紫/青/靛蓝系
- **组件类型**：component 使用蓝色
- **未知类型**：unknown 使用灰色

## 命令

### 1. 创建节点

```json
{
    "framework": "System",
    "command": "meta-class:create",
    "payload": {
        "name": "MyClass"
    }
}
```

- 创建节点，默认类型为 `unknown`
- 默认颜色为灰色

### 2. 设置类型

```json
{
    "framework": "System",
    "command": "meta-class:set-type",
    "payload": {
        "name": "MyClass",
        "type": "component"
    }
}
```

- 设置节点类型
- 自动更新节点颜色
- 如果节点有扩展边，会自动更新边的样式
- 如果不提供 `type`，默认为 `unknown`

### 3. 添加扩展（类型继承）

```json
{
    "framework": "System",
    "command": "meta-class:add-extension",
    "payload": {
        "name": "MyClass",
        "extension": "MyExtension",
        "type": "data"
    }
}
```

**类型参数可选：**
- 如果提供 `type`：使用指定的类型（data/code/cache/transient）
- 如果不提供 `type`：从 `extension` 节点的类型推断
  - `data-extension` → `data`
  - `code-extension` → `code`
  - `cache-extension` → `cache`
  - `transient-extension` → `transient`
  - 其他类型 → `data`（默认）

**边样式：**
- 所有扩展边使用虚线（dashed）
- 不同类型使用不同颜色的绿色系

### 4. 类型变更的影响

当节点类型改变时：
1. 节点颜色自动更新
2. 从该节点出发的所有扩展边样式自动更新
3. 如果扩展边没有指定类型，会根据新的节点类型重新推断

## 使用示例

### 示例 1：创建带类型的组件

```javascript
// 1. 创建节点
{ framework: 'System', command: 'meta-class:create', payload: { name: 'Dog' }}

// 2. 设置类型
{ framework: 'System', command: 'meta-class:set-type', payload: { name: 'Dog', type: 'component' }}
// Dog 现在是蓝色
```

### 示例 2：创建扩展并自动推断类型

```javascript
// 1. 创建扩展节点
{ framework: 'System', command: 'meta-class:create', payload: { name: 'BarkingExt' }}
{ framework: 'System', command: 'meta-class:set-type', payload: { name: 'BarkingExt', type: 'code-extension' }}
// BarkingExt 是深绿色

// 2. 添加扩展（不指定 type）
{ framework: 'System', command: 'meta-class:add-extension', payload: { name: 'Dog', extension: 'BarkingExt' }}
// 边的类型自动推断为 'code'，使用深绿色虚线
```

### 示例 3：显式指定扩展类型

```javascript
// 1. 创建扩展节点（类型为 unknown）
{ framework: 'System', command: 'meta-class:create', payload: { name: 'CustomExt' }}

// 2. 添加扩展（显式指定类型）
{ framework: 'System', command: 'meta-class:add-extension', payload: { name: 'Dog', extension: 'CustomExt', type: 'data' }}
// 边使用 data 类型的样式（绿色虚线）
```

### 示例 4：类型变更

```javascript
// 1. 创建节点和扩展
{ framework: 'System', command: 'meta-class:create', payload: { name: 'MyExt' }}
{ framework: 'System', command: 'meta-class:set-type', payload: { name: 'MyExt', type: 'data-extension' }}
{ framework: 'System', command: 'meta-class:add-extension', payload: { name: 'MyClass', extension: 'MyExt' }}
// 边是绿色虚线（data 类型）

// 2. 改变扩展节点类型
{ framework: 'System', command: 'meta-class:set-type', payload: { name: 'MyExt', type: 'code-extension' }}
// MyExt 变为深绿色
// 边的样式自动更新为深绿色（code 类型）
```

## 完整示例

```javascript
// 创建一个完整的类层次结构

// 1. 基础类
{ framework: 'System', command: 'meta-class:create', payload: { name: 'Object' }},
{ framework: 'System', command: 'meta-class:set-type', payload: { name: 'Object', type: 'component' }},

// 2. 接口
{ framework: 'System', command: 'meta-class:create', payload: { name: 'ISerializable' }},
{ framework: 'System', command: 'meta-class:set-type', payload: { name: 'ISerializable', type: 'interface' }},

// 3. 组件类
{ framework: 'System', command: 'meta-class:create', payload: { name: 'Animal' }},
{ framework: 'System', command: 'meta-class:set-type', payload: { name: 'Animal', type: 'component' }},
{ framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Animal', parent: 'Object' }},
{ framework: 'System', command: 'meta-class:add-interface', payload: { name: 'Animal', interface: 'ISerializable', type: 'tie' }},

// 4. 扩展
{ framework: 'System', command: 'meta-class:create', payload: { name: 'DataExt' }},
{ framework: 'System', command: 'meta-class:set-type', payload: { name: 'DataExt', type: 'data-extension' }},
{ framework: 'System', command: 'meta-class:add-extension', payload: { name: 'Animal', extension: 'DataExt' }},
// 边自动使用 data 类型样式
```

## 边类型样式

### 继承边（Inheritance）
- **线型**：实线（solid）
- **颜色**：蓝色 (#2196F3)
- **箭头**：三角形（triangle）

### 扩展边（Extension）
- **线型**：虚线（dashed）
- **颜色**：根据类型
  - data: 绿色 (#4CAF50)
  - code: 深绿 (#43A047)
  - transient: 浅绿 (#66BB6A)
  - cache: 更浅绿 (#81C784)
- **箭头**：V形（vee）

### 实现边（Implementation）
- **线型**：点线（dotted）
- **颜色**：根据类型
  - tie: 青色 (#00BCD4)
  - tie-chain: 深青 (#009688)
  - boa: 靛蓝 (#3F51B5)
- **箭头**：菱形（diamond）

## 测试

### 运行测试

```bash
# 大型测试（100+ 命令）
node test/socket-large-test.js

# 调试测试（35+ 命令）
node test/socket-debug-test.js
```

### 测试内容

大型测试包含：
- 9种节点类型的完整测试
- 类型继承和推断
- 扩展边的自动类型推断
- 类型变更的级联更新
- 接口查找功能

## 接口查找

### 查找规则

一个节点可以找到的接口包括：
1. **直接实现的接口**
2. **父类实现的接口**（继承）
3. **扩展实现的接口**
4. **接口的父接口**（接口继承）

### 查找示例

```
Object (实现 ISerializable)
  └─ Animal
      └─ Dog (实现 IPet)
          + BarkingExt (实现 ILoggable)

接口层次：
IBase
  ├─ ISerializable
  └─ ILoggable
      └─ IPet
```

**Dog 可以找到的接口：**
1. `IPet` - 直接实现
2. `ISerializable` - 父类 Animal → Object 实现
3. `ILoggable` - 扩展 BarkingExt 实现
4. `IBase` - IPet 和 ISerializable 的父接口

### 查询命令

```javascript
// 查询 Dog 是否实现 ISerializable
{ framework: 'System', command: 'query:start-query', payload: {}},
{ framework: 'System', command: 'query:set-querier', payload: { name: 'Dog' }},
{ framework: 'System', command: 'query:set-interface', payload: { name: 'ISerializable' }},
{ framework: 'System', command: 'query:end-query', payload: { result: 'ok' }},
// 结果：ok（通过父类 Object 实现）
```

## 最佳实践

### 1. 始终设置类型

```javascript
// ✅ 好的做法
{ framework: 'System', command: 'meta-class:create', payload: { name: 'MyClass' }},
{ framework: 'System', command: 'meta-class:set-type', payload: { name: 'MyClass', type: 'component' }},

// ❌ 不推荐
{ framework: 'System', command: 'meta-class:create', payload: { name: 'MyClass' }},
// 节点保持 unknown 类型
```

### 2. 使用类型推断

```javascript
// ✅ 好的做法 - 让系统自动推断
{ framework: 'System', command: 'meta-class:set-type', payload: { name: 'MyExt', type: 'code-extension' }},
{ framework: 'System', command: 'meta-class:add-extension', payload: { name: 'MyClass', extension: 'MyExt' }},
// 边自动使用 code 类型

// ❌ 不必要的显式指定
{ framework: 'System', command: 'meta-class:add-extension', payload: { name: 'MyClass', extension: 'MyExt', type: 'code' }},
```

### 3. 组织类型

```javascript
// 按类型组织节点
// 1. 先创建所有接口
// 2. 再创建所有组件
// 3. 最后创建所有扩展
// 4. 建立关系
```

## 故障排除

### Q: 节点颜色没有改变

**原因**：没有调用 `set-type` 命令

**解决**：
```javascript
{ framework: 'System', command: 'meta-class:set-type', payload: { name: 'MyClass', type: 'component' }}
```

### Q: 扩展边颜色不对

**原因**：扩展节点类型设置错误

**解决**：
1. 检查扩展节点的类型
2. 重新设置类型
3. 边会自动更新

### Q: 类型推断不工作

**原因**：扩展节点没有设置类型

**解决**：
```javascript
// 先设置扩展节点类型
{ framework: 'System', command: 'meta-class:set-type', payload: { name: 'MyExt', type: 'data-extension' }}
// 再添加扩展
{ framework: 'System', command: 'meta-class:add-extension', payload: { name: 'MyClass', extension: 'MyExt' }}
```

## 相关文档

- `docs/packages.md` - 完整协议说明
- `docs/SOCKET_SYSTEM.md` - Socket 系统文档
- `docs/AUTO_LAYOUT.md` - 自动布局文档
- `docs/TESTING_GUIDE.md` - 测试指南
