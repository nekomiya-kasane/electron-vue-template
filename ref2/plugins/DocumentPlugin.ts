import { defineAsyncComponent } from 'vue'
import type { Plugin, PluginContext } from '@/core/plugin'

/**
 * 文档管理插件
 * 提供文档树、书签、标签等功能
 */
export const DocumentPlugin: Plugin = {
  metadata: {
    id: 'document',
    name: '文档管理',
    version: '1.0.0',
    description: '提供文档树、书签、标签管理功能'
  },

  install(context: PluginContext) {
    // 注册左侧图标栏按钮
    context.registerIconButton({
      id: 'doc-tree',
      icon: '📁',
      title: '文档树',
      position: 'left'
    })

    context.registerIconButton({
      id: 'bookmarks',
      icon: '⭐',
      title: '书签',
      position: 'left'
    })

    context.registerIconButton({
      id: 'tags',
      icon: '🏷️',
      title: '标签',
      position: 'left'
    })

    // 注册侧边栏
    context.registerSidebar({
      id: 'doc-tree',
      title: '文档树',
      position: 'left',
      component: defineAsyncComponent(() => import('@/components/panels/DocTree.vue'))
    })

    context.registerSidebar({
      id: 'bookmarks',
      title: '书签',
      position: 'left',
      component: defineAsyncComponent(() => import('@/components/panels/Bookmarks.vue'))
    })

    context.registerSidebar({
      id: 'tags',
      title: '标签',
      position: 'left',
      component: defineAsyncComponent(() => import('@/components/panels/Tags.vue'))
    })

    // 注册菜单
    context.registerMenu({
      sections: [
        {
          items: [
            { id: 'new-doc', label: '新建文档', icon: '📄', shortcut: 'Ctrl+N', action: () => {
              context.emit('document:create')
            }},
            { id: 'new-notebook', label: '新建笔记本', icon: '📁', action: () => {
              context.emit('notebook:create')
            }}
          ]
        },
        {
          items: [
            { id: 'open', label: '打开', icon: '📂', shortcut: 'Ctrl+O' },
            { id: 'recent', label: '最近打开', icon: '🕒', submenu: [
              { id: 'recent-1', label: '文档 1' },
              { id: 'recent-2', label: '文档 2' }
            ]}
          ]
        }
      ]
    })

    // 默认激活文档树
    context.activateSidebar('doc-tree', 'left')
  },

  onActivate(_context: PluginContext) {
    console.log('[DocumentPlugin] Activated')
  },

  onDeactivate(_context: PluginContext) {
    console.log('[DocumentPlugin] Deactivated')
  }
}
