import type { Core } from 'cytoscape'

export interface CommandResult {
  success: boolean
  message: string
  data?: any
}

export interface CommandContext {
  cy: Core | null
  eventBus: any
}

export class CommandExecutor {
  private context: CommandContext

  constructor(context: CommandContext) {
    this.context = context
  }

  execute(command: string): CommandResult {
    const parts = command.trim().split(/\s+/)
    const cmd = parts[0].toLowerCase()
    const args = parts.slice(1)

    switch (cmd) {
      case 'help':
        return this.showHelp()
      
      case 'create':
      case 'add':
        return this.createNode(args)
      
      case 'delete':
      case 'remove':
        return this.deleteElement(args)
      
      case 'connect':
      case 'link':
        return this.createEdge(args)
      
      case 'select':
        return this.selectElement(args)
      
      case 'clear':
        return this.clearGraph()
      
      case 'list':
        return this.listElements(args)
      
      case 'focus':
        return this.focusElement(args)
      
      case 'export':
        return this.exportHistory()
      
      default:
        return {
          success: false,
          message: `未知命令: ${cmd}。输入 'help' 查看帮助。`
        }
    }
  }

  private showHelp(): CommandResult {
    const help = `
可用命令：

节点操作：
  create <name> [type]        创建节点
  delete <name>               删除节点
  select <name>               选择节点
  focus <name>                聚焦到节点

边操作：
  connect <from> <to> [type]  创建边
  delete edge <from> <to>     删除边

图操作：
  clear                       清空图
  list [nodes|edges]          列出所有元素
  export                      导出历史记录为命令

示例：
  create MyClass class
  connect MyClass BaseClass inheritance
  select MyClass
  focus MyClass
  delete MyClass
`
    return {
      success: true,
      message: help
    }
  }

  private createNode(args: string[]): CommandResult {
    if (args.length === 0) {
      return {
        success: false,
        message: '用法: create <name> [type]'
      }
    }

    const name = args[0]
    const type = args[1] || 'class'

    this.context.eventBus?.emit('debugger:createVertex', { name, type })

    return {
      success: true,
      message: `已创建节点: ${name} (${type})`
    }
  }

  private deleteElement(args: string[]): CommandResult {
    if (args.length === 0) {
      return {
        success: false,
        message: '用法: delete <name> 或 delete edge <from> <to>'
      }
    }

    if (args[0].toLowerCase() === 'edge' && args.length >= 3) {
      // 删除边
      const from = args[1]
      const to = args[2]
      
      this.context.eventBus?.emit('debugger:deleteEdge', {
        source: from,
        target: to
      })

      return {
        success: true,
        message: `已删除边: ${from} -> ${to}`
      }
    } else {
      // 删除节点
      const name = args[0]
      
      this.context.eventBus?.emit('debugger:deleteVertex', { name })

      return {
        success: true,
        message: `已删除节点: ${name}`
      }
    }
  }

  private createEdge(args: string[]): CommandResult {
    if (args.length < 2) {
      return {
        success: false,
        message: '用法: connect <from> <to> [type]'
      }
    }

    const source = args[0]
    const target = args[1]
    const edgeType = args[2] || 'association'

    this.context.eventBus?.emit('debugger:createEdge', {
      source,
      target,
      edgeType
    })

    return {
      success: true,
      message: `已创建边: ${source} -> ${target} (${edgeType})`
    }
  }

  private selectElement(args: string[]): CommandResult {
    if (args.length === 0) {
      return {
        success: false,
        message: '用法: select <name>'
      }
    }

    const name = args[0]
    
    if (!this.context.cy) {
      return {
        success: false,
        message: '图未初始化'
      }
    }

    const node = this.context.cy.$id(name)
    if (node.length === 0) {
      return {
        success: false,
        message: `节点不存在: ${name}`
      }
    }

    this.context.eventBus?.emit('graph:selectNode', name)

    return {
      success: true,
      message: `已选择节点: ${name}`
    }
  }

  private clearGraph(): CommandResult {
    this.context.eventBus?.emit('debugger:clear')

    return {
      success: true,
      message: '已清空图'
    }
  }

  private listElements(args: string[]): CommandResult {
    if (!this.context.cy) {
      return {
        success: false,
        message: '图未初始化'
      }
    }

    const type = args[0]?.toLowerCase()

    if (!type || type === 'nodes') {
      const nodes = this.context.cy.nodes().map(n => n.id())
      return {
        success: true,
        message: `节点 (${nodes.length}):\n${nodes.join('\n')}`,
        data: nodes
      }
    } else if (type === 'edges') {
      const edges = this.context.cy.edges().map(e => 
        `${e.data('source')} -> ${e.data('target')} (${e.data('edgeType')})`
      )
      return {
        success: true,
        message: `边 (${edges.length}):\n${edges.join('\n')}`,
        data: edges
      }
    } else {
      return {
        success: false,
        message: '用法: list [nodes|edges]'
      }
    }
  }

  private focusElement(args: string[]): CommandResult {
    if (args.length === 0) {
      return {
        success: false,
        message: '用法: focus <name>'
      }
    }

    const name = args[0]
    
    if (!this.context.cy) {
      return {
        success: false,
        message: '图未初始化'
      }
    }

    const node = this.context.cy.$id(name)
    if (node.length === 0) {
      return {
        success: false,
        message: `节点不存在: ${name}`
      }
    }

    this.context.eventBus?.emit('graph:focusNode', name)

    return {
      success: true,
      message: `已聚焦到节点: ${name}`
    }
  }

  private exportHistory(): CommandResult {
    // 这个方法会被 GraphElementsPanel 调用来导出历史
    this.context.eventBus?.emit('command:exportHistory')

    return {
      success: true,
      message: '正在导出历史记录...'
    }
  }

  // 将历史记录项转换为命令
  static historyToCommand(item: any): string {
    const action = item.action
    const data = item.data

    switch (action) {
      case 'createVertex':
        return `create ${data.name} ${data.type || 'class'}`
      
      case 'deleteVertex':
        return `delete ${data.name}`
      
      case 'createEdge':
        return `connect ${data.source} ${data.target} ${data.edgeType || 'association'}`
      
      case 'deleteEdge':
        return `delete edge ${data.source} ${data.target}`
      
      case 'setParent':
        return `connect ${data.name} ${data.parent} inheritance`
      
      case 'clear':
        return 'clear'
      
      default:
        return `# ${action}: ${JSON.stringify(data)}`
    }
  }
}
