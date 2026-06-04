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
  <div class="comparison-feedback success comparison-result-card">
    <div class="comparison-result-copy">
      <strong>{{ copy.comparisonSuccess }}</strong>
      <span>{{ copy.comparisonSuccessDescription }}</span>
    </div>
    <div class="comparison-exports" :aria-label="copy.comparisonExportsTitle">
      <a
        v-if="htmlUrl"
        class="comparison-export-item"
        :href="htmlUrl"
        target="_blank"
        rel="noreferrer"
      >
        <span class="detail-export-label">{{ copy.comparisonHtmlShort }}</span>
      </a>
      <span v-else class="comparison-export-item disabled">
        <span class="detail-export-label">{{ copy.comparisonHtmlShort }}</span>
      </span>

      <a
        v-if="csvUrl"
        class="comparison-export-item"
        :href="csvUrl"
        target="_blank"
        rel="noreferrer"
      >
        <span class="detail-export-label">{{ copy.comparisonCsvShort }}</span>
      </a>
      <span v-else class="comparison-export-item disabled">
        <span class="detail-export-label">{{ copy.comparisonCsvShort }}</span>
      </span>

      <a
        v-if="jsonUrl"
        class="comparison-export-item"
        :href="jsonUrl"
        target="_blank"
        rel="noreferrer"
      >
        <span class="detail-export-label">{{ copy.comparisonJsonShort }}</span>
      </a>
      <span v-else class="comparison-export-item disabled">
        <span class="detail-export-label">{{ copy.comparisonJsonShort }}</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.comparison-feedback {
  border: 1px solid rgba(148, 163, 184, 0.20);
  border-radius: 18px;
}

.comparison-feedback.success {
  background: #f0fdf4;
  color: #166534;
  border-color: rgba(34, 197, 94, 0.26);
}

.detail-export-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.comparison-result-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 18px;
}

.comparison-result-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.comparison-result-copy strong {
  color: #14532d;
  font-size: 14px;
  font-weight: 800;
}

.comparison-result-copy span {
  color: #3f684d;
  font-size: 12px;
  line-height: 1.65;
}

.comparison-result-card .comparison-exports {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.comparison-export-item {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 16px;
  border-radius: 13px;
  border: 1px solid rgba(96, 165, 250, 0.48);
  background: rgba(239, 246, 255, 0.78);
  color: #2563eb;
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  word-break: keep-all;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.comparison-result-card .comparison-export-item {
  min-width: 92px;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 10px;
  background: #ffffff;
}

.comparison-export-item.disabled {
  opacity: 0.52;
  cursor: not-allowed;
}

.comparison-export-item:not(.disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.12);
}

.comparison-export-item:not(:first-child) {
  border-color: rgba(148, 163, 184, 0.34);
}

.comparison-export-item:not(:first-child):not(.disabled):hover {
  border-color: rgba(96, 165, 250, 0.46);
}

@media (max-width: 1100px) {
  .comparison-export-item {
    min-height: 36px;
    border-radius: 10px;
    box-shadow: none;
  }

  .comparison-export-item {
    background: #eff6ff;
  }

  .comparison-result-card .comparison-export-item {
    min-width: 86px;
    min-height: 32px;
    padding: 0 12px;
  }

  .comparison-exports .comparison-export-item {
    min-height: 32px;
    padding: 0 12px;
    border-radius: 9px;
  }

  .comparison-export-item {
    min-height: 32px;
    padding: 0 12px;
    border-radius: 9px;
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
  }

  .comparison-exports .comparison-export-item {
    justify-content: center;
    min-width: 0;
  }
}

@media (max-width: 760px) {
  .comparison-result-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .comparison-result-card .comparison-exports {
    justify-content: flex-start;
    width: 100%;
  }
}
</style>
