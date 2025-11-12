<template>
  <MainLayout v-if="true" />
  <div class="loading-layer" v-else>
    <div class="loading-spinner"></div>
    <div class="loading-text">加载插件中...</div>
  </div>
</template>

<script lang="ts" setup>
import MainLayout from './components/layout/MainLayout.vue'
</script>

<style scoped>
.loading-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

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
  justify-content: center;
  align-items: center;
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
