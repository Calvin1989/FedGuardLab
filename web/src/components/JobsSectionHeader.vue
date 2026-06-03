<script setup>
/**
 * JobsSectionHeader — title, hint, and filter controls for the
 * jobs / comparisons dashboard section.
 *
 * All state (filters) is synced to the parent via v-model.
 * No API calls or internal business logic.
 */
defineProps({
  /** Localised UI copy (the `t` computed from App.vue) */
  copy: {
    type: Object,
    required: true,
  },
})

const statusFilter = defineModel("statusFilter", { type: String, default: "all" })
const archiveFilter = defineModel("archiveFilter", { type: String, default: "active" })
const limit = defineModel("limit", { type: Number, default: 20 })
const sort = defineModel("sort", { type: String, default: "created_at_desc" })
</script>

<template>
  <div class="section-header">
    <div>
      <h2>{{ copy.comparisonTitle }}</h2>
      <p>{{ copy.comparisonHint }}</p>
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

    <!-- Slot for section-actions so the parent keeps full control of buttons -->
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

.section-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
  letter-spacing: -0.035em;
}

.section-header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
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
</style>
