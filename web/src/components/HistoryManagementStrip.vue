<script setup>
/**
 * HistoryManagementStrip — compact summary strip for job history filters
 * and comparison eligibility counts.
 *
 * Pure display; all values received via props.
 */
defineProps({
  copy: {
    type: Object,
    required: true,
  },
  totalJobs: {
    type: Number,
    required: true,
  },
  comparableJobs: {
    type: Number,
    required: true,
  },
  selectedJobs: {
    type: Number,
    required: true,
  },
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

    <div class="history-management-stats" aria-label="Job history summary">
      <span class="history-summary-card">
        <small>{{ copy.historyTotalJobs }}</small>
        <strong>{{ totalJobs }}</strong>
      </span>

      <span class="history-summary-card">
        <small>{{ copy.historyComparableJobs }}</small>
        <strong>{{ comparableJobs }}</strong>
      </span>

      <span class="history-summary-card">
        <small>{{ copy.historySelectedJobs }}</small>
        <strong>{{ selectedJobs }}</strong>
      </span>

      <span class="history-summary-card history-summary-card-filter">
        <small>{{ copy.historyCurrentFilter }}</small>
        <strong>{{ activeFilterLabel }}</strong>
      </span>
    </div>
  </div>
</template>

<style scoped>
.history-management-strip {
  display: flex;
  align-items: stretch;
  gap: 16px;
  width: 100%;
  margin: 0 0 12px;
  padding: 10px 14px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 10px;
  background: #f8fafc;
}

.history-management-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  padding: 2px 16px 2px 4px;
  border-right: 1px solid rgba(148, 163, 184, 0.12);
  flex-shrink: 0;
}

.history-management-copy strong {
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
}

.history-management-copy span {
  max-width: 280px;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
}

.history-management-stats {
  display: flex;
  gap: 0;
  min-width: 0;
  flex: 1;
  align-items: stretch;
}

.history-summary-card {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  padding: 4px 14px;
  border-right: 1px solid rgba(148, 163, 184, 0.08);
}

.history-summary-card:last-child {
  border-right: none;
}

.history-summary-card small {
  overflow: hidden;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.history-summary-card strong {
  overflow: hidden;
  color: #0f172a;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-summary-card-filter {
  border-color: transparent;
  background: transparent;
}

.history-summary-card-filter strong {
  font-size: 13px;
  letter-spacing: 0;
  line-height: 1.2;
  color: #334155;
}

@media (max-width: 1180px) {
  .history-management-strip {
    flex-wrap: wrap;
  }

  .history-management-copy {
    border-right: none;
    border-bottom: 1px solid rgba(148, 163, 184, 0.12);
    padding: 2px 4px 8px;
    flex: 1 1 100%;
  }
}

@media (max-width: 820px) {
  .history-management-stats {
    flex-wrap: wrap;
  }

  .history-summary-card {
    flex: 1 1 45%;
    border-right: none;
    padding: 6px 10px;
  }
}

@media (max-width: 520px) {
  .history-summary-card {
    flex: 1 1 100%;
  }
}
</style>
