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
      <span class="detail-section-title">{{ copy.comparisonHistoryTitle }}</span>
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
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

/* Section heading */
.detail-section-heading {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
}

.detail-section-title {
  margin: 0;
  color: #0f172a;
  font-size: 14px;
  font-weight: 900;
  letter-spacing: -0.01em;
  line-height: 1.2;
  text-transform: none;
}

.detail-section-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.45;
}

/* Secondary button */
.secondary-button {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 16px;
  border: 1px solid rgba(96, 165, 250, 0.48);
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  word-break: keep-all;
  cursor: pointer;
  box-shadow: none;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    background-color 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.secondary-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.secondary-button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.12);
}

.secondary-button:focus-visible,
.report-link:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.5);
  outline-offset: 2px;
}

/* Empty state */
.empty-state {
  width: 100%;
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  border: 1px dashed rgba(148, 163, 184, 0.34);
  border-radius: 18px;
  color: #64748b;
  text-align: center;
  font-size: 13px;
  line-height: 1.6;
}

.empty-state.small {
  min-height: 60px;
  margin-top: 12px;
}

/* Feedback states */
.comparison-feedback {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.20);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.72);
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
  border-radius: 16px;
  background: #ffffff;
  font-size: 12px;
}

.jobs-table th,
.jobs-table td {
  padding: 11px 12px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.88);
  text-align: left;
  vertical-align: middle;
}

.jobs-table th {
  background: #f8fafc;
  color: #334155;
  font-size: 12px;
  font-weight: 900;
}

.jobs-table tr:last-child td {
  border-bottom: 0;
}

/* Job ID label */
.job-id {
  margin-top: 2px;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
}

/* Report link */
.report-link {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid rgba(96, 165, 250, 0.48);
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: none;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    background-color 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.report-link:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.12);
}

.report-link.disabled {
  border-color: rgba(148, 163, 184, 0.26);
  background: #f8fafc;
  color: #94a3b8;
  box-shadow: none;
}

/* Comparison history specific */
.comparison-history-heading {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.comparison-history-refresh {
  min-height: 32px;
  padding: 6px 12px;
  white-space: nowrap;
}

.comparison-history-empty {
  margin-top: 10px;
}

.comparison-history-error {
  margin-top: 10px;
}

.comparison-history-table {
  margin-top: 10px;
  box-shadow: none;
}

.comparison-history-table th,
.comparison-history-table td {
  padding-top: 9px;
  padding-bottom: 9px;
}

.comparison-history-title {
  max-width: 320px;
  overflow: hidden;
  color: #0f172a;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Comparison history scroll container */
.comparison-history-scroll {
  max-height: 420px;
  overflow: auto;
  border: 1px solid rgba(226, 232, 240, 0.72);
  border-radius: 16px;
  background: #ffffff;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.20) transparent;
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

/* Comparison history links */
.comparison-history-links {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.comparison-history-links .report-link {
  min-height: 28px;
  min-width: auto;
  padding: 7px 10px;
  font-size: 12px;
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
