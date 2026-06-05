<script setup>
defineProps({
  copy: {
    type: Object,
    required: true,
  },
  htmlUrl: {
    type: String,
    default: "",
  },
  csvUrl: {
    type: String,
    default: "",
  },
  jsonUrl: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <div class="comparison-result-card card-base animate-fade-in">
    <div class="comparison-result-copy">
      <div class="status-badge-row">
        <span class="tag tag-success">{{ copy.comparisonSuccess }}</span>
      </div>
      <p class="text-sm text-secondary">{{ copy.comparisonSuccessDescription }}</p>
    </div>
    <div class="comparison-exports">
      <a
        v-if="htmlUrl"
        class="btn btn-primary"
        :href="htmlUrl"
        target="_blank"
        rel="noreferrer"
      >
        {{ copy.comparisonHtmlShort }}
      </a>

      <a
        v-if="csvUrl"
        class="btn btn-outline"
        :href="csvUrl"
        target="_blank"
        rel="noreferrer"
      >
        {{ copy.comparisonCsvShort }}
      </a>

      <a
        v-if="jsonUrl"
        class="btn btn-outline"
        :href="jsonUrl"
        target="_blank"
        rel="noreferrer"
      >
        {{ copy.comparisonJsonShort }}
      </a>
    </div>
  </div>
</template>

<style scoped>
.comparison-result-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  background: var(--color-success-light);
  border-color: var(--color-success-border);
}

.comparison-result-copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.status-badge-row {
  display: flex;
  align-items: center;
}

.comparison-exports {
  display: flex;
  gap: 8px;
}

@media (max-width: 760px) {
  .comparison-result-card {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  .status-badge-row {
    justify-content: center;
  }

  .comparison-exports {
    justify-content: center;
    flex-wrap: wrap;
  }

  .comparison-exports .btn {
    flex: 1;
  }
}
</style>
