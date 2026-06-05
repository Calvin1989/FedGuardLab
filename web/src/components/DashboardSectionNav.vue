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
  gap: 4px;
  align-items: center;
}

.dashboard-section-tab {
  appearance: none;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  color: #475569;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  min-height: 30px;
  padding: 0 12px;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    color 0.16s ease,
    transform 0.16s ease;
}

.dashboard-section-tab:hover {
  border-color: rgba(59, 130, 246, 0.42);
  color: #1d4ed8;
  transform: translateY(-1px);
}

.dashboard-section-tab.active {
  border-color: rgba(37, 99, 235, 0.42);
  background: #eff6ff;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  font-weight: 800;
}

.dashboard-section-tab:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.5);
  outline-offset: 2px;
}

@media (max-width: 860px) {
  .dashboard-section-tab {
    min-height: 28px;
    padding: 0 10px;
    font-size: 11px;
  }
}
</style>
