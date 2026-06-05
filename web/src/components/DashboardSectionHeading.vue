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
    <h2>{{ copy.title }}</h2>
    <p>{{ copy.hint }}</p>
  </div>
</template>

<style scoped>
.dashboard-section-heading {
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.dashboard-section-heading .section-kicker {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.dashboard-section-heading h2 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(20px, 2.5vw, 28px);
  letter-spacing: -0.035em;
  line-height: 1.15;
}

.dashboard-section-heading p:last-child {
  max-width: 760px;
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
}
</style>