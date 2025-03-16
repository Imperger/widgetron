<script setup lang="ts"></script>

<template>
  <div class="menu-item"><slot></slot></div>
</template>

<style scope>
.menu-item {
  color: var(--color-text-base);
  padding: 0.5rem;
  text-wrap: nowrap;
  cursor: pointer;
}
</style>
