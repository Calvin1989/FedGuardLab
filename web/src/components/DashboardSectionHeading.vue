<script setup>
defineProps({
  copy: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div class="dashboard-section-heading">
    <p class="section-kicker">{{ copy.kicker }}</p>
    <h2 class="text-h1">{{ copy.title }}</h2>
    <p class="text-sm text-secondary">{{ copy.hint }}</p>
  </div>
</template>

<style scoped>
.dashboard-section-heading {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border-card);
}

.section-kicker {
  margin: 0 0 8px;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.dashboard-section-heading h2 {
  margin: 0;
}

.dashboard-section-heading p:last-child {
  max-width: 800px;
  margin: 10px 0 0;
  line-height: 1.6;
}
</style>