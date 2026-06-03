<script setup>
/**
 * ComparisonHistoryPanel — displays comparison report history
 * with loading, error, and empty states, plus a refresh button.
 *
 * Pure display; all values received via props.
 * Emits "refresh" when the user clicks the refresh button.
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

defineEmits(["refresh"])
</script>

<template>
  <section class="comparison-history-panel dashboard-info-panel">
    <div class="detail-section-heading comparison-history-heading">
      <div>
        <span class="detail-section-title">{{ copy.comparisonHistoryTitle }}</span>
        <span class="detail-section-subtitle">{{ copy.comparisonHistoryHint }}</span>
      </div>
      <button
        class="secondary-button comparison-history-refresh"
        :disabled="status === 'loading'"
        @click="$emit('refresh')"
      >
        {{ copy.comparisonHistoryRefresh }}
      </button>
    </div>

    <div v-if="status === 'loading'" class="empty-state small comparison-history-empty">
      {{ copy.comparisonHistoryLoading }}
    </div>

    <div v-else-if="error" class="comparison-feedback error-feedback comparison-history-error">
      <strong>{{ copy.comparisonHistoryFailed }}</strong>
      <span>{{ error }}</span>
    </div>

    <div v-else-if="items.length === 0" class="empty-state small comparison-history-empty">
      {{ copy.comparisonHistoryEmpty }}
    </div>

    <div v-else class="comparison-history-scroll">
      <table class="jobs-table comparison-history-table">
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
        <tr v-for="item in items" :key="item.comparison_id">
          <td>
            <div class="comparison-history-title">{{ item.title }}</div>
            <div class="job-id">{{ item.createdAtLabel }}</div>
          </td>
          <td>{{ item.job_count }}</td>
          <td>{{ item.best_accuracy }}</td>
          <td>{{ item.lowest_loss }}</td>
          <td>{{ item.lowest_asr }}</td>
          <td>
            <div class="comparison-history-links">
              <a
                v-if="item.htmlUrl"
                class="report-link"
                :href="item.htmlUrl"
                target="_blank"
                rel="noreferrer"
              >
                {{ copy.comparisonHtmlShort }}
              </a>
              <a
                v-if="item.csvUrl"
                class="report-link secondary-link"
                :href="item.csvUrl"
                target="_blank"
                rel="noreferrer"
              >
                {{ copy.comparisonCsvShort }}
              </a>
              <a
                v-if="item.jsonUrl"
                class="report-link secondary-link"
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
.comparison-history-heading {
  margin-bottom: 12px;
}

.comparison-history-refresh {
  min-height: 34px;
  padding: 8px 12px;
  white-space: nowrap;
}

.comparison-history-empty,
.comparison-history-error,

.comparison-history-table {
  margin-top: 10px;
  box-shadow: none;
}

.comparison-history-table th,
.comparison-history-table td {
  padding-top: 11px;
  padding-bottom: 11px;
}

.comparison-history-title {
  max-width: 320px;
  overflow: hidden;
  color: #0f172a;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comparison-history-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.comparison-history-links .report-link {
  min-width: auto;
  padding: 7px 10px;
  font-size: 12px;
}

.comparison-history-links .secondary-link {
  background: rgba(239, 246, 255, 0.92);
  color: #1d4ed8;
}


/* Report entry sizing and comparison history scroll */
.comparison-history-scroll {
  max-height: 460px;
  overflow: auto;
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 14px;
  background: #ffffff;
}

.comparison-history-scroll .comparison-history-table {
  margin-top: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.comparison-history-scroll .comparison-history-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f8fafc;
}

.comparison-history-scroll .comparison-history-table tr:last-child td {
  border-bottom: 0;
}

.comparison-history-links .report-link {
  min-height: 28px;
  padding: 0 10px;
  font-size: 12px;
}

.comparison-history-links {
  gap: 6px;
}

.comparison-history-links .secondary-link {
  border-color: rgba(148, 163, 184, 0.34);
  background: rgba(248, 250, 252, 0.94);
  color: #334155;
}

.comparison-history-links .secondary-link:hover {
  border-color: rgba(96, 165, 250, 0.46);
  background: rgba(239, 246, 255, 0.96);
  color: #1d4ed8;
}

@media (max-width: 760px) {
  .comparison-history-scroll {
    max-height: 360px;
  }
}
</style>
