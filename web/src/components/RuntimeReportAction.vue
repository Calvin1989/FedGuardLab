<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  href: {
    type: String,
    required: false,
    default: "",
  },
  linkLabel: {
    type: String,
    required: true,
  },
  notReadyLabel: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div class="runtime-report-action runtime-item runtime-action" :class="{ 'is-disabled': !href }">
    <span class="runtime-label">{{ label }}</span>
    <a
      v-if="href"
      class="runtime-value runtime-text-value runtime-report-link runtime-report-value"
      :href="href"
      target="_blank"
    >
      {{ linkLabel }}
    </a>
    <strong v-else class="runtime-value runtime-text-value runtime-report-value">{{ notReadyLabel }}</strong>
  </div>
</template>

<style scoped>
.runtime-report-action {
  gap: 6px;
}

.runtime-report-action .runtime-label {
  display: block;
  margin: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.1;
}

.runtime-report-action .runtime-report-value {
  display: flex;
  min-height: 30px;
  align-items: center;
  max-width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: #111827;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.012em;
  line-height: 1.15;
  white-space: nowrap;
}

.runtime-report-action .runtime-report-link {
  width: auto;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  color: #2563eb;
  justify-content: flex-start;
  text-decoration: underline;
  text-decoration-color: rgba(37, 99, 235, 0.42);
  text-decoration-thickness: 1.5px;
  text-underline-offset: 3px;
  text-overflow: ellipsis;
  transform: none;
}

.runtime-report-action .runtime-report-link:hover {
  color: #1d4ed8;
  text-decoration-color: currentColor;
}

.runtime-report-action.is-disabled .runtime-report-value {
  color: #111827;
}
</style>
