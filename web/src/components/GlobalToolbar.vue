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

    <LanguageSwitcher :language="language" @select="emit('select-language', $event)" />
  </div>
</template>

<style scoped>
.global-toolbar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 36px;
}

@media (max-width: 860px) {
  .global-toolbar {
    align-items: center;
  }
}
</style>
