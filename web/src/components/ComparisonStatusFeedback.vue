<script setup>
defineProps({
  copy: {
    type: Object,
    required: true,
  },
  kind: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "idle",
  },
  error: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <div v-if="kind === 'creating' && status === 'creating'" class="comparison-feedback creating">
    <span class="feedback-spinner"></span>
    {{ copy.comparisonCreating }}
  </div>

  <div v-else-if="kind === 'error' && error" class="comparison-feedback error-feedback">
    <strong>{{ copy.comparisonFailed }}</strong>
    <span>{{ error }}</span>
  </div>
</template>

<style scoped>
.comparison-feedback {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.20);
  border-radius: 16px;
  font-size: 13px;
  display: flex;
  align-items: center;
  border-color: rgba(148, 163, 184, 0.22);
  background: #ffffff;
  box-shadow: none;
  animation: cardFadeIn 0.22s ease-out both;
}

.comparison-feedback.creating {
  color: #2563eb;
}

.error-feedback {
  background: #fff1f2;
  color: #9f1239;
}

.feedback-spinner {
  width: 16px;
  height: 16px;
  display: inline-flex;
  margin-right: 8px;
  border: 2px solid rgba(37, 99, 235, 0.22);
  border-top-color: #2563eb;
  border-radius: 999px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
