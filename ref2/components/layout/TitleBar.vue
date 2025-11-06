<template>
    <div class="title-bar">
        <button class="app-logo" @click="handleLogoClick" title="主菜单">
            <span class="logo-icon">📝</span>
        </button>
    </div>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue'

const emit = defineEmits<{
  menuClick: [event: { x: number; y: number }]
}>()

const handleLogoClick = (event: MouseEvent) => {
    const target = event.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    emit('menuClick', {
        x: rect.left,
        y: rect.bottom + 4
    })
}
</script>

<style scoped>
.title-bar {
    display: flex;
    align-items: center;
    height: 100%;
    width: 48px;
    flex-shrink: 0;
    -webkit-app-region: no-drag;
}

.app-logo {
    background: none;
    border: none;
    width: 40px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 6px;
    margin: 2px 4px;
}

.app-logo:hover {
    background: rgba(0, 0, 0, 0.08);
    transform: scale(1.05);
}

.logo-icon {
    font-size: 18px;
}
</style>