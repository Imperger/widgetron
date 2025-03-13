<script setup lang="ts">
const model = defineModel();
</script>

<template>
  <label class="switch">
    <input v-model="model" type="checkbox" />
    <span class="slider round"></span>
  </label>
</template>

<style scoped>
* {
  --border-width: 2px;
}

.switch {
  position: relative;
  display: inline-block;
  width: var(--toggle-width);
  height: var(--toggle-height);
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: var(--border-width) solid var(--color-background-toggle-handle);
  border-radius: var(--toggle-handle-size);
  transition: 0.4s;
}

.slider:after {
  position: absolute;
  content: '';
  height: var(--toggle-handle-size);
  width: var(--toggle-handle-size);
  left: calc(var(--border-width) + 1px);
  top: var(--border-width);
  background-color: var(--color-background-toggle-handle);
  transition: var(--timing-short);
}

input:checked + .slider:before {
  display: block;
  position: absolute;
  content: '';
  top: calc(50% - 1px);
  left: 0.8rem;
  width: 0.7rem;
  height: 0.3rem;
  transform: translate3d(-50%, -50%, 0px) rotate(-45deg);
  border-width: 0 0 2px 2px;
  border-style: solid;
  border-color: var(--color-text-toggle-checked-icon);
}

input:checked + .slider {
  border-color: var(--color-border-toggle-checked);
}

input:checked + .slider:after {
  left: calc(100% - var(--toggle-handle-size) - var(--border-width) - 1px);
  background-color: var(--color-border-toggle-checked);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:after {
  border-radius: 50%;
}
</style>
