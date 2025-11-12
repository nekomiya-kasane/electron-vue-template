/**
 * GraphView Socket 集成（通过 Electron IPC）
 */

import { ref, onUnmounted, type Ref } from 'vue'
import { GraphMessageHandler } from './GraphMessageHandler'
import type { Core } from 'cytoscape'

export interface GraphSocketConfig {
  port: number
  host?: string
  autoStart?: boolean
  autoLayout?: boolean
  layoutName?: string
}

export function useGraphSocket(cy: Ref<Core | null>, config: GraphSocketConfig) {
  const isRunning = ref(false)
  const sessions = ref<any[]>([])
  const messageHandler = new GraphMessageHandler()
  const error = ref<string | null>(null)
  const serverName = 'graph-view'
  const autoLayout = ref(config.autoLayout ?? true)
  const layoutName = ref(config.layoutName || 'dagre')

  // 自动布局函数（增量式）
  const runLayout = () => {
    if (!cy.value || !autoLayout.value) return
    
    try {
      // 使用增量式布局，保持现有节点位置尽量稳定
      const layout = cy.value.layout({
        name: layoutName.value,
        animate: true,
        animationDuration: 500,
        animationEasing: 'ease-out',
        fit: false,  // 不自动适应视图，保持当前缩放
        padding: 30,
        // dagre 特定选项
        rankDir: 'TB',  // 从上到下
        nodeSep: 80,    // 节点间距
        edgeSep: 20,
        rankSep: 100,   // 层级间距
        // 增量式布局：只调整新节点位置
        randomize: false,  // 不随机化初始位置
        // cose 特定选项（如果使用 cose）
        nodeRepulsion: 400000,
        idealEdgeLength: 100,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
      } as any)
      
      layout.run()
    } catch (err) {
      console.error('Layout error:', err)
    }
  }

  // 更新 Cytoscape 实例
  const updateCytoscape = (newCy: Core | null) => {
    if (newCy) {
      messageHandler.setCytoscape(newCy)
    }
  }

  // 切换自动布局
  const toggleAutoLayout = (enabled: boolean) => {
    autoLayout.value = enabled
  }

  // 设置布局算法
  const setLayoutName = (name: string) => {
    layoutName.value = name
  }

  // 更新会话列表
  const updateSessions = async () => {
    if (isRunning.value && window.electronAPI?.socket) {
      try {
        sessions.value = await window.electronAPI.socket.getSessions(serverName)
      } catch (err) {
        console.error('Failed to get sessions:', err)
      }
    }
  }

  // 启动服务器
  const start = async () => {
    if (!window.electronAPI?.socket) {
      throw new Error('Electron API not available')
    }

    try {
      error.value = null

      // 设置 Cytoscape 实例
      if (cy.value) {
        messageHandler.setCytoscape(cy.value)
      }

      // 注册事件监听器
      window.electronAPI.socket.onConnection((data: any) => {
        console.log(`New session: ${data.session.id}`)
        updateSessions()
      })

      window.electronAPI.socket.onMessage(async (data: any) => {
        try {
          await messageHandler.handleMessage(data.message, data.session)
          
          // 如果是图操作命令，触发自动布局
          const cmd = data.message.command
          if (cmd.startsWith('meta-class:')) {
            // 延迟执行布局，避免频繁触发
            setTimeout(runLayout, 100)
          }
        } catch (err) {
          console.error('Error handling message:', err)
        }
      })

      window.electronAPI.socket.onDisconnection((data: any) => {
        console.log(`Session ended: ${data.session.id}`)
        updateSessions()
      })

      // 创建服务器
      const result = await window.electronAPI.socket.createServer(
        serverName,
        config.port,
        config.host || '0.0.0.0'
      )

      if (!result.success) {
        throw new Error(result.error || 'Failed to create server')
      }

      isRunning.value = true
      await updateSessions()
      console.log(`Graph socket server started on port ${config.port}`)
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to start socket server:', err)
      throw err
    }
  }

  // 停止服务器
  const stop = async () => {
    if (!window.electronAPI?.socket) {
      return
    }

    try {
      const result = await window.electronAPI.socket.stopServer(serverName)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to stop server')
      }

      isRunning.value = false
      sessions.value = []
      console.log('Graph socket server stopped')
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to stop socket server:', err)
      throw err
    }
  }

  // 获取服务器状态
  const getStatus = async () => {
    if (!window.electronAPI?.socket) {
      return null
    }
    return await window.electronAPI.socket.getStatus(serverName)
  }

  // 获取查询状态
  const getQueryState = () => {
    return messageHandler.getQueryState()
  }

  // 自动启动
  if (config.autoStart) {
    start().catch(err => {
      console.error('Auto-start failed:', err)
    })
  }

  // 清理
  onUnmounted(() => {
    if (window.electronAPI?.socket) {
      window.electronAPI.socket.removeAllListeners()
    }
    stop().catch(err => {
      console.error('Cleanup failed:', err)
    })
  })

  return {
    isRunning,
    sessions,
    error,
    autoLayout,
    layoutName,
    start,
    stop,
    updateCytoscape,
    toggleAutoLayout,
    setLayoutName,
    runLayout,
    getStatus,
    getQueryState
  }
}
