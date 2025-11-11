<template>
    <div class="title-bar" :style="{ height: props.height }">
        <div class="icon-area">
            <button class="icon-button" title="Menu">
                <span class="icon-logo">📝</span>
            </button>
        </div>

        <div class="tabs-area">

        </div>

        <div class="window-controls-area">
            <button class="window-control-btn" @click="minimizeWindow" title="Minimize">
                <span class="icon">−</span>
            </button>
            <button class="window-control-btn" @click="maximizeWindow" title="Maximize">
                <span class="icon">□</span>
            </button>
            <button class="window-control-btn close-btn" @click="closeWindow" title="Close">
                <span class="icon">×</span>
            </button>
        </div>
    </div>
</template>

<script lang="ts" setup>
interface Property {
    height?: string
}

const props = withDefaults(defineProps<Property>(), {
    height: '1rem'
})
</script>

<style scoped></style>