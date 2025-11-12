<template>
  <div ref="editorContainer" class="monaco-editor-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as monaco from 'monaco-editor'

interface Props {
  modelValue?: string
  language?: string
  theme?: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light'
  readonly?: boolean
  options?: monaco.editor.IStandaloneEditorConstructionOptions
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  language: 'typescript',
  theme: 'vs-dark',
  readonly: false,
  options: () => ({})
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [value: string]
  'save': [value: string]
}>()

const editorContainer = ref<HTMLElement>()
let editor: monaco.editor.IStandaloneCodeEditor | null = null

onMounted(() => {
  if (!editorContainer.value) return

  // 创建编辑器
  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: props.language,
    theme: props.theme,
    readOnly: props.readonly,
    automaticLayout: true,
    minimap: {
      enabled: true
    },
    fontSize: 14,
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'on',
    lineNumbers: 'on',
    glyphMargin: true,
    folding: true,
    lineDecorationsWidth: 10,
    lineNumbersMinChars: 3,
    scrollBeyondLastLine: false,
    renderLineHighlight: 'all',
    contextmenu: true,
    mouseWheelZoom: true,
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    ...props.options
  })

  // 监听内容变化
  editor.onDidChangeModelContent(() => {
    const value = editor?.getValue() || ''
    emit('update:modelValue', value)
    emit('change', value)
  })

  // 监听保存快捷键 (Ctrl+S / Cmd+S)
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    const value = editor?.getValue() || ''
    emit('save', value)
  })
})

onUnmounted(() => {
  editor?.dispose()
})

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (editor && editor.getValue() !== newValue) {
    editor.setValue(newValue)
  }
})

// 监听语言变化
watch(() => props.language, (newLanguage) => {
  if (editor) {
    const model = editor.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, newLanguage)
    }
  }
})

// 监听主题变化
watch(() => props.theme, (newTheme) => {
  monaco.editor.setTheme(newTheme)
})

// 暴露编辑器实例方法
defineExpose({
  getEditor: () => editor,
  getValue: () => editor?.getValue() || '',
  setValue: (value: string) => editor?.setValue(value),
  focus: () => editor?.focus(),
  getPosition: () => editor?.getPosition(),
  setPosition: (position: monaco.IPosition) => editor?.setPosition(position),
  revealLine: (lineNumber: number) => editor?.revealLine(lineNumber),
  setSelection: (selection: monaco.ISelection) => editor?.setSelection(selection)
})
</script>

<style lang="scss" scoped>
.monaco-editor-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
