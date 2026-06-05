<script setup>
/**
 * JobsSectionHeader — title, hint, and filter controls for the
 * jobs / comparisons dashboard section.
 *
 * Filter state is synced to the parent via v-model.
 * Section actions stay in the parent through the default slot.
 */
defineProps({
  /** Localised UI copy (the `t` computed from App.vue) */
  copy: {
    type: Object,
    required: true,
  },
  /** Whether to show the jobs title, hint, and filter controls */
  showFilters: {
    type: Boolean,
    default: true,
  },
});

const statusFilter = defineModel("statusFilter", { type: String, default: "all" });
const archiveFilter = defineModel("archiveFilter", { type: String, default: "active" });
const limit = defineModel("limit", { type: Number, default: 20 });
const sort = defineModel("sort", { type: String, default: "created_at_desc" });
</script>

<template>
  <div class="section-header" :class="{ 'actions-only': !showFilters }">
    <div v-if="showFilters" class="section-header-copy filter-only">
      <div class="job-filters">
        <label class="status-filter">
          {{ copy.statusFilter }}:
          <select v-model="statusFilter">
            <option value="all">{{ copy.allStatuses }}</option>
            <option value="finished_report">{{ copy.finishedWithReport }}</option>
            <option value="finished">{{ copy.statusValues.finished }}</option>
            <option value="running">{{ copy.statusValues.running }}</option>
            <option value="cancelled">{{ copy.statusValues.cancelled }}</option>
            <option value="failed">{{ copy.statusValues.failed }}</option>
            <option value="queued">{{ copy.statusValues.queued }}</option>
          </select>
        </label>

        <label class="status-filter">
          {{ copy.historyArchiveFilter }}:
          <select v-model="archiveFilter">
            <option value="active">{{ copy.archiveActive }}</option>
            <option value="archived">{{ copy.archiveArchived }}</option>
            <option value="all">{{ copy.archiveAll }}</option>
          </select>
        </label>

        <label class="status-filter">
          {{ copy.limitFilter }}:
          <select v-model.number="limit">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </label>

        <label class="status-filter">
          {{ copy.sortFilter }}:
          <select v-model="sort">
            <option value="created_at_desc">{{ copy.newestFirst }}</option>
            <option value="created_at_asc">{{ copy.oldestFirst }}</option>
          </select>
        </label>
      </div>
    </div>

    <slot />
  </div>
</template>

<style scoped>
.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.section-header.actions-only {
  justify-content: flex-end;
  margin-bottom: 14px;
}

.section-header-copy {
  min-width: 0;
}

.section-header-copy.filter-only {
  flex: 1 1 auto;
}

.section-header-copy.filter-only .job-filters {
  margin-top: 0;
}

.section-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
  letter-spacing: -0.035em;
}

.section-header p {
  max-width: 720px;
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.55;
}

.job-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.status-filter {
  display: grid;
  gap: 5px;
  min-width: 170px;
  color: #172033;
  font-size: 12px;
  font-weight: 900;
}

.status-filter select {
  min-height: 36px;
  padding: 0 34px 0 12px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  font-size: 12px;
  font-weight: 800;
  outline: none;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.status-filter select:focus {
  border-color: rgba(37, 99, 235, 0.48);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.10);
}

.status-filter select:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.4);
  outline-offset: 1px;
}

/* Section actions (slotted from App.vue) */
:deep(.section-actions) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  align-items: flex-end;
}

:deep(.run-button),
:deep(.secondary-button) {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 16px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 900;
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

:deep(.run-button) {
  border: 1px solid #1d4ed8;
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
  color: #ffffff;
}

:deep(.run-button:disabled) {
  opacity: 0.48;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

:deep(.run-button:not(:disabled):hover) {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.12);
}

:deep(.run-button:focus-visible),
:deep(.secondary-button:focus-visible) {
  outline: 2px solid rgba(37, 99, 235, 0.5);
  outline-offset: 2px;
}

:deep(.secondary-button) {
  border: 1px solid rgba(96, 165, 250, 0.48);
  background: #eff6ff;
  color: #2563eb;
}

:deep(.secondary-button:disabled) {
  opacity: 0.48;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

:deep(.secondary-button:not(:disabled):hover) {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.12);
}

@media (max-width: 860px) {
  .section-header,
  .section-header.actions-only {
    flex-direction: column;
    align-items: stretch;
  }

  .job-filters {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
