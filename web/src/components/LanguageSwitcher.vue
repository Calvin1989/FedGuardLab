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
  height: 30px;
  padding: 2px;
  gap: 2px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 6px;
  background: #f8fafc;
}

.lang-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 26px;
  min-height: 26px;
  padding: 0 8px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    color 0.12s ease;
}

.lang-button:hover {
  color: #334155;
  background: rgba(148, 163, 184, 0.08);
}

.lang-button.active {
  background: #ffffff;
  color: #0f172a;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.lang-button:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.5);
  outline-offset: 1px;
}

@media (max-width: 560px) {
  .lang-switcher {
    height: 28px;
  }

  .lang-button {
    width: 48px;
    height: 24px;
    min-height: 24px;
    font-size: 10px;
  }
}
</style>
