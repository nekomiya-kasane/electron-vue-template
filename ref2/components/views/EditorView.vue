<template>
  <div class="editor-view">
    <div class="editor-header">
      <input 
        type="text" 
        class="doc-title" 
        placeholder="无标题文档"
        :value="title"
        @input="updateTitle"
      />
    </div>
    <div class="editor-content">
      <div class="editor-placeholder" v-if="!content">
        在此处开始编写...
      </div>
      <div v-else class="editor-text">
        {{ content }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  title?: string
  content?: string
}>()

const title = ref(props.title || '')
const content = ref(props.content || '')

watch(() => props.title, (newTitle) => {
  title.value = newTitle || ''
})

watch(() => props.content, (newContent) => {
  content.value = newContent || ''
})

const updateTitle = (event: Event) => {
  title.value = (event.target as HTMLInputElement).value
}
</script>

<style scoped>
.editor-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.editor-header {
  padding: 20px 40px 10px;
  border-bottom: 1px solid #e3e5e7;
  flex-shrink: 0;
}

.doc-title {
  width: 100%;
  border: none;
  outline: none;
  font-size: 24px;
  font-weight: 600;
  color: #202124;
  padding: 8px 0;
}

.doc-title::placeholder {
  color: #dadce0;
}

.editor-content {
  flex: 1;
  padding: 20px 40px;
  overflow-y: auto;
  line-height: 1.8;
}

.editor-placeholder {
  color: #9aa0a6;
  font-size: 14px;
}

.editor-text {
  color: #202124;
  font-size: 14px;
  white-space: pre-wrap;
}
</style>
