<template>
    <div class="title-bar" :style="{ height: props.height }">
        <div class="icon-area">
            <button class="icon-button" title="Menu">
                <span class="icon">📝</span>
            </button>
        </div>

        <div class="setting-area">

        </div>

        <div class="plugin-area">

        </div>

        <div class="window-controls-area">
            <button class="icon-button window-control-btn" @click="minimizeWindow" title="Minimize">
                <span class="icon">➖</span>
            </button>
            <button class="icon-button window-control-btn" @click="maximizeWindow" title="Maximize">
                <span class="icon">✳️</span>
            </button>
            <button class="icon-button window-control-btn close-btn" @click="closeWindow" title="Close">
                <span class="icon">❌</span>
            </button>
        </div>
    </div>
</template>

<script lang="ts" setup>
interface Property {
    height?: string
}

const props = withDefaults(defineProps<Property>(), {
    height: '1.5rem'
})

const minimizeWindow = () => {
    window.electronAPI?.window?.minimize();
}
const maximizeWindow = () => {
    window.electronAPI?.window?.maximize();
}
const closeWindow = () => {
    window.electronAPI?.window?.close();
}
</script>

<style scoped lang="scss">
.title-bar {
    display: flex;
    align-items: center;
    background: #ffffff;
    border-bottom: 1px solid #e3e5e7;
    flex-shrink: 0;
    -webkit-app-region: drag;

    .icon-area {
        display: flex;
        align-items: center;
        height: 100%;
        padding: 0 8px;
        flex-shrink: 0;
        -webkit-app-region: no-drag;

        .icon-button {
            background: none;
            border: none;
            aspect-ratio: 1;
            height: 70%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.15s ease;
            border-radius: 6px;

            &:hover {
                background: rgba(0, 0, 0, 0.06);
                transform: scale(1.08);
            }

            &:active {
                transform: scale(0.95);
            }

            .icon {
                font-size: clamp(14px, 1em, 20px);
                line-height: 1;
            }
        }
    }

    .setting-area {
        display: flex;
        justify-content: flex-start;
        height: 100%;
        overflow: hidden;
        -webkit-app-region: drag;
    }

    .plugin-area {
        flex: 1;
        display: flex;
        justify-content: flex-end;
        height: 100%;
        overflow: hidden;
        -webkit-app-region: drag;
    }

    .window-controls-area {
        display: flex;
        align-items: center;
        height: 100%;
        flex-shrink: 0;
        -webkit-app-region: no-drag;

        .icon-button {
            background: none;
            border: none;
            aspect-ratio: 1.4;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.15s ease;
            color: #5f6368;

            .icon {
                font-size: clamp(12px, 0.9em, 18px);
                line-height: 1;
            }

            &:hover {
                background: rgba(0, 0, 0, 0.06);
            }

            &:active {
                background: rgba(0, 0, 0, 0.1);
            }

            &.close-btn:hover {
                background: #e81123;
                color: white;

                .icon {
                    transform: scale(1.1);
                }
            }

            &.close-btn:active {
                background: #c50e1f;
            }
        }
    }
}
</style>