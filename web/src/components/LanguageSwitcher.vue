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
  height: 32px;
  padding: 2px;
  gap: 2px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
}

.lang-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 28px;
  min-height: 28px;
  padding: 0 10px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
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
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.10);
}

.lang-button:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.5);
  outline-offset: 2px;
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
