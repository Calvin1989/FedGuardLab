<script setup>
/**
 * HistoryManagementStrip — summary stats bar showing total jobs,
 * comparable jobs, selected jobs, and active filter label.
 *
 * Pure display; all values received via props.
 */
defineProps({
  /** Localised UI copy (the `t` computed from App.vue) */
  copy: {
    type: Object,
    required: true,
  },
  /** Total number of jobs in the current list */
  totalJobs: {
    type: Number,
    required: true,
  },
  /** Number of jobs eligible for comparison */
  comparableJobs: {
    type: Number,
    required: true,
  },
  /** Number of currently selected jobs */
  selectedJobs: {
    type: Number,
    required: true,
  },
  /** Human-readable label for the active status + archive filter */
  activeFilterLabel: {
    type: String,
    default: "",
  },
})
</script>

<template>
  <div class="history-management-strip">
    <div class="history-management-copy">
      <strong>{{ copy.historyManagementTitle }}</strong>
      <span>{{ copy.historyManagementDescription }}</span>
    </div>
    <div class="history-management-stats">
      <span class="history-stat">
        <strong>{{ totalJobs }}</strong>
        <small>{{ copy.historyTotalJobs }}</small>
      </span>
      <span class="history-stat">
        <strong>{{ comparableJobs }}</strong>
        <small>{{ copy.historyComparableJobs }}</small>
      </span>
      <span class="history-stat">
        <strong>{{ selectedJobs }}</strong>
        <small>{{ copy.historySelectedJobs }}</small>
      </span>
      <span class="history-stat history-stat-wide">
        <strong>{{ activeFilterLabel }}</strong>
        <small>{{ copy.historyCurrentFilter }}</small>
      </span>
    </div>
  </div>
</template>

<style scoped>
.history-management-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.20);
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.72);
  margin-top: 14px;
}

.history-management-copy {
  min-width: 0;
}

.history-management-copy strong {
  display: block;
  color: #0f172a;
  font-size: 13px;
}

.history-management-copy span {
  display: block;
  margin-top: 2px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.45;
}

.history-management-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.history-stat {
  display: grid;
  gap: 2px;
  text-align: center;
}

.history-stat strong {
  color: #0f172a;
  font-size: 18px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.history-stat small {
  color: #64748b;
  font-size: 11px;
  font-weight: 900;
}
</style>
