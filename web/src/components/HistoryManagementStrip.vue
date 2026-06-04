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
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(520px, 0.95fr);
  align-items: stretch;
  gap: 14px;
  width: 100%;
  margin: 0 0 14px;
  padding: 14px;
  border: 1px solid rgba(191, 219, 254, 0.76);
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(239, 246, 255, 0.82), rgba(248, 250, 252, 0.96));
}

.history-management-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  padding: 4px 4px 4px 6px;
}

.history-management-copy strong {
  color: #0f172a;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.25;
}

.history-management-copy span {
  max-width: 820px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.55;
}

.history-management-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  min-width: 0;
}

.history-summary-card {
  display: flex;
  min-width: 0;
  min-height: 72px;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid rgba(226, 232, 240, 0.96);
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
}

.history-summary-card small {
  overflow: hidden;
  color: #64748b;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-summary-card strong {
  overflow: hidden;
  color: #0f172a;
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-summary-card-filter {
  border-color: rgba(147, 197, 253, 0.62);
  background: rgba(255, 255, 255, 0.96);
}

.history-summary-card-filter strong {
  font-size: 15px;
  letter-spacing: -0.01em;
  line-height: 1.15;
}

@media (max-width: 1180px) {
  .history-management-strip {
    grid-template-columns: 1fr;
  }

  .history-management-stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .history-management-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .history-management-stats {
    grid-template-columns: 1fr;
  }
}
</style>
