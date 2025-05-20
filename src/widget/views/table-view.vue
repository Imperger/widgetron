<script setup lang="ts">
import type { WidgetModelTable, WidgetModelTableCell } from '../model/widget-model-table';

const { rows } = defineProps<Omit<WidgetModelTable, 'type'>>();

const cellStyle = ({ text: _1, colspan: _2, rowspan: _3, ...style }: WidgetModelTableCell) => style;
</script>

<template>
  <table>
    <tbody>
      <tr v-for="(row, rowId) in rows" :key="rowId">
        <td
          :key="cellId"
          v-for="(cell, cellId) in row.cells"
          :colspan="cell.colspan"
          :rowspan="cell.rowspan"
          :style="cellStyle(cell)"
        >
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
