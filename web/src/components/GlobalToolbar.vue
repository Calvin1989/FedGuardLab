<script setup>
import LanguageSwitcher from "./LanguageSwitcher.vue";
import TopbarBrand from "./TopbarBrand.vue";

defineProps({
  language: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["select-language"]);
</script>

<template>
  <div class="global-toolbar" aria-label="Global toolbar">
    <TopbarBrand />

    <div class="toolbar-actions">
      <LanguageSwitcher :language="language" @select="emit('select-language', $event)" />
    </div>
  </div>
</template>

<style scoped>
.global-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--color-bg-page);
  margin-bottom: 8px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
</style>
