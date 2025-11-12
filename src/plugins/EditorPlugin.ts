import { defineAsyncComponent } from 'vue'
import type { Plugin, PluginContext } from '@/core/plugin'

/**
 * 编辑器插件
 * 提供文档编辑、大纲、反链等功能
 */
export const EditorPlugin: Plugin = {
  metadata: {
    id: 'editor',
    name: '编辑器',
    version: '1.0.0',
    description: '提供文档编辑和大纲功能',
    dependencies: ['document'] // 依赖文档插件
  },

  install(context: PluginContext) {
    // 注册文档类型
    context.registerDocumentType({
      id: 'markdown',
      name: 'Markdown 文档',
      extensions: ['.md', '.markdown'],
      icon: '📝'
    })

    // 注册右侧图标栏按钮（支持 markdown 文档）
    context.registerIconButton({
      id: 'outline',
      icon: '📋',
      title: '大纲',
      position: 'right'
    }, ['markdown'])

    context.registerIconButton({
      id: 'backlinks',
      icon: '🔗',
      title: '反链',
      position: 'right'
    }, ['markdown'])

    // 注册侧边栏（支持 markdown 文档）
    context.registerSidebar({
      id: 'outline',
      title: '大纲',
      position: 'right',
      component: defineAsyncComponent(() => import('@/components/panels/Outline.vue'))
    }, ['markdown'])

    context.registerSidebar({
      id: 'backlinks',
      title: '反链',
      position: 'right',
      component: defineAsyncComponent(() => import('@/components/panels/Backlinks.vue'))
    }, ['markdown'])

    // 注册主视图（编辑器）
    context.registerMainView({
      id: 'editor',
      component: defineAsyncComponent(() => import('@/components/views/EditorView.vue')),
      supportedDocumentTypes: ['markdown']
    })

    // 监听文档创建事件
    context.on('document:create', () => {
      console.log('[EditorPlugin] Creating new document')
      // 切换到编辑器视图
      context.switchMainView('editor', { title: '新建文档' })
    })

    // 注册状态栏项
    context.registerStatusBarItem({
      id: 'word-count',
      text: '字数: 0',
      position: 'left',
      priority: 10
    })

    context.registerStatusBarItem({
      id: 'cursor-position',
      text: '行 1, 列 1',
      position: 'right',
      priority: 10
    })

    context.registerStatusBarItem({
      id: 'encoding',
      text: 'UTF-8',
      position: 'right',
      priority: 5
    })

    // 创建默认文档
    const defaultDoc = {
      id: 'welcome',
      title: '欢迎使用',
      type: 'markdown',
      content: '# 欢迎使用\n\n开始编写你的文档...'
    }
    context.createDocument(defaultDoc)
    context.switchToDocument('welcome')

    // 默认激活大纲和编辑器
    context.activateSidebar('outline', 'right')
    context.switchMainView('editor', { title: '欢迎使用' })
  },

  onActivate(_context: PluginContext) {
    console.log('[EditorPlugin] Activated')
    // 可以在这里恢复编辑器状态
  },

  onDeactivate(_context: PluginContext) {
    console.log('[EditorPlugin] Deactivated')
    // 可以在这里保存编辑器状态
  }
}
