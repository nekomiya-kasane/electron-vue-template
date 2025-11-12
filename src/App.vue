<template>
  <MainLayout v-if="pluginsReady" />
  <div v-else class="loading">
    <div class="loading-spinner"></div>
    <div class="loading-text">加载插件中...</div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import MainLayout from './components/layout/MainLayout.vue'
import { initializePlugins } from './plugins'

const pluginsReady = ref(false)

onMounted(async () => {
  try {
    await initializePlugins()
    pluginsReady.value = true
  } catch (error) {
    console.error('Failed to initialize application:', error)
  }
})
</script>

<style lang="scss" scoped>
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #f7f9fa;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e3e5e7;
  border-top-color: #4a9eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: 16px;
  font-size: 14px;
  color: #5f6368;
}
</style>
