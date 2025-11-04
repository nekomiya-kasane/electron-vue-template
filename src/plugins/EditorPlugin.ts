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
    // 注册右侧图标栏按钮
    context.registerIconButton({
      id: 'outline',
      icon: '📋',
      title: '大纲',
      position: 'right'
    })

    context.registerIconButton({
      id: 'backlinks',
      icon: '🔗',
      title: '反链',
      position: 'right'
    })

    // 注册侧边栏
    context.registerSidebar({
      id: 'outline',
      title: '大纲',
      position: 'right',
      component: defineAsyncComponent(() => import('@/components/panels/Outline.vue'))
    })

    context.registerSidebar({
      id: 'backlinks',
      title: '反链',
      position: 'right',
      component: defineAsyncComponent(() => import('@/components/panels/Backlinks.vue'))
    })

    // 注册主视图（编辑器）
    context.registerMainView({
      id: 'editor',
      component: defineAsyncComponent(() => import('@/components/views/EditorView.vue'))
    })

    // 监听文档创建事件
    context.on('document:create', () => {
      console.log('[EditorPlugin] Creating new document')
      // 切换到编辑器视图
      context.switchMainView('editor', { title: '新建文档' })
    })

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
