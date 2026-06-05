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

const emit = defineEmits(["refresh"]);
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
        @click="emit('refresh')"
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
/* Panel shell */
.dashboard-info-panel {
  margin-top: 16px;
  padding: 0;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 10px;
  background: #ffffff;
  overflow: hidden;
}

/* Section heading */
.detail-section-heading {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.detail-section-title {
  margin: 0;
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.3;
  text-transform: none;
}

.detail-section-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0;
  line-height: 1.4;
}

/* Secondary button */
.secondary-button {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 6px;
  background: #ffffff;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  word-break: keep-all;
  cursor: pointer;
  box-shadow: none;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    color 0.16s ease;
}

.secondary-button:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.secondary-button:not(:disabled):hover {
  background: #f8fafc;
  border-color: rgba(148, 163, 184, 0.36);
}

.secondary-button:focus-visible,
.report-link:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.5);
  outline-offset: 2px;
}

/* Empty state */
.empty-state {
  width: 100%;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.24);
  border-radius: 8px;
  color: #94a3b8;
  text-align: center;
  font-size: 12px;
  line-height: 1.5;
}

.empty-state.small {
  min-height: 48px;
  margin-top: 8px;
}

/* Feedback states */
.comparison-feedback {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 8px;
  background: #f8fafc;
}

.error-feedback {
  background: #fff1f2;
  color: #9f1239;
}

/* Jobs table */
.jobs-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
  border-radius: 0;
  background: #ffffff;
  font-size: 12px;
}

.jobs-table th,
.jobs-table td {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.72);
  text-align: left;
  vertical-align: middle;
}

.jobs-table th {
  background: #f8fafc;
  color: #475569;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.jobs-table tr:last-child td {
  border-bottom: 0;
}

/* Job ID label */
.job-id {
  margin-top: 1px;
  color: #94a3b8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
}

/* Report link */
.report-link {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 26px;
  padding: 0 8px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 5px;
  background: #ffffff;
  color: #2563eb;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: none;
  transition:
    background 0.12s ease,
    border-color 0.12s ease;
}

.report-link:hover {
  background: #eff6ff;
  border-color: rgba(37, 99, 235, 0.3);
}

.report-link.disabled {
  border-color: rgba(148, 163, 184, 0.16);
  background: #f8fafc;
  color: #94a3b8;
}

/* Comparison history specific */
.comparison-history-heading {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  background: #f8fafc;
}

.comparison-history-refresh {
  min-height: 30px;
  padding: 4px 10px;
  white-space: nowrap;
}

.comparison-history-empty {
  margin-top: 0;
  padding: 14px;
}

.comparison-history-error {
  margin-top: 0;
  padding: 14px;
}

.comparison-history-table {
  margin-top: 0;
  box-shadow: none;
}

.comparison-history-table th,
.comparison-history-table td {
  padding-top: 7px;
  padding-bottom: 7px;
}

.comparison-history-title {
  max-width: 320px;
  overflow: hidden;
  color: #0f172a;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Comparison history scroll container */
.comparison-history-scroll {
  max-height: 400px;
  overflow: auto;
  border: none;
  border-radius: 0;
  background: #ffffff;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.16) transparent;
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
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
}

.comparison-history-scroll .comparison-history-table tr:last-child td {
  border-bottom: 0;
}

/* Comparison history links */
.comparison-history-links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.comparison-history-links .report-link {
  min-height: 26px;
  min-width: auto;
  padding: 3px 8px;
  font-size: 11px;
}

.comparison-history-links .secondary-link {
  border-color: rgba(148, 163, 184, 0.2);
  background: #ffffff;
  color: #475569;
}

.comparison-history-links .secondary-link:hover {
  border-color: rgba(37, 99, 235, 0.3);
  background: #eff6ff;
  color: #2563eb;
}

@media (max-width: 760px) {
  .comparison-history-scroll {
    max-height: 320px;
  }

  .comparison-history-heading {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .comparison-history-refresh {
    align-self: flex-start;
  }
}
</style>
