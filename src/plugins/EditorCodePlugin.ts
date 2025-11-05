import { defineAsyncComponent } from 'vue'
import type { Plugin, PluginContext } from '@/core/plugin'

/**
 * 代码编辑器插件
 * 提供 Monaco Editor 集成和代码编辑功能
 */
export const EditorCodePlugin: Plugin = {
  metadata: {
    id: 'editor-code',
    name: '代码编辑器',
    version: '1.0.0',
    description: 'Monaco Editor 集成，支持多种编程语言'
  },

  install(context: PluginContext) {
    // 注册代码文档类型
    context.registerDocumentType({
      id: 'code',
      name: '代码文件',
      extensions: [
        '.ts', '.tsx', '.js', '.jsx',
        '.json', '.html', '.css', '.scss', '.less',
        '.vue', '.md', '.yaml', '.yml',
        '.xml', '.sql', '.py', '.java',
        '.c', '.cpp', '.cs', '.go', '.rs',
        '.php', '.rb', '.sh', '.bat'
      ],
      icon: '📝'
    })

    // 注册主视图
    context.registerMainView({
      id: 'monaco-editor-view',
      component: defineAsyncComponent(() => import('@/components/views/MonacoEditorView.vue')),
      supportedDocumentTypes: ['code']
    })

    // 注册菜单项
    context.registerMenu({
      sections: [
        {
          title: '文件',
          items: [
            {
              id: 'new-code-file',
              label: '新建代码文件',
              icon: '📝',
              shortcut: 'Ctrl+N',
              action: () => {
                createNewCodeFile(context)
              }
            },
            {
              id: 'open-file',
              label: '打开文件',
              icon: '📂',
              shortcut: 'Ctrl+O',
              action: () => {
                // TODO: 实现文件打开对话框
                console.log('Open file dialog')
              }
            }
          ]
        },
        {
          title: '编辑',
          items: [
            {
              id: 'format-code',
              label: '格式化代码',
              icon: '✨',
              shortcut: 'Shift+Alt+F',
              action: () => {
                context.emit('editor:format')
              }
            },
            {
              id: 'find',
              label: '查找',
              icon: '🔍',
              shortcut: 'Ctrl+F',
              action: () => {
                context.emit('editor:find')
              }
            },
            {
              id: 'replace',
              label: '替换',
              icon: '🔄',
              shortcut: 'Ctrl+H',
              action: () => {
                context.emit('editor:replace')
              }
            }
          ]
        }
      ]
    })

    // 注册状态栏项
    context.registerStatusBarItem({
      id: 'editor-language',
      text: 'TypeScript',
      position: 'right',
      priority: 10
    })

    context.registerStatusBarItem({
      id: 'editor-position',
      text: 'Ln 1, Col 1',
      position: 'right',
      priority: 9
    })

    console.log('[EditorCodePlugin] Installed')
  },

  onActivate(_context: PluginContext) {
    console.log('[EditorCodePlugin] Activated')
  },

  onDeactivate(_context: PluginContext) {
    console.log('[EditorCodePlugin] Deactivated')
  }
}

/**
 * 创建新代码文件
 */
function createNewCodeFile(context: PluginContext) {
  const docId = `code-${Date.now()}`
  const doc = {
    id: docId,
    title: 'Untitled.ts',
    type: 'code',
    content: {
      code: '// 开始编写代码...\n',
      language: 'typescript'
    }
  }
  
  context.createDocument(doc)
  context.switchToDocument(docId)
  context.switchMainView('monaco-editor-view')
  
  console.log('[EditorCodePlugin] Created new code file:', docId)
}
