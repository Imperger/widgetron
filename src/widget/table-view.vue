<script setup lang="ts">
import type { WidgetModelTable } from './model/widget-model-table';

const { rows } = defineProps<Omit<WidgetModelTable, 'type'>>();
</script>

<template>
  <table>
    <tbody>
      <tr v-for="(row, rowId) in rows" :key="rowId">
        <td v-for="(cell, cellId) in row.cells" :key="cellId">
          {{ cell.text }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
table {
  table-layout: auto;
  width: 100%;
}
</style>
