<template>
  <TitleBar />
  <div class="app-container">
    <h1>Hello World!</h1>
    <p>Vue app is running successfully! 🎉</p>
  </div>
</template>

<script setup lang="ts">
import TitleBar from './components/layout/TitleBar.vue'
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 32px); /* 减去 TitleBar 的高度 */
  font-family: Arial, sans-serif;
  background-color: #42b883;
}

h1 {
  color: #42b883;
  font-size: 3rem;
  margin-bottom: 1rem;
}

p {
  color: #35495e;
  font-size: 1.5rem;
}
</style>
