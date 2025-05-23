<script setup lang="ts">
import { ref, watch } from 'vue';

import ConfirmDialog from '@/ui/confirm-dialog.vue';

export interface WidgetLabelDialogProps {
  placeholder?: string;
}

export interface WidgetLabelDialogEvents {
  (e: 'ok', label: string): void;
  (e: 'cancel'): void;
}

const { placeholder = '' } = defineProps<WidgetLabelDialogProps>();

const show = defineModel<boolean>('show', { required: true });

const emit = defineEmits<WidgetLabelDialogEvents>();

const label = ref(placeholder ?? '');

const closeDialog = () => {
  show.value = false;
  label.value = placeholder;
};

watch(show, (x) => !x && closeDialog());
</script>

<template>
  <ConfirmDialog v-model:show="show">
    <h3>Enter widget label</h3>
    <p>The widget will be added under this label to the widget menu</p>
    <input v-model="label" type="text" class="lavel-input" />
    <div class="actions">
      <button @click="emit('cancel')" class="action-btn">Cancel</button>
      <button @click="emit('ok', label)" class="action-btn">Ok</button>
    </div>
  </ConfirmDialog>
</template>

<style scoped>
.label-input {
  display: block;
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
