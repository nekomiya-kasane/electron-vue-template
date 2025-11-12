<template>
  <div class="monaco-editor-view">
    <MonacoEditor
      v-model="code"
      :language="language"
      :theme="editorTheme"
      :options="editorOptions"
      @save="handleSave"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MonacoEditor from '@/components/editor/MonacoEditor.vue'
import { settingsService } from '@/core/settings'
import { pluginManager } from '@/core/plugin'

const code = ref('// 开始编写代码...\nconsole.log("Hello World")\n')
const language = ref('typescript')

// 从设置中获取编辑器配置
const editorTheme = computed(() => {
  return settingsService.get('editor.theme') || 'vs-dark'
})

const editorOptions = computed(() => ({
  fontSize: settingsService.get('editor.fontSize') || 14,
  tabSize: settingsService.get('editor.tabSize') || 2,
  wordWrap: settingsService.get('editor.wordWrap') || 'on',
  minimap: {
    enabled: settingsService.get('editor.minimap.enabled') !== false
  }
}))

// 处理保存
function handleSave(value: string) {
  console.log('Saving code:', value.length, 'characters')
  pluginManager.getEventBus().emit('editor:saved', {
    language: language.value,
    code: value
  })
}

// 处理变化
function handleChange(_value: string) {
  // 可以在这里实现自动保存等功能
}

// 监听设置变化
onMounted(() => {
  settingsService.onDidChange('editor.theme', (value) => {
    console.log('Editor theme changed:', value)
  })
  
  settingsService.onDidChange('editor.fontSize', (value) => {
    console.log('Editor font size changed:', value)
  })
})
</script>

<style scoped>
.monaco-editor-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
}
</style>
