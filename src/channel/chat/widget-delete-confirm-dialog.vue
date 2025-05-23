<script setup lang="ts">
import ConfirmDialog from '@/ui/confirm-dialog.vue';

export interface MyWidgetLabelProps {
  label: string;
}

export interface MyWidgetLabelDialogEvents {
  (e: 'ok'): void;
  (e: 'cancel'): void;
}

const { label } = defineProps<MyWidgetLabelProps>();

const show = defineModel<boolean>('show', { required: true });

const emit = defineEmits<MyWidgetLabelDialogEvents>();
</script>

<template>
  <ConfirmDialog v-model:show="show">
    <h3>
      Delete <span class="label">{{ label }}</span
      >?
    </h3>
    <div class="actions">
      <button @click="emit('cancel')" class="action-btn">Cancel</button>
      <button @click="emit('ok')" class="action-btn">Delete</button>
    </div>
  </ConfirmDialog>
</template>

<style scoped>
.label {
  color: #e53935;
}

.actions {
  display: flex;
  flex-direction: row-reverse;
  align-self: end;
}

.action-btn {
  margin: 0 5px;
}
</style>
