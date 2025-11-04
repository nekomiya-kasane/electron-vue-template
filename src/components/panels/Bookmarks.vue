<template>
  <div class="bookmarks">
    <div class="bookmark-item">
      <span class="bookmark-icon">⭐</span>
      <span class="bookmark-text">重要文档</span>
    </div>
    <div class="bookmark-item">
      <span class="bookmark-icon">⭐</span>
      <span class="bookmark-text">待办事项</span>
    </div>
  </div>
</template>

<style scoped>
.bookmarks {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bookmark-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.bookmark-item:hover {
  background: #e8eaed;
  transform: translateX(2px);
}

.bookmark-icon {
  font-size: 14px;
}

.bookmark-text {
  flex: 1;
  color: #202124;
}
</style>
