<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

import CloseIcon from '@/components/icons/close-icon.vue';
import TickIcon from '@/components/icons/tick-icon.vue';

interface MousePos {
  x: number;
  y: number;
}

export interface FloatingWindowProps {
  title?: string;
  resizable?: boolean;
  saveEnabled?: boolean;
}

export interface FloatingWindowEvents {
  (e: 'close'): void;
  (e: 'save'): void;
}

const { title = '', resizable = false, saveEnabled = true } = defineProps<FloatingWindowProps>();

const width = defineModel<number>('width', { required: false, default: 800 });
const height = defineModel<number>('height', { required: false, default: 600 });
const left = defineModel<number>('left', { required: false, default: 0 });
const top = defineModel<number>('top', { required: false, default: 0 });

const emit = defineEmits<FloatingWindowEvents>();

const componentRef = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

let isDragging = false;
let startDraggingPos: MousePos = { x: 0, y: 0 };

const onDragStart = (e: MouseEvent) => {
  isDragging = true;
  startDraggingPos = { x: e.pageX, y: e.pageY };
};

const onDrag = (e: MouseEvent) => {
  if (!isDragging) {
    return;
  }

  left.value += e.pageX - startDraggingPos.x;
  top.value += e.pageY - startDraggingPos.y;

  startDraggingPos = { x: e.pageX, y: e.pageY };
};

const onDragStop = () => {
  isDragging = false;
};

const style = computed(() => ({
  width: `${width.value}px`,
  height: `${height.value}px`,
  left: `${left.value}px`,
  top: `${top.value}px`,
}));

const onResize = (_entries: ResizeObserverEntry[], _observer: ResizeObserver) => {
  const rect = componentRef.value!.getBoundingClientRect();

  width.value = rect.width;
  height.value = rect.height;
};

const saveIconColor = computed(() => (saveEnabled ? '#ffffff' : '#e877e8'));

onMounted(() => {
  resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(componentRef.value!);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});
</script>

<template>
  <div
    ref="componentRef"
    class="floating-window"
    :class="{ 'floating-window-resizable': resizable }"
    :style="style"
  >
    <div
      @mousedown="onDragStart"
      @mousemove="onDrag"
      @mouseup="onDragStop"
      @mouseleave="onDragStop"
      class="title-bar"
    >
      <button :disabled="!saveEnabled" @click="() => emit('save')" class="title-bar-savebtn">
        <TickIcon :color="saveIconColor" />
      </button>
      <div class="title-bar-caption">{{ title }}</div>
      <button @click="() => emit('close')" class="title-bar-closebtn"><CloseIcon /></button>
    </div>
    <div class="floating-window-content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
* {
  --caption-bar-height: 25px;
}

.floating-window {
  display: flex;
  flex-direction: column;
  position: absolute;
  z-index: 1000;
}

.floating-window-resizable {
  overflow: auto;
  resize: both;
}

.title-bar {
  display: flex;
  flex-direction: row;
  height: var(--caption-bar-height);
  background-color: #9147ff;
}

.title-bar-caption {
  flex: 1 0 auto;
  text-align: center;
}

.title-bar-savebtn {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  margin-left: 5px;
}

.title-bar-closebtn {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.floating-window-content {
  display: flex;
  flex-direction: column;
  max-height: calc(100% - var(--caption-bar-height));
  flex: 1 0 auto;
}
</style>
