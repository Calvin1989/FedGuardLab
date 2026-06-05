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
  wide: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div class="runtime-info-tile runtime-item" :class="{ wide }">
    <span class="runtime-label">{{ label }}</span>
    <strong class="runtime-value runtime-text-value">{{ value }}</strong>
  </div>
</template>

<style scoped>
.runtime-info-tile .runtime-label {
  display: block;
  margin: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.1;
}

.runtime-info-tile .runtime-value {
  display: flex;
  min-height: 26px;
  min-width: 0;
  align-items: center;
  margin: 0;
  color: #111827;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.runtime-info-tile .runtime-text-value {
  overflow-wrap: anywhere;
}
</style>
