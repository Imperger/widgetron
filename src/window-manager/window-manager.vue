<script setup lang="ts">
import { inject } from 'vue';

import { windowManagerToken } from '@/injection-tokens';
import type { CssEditorWindowInstance } from '@/ui/code-editor/css/css-editor-window-instance';
import CssEditorWindow from '@/ui/code-editor/css/css-editor-window.vue';
import TypescriptEditorWindow from '@/ui/code-editor/typescript/typescript-editor-window.vue';
import FloatingWidget from '@/widget/floating-widget.vue';
import type { WidgetInstance } from '@/widget/widget-instance';

const windowManager = inject(windowManagerToken)!;

const onClose = (instance: WidgetInstance | CssEditorWindowInstance) => {
  instance.onClose?.();

  windowManager.value.close(instance.key);
};
</script>

<template>
  <template :key="window.key" v-for="window in windowManager">
    <FloatingWidget
      v-if="window.type === 'widget_instance'"
      :label="window.label"
      :update-period="window.updatePeriod"
      :source-code="window.sourceCode"
      @close="onClose(window)"
      @setFocus="windowManager.setFocus(window.key)"
    />
    <TypescriptEditorWindow
      v-else-if="window.type === 'typescript_editor_window'"
      :label="window.label"
      :extraLibs="window.extraLibs"
      :placeholder="window.placeholder"
      :validators="window.validators"
      @initialized="window.onInitialized"
      @save="window.onSave"
      @preview="window.onExecute"
      @close="window.onClose"
      @setFocus="windowManager.setFocus(window.key)"
    />
    <CssEditorWindow
      v-else-if="window.type === 'css_editor_window'"
      :title="window.title"
      :validators="window.validators"
      @initialized="window.onInitialized"
      @save="window.onSave"
      @close="window.onClose"
      @setFocus="windowManager.setFocus(window.key)"
    />
  </template>
</template>

<style scoped></style>
