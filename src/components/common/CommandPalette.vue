<template>
  <div v-if="visible" class="command-palette-overlay" @click="handleOverlayClick">
    <div class="command-palette" @click.stop>
      <div class="command-header">
        <span class="command-title">命令面板</span>
        <button class="close-btn" @click="close">×</button>
      </div>
      
      <div class="command-input-wrapper">
        <span class="prompt">></span>
        <input
          ref="inputRef"
          v-model="command"
          type="text"
          class="command-input"
          placeholder="输入命令（help 查看帮助）"
          @keydown.enter="executeCommand"
          @keydown.esc="close"
          @keydown.up="navigateHistory(-1)"
          @keydown.down="navigateHistory(1)"
        />
      </div>
      
      <div class="command-output" ref="outputRef">
        <div
          v-for="(item, index) in output"
          :key="index"
          :class="['output-line', item.type]"
        >
          <span v-if="item.type === 'command'" class="prompt">></span>
          <span class="output-text">{{ item.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

interface OutputLine {
  text: string
  type: 'command' | 'success' | 'error' | 'info'
}

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'execute': [command: string]
}>()

const command = ref('')
const output = ref<OutputLine[]>([])
const inputRef = ref<HTMLInputElement | null>(null)
const outputRef = ref<HTMLElement | null>(null)
const commandHistory = ref<string[]>([])
const historyIndex = ref(-1)

// 当面板显示时聚焦输入框
watch(() => props.visible, (visible) => {
  if (visible) {
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

function close() {
  emit('update:visible', false)
}

function handleOverlayClick() {
  close()
}

function executeCommand() {
  const cmd = command.value.trim()
  if (!cmd) return
  
  // 添加到输出
  output.value.push({
    text: cmd,
    type: 'command'
  })
  
  // 添加到历史
  if (commandHistory.value[commandHistory.value.length - 1] !== cmd) {
    commandHistory.value.push(cmd)
  }
  historyIndex.value = commandHistory.value.length
  
  // 发送执行事件
  emit('execute', cmd)
  
  // 清空输入
  command.value = ''
  
  // 滚动到底部
  nextTick(() => {
    if (outputRef.value) {
      outputRef.value.scrollTop = outputRef.value.scrollHeight
    }
  })
}

function navigateHistory(direction: number) {
  if (commandHistory.value.length === 0) return
  
  historyIndex.value += direction
  
  if (historyIndex.value < 0) {
    historyIndex.value = 0
  } else if (historyIndex.value >= commandHistory.value.length) {
    historyIndex.value = commandHistory.value.length
    command.value = ''
    return
  }
  
  command.value = commandHistory.value[historyIndex.value] || ''
}

function addOutput(text: string, type: OutputLine['type'] = 'info') {
  output.value.push({ text, type })
  
  nextTick(() => {
    if (outputRef.value) {
      outputRef.value.scrollTop = outputRef.value.scrollHeight
    }
  })
}

function clearOutput() {
  output.value = []
}

defineExpose({
  addOutput,
  clearOutput
})
</script>

<style scoped>
.command-palette-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.command-palette {
  width: 600px;
  max-width: 90vw;
  max-height: 500px;
  background: #1e1e1e;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.command-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #333;
}

.command-title {
  color: #e0e0e0;
  font-size: 14px;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #333;
  color: #fff;
}

.command-input-wrapper {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #333;
}

.prompt {
  color: #4a9eff;
  margin-right: 8px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-weight: bold;
}

.command-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #e0e0e0;
  font-size: 14px;
  font-family: 'Consolas', 'Monaco', monospace;
}

.command-input::placeholder {
  color: #666;
}

.command-output {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.output-line {
  margin-bottom: 4px;
  display: flex;
  align-items: flex-start;
}

.output-line.command {
  color: #4a9eff;
}

.output-line.success {
  color: #4ec9b0;
}

.output-line.error {
  color: #f48771;
}

.output-line.info {
  color: #d4d4d4;
}

.output-text {
  white-space: pre-wrap;
  word-break: break-word;
}

/* 滚动条样式 */
.command-output::-webkit-scrollbar {
  width: 8px;
}

.command-output::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.command-output::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}

.command-output::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
