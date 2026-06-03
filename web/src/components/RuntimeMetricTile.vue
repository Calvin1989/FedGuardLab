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
  <div class="hero-metric-item">
    <span class="runtime-label">{{ label }}</span>
    <strong class="runtime-value">{{ value }}</strong>
  </div>
</template>
