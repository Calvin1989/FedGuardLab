<script setup>
const props = defineProps({
  sections: {
    type: Array,
    required: true,
  },
  activeSection: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["select"]);
</script>

<template>
  <nav class="dashboard-section-nav" aria-label="Dashboard sections">
    <button
      v-for="section in sections"
      :key="section.id"
      type="button"
      class="dashboard-section-tab"
      :class="{ active: activeSection === section.id }"
      :aria-current="activeSection === section.id ? 'page' : undefined"
      @click="emit('select', section.id)"
    >
      {{ section.label }}
    </button>
  </nav>
</template>

<style scoped>
.dashboard-section-nav {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  align-items: stretch;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.dashboard-section-tab {
  appearance: none;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  min-height: 40px;
  padding: 0 16px;
  transition:
    color 0.16s ease,
    border-color 0.16s ease;
}

.dashboard-section-tab:hover {
  color: #334155;
  border-bottom-color: rgba(148, 163, 184, 0.3);
}

.dashboard-section-tab.active {
  color: #1d4ed8;
  border-bottom-color: #2563eb;
  font-weight: 700;
}

.dashboard-section-tab:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.5);
  outline-offset: -2px;
}

@media (max-width: 860px) {
  .dashboard-section-nav {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .dashboard-section-tab {
    min-height: 36px;
    padding: 0 12px;
    font-size: 12px;
    white-space: nowrap;
  }
}
</style>
