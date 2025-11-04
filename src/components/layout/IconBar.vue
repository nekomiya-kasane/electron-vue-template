<template>
  <div class="icon-bar" :class="position">
    <div class="icon-bar-items">
      <button
        v-for="item in items"
        :key="item.id"
        class="icon-bar-btn"
        :class="{ active: activeId === item.id }"
        :title="item.title"
        @click="handleClick(item.id)"
      >
        <span class="icon">{{ item.icon }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

export interface IconBarItem {
  id: string
  icon: string
  title: string
}

defineProps<{
  items: IconBarItem[]
  activeId?: string
  position: 'left' | 'right'
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const handleClick = (id: string) => {
  emit('select', id)
}
</script>

<style scoped>
.icon-bar {
  display: flex;
  flex-direction: column;
  background: #2c2c2c;
  width: 48px;
  flex-shrink: 0;
  height: 100%;
}

.icon-bar.left {
  border-right: 1px solid #1a1a1a;
}

.icon-bar.right {
  border-left: 1px solid #1a1a1a;
}

.icon-bar-items {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  gap: 4px;
}

.icon-bar-btn {
  background: none;
  border: none;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  color: #9aa0a6;
  border-radius: 8px;
  margin: 0 4px;
}

.icon-bar-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: scale(1.05);
}

.icon-bar-btn.active {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.icon-bar-btn.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: #4a9eff;
  border-radius: 0 2px 2px 0;
}

.icon-bar.right .icon-bar-btn.active::before {
  left: auto;
  right: 0;
  border-radius: 2px 0 0 2px;
}

.icon {
  font-size: 20px;
}
</style>
