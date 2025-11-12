<template>
  <div class="collapsible-panel" :class="{ collapsed: isCollapsed }">
    <div class="panel-header" @click="toggleCollapse">
      <div class="panel-title">
        <slot name="icon"></slot>
        <h3>{{ title }}</h3>
      </div>
      <div class="panel-actions">
        <slot name="actions"></slot>
        <button class="collapse-btn" :title="isCollapsed ? '展开' : '折叠'">
          {{ isCollapsed ? '▶' : '▼' }}
        </button>
      </div>
    </div>
    <div v-show="!isCollapsed" class="panel-content" ref="contentRef">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'

interface Props {
  title: string
  defaultCollapsed?: boolean
  collapsible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultCollapsed: false,
  collapsible: true
})

const emit = defineEmits<{
  'update:collapsed': [value: boolean]
  'collapse': []
  'expand': []
  'layout-change': []
}>()

const isCollapsed = ref(props.defaultCollapsed)
const contentRef = ref<HTMLElement | null>(null)

function toggleCollapse() {
  if (!props.collapsible) return
  
  isCollapsed.value = !isCollapsed.value
  emit('update:collapsed', isCollapsed.value)
  
  if (isCollapsed.value) {
    emit('collapse')
  } else {
    emit('expand')
  }
  
  // 通知父组件重新计算布局
  nextTick(() => {
    emit('layout-change')
  })
}

// 暴露方法供外部调用
defineExpose({
  collapse: () => {
    isCollapsed.value = true
    emit('update:collapsed', true)
    emit('collapse')
    nextTick(() => {
      emit('layout-change')
    })
  },
  expand: () => {
    isCollapsed.value = false
    emit('update:collapsed', false)
    emit('expand')
    nextTick(() => {
      emit('layout-change')
    })
  },
  toggle: toggleCollapse,
  isCollapsed: () => isCollapsed.value
})
</script>

<style lang="scss" scoped>
.collapsible-panel {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #e3e5e7;
  background: #ffffff;
  transition: height 0.25s cubic-bezier(0.4, 0, 0.2, 1), 
              flex 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex: 1;
  min-height: 0;
  overflow: hidden;

  &.collapsed {
    flex: 0 0 auto;
    min-height: 0;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e3e5e7;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
  flex-shrink: 0;

  &:hover {
    background: #e9ecef;
  }
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;

  h3 {
    font-size: 13px;
    font-weight: 600;
    color: #202124;
    margin: 0;
  }
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  font-size: 10px;
  color: #5f6368;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 3px;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #202124;
  }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}
</style>
