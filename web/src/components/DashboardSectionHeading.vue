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
  margin-bottom: 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.dashboard-section-heading .section-kicker {
  margin: 0 0 6px;
  color: #2563eb;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.dashboard-section-heading h2 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(24px, 3vw, 34px);
  letter-spacing: -0.045em;
  line-height: 1.08;
}

.dashboard-section-heading p:last-child {
  max-width: 760px;
  margin: 8px 0 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.6;
}
</style>