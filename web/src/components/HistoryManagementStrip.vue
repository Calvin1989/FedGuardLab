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
  <div class="history-management-strip animate-fade-in">
    <div class="history-management-copy">
      <strong class="text-h3">{{ copy.historyManagementTitle }}</strong>
      <span class="text-secondary text-sm">{{ copy.historyManagementDescription }}</span>
    </div>

    <div class="history-management-stats" aria-label="Job history summary">
      <div class="stat-pill">
        <small class="text-xs uppercase font-bold">{{ copy.historyTotalJobs }}</small>
        <strong class="text-h3">{{ totalJobs }}</strong>
      </div>

      <div class="stat-pill">
        <small class="text-xs uppercase font-bold">{{ copy.historyComparableJobs }}</small>
        <strong class="text-h3">{{ comparableJobs }}</strong>
      </div>

      <div class="stat-pill">
        <small class="text-xs uppercase font-bold">{{ copy.historySelectedJobs }}</small>
        <strong class="text-h3">{{ selectedJobs }}</strong>
      </div>

      <div class="stat-pill filter-pill">
        <small class="text-xs uppercase font-bold">{{ copy.historyCurrentFilter }}</small>
        <strong class="text-sm font-bold">{{ activeFilterLabel }}</strong>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-management-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
  margin-bottom: 24px;
  padding: 20px 24px;
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-lg);
  background: var(--color-primary-light);
}

.history-management-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.history-management-stats {
  display: flex;
  gap: 12px;
}

.stat-pill {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  min-width: 80px;
  padding: 8px 16px;
  background: white;
  border: 1px solid var(--color-border-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.filter-pill {
  min-width: 120px;
  background: var(--color-bg-page);
}

.uppercase { text-transform: uppercase; }
.font-bold { font-weight: 700; }

@media (max-width: 960px) {
  .history-management-strip {
    flex-direction: column;
    align-items: flex-start;
  }

  .history-management-stats {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
