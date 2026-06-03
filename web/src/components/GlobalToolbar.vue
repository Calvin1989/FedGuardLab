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
  width: min(1180px, calc(100vw - 48px));
  margin-left: auto;
  margin-right: auto;
}

.global-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 42px;
  margin-bottom: 18px;
}

@media (max-width: 860px) {
  .global-toolbar {
    width: min(100%, calc(100vw - 28px));
    align-items: flex-start;
  }
}

.global-toolbar {
  width: min(1200px, calc(100vw - 48px));
  min-height: 36px;
  margin-bottom: 14px;
}

@media (max-width: 860px) {
  .global-toolbar {
    width: min(100%, calc(100vw - 28px));
  }
}
</style>
