<template>
  <div class="setting-item">
    <div class="setting-header">
      <label class="setting-label">{{ definition.title }}</label>
      <button 
        v-if="!isDefault" 
        @click="resetToDefault" 
        class="reset-btn"
        title="重置为默认值"
      >
        ↺
      </button>
    </div>
    <div v-if="definition.description" class="setting-description">
      {{ definition.description }}
    </div>
    
    <!-- 字符串输入 -->
    <input
      v-if="definition.type === 'string'"
      v-model="localValue"
      type="text"
      class="setting-input"
      :placeholder="String(definition.default)"
      @blur="updateValue"
    />
    
    <!-- 数字输入 -->
    <div v-else-if="definition.type === 'number'" class="number-input-group">
      <input
        v-model.number="localValue"
        type="number"
        class="setting-input"
        :min="definition.minimum"
        :max="definition.maximum"
        :placeholder="String(definition.default)"
        @blur="updateValue"
      />
      <input
        v-if="definition.minimum !== undefined && definition.maximum !== undefined"
        v-model.number="localValue"
        type="range"
        class="setting-range"
        :min="definition.minimum"
        :max="definition.maximum"
        @input="updateValue"
      />
    </div>
    
    <!-- 布尔开关 -->
    <label v-else-if="definition.type === 'boolean'" class="setting-switch">
      <input
        v-model="localValue"
        type="checkbox"
        @change="updateValue"
      />
      <span class="switch-slider"></span>
    </label>
    
    <!-- 枚举下拉 -->
    <select
      v-else-if="definition.type === 'enum'"
      v-model="localValue"
      class="setting-select"
      @change="updateValue"
    >
      <option
        v-for="(option, index) in definition.enum"
        :key="option"
        :value="option"
      >
        {{ definition.enumDescriptions?.[index] || option }}
      </option>
    </select>
    
    <!-- 对象/数组 - 显示 JSON -->
    <div v-else-if="definition.type === 'object' || definition.type === 'array'" class="json-editor">
      <textarea
        v-model="jsonValue"
        class="setting-textarea"
        rows="5"
        @blur="updateJsonValue"
      ></textarea>
      <div v-if="jsonError" class="error-message">{{ jsonError }}</div>
    </div>
    
    <div v-if="definition.deprecated" class="deprecated-message">
      ⚠️ {{ definition.deprecationMessage || '此设置已弃用' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { SettingDefinition } from '@/core/settings'

interface Props {
  definition: SettingDefinition
  value: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update': [value: any]
}>()

const localValue = ref(props.value)
const jsonValue = ref('')
const jsonError = ref('')

// 判断是否为默认值
const isDefault = computed(() => {
  return JSON.stringify(localValue.value) === JSON.stringify(props.definition.default)
})

// 初始化 JSON 值
if (props.definition.type === 'object' || props.definition.type === 'array') {
  jsonValue.value = JSON.stringify(props.value, null, 2)
}

// 监听外部值变化
watch(() => props.value, (newValue) => {
  localValue.value = newValue
  if (props.definition.type === 'object' || props.definition.type === 'array') {
    jsonValue.value = JSON.stringify(newValue, null, 2)
  }
})

// 更新值
function updateValue() {
  emit('update', localValue.value)
}

// 更新 JSON 值
function updateJsonValue() {
  try {
    const parsed = JSON.parse(jsonValue.value)
    localValue.value = parsed
    jsonError.value = ''
    emit('update', parsed)
  } catch (error) {
    jsonError.value = '无效的 JSON 格式'
  }
}

// 重置为默认值
function resetToDefault() {
  localValue.value = props.definition.default
  if (props.definition.type === 'object' || props.definition.type === 'array') {
    jsonValue.value = JSON.stringify(props.definition.default, null, 2)
  }
  updateValue()
}
</script>

<style lang="scss" scoped>
.setting-item {
  padding: 16px 0;
  border-bottom: 1px solid #e3e5e7;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.setting-label {
  font-size: 13px;
  font-weight: 500;
  color: #202124;
}

.reset-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid #e3e5e7;
  border-radius: 4px;
  color: #5f6368;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: #f0f4f8;
  border-color: #c5cdd5;
  color: #202124;
}

.setting-description {
  font-size: 12px;
  color: #5f6368;
  margin-bottom: 12px;
  line-height: 1.5;
}

.setting-input,
.setting-select,
.setting-textarea {
  width: 100%;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e3e5e7;
  border-radius: 6px;
  font-size: 13px;
  color: #202124;
  transition: all 0.2s;
}

.setting-input:focus,
.setting-select:focus,
.setting-textarea:focus {
  outline: none;
  border-color: #4a9eff;
  box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.1);
}

.number-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-range {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #e3e5e7;
  outline: none;
  -webkit-appearance: none;
}

.setting-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4a9eff;
  cursor: pointer;
  transition: all 0.2s;
}

.setting-range::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.setting-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;
}

.setting-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  border-radius: 24px;
  transition: 0.3s;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
}

.setting-switch input:checked + .switch-slider {
  background-color: #4a9eff;
}

.setting-switch input:checked + .switch-slider:before {
  transform: translateX(20px);
}

.json-editor {
  position: relative;
}

.setting-textarea {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  resize: vertical;
}

.error-message {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  color: #c33;
  font-size: 12px;
}

.deprecated-message {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  color: #856404;
  font-size: 12px;
}
</style>
