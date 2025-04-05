<script setup lang="ts">
const show = defineModel<boolean>('show', { required: true });
</script>

<template>
  <div v-if="show" @click.self="show = false" class="overlay">
    <div class="dialog">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  display: flex;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  align-items: center;
  justify-content: center;
  margin: auto;
  background-color: rgb(61 61 61 / 70%);
  z-index: 1000;
}

.dialog {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  min-width: 400px;
  background-color: var(--color-background-base);
}
</style>
