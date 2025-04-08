<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';

import CloseIcon from '@/components/icons/close-icon.vue';

interface MousePos {
  x: number;
  y: number;
}

export interface FloatingWindowProps {
  title?: string;
  resizable?: boolean;
}

export interface FloatingWindowEvents {
  (e: 'close'): void;
}

const { title = '', resizable = false } = defineProps<FloatingWindowProps>();

const width = defineModel<number>('width', { required: false, default: 800 });
const height = defineModel<number>('height', { required: false, default: 600 });
const left = defineModel<number>('left', { required: false, default: 0 });
const top = defineModel<number>('top', { required: false, default: 0 });

const emit = defineEmits<FloatingWindowEvents>();

const componentRef = ref<HTMLElement | null>(null);

let startTitleDraggingPos: MousePos = { x: 0, y: 0 };
let startResizehandleDraggingPos: MousePos = { x: 0, y: 0 };

const minWidth = 800;
const minHeight = 600;

const onTitleDragStart = (e: MouseEvent) => {
  startTitleDraggingPos = { x: e.pageX, y: e.pageY };

  document.addEventListener('mouseup', onTitleDragStop);
  document.addEventListener('mousemove', onTitleDrag);
};

const onTitleDrag = (e: MouseEvent) => {
  left.value += e.pageX - startTitleDraggingPos.x;
  top.value += e.pageY - startTitleDraggingPos.y;

  startTitleDraggingPos = { x: e.pageX, y: e.pageY };
};

const onTitleDragStop = () => {
  document.removeEventListener('mousemove', onTitleDrag);
  document.removeEventListener('mouseup', onTitleDragStop);
};

const onResizeStart = (e: MouseEvent) => {
  startResizehandleDraggingPos = { x: e.pageX, y: e.pageY };

  document.addEventListener('mouseup', onResizeStop);
  document.addEventListener('mousemove', onResize);
};

const onResize = (e: MouseEvent) => {
  const newWidth = width.value + e.pageX - startResizehandleDraggingPos.x;
  const newHeight = height.value + e.pageY - startResizehandleDraggingPos.y;

  if (newWidth > minWidth) {
    width.value = newWidth;

    startResizehandleDraggingPos.x = e.pageX;
  }

  if (newHeight >= minHeight) {
    height.value = newHeight;

    startResizehandleDraggingPos.y = e.pageY;
  }
};

const onResizeStop = () => {
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', onResizeStop);
};

const style = computed(() => ({
  width: `${width.value}px`,
  height: `${height.value}px`,
  left: `${left.value}px`,
  top: `${top.value}px`,
}));

onUnmounted(() => {
  document.removeEventListener('mousemove', onTitleDrag);
  document.removeEventListener('mouseup', onTitleDragStop);

  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', onResizeStop);
});
</script>

<template>
  <div ref="componentRef" class="floating-window" :style="style">
    <div @mousedown="onTitleDragStart" class="title-bar">
      <slot name="title-bar"></slot>
      <div class="title-bar-caption">{{ title }}</div>
      <button @click="() => emit('close')" class="title-bar-closebtn"><CloseIcon /></button>
    </div>
    <div class="floating-window-content">
      <slot></slot>
    </div>
    <div v-if="resizable" @mousedown="onResizeStart" class="resize-handle"></div>
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
  background-color: var(--color-background-base);
}

.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-top: 15px solid #7c7c7c63;
  cursor: nwse-resize;
  transform: rotate(90deg);
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
