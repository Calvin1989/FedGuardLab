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
  gap: 16px;
  margin-bottom: 12px;
  padding: 12px 14px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 10px;
}

.section-header.actions-only {
  justify-content: flex-end;
  margin-bottom: 12px;
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
  font-size: 20px;
  letter-spacing: -0.03em;
}

.section-header p {
  max-width: 720px;
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
}

.job-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 0;
}

.status-filter {
  display: grid;
  gap: 3px;
  min-width: 140px;
  color: #475569;
  font-size: 11px;
  font-weight: 600;
}

.status-filter select {
  min-height: 32px;
  padding: 0 30px 0 10px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
  font-size: 12px;
  font-weight: 600;
  outline: none;
}

.status-filter select:focus {
  border-color: rgba(37, 99, 235, 0.48);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.08);
}

.status-filter select:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.4);
  outline-offset: 1px;
}

/* Section actions (slotted from App.vue) */
:deep(.section-actions) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  align-items: center;
  flex-shrink: 0;
}

:deep(.run-button),
:deep(.secondary-button) {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 14px;
  border-radius: 6px;
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
    color 0.16s ease,
    box-shadow 0.16s ease;
}

:deep(.run-button) {
  border: 1px solid #1d4ed8;
  background: #2563eb;
  color: #ffffff;
}

:deep(.run-button:disabled) {
  opacity: 0.48;
  cursor: not-allowed;
  box-shadow: none;
}

:deep(.run-button:not(:disabled):hover) {
  background: #1d4ed8;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2);
}

:deep(.run-button:focus-visible),
:deep(.secondary-button:focus-visible) {
  outline: 2px solid rgba(37, 99, 235, 0.5);
  outline-offset: 2px;
}

:deep(.secondary-button) {
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #ffffff;
  color: #334155;
}

:deep(.secondary-button:disabled) {
  opacity: 0.48;
  cursor: not-allowed;
  box-shadow: none;
}

:deep(.secondary-button:not(:disabled):hover) {
  background: #f8fafc;
  border-color: rgba(148, 163, 184, 0.36);
}

@media (max-width: 860px) {
  .section-header,
  .section-header.actions-only {
    flex-direction: column;
    align-items: stretch;
  }

  .job-filters {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
}
</style>
