import { defineAsyncComponent } from 'vue'
import type { Plugin, PluginContext } from '@/core/plugin'

/**
 * Graph 插件
 * 提供有向图可视化、会话管理和操作历史功能
 * 监听 type === 'QI' 的数据包并动态更新图
 */
export const GraphPlugin: Plugin = {
  metadata: {
    id: 'graph',
    name: 'Graph 可视化',
    version: '1.0.0',
    description: '有向图可视化和数据包监听'
  },

  install(context: PluginContext) {
    // 注册 QIViewer 文档类型
    context.registerDocumentType({
      id: 'QIViewer',
      name: 'QI 查看器',
      extensions: ['.qi', '.qiv'],
      icon: '📊'
    })

    // 注册左侧 Session 按钮和侧边栏
    context.registerIconButton({
      id: 'session',
      icon: '📊',
      title: 'Session',
      position: 'left'
    }, ['QIViewer'])

    context.registerSidebar({
      id: 'session',
      title: '会话管理',
      position: 'left',
      component: defineAsyncComponent(() => import('@/components/panels/SessionPanel.vue'))
    }, ['QIViewer'])

    // 注册右侧 History 按钮和侧边栏
    context.registerIconButton({
      id: 'history',
      icon: '📜',
      title: 'History',
      position: 'right'
    }, ['QIViewer'])

    context.registerSidebar({
      id: 'history',
      title: '操作历史',
      position: 'right',
      component: defineAsyncComponent(() => import('@/components/panels/HistoryPanel.vue'))
    }, ['QIViewer'])

    // 注册主视图（Graph 查看器）
    context.registerMainView({
      id: 'graph-viewer',
      component: defineAsyncComponent(() => import('@/components/views/GraphView.vue')),
      supportedDocumentTypes: ['QIViewer']
    })

    // 注册菜单项
    context.registerMenu({
      sections: [
        {
          title: 'Graph',
          items: [
            {
              id: 'new-graph',
              label: '新建图',
              icon: '📊',
              shortcut: 'Ctrl+Shift+G',
              action: () => {
                createNewGraph(context)
              }
            },
            {
              id: 'test-packet',
              label: '发送测试数据包',
              icon: '📦',
              action: () => {
                sendTestPacket(context)
              }
            },
            {
              id: 'auto-layout',
              label: '自动布局',
              icon: '🔄',
              action: () => {
                context.emit('graph:autoLayout')
              }
            },
            {
              id: 'clear-graph',
              label: '清空图',
              icon: '🗑️',
              action: () => {
                context.emit('graph:clear')
              }
            }
          ]
        }
      ]
    })

    // 注册状态栏项
    context.registerStatusBarItem({
      id: 'graph-status',
      text: 'Graph Ready',
      position: 'left',
      priority: 8
    })

    // 监听数据包
    context.on('data:packet', (packet: any) => {
      handleDataPacket(context, packet)
    })

    // 监听会话事件
    context.on('session:created', (session: any) => {
      console.log('[GraphPlugin] Session created:', session)
    })

    context.on('session:selected', (session: any) => {
      console.log('[GraphPlugin] Session selected:', session)
      // 可以在这里加载会话数据
    })

    // 监听历史重放
    context.on('history:replay', (item: any) => {
      console.log('[GraphPlugin] Replaying history:', item)
      if (item.data) {
        context.emit('data:packet', item.data)
      }
    })

    console.log('[GraphPlugin] Installed')
  },

  onActivate(context: PluginContext) {
    console.log('[GraphPlugin] Activated')
    
    // 创建默认的 QIViewer 文档
    const defaultDoc = {
      id: 'qi-viewer-default',
      title: 'QI Viewer',
      type: 'QIViewer',
      content: { nodes: [], edges: [] }
    }
    context.createDocument(defaultDoc)
    context.switchToDocument('qi-viewer-default')
    
    // 切换到 Graph 查看器
    context.switchMainView('graph-viewer')
    
    // 默认打开 Session 和 History 侧边栏
    context.activateSidebar('session', 'left')
    context.activateSidebar('history', 'right')
  },

  onDeactivate(_context: PluginContext) {
    console.log('[GraphPlugin] Deactivated')
  }
}

/**
 * 创建新图
 */
function createNewGraph(context: PluginContext) {
  const docId = `qi-viewer-${Date.now()}`
  const doc = {
    id: docId,
    title: `QI Viewer ${new Date().toLocaleTimeString()}`,
    type: 'QIViewer',
    content: { nodes: [], edges: [] }
  }
  
  context.createDocument(doc)
  context.switchToDocument(docId)
  context.switchMainView('graph-viewer')
  
  console.log('[GraphPlugin] Created new graph:', docId)
}

/**
 * 发送测试数据包
 */
function sendTestPacket(context: PluginContext) {
  const testPackets = [
    {
      type: 'QI',
      action: 'addNode',
      id: `node-${Date.now()}`,
      label: `Node ${Math.floor(Math.random() * 100)}`,
      color: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'][Math.floor(Math.random() * 4)]
    },
    {
      type: 'QI',
      action: 'addEdge',
      id: `edge-${Date.now()}`,
      source: 'A',
      target: 'B',
      label: 'test edge',
      color: '#666'
    },
    {
      type: 'QI',
      action: 'tempHighlight',
      nodeId: 'A',
      duration: 2000
    }
  ]

  const packet = testPackets[Math.floor(Math.random() * testPackets.length)]
  context.emit('data:packet', packet)
  
  console.log('[GraphPlugin] Sent test packet:', packet)
}

/**
 * 处理数据包
 */
function handleDataPacket(context: PluginContext, packet: any) {
  // 只处理 QI 类型的数据包
  if (packet.type !== 'QI') return

  console.log('[GraphPlugin] Received QI packet:', packet)

  // 触发图更新事件
  if (packet.action === 'addNode') {
    context.emit('graph:nodeAdded', {
      id: packet.id,
      label: packet.label,
      color: packet.color
    })
  } else if (packet.action === 'addEdge') {
    context.emit('graph:edgeAdded', {
      id: packet.id,
      source: packet.source,
      target: packet.target,
      label: packet.label,
      color: packet.color
    })
  } else if (packet.action === 'highlight' || packet.action === 'tempHighlight') {
    context.emit('graph:highlighted', {
      nodeId: packet.nodeId,
      duration: packet.duration
    })
  }
}
