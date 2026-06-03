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
  display: grid;
  grid-template-columns: 76px 76px;
  width: 160px;
  height: 40px;
  padding: 4px;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.10);
  backdrop-filter: blur(14px);
}

.lang-button {
  width: 76px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #334155;
  font-size: 11px;
  font-weight: 900;
  line-height: 32px;
  white-space: nowrap;
  cursor: pointer;
}

.lang-button.active {
  background: #0f172a;
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
}

@media (max-width: 560px) {
  .lang-switcher {
    grid-template-columns: 58px 58px;
    width: 124px;
  }

  .lang-button {
    width: 58px;
    font-size: 10px;
  }
}

.lang-switcher {
  height: 36px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.lang-switcher {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: 34px;
  padding: 3px;
  gap: 3px;
  border-color: rgba(148, 163, 184, 0.26);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
}

.lang-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 74px;
  height: 28px;
  min-height: 28px;
  padding: 0 12px;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  transform: none;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.lang-button.active {
  transform: none;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.16);
}

.lang-button {
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    background-color 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
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
