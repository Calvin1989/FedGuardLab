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
  <div class="section-header card-base" :class="{ 'actions-only': !showFilters }">
    <div v-if="showFilters" class="section-header-copy filter-only">
      <div class="job-filters">
        <label class="filter-label">
          {{ copy.statusFilter }}
          <select v-model="statusFilter" class="select-base filter-select">
            <option value="all">{{ copy.allStatuses }}</option>
            <option value="finished_report">{{ copy.finishedWithReport }}</option>
            <option value="finished">{{ copy.statusValues.finished }}</option>
            <option value="running">{{ copy.statusValues.running }}</option>
            <option value="cancelled">{{ copy.statusValues.cancelled }}</option>
            <option value="failed">{{ copy.statusValues.failed }}</option>
            <option value="queued">{{ copy.statusValues.queued }}</option>
          </select>
        </label>

        <label class="filter-label">
          {{ copy.historyArchiveFilter }}
          <select v-model="archiveFilter" class="select-base filter-select">
            <option value="active">{{ copy.archiveActive }}</option>
            <option value="archived">{{ copy.archiveArchived }}</option>
            <option value="all">{{ copy.archiveAll }}</option>
          </select>
        </label>

        <label class="filter-label">
          {{ copy.limitFilter }}
          <select v-model.number="limit" class="select-base filter-select">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </label>

        <label class="filter-label">
          {{ copy.sortFilter }}
          <select v-model="sort" class="select-base filter-select">
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
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
  padding: 16px 24px;
  background: white;
  border-radius: var(--radius-lg);
}

.section-header.actions-only {
  justify-content: flex-end;
}

.job-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.filter-select {
  min-width: 120px;
  height: 36px;
  padding: 0 12px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
}

/* Section actions (slotted from App.vue) */
:deep(.section-actions) {
  display: flex;
  gap: 12px;
  align-items: center;
}

@media (max-width: 960px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .job-filters {
    justify-content: space-between;
  }

  .filter-label {
    flex: 1;
    min-width: 140px;
  }
}
</style>
