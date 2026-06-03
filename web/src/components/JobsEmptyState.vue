<script setup>
/**
 * JobsEmptyState — placeholder shown when the jobs list is empty.
 *
 * Displays different copy depending on whether the user is viewing
 * all statuses or a filtered subset.
 *
 * Pure display; all values received via props.
 */
defineProps({
  /** Localised UI copy (the `t` computed from App.vue) */
  copy: {
    type: Object,
    required: true,
  },
  /** Current status filter value ("all", "finished_report", etc.) */
  statusFilter: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="empty-state small comparison-empty-state">
    <template v-if="statusFilter === 'all'">
      <strong>{{ copy.emptyAllStatuses }}</strong>
      <span>{{ copy.emptyAllStatusesHint }}</span>
    </template>
    <template v-else-if="statusFilter === 'finished_report'">
      <strong>{{ copy.emptyAll }}</strong>
      <span>{{ copy.emptyAllHint }}</span>
    </template>
    <template v-else>
      <strong>{{ copy.emptyFiltered.replace('{status}', copy.statusValues[statusFilter] || statusFilter) }}</strong>
      <span>{{ copy.emptyFilteredHint }}</span>
    </template>
  </div>
</template>

<style scoped>
.empty-state {
  width: 100%;
  min-height: 82px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 18px;
  border: 1px dashed rgba(148, 163, 184, 0.34);
  border-radius: 18px;
  color: #64748b;
  text-align: center;
  font-size: 13px;
  line-height: 1.6;
}

.empty-state.small {
  min-height: 70px;
  margin-top: 16px;
}

.empty-state strong {
  color: #334155;
  font-size: 13px;
}

.empty-state span {
  margin-top: 4px;
  font-size: 12px;
}
</style>
