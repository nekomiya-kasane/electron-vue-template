<template>
  <div class="test-container">
    <h2>可折叠面板系统测试</h2>
    
    <ResizablePanelGroup>
      <!-- 测试面板 1 -->
      <CollapsiblePanel 
        title="测试面板 1" 
        :default-collapsed="false"
        class="test-panel-1"
      >
        <template #actions>
          <button @click="panel1Count++" class="action-btn">
            计数: {{ panel1Count }}
          </button>
        </template>
        
        <div class="panel-content">
          <p>这是第一个测试面板的内容</p>
          <ul>
            <li v-for="i in 10" :key="i">测试项目 {{ i }}</li>
          </ul>
        </div>
      </CollapsiblePanel>

      <!-- 测试面板 2 -->
      <CollapsiblePanel 
        title="测试面板 2" 
        :default-collapsed="false"
        class="test-panel-2"
      >
        <div class="panel-content">
          <p>这是第二个测试面板的内容</p>
          <div class="test-box">
            <h4>可以拖动上方的分隔条调整大小</h4>
            <p>点击面板标题可以折叠/展开</p>
          </div>
        </div>
      </CollapsiblePanel>

      <!-- 测试面板 3 -->
      <CollapsiblePanel 
        title="测试面板 3" 
        :default-collapsed="false"
        class="test-panel-3"
      >
        <div class="panel-content">
          <p>这是第三个测试面板的内容</p>
          <textarea 
            v-model="testText" 
            placeholder="输入一些文本..."
            class="test-textarea"
          ></textarea>
        </div>
      </CollapsiblePanel>
    </ResizablePanelGroup>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CollapsiblePanel from '@/components/common/CollapsiblePanel.vue'
import ResizablePanelGroup from '@/components/common/ResizablePanelGroup.vue'

const panel1Count = ref(0)
const testText = ref('')
</script>

<style lang="scss" scoped>
.test-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #f5f5f5;
}

.test-container h2 {
  margin: 0 0 20px 0;
  color: #202124;
}

.test-panel-1 {
  flex: 0 0 200px;
  min-height: 100px;
}

.test-panel-2 {
  flex: 1;
  min-height: 150px;
}

.test-panel-3 {
  flex: 1;
  min-height: 150px;
}

.panel-content {
  padding: 16px;
}

.panel-content p {
  margin: 0 0 12px 0;
  color: #5f6368;
  font-size: 14px;
}

.panel-content ul {
  margin: 0;
  padding-left: 20px;
}

.panel-content li {
  margin: 4px 0;
  color: #5f6368;
  font-size: 13px;
}

.action-btn {
  padding: 4px 8px;
  font-size: 11px;
  background: #4a9eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #3d7fd8;
}

.test-box {
  padding: 16px;
  background: #e3f2fd;
  border-radius: 8px;
  border: 1px solid #90caf9;
}

.test-box h4 {
  margin: 0 0 8px 0;
  color: #1976d2;
  font-size: 14px;
}

.test-box p {
  margin: 0;
  color: #1565c0;
  font-size: 13px;
}

.test-textarea {
  width: 100%;
  min-height: 100px;
  padding: 8px;
  border: 1px solid #e3e5e7;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  resize: vertical;
}

.test-textarea:focus {
  outline: none;
  border-color: #4a9eff;
}
</style>
