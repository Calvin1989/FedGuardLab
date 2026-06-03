<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: false,
    default: "",
  },
});
</script>

<template>
  <div class="runtime-metric-tile hero-metric-item">
    <span class="runtime-label">{{ label }}</span>
    <strong class="runtime-value">{{ value }}</strong>
  </div>
</template>

<style scoped>
.runtime-metric-tile .runtime-label {
  display: block;
  margin: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.1;
}

.runtime-metric-tile .runtime-value {
  display: flex;
  min-height: 30px;
  align-items: center;
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
}
</style>