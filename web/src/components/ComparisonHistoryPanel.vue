<script setup>
/**
 * ComparisonHistoryPanel — displays comparison report history
 * with loading, error, and empty states, plus a refresh button.
 *
 * Pure display; all values received via props.
 * Emits "refresh" when the user clicks the refresh button.
 * Emits "clear" when the user wants to delete all history.
 */
defineProps({
  /** Localised UI copy (the `t` computed from App.vue) */
  copy: {
    type: Object,
    required: true,
  },
  /** Loading / idle / error status */
  status: {
    type: String,
    default: "idle",
  },
  /** Error message when status is "error" */
  error: {
    type: String,
    default: "",
  },
  /**
   * Pre-computed display items.
   * Each item: { comparison_id, title, createdAtLabel, job_count,
   *   best_accuracy, lowest_loss, lowest_asr, htmlUrl, csvUrl, jsonUrl }
   */
  items: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["refresh", "clear"]);
</script>

<template>
  <section class="comparison-history-panel card-base animate-fade-in">
    <div class="comparison-history-heading">
      <h2 class="text-h2">{{ copy.comparisonHistoryTitle }}</h2>
      <div class="comparison-history-actions">
        <button
          v-if="items.length > 0"
          class="btn btn-secondary"
          :disabled="status === 'loading'"
          @click="emit('clear')"
        >
          {{ copy.clearHistory }}
        </button>
        <button
          class="btn btn-outline"
          :disabled="status === 'loading'"
          @click="emit('refresh')"
        >
          {{ copy.comparisonHistoryRefresh }}
        </button>
      </div>
    </div>

    <div v-if="status === 'loading'" class="empty-state small">
      {{ copy.comparisonHistoryLoading }}
    </div>

    <div v-else-if="error" class="error-feedback">
      <strong>{{ copy.comparisonHistoryFailed }}</strong>
      <span>{{ error }}</span>
    </div>

    <div v-else-if="items.length === 0" class="empty-state">
      <div class="empty-icon">📊</div>
      <div class="text-h3">{{ copy.comparisonHistoryEmpty }}</div>
      <div class="text-sm text-muted">{{ copy.comparisonHistoryHint }}</div>
    </div>

    <div v-else class="table-container">
      <table class="base-table jobs-table">
        <thead>
          <tr>
            <th>{{ copy.comparisonHistoryCreated }}</th>
            <th>{{ copy.comparisonHistoryJobs }}</th>
            <th>{{ copy.comparisonHistoryBestAccuracy }}</th>
            <th>{{ copy.comparisonHistoryLowestLoss }}</th>
            <th>{{ copy.comparisonHistoryLowestAsr }}</th>
            <th>{{ copy.comparisonHistoryExports }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.comparison_id" class="history-row">
            <td>
              <div class="comparison-history-title text-h3">{{ item.title }}</div>
              <div class="job-id text-xs text-muted font-mono">{{ item.createdAtLabel }}</div>
            </td>
            <td class="text-sm">{{ item.job_count }}</td>
            <td class="text-sm font-mono">{{ item.best_accuracy }}</td>
            <td class="text-sm font-mono">{{ item.lowest_loss }}</td>
            <td class="text-sm font-mono">{{ item.lowest_asr }}</td>
            <td>
              <div class="comparison-history-links">
                <a
                  v-if="item.htmlUrl"
                  class="btn btn-primary btn-xs"
                  :href="item.htmlUrl"
                  target="_blank"
                  rel="noreferrer"
                >
                  {{ copy.comparisonHtmlShort }}
                </a>
                <a
                  v-if="item.csvUrl"
                  class="btn btn-secondary btn-xs"
                  :href="item.csvUrl"
                  target="_blank"
                  rel="noreferrer"
                >
                  {{ copy.comparisonCsvShort }}
                </a>
                <a
                  v-if="item.jsonUrl"
                  class="btn btn-secondary btn-xs"
                  :href="item.jsonUrl"
                  target="_blank"
                  rel="noreferrer"
                >
                  {{ copy.comparisonJsonShort }}
                </a>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.comparison-history-panel {
  display: grid;
  gap: 24px;
}

.comparison-history-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.comparison-history-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.comparison-history-title {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text-main);
  margin-bottom: 2px;
}

.comparison-history-links {
  display: flex;
  gap: 6px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  background: rgba(255, 255, 255, 0.5);
  border: 2px dashed var(--color-border-card);
  border-radius: var(--radius-lg);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state.small {
  padding: 24px;
  min-height: auto;
}

@media (max-width: 760px) {
  .comparison-history-heading {
    flex-direction: column;
    align-items: flex-start;
  }

  .comparison-history-actions {
    width: 100%;
    justify-content: stretch;
  }

  .comparison-history-actions .btn {
    flex: 1;
  }
}
</style>
