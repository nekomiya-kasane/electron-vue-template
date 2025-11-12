import { defineAsyncComponent } from 'vue'
import type { Plugin, PluginContext } from '@/core/plugin'
import { settingsService } from '@/core/settings'

/**
 * 设置插件
 * 提供应用程序设置管理功能
 */
export const SettingsPlugin: Plugin = {
  metadata: {
    id: 'settings',
    name: '设置',
    version: '1.0.0',
    description: '应用程序设置管理'
  },

  install(context: PluginContext) {
    // 注册设置按钮
    context.registerIconButton({
      id: 'settings',
      icon: '⚙️',
      title: 'Settings',
      position: 'right'
    })

    // 注册设置侧边栏
    context.registerSidebar({
      id: 'settings',
      title: '设置',
      position: 'right',
      component: defineAsyncComponent(() => import('@/components/settings/SettingsView.vue'))
    })

    // 注册默认设置
    registerDefaultSettings()

    // 注册菜单项
    context.registerMenu({
      sections: [
        {
          title: '设置',
          items: [
            {
              id: 'open-settings',
              label: '打开设置',
              icon: '⚙️',
              shortcut: 'Ctrl+,',
              action: () => {
                context.activateSidebar('settings', 'right')
              }
            },
            {
              id: 'reset-settings',
              label: '重置所有设置',
              icon: '↺',
              action: () => {
                if (confirm('确定要重置所有设置吗？')) {
                  settingsService.resetAll('user')
                }
              }
            }
          ]
        }
      ]
    })

    console.log('[SettingsPlugin] Installed')
  },

  onActivate(_context: PluginContext) {
    console.log('[SettingsPlugin] Activated')
  },

  onDeactivate(_context: PluginContext) {
    console.log('[SettingsPlugin] Deactivated')
  }
}

/**
 * 注册默认设置
 */
function registerDefaultSettings() {
  // 编辑器设置
  settingsService.registerSettings([
    {
      key: 'editor.fontSize',
      type: 'number',
      default: 14,
      title: '字体大小',
      description: '编辑器字体大小（像素）',
      category: '编辑器',
      minimum: 8,
      maximum: 72,
      order: 1
    },
    {
      key: 'editor.tabSize',
      type: 'number',
      default: 2,
      title: 'Tab 大小',
      description: 'Tab 键对应的空格数',
      category: '编辑器',
      minimum: 1,
      maximum: 8,
      order: 2
    },
    {
      key: 'editor.theme',
      type: 'enum',
      default: 'vs-dark',
      enum: ['vs', 'vs-dark', 'hc-black', 'hc-light'],
      enumDescriptions: ['浅色', '深色', '高对比度深色', '高对比度浅色'],
      title: '编辑器主题',
      description: 'Monaco Editor 主题',
      category: '编辑器',
      order: 3
    },
    {
      key: 'editor.minimap.enabled',
      type: 'boolean',
      default: true,
      title: '显示小地图',
      description: '在编辑器右侧显示代码小地图',
      category: '编辑器',
      order: 4
    },
    {
      key: 'editor.wordWrap',
      type: 'enum',
      default: 'on',
      enum: ['off', 'on', 'wordWrapColumn', 'bounded'],
      enumDescriptions: ['关闭', '开启', '在列处换行', '限制换行'],
      title: '自动换行',
      description: '控制编辑器是否自动换行',
      category: '编辑器',
      order: 5
    }
  ])

  // 图视图设置
  settingsService.registerSettings([
    {
      key: 'graph.defaultLayout',
      type: 'enum',
      default: 'cose',
      enum: ['dagre', 'circle', 'cola', 'grid', 'concentric', 'breadthfirst', 'cose'],
      enumDescriptions: ['层次布局', '圆形布局', '力导向布局', '网格布局', '同心圆布局', '广度优先布局', 'CoSE 布局'],
      title: '默认布局',
      description: '图的默认布局算法',
      category: '图视图',
      order: 1
    },
    {
      key: 'graph.nodeColor',
      type: 'string',
      default: '#4CAF50',
      title: '节点颜色',
      description: '默认节点颜色（十六进制）',
      category: '图视图',
      pattern: '^#[0-9A-Fa-f]{6}$',
      order: 2
    },
    {
      key: 'graph.edgeColor',
      type: 'string',
      default: '#666',
      title: '边颜色',
      description: '默认边颜色（十六进制）',
      category: '图视图',
      pattern: '^#[0-9A-Fa-f]{6}$',
      order: 3
    },
    {
      key: 'graph.showGrid',
      type: 'boolean',
      default: true,
      title: '显示网格',
      description: '在图视图中显示背景网格',
      category: '图视图',
      order: 4
    },
    {
      key: 'graph.showRuler',
      type: 'boolean',
      default: true,
      title: '显示标尺',
      description: '在图视图中显示坐标标尺',
      category: '图视图',
      order: 5
    },
    {
      key: 'graph.animationDuration',
      type: 'number',
      default: 500,
      title: '动画时长',
      description: '布局动画时长（毫秒）',
      category: '图视图',
      minimum: 0,
      maximum: 5000,
      order: 6
    }
  ])

  // UI 设置
  settingsService.registerSettings([
    {
      key: 'ui.theme',
      type: 'enum',
      default: 'light',
      enum: ['light', 'dark', 'auto'],
      enumDescriptions: ['浅色', '深色', '跟随系统'],
      title: '应用主题',
      description: '应用程序整体主题',
      category: 'UI',
      order: 1
    },
    {
      key: 'ui.fontSize',
      type: 'number',
      default: 12,
      title: 'UI 字体大小',
      description: '界面字体大小（像素）',
      category: 'UI',
      minimum: 10,
      maximum: 20,
      order: 2
    },
    {
      key: 'ui.compactMode',
      type: 'boolean',
      default: false,
      title: '紧凑模式',
      description: '使用更紧凑的界面布局',
      category: 'UI',
      order: 3
    },
    {
      key: 'ui.sidebarPosition',
      type: 'enum',
      default: 'left',
      enum: ['left', 'right'],
      enumDescriptions: ['左侧', '右侧'],
      title: '侧边栏位置',
      description: '主侧边栏的默认位置',
      category: 'UI',
      order: 4
    }
  ])

  // 插件设置
  settingsService.registerSettings([
    {
      key: 'plugin.autoLoad',
      type: 'boolean',
      default: true,
      title: '自动加载插件',
      description: '启动时自动加载所有已安装的插件',
      category: '插件',
      order: 1
    },
    {
      key: 'plugin.checkUpdates',
      type: 'boolean',
      default: true,
      title: '检查更新',
      description: '自动检查插件更新',
      category: '插件',
      order: 2
    },
    {
      key: 'plugin.devMode',
      type: 'boolean',
      default: false,
      title: '开发者模式',
      description: '启用插件开发者工具',
      category: '插件',
      order: 3
    }
  ])

  // 高级设置
  settingsService.registerSettings([
    {
      key: 'advanced.enableLogging',
      type: 'boolean',
      default: true,
      title: '启用日志',
      description: '记录应用程序日志',
      category: '高级',
      order: 1
    },
    {
      key: 'advanced.logLevel',
      type: 'enum',
      default: 'info',
      enum: ['debug', 'info', 'warn', 'error'],
      enumDescriptions: ['调试', '信息', '警告', '错误'],
      title: '日志级别',
      description: '日志记录级别',
      category: '高级',
      order: 2
    },
    {
      key: 'advanced.maxHistorySize',
      type: 'number',
      default: 100,
      title: '最大历史记录',
      description: '保留的最大历史记录数',
      category: '高级',
      minimum: 10,
      maximum: 1000,
      order: 3
    }
  ])
}
