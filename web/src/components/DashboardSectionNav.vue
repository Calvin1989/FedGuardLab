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
      class="section-tab"
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
  display: flex;
  gap: 8px;
  padding: 4px;
  background: rgba(241, 245, 249, 0.5);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-card);
}

.section-tab {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.section-tab:hover {
  color: var(--color-primary);
  background: rgba(255, 255, 255, 0.5);
}

.section-tab.active {
  background: white;
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

@media (max-width: 640px) {
  .dashboard-section-nav {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
