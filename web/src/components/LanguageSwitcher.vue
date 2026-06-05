<script setup>
defineProps({
  language: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["select"]);
</script>

<template>
  <div class="lang-switcher" aria-label="Language switcher">
    <button
      class="lang-button"
      :class="{ active: language === 'zh' }"
      @click="emit('select', 'zh')"
    >
      中文
    </button>
    <button
      class="lang-button"
      :class="{ active: language === 'en' }"
      @click="emit('select', 'en')"
    >
      English
    </button>
  </div>
</template>

<style scoped>
.lang-switcher {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: 34px;
  padding: 3px;
  gap: 3px;
  border: 1px solid rgba(148, 163, 184, 0.26);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(14px);
}

.lang-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 74px;
  height: 28px;
  min-height: 28px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #334155;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    background-color 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.lang-button:hover {
  color: #1d4ed8;
}

.lang-button.active {
  background: #0f172a;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
}

.lang-button:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.5);
  outline-offset: 2px;
}

@media (max-width: 560px) {
  .lang-switcher {
    height: 32px;
  }

  .lang-button {
    width: 62px;
    height: 26px;
    min-height: 26px;
    font-size: 10px;
  }
}
</style>
