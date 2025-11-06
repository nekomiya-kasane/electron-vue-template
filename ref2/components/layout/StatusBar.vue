<template>
  <div class="status-bar">
    <div class="status-bar-section status-bar-left">
      <template v-for="item in leftItems" :key="item.id">
        <component 
          v-if="item.component" 
          :is="item.component" 
          v-bind="item.props"
          class="status-bar-item"
        />
        <span v-else class="status-bar-item status-bar-text">{{ item.text }}</span>
      </template>
    </div>
    
    <div class="status-bar-section status-bar-center">
      <template v-for="item in centerItems" :key="item.id">
        <component 
          v-if="item.component" 
          :is="item.component" 
          v-bind="item.props"
          class="status-bar-item"
        />
        <span v-else class="status-bar-item status-bar-text">{{ item.text }}</span>
      </template>
    </div>
    
    <div class="status-bar-section status-bar-right">
      <template v-for="item in rightItems" :key="item.id">
        <component 
          v-if="item.component" 
          :is="item.component" 
          v-bind="item.props"
          class="status-bar-item"
        />
        <span v-else class="status-bar-item status-bar-text">{{ item.text }}</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StatusBarItem } from '@/core/plugin/types'

const props = defineProps<{
  items: StatusBarItem[]
}>()

const leftItems = computed(() => 
  props.items.filter(item => item.position === 'left')
)

const centerItems = computed(() => 
  props.items.filter(item => item.position === 'center')
)

const rightItems = computed(() => 
  props.items.filter(item => item.position === 'right')
)
</script>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 24px;
  background: #f7f9fa;
  border-top: 1px solid #e3e5e7;
  padding: 0 8px;
  font-size: 12px;
  color: #5f6368;
  flex-shrink: 0;
}

.status-bar-section {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.status-bar-left {
  justify-content: flex-start;
  flex: 1;
}

.status-bar-center {
  justify-content: center;
  flex: 0 0 auto;
}

.status-bar-right {
  justify-content: flex-end;
  flex: 1;
}

.status-bar-item {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.status-bar-text {
  user-select: none;
}
</style>
