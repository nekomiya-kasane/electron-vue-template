/**
 * GraphView 消息处理器
 * 根据 packages.md 规范处理图操作命令
 */

import type { SocketMessage, SocketSession } from '@/core/socket'
import type { Core } from 'cytoscape'
import { pluginManager } from '@/core/plugin'

export interface EdgeStyle {
  lineType: 'solid' | 'dashed' | 'dotted'
  color: string
  width: number
}

export interface QueryState {
  isQuerying: boolean
  querierHistory: string[]
  interfaceHistory: string[]
  lastQuerier?: string
  lastInterface?: string
}

export class GraphMessageHandler {
  private cy: Core | null = null
  private queryState: QueryState = {
    isQuerying: false,
    querierHistory: [],
    interfaceHistory: []
  }

  // 节点类型颜色配置
  private nodeTypeColors = {
    'unknown': '#9E9E9E',           // 灰色
    'component': '#2196F3',         // 蓝色
    'interface': '#9C27B0',         // 紫色
    'tie': '#00BCD4',               // 青色
    'boa': '#3F51B5',               // 靛蓝
    'data-extension': '#4CAF50',    // 绿色
    'code-extension': '#25802aff',    // 深绿
    'transient-extension': '#35f43eff', // 浅绿
    'cache-extension': '#bbf5beff'    // 更浅绿
  }

  // 边类型样式配置
  private edgeStyles = {
    // 继承边
    inheritance: {
      lineType: 'solid' as const,
      color: '#2196F3',
      width: 2
    },
    // 扩展边（4种类型）
    extension: {
      data: { lineType: 'dashed' as const, color: '#4CAF50', width: 2 },
      cache: { lineType: 'dashed' as const, color: '#81C784', width: 2 },
      transient: { lineType: 'dashed' as const, color: '#66BB6A', width: 2 },
      code: { lineType: 'dashed' as const, color: '#43A047', width: 2 }
    },
    // 实现边（3种类型）
    implementation: {
      tie: { lineType: 'dotted' as const, color: '#00BCD4', width: 2 },
      'tie-chain': { lineType: 'dotted' as const, color: '#009688', width: 2 },
      boa: { lineType: 'dotted' as const, color: '#3F51B5', width: 2 }
    }
  }

  // 查询高亮颜色
  private queryColors = {
    querier: {
      first: 'rgba(255, 193, 7, 0.8)',
      subsequent: 'rgba(255, 193, 7, 0.4)'
    },
    interface: {
      first: 'rgba(33, 150, 243, 0.8)',
      subsequent: 'rgba(33, 150, 243, 0.4)'
    },
    result: {
      ok: 'rgba(76, 175, 80, 0.8)',
      failed: 'rgba(244, 67, 54, 0.8)',
      cached: 'rgba(255, 235, 59, 0.8)'
    }
  }

  constructor(cy: Core | null = null) {
    this.cy = cy
  }

  setCytoscape(cy: Core): void {
    this.cy = cy
  }

  /**
   * 处理消息
   */
  async handleMessage(message: SocketMessage, session: SocketSession): Promise<void> {
    // 只处理 System 框架的消息
    if (message.framework !== 'System') {
      return
    }

    console.log(`[${session.id}] Processing command: ${message.command}`, message.payload)

    try {
      switch (message.command) {
        case 'meta-class:create':
          this.handleCreateVertex(message.payload as { name: string })
          break
        case 'meta-class:set-type':
          this.handleSetType(message.payload as { name: string; type?: string })
          break
        case 'meta-class:set-parent':
          this.handleSetParent(message.payload as { name: string; parent: string })
          break
        case 'meta-class:add-extension':
          this.handleAddExtension(message.payload as { name: string; extension: string; type?: string })
          break
        case 'meta-class:remove-extension':
          this.handleRemoveExtension(message.payload as { name: string; extension: string })
          break
        case 'meta-class:add-interface':
          this.handleAddInterface(message.payload as { name: string; interface: string; type: string })
          break
        case 'meta-class:remove-interface':
          this.handleRemoveInterface(message.payload as { name: string; interface: string })
          break
        case 'query:start-query':
          this.handleStartQuery()
          break
        case 'query:end-query':
          this.handleEndQuery(message.payload as { result: 'ok' | 'failed' | 'cached' })
          break
        case 'query:clear-query-history':
          this.handleClearQueryHistory()
          break
        case 'query:set-querier':
          this.handleSetQuerier(message.payload as { name: string })
          break
        case 'query:set-interface':
          this.handleSetInterface(message.payload as { name: string })
          break
        default:
          console.warn(`Unknown command: ${message.command}`)
      }
    } catch (error) {
      console.error(`Error handling command ${message.command}:`, error)
      throw error
    }
  }

  /**
   * 创建顶点（默认类型为 unknown）
   */
  private handleCreateVertex(payload: { name: string }): void {
    if (!this.cy) return

    const { name } = payload
    
    // 检查是否已存在
    if (this.cy.$id(name).length > 0) {
      console.warn(`Vertex ${name} already exists`)
      return
    }

    const color = this.nodeTypeColors['unknown']
    
    this.cy.add({
      group: 'nodes',
      data: {
        id: name,
        label: name,
        type: 'unknown',
        color: color
      }
    })

    console.log(`Created vertex: ${name} (type: unknown)`)
    
    // 触发事件，通知侧边栏
    pluginManager.getEventBus().emit('graph:nodeAdded', { 
      id: name, 
      label: name, 
      color: color,
      type: 'unknown'
    })
  }

  /**
   * 设置节点类型
   */
  private handleSetType(payload: { name: string; type?: string }): void {
    if (!this.cy) return

    const { name, type = 'unknown' } = payload
    
    // 确保节点存在
    this.ensureNodeExists(name)
    
    const node = this.cy.$id(name)
    if (node.length === 0) return
    
    // 获取颜色
    const color = this.nodeTypeColors[type as keyof typeof this.nodeTypeColors] || this.nodeTypeColors['unknown']
    
    // 更新节点类型和颜色
    node.data('type', type)
    node.data('color', color)
    
    console.log(`Set type for ${name}: ${type} (color: ${color})`)
    
    // 触发事件，通知侧边栏更新节点颜色
    pluginManager.getEventBus().emit('graph:nodeUpdated', {
      id: name,
      label: node.data('label') || name,
      color: color,
      type: type
    })
    
    // 如果节点有扩展边，更新这些边的样式
    this.updateExtensionEdgesForNode(name)
  }

  /**
   * 更新节点的所有扩展边样式
   */
  private updateExtensionEdgesForNode(nodeName: string): void {
    if (!this.cy) return
    
    // 找到所有从此节点出发的扩展边
    const edges = this.cy.edges(`[source = "${nodeName}"][edgeType = "extension"]`)
    
    edges.forEach(edge => {
      const extensionType = edge.data('extensionType')
      if (!extensionType) {
        // 如果边没有指定类型，使用源节点的类型
        const sourceNode = edge.source()
        const nodeType = sourceNode.data('type')
        
        // 根据节点类型推断扩展类型
        let edgeType = 'data'
        if (nodeType === 'data-extension') edgeType = 'data'
        else if (nodeType === 'code-extension') edgeType = 'code'
        else if (nodeType === 'cache-extension') edgeType = 'cache'
        else if (nodeType === 'transient-extension') edgeType = 'transient'
        
        const style = this.edgeStyles.extension[edgeType as keyof typeof this.edgeStyles.extension]
        edge.data('color', style.color)
        edge.data('width', style.width)
        edge.data('lineStyle', style.lineType)
      }
    })
  }

  /**
   * 设置父节点（继承关系）
   */
  private handleSetParent(payload: { name: string; parent: string }): void {
    if (!this.cy) return

    const { name, parent } = payload

    // 删除现有的继承边
    this.cy.edges(`[source = "${name}"][edgeType = "inheritance"]`).remove()

    if (parent === 'none' || !parent) {
      console.log(`Removed parent for ${name}`)
      return
    }

    // 确保两个节点都存在
    this.ensureNodeExists(name)
    this.ensureNodeExists(parent)

    // 创建继承边
    const edgeId = `${name}-inherits-${parent}`
    if (this.cy.$id(edgeId).length === 0) {
      const style = this.edgeStyles.inheritance
      const edgeData = {
        id: edgeId,
        source: name,
        target: parent,
        edgeType: 'inheritance',
        label: 'inherits',
        color: style.color || '#4A90E2',
        width: style.width || 2,
        lineStyle: style.lineType || 'solid',
        arrowShape: 'triangle',
        curveStyle: 'bezier',
        opacity: 1
      }
      
      this.cy.add({
        group: 'edges',
        data: edgeData
      })
      
      console.log(`Set parent: ${name} -> ${parent}`)
      
      // 触发事件，通知侧边栏
      pluginManager.getEventBus().emit('graph:edgeAdded', edgeData)
    }
  }

  /**
   * 添加扩展（type 可选，如果没有提供则使用 extension 节点的类型）
   */
  private handleAddExtension(payload: { name: string; extension: string; type?: string }): void {
    if (!this.cy) return

    const { name, extension } = payload
    let { type } = payload

    // 确保节点存在
    this.ensureNodeExists(name)
    this.ensureNodeExists(extension)

    // 如果没有提供 type，从 extension 节点的类型推断
    if (!type) {
      const extensionNode = this.cy.$id(extension)
      if (extensionNode.length > 0) {
        const nodeType = extensionNode.data('type')
        // 根据节点类型推断扩展类型
        if (nodeType === 'data-extension') type = 'data'
        else if (nodeType === 'code-extension') type = 'code'
        else if (nodeType === 'cache-extension') type = 'cache'
        else if (nodeType === 'transient-extension') type = 'transient'
        else type = 'data' // 默认
      } else {
        type = 'data' // 默认
      }
    }

    // 检查边是否已存在
    const edgeId = `${extension}-extends-${name}-${type}`
    if (this.cy.$id(edgeId).length > 0) {
      console.warn(`Extension edge ${edgeId} already exists`)
      return
    }

    // 获取样式
    const style = this.edgeStyles.extension[type as keyof typeof this.edgeStyles.extension] || 
                  this.edgeStyles.extension.data

    const edgeData = {
      id: edgeId,
      source: extension,
      target: name,
      edgeType: 'extension',
      extensionType: type,
      label: `ext:${type}`,
      color: style.color || '#50C878',
      width: style.width || 2,
      lineStyle: style.lineType || 'dashed',
      arrowShape: 'vee',
      curveStyle: 'bezier',
      opacity: 1
    }

    this.cy.add({
      group: 'edges',
      data: edgeData
    })

    console.log(`Added extension: ${extension} -> ${name} (${type})`)
    
    // 触发事件，通知侧边栏
    pluginManager.getEventBus().emit('graph:edgeAdded', edgeData)
  }

  /**
   * 移除扩展
   */
  private handleRemoveExtension(payload: { name: string; extension: string }): void {
    if (!this.cy) return

    const { name, extension } = payload

    // 删除所有从 extension 到 name 的扩展边
    this.cy.edges(`[source = "${extension}"][target = "${name}"][edgeType = "extension"]`).remove()

    console.log(`Removed extension: ${extension} -> ${name}`)
  }

  /**
   * 添加接口实现
   */
  private handleAddInterface(payload: { name: string; interface: string; type: string }): void {
    if (!this.cy) return

    const { name, interface: iface, type } = payload

    // 确保节点存在
    this.ensureNodeExists(name)
    this.ensureNodeExists(iface)

    // 检查边是否已存在
    const edgeId = `${name}-implements-${iface}-${type}`
    if (this.cy.$id(edgeId).length > 0) {
      console.warn(`Implementation edge ${edgeId} already exists`)
      return
    }

    // 获取样式
    const style = this.edgeStyles.implementation[type as keyof typeof this.edgeStyles.implementation] || 
                  this.edgeStyles.implementation.tie

    const edgeData = {
      id: edgeId,
      source: name,
      target: iface,
      edgeType: 'implementation',
      implementationType: type,
      label: `impl:${type}`,
      color: style.color || '#00CED1',
      width: style.width || 2,
      lineStyle: style.lineType || 'dotted',
      arrowShape: 'diamond',
      curveStyle: 'bezier',
      opacity: 1
    }

    this.cy.add({
      group: 'edges',
      data: edgeData
    })

    console.log(`Added interface: ${name} -> ${iface} (${type})`)
    
    // 触发事件，通知侧边栏
    pluginManager.getEventBus().emit('graph:edgeAdded', edgeData)
  }

  /**
   * 移除接口实现
   */
  private handleRemoveInterface(payload: { name: string; interface: string }): void {
    if (!this.cy) return

    const { name, interface: iface } = payload

    // 删除所有从 name 到 interface 的实现边
    this.cy.edges(`[source = "${name}"][target = "${iface}"][edgeType = "implementation"]`).remove()

    console.log(`Removed interface: ${name} -> ${iface}`)
  }

  /**
   * 开始查询模式
   */
  private handleStartQuery(): void {
    this.queryState.isQuerying = true
    this.queryState.querierHistory = []
    this.queryState.interfaceHistory = []
    this.queryState.lastQuerier = undefined
    this.queryState.lastInterface = undefined

    // 清除所有高亮
    this.clearAllHighlights()

    console.log('Query mode started')
  }

  /**
   * 结束查询模式
   */
  private handleEndQuery(payload: { result: 'ok' | 'failed' | 'cached' }): void {
    if (!this.cy || !this.queryState.isQuerying) return

    const { result } = payload
    this.queryState.isQuerying = false

    // 高亮最后的 querier 和 interface
    const color = this.queryColors.result[result]
    
    if (this.queryState.lastQuerier) {
      const node = this.cy.$id(this.queryState.lastQuerier)
      node.style('background-color', color)
    }

    if (this.queryState.lastInterface) {
      const node = this.cy.$id(this.queryState.lastInterface)
      node.style('background-color', color)
    }

    console.log(`Query ended with result: ${result}`)
  }

  /**
   * 清除查询历史
   */
  private handleClearQueryHistory(): void {
    this.clearAllHighlights()
    this.queryState.querierHistory = []
    this.queryState.interfaceHistory = []
    this.queryState.lastQuerier = undefined
    this.queryState.lastInterface = undefined

    console.log('Query history cleared')
  }

  /**
   * 设置查询者
   */
  private handleSetQuerier(payload: { name: string }): void {
    if (!this.cy || !this.queryState.isQuerying) return

    const { name } = payload
    this.ensureNodeExists(name)

    const isFirst = !this.queryState.querierHistory.includes(name)
    const color = isFirst ? 
      this.queryColors.querier.first : 
      this.queryColors.querier.subsequent

    const node = this.cy.$id(name)
    node.style('background-color', color)

    if (isFirst) {
      this.queryState.querierHistory.push(name)
    }
    this.queryState.lastQuerier = name

    console.log(`Set querier: ${name} (${isFirst ? 'first' : 'subsequent'})`)
  }

  /**
   * 设置接口
   */
  private handleSetInterface(payload: { name: string }): void {
    if (!this.cy || !this.queryState.isQuerying) return

    const { name } = payload
    this.ensureNodeExists(name)

    const isFirst = !this.queryState.interfaceHistory.includes(name)
    const color = isFirst ? 
      this.queryColors.interface.first : 
      this.queryColors.interface.subsequent

    const node = this.cy.$id(name)
    node.style('background-color', color)

    if (isFirst) {
      this.queryState.interfaceHistory.push(name)
    }
    this.queryState.lastInterface = name

    console.log(`Set interface: ${name} (${isFirst ? 'first' : 'subsequent'})`)
  }

  /**
   * 确保节点存在
   */
  private ensureNodeExists(name: string): void {
    if (!this.cy) return

    if (this.cy.$id(name).length === 0) {
      this.handleCreateVertex({ name })
    }
  }

  /**
   * 清除所有高亮
   */
  private clearAllHighlights(): void {
    if (!this.cy) return

    this.cy.nodes().style('background-color', '')
  }

  /**
   * 获取查询状态
   */
  getQueryState(): QueryState {
    return { ...this.queryState }
  }
}
