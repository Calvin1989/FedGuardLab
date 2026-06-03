<script setup>
/**
 * SelectedJobsPreview — chip list of currently selected jobs
 * shown at the top of the comparisons panel.
 *
 * Pure display; all data received via props.
 */
defineProps({
  /** Localised UI copy (the `t` computed from App.vue) */
  copy: {
    type: Object,
    required: true,
  },
  /** Array of resolved job objects for the selected job IDs */
  selectedJobs: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <div class="selected-jobs-preview">
    <div class="selected-jobs-header">
      <p class="section-kicker">{{ copy.selectedJobsTitle }}</p>
    </div>

    <div class="selected-jobs-list">
      <div
        v-for="job in selectedJobs"
        :key="job.job_id"
        class="selected-job-chip"
      >
        <span class="selected-job-id">{{ job.job_id.slice(0, 8) }}</span>
        <span class="selected-job-name">
          {{ job.experiment_name || job.config_path || "—" }}
        </span>
        <span
          class="selected-job-status"
          :class="'status-' + (job.status || '')"
        >
          {{ copy.statusValues[job.status] || job.status || "—" }}
        </span>
        <span class="selected-job-time">
          {{ job.finished_at || job.created_at || "—" }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.selected-jobs-preview {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.20);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.72);
}

.selected-jobs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-kicker {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.selected-jobs-list {
  display: grid;
  gap: 8px;
}

.selected-job-chip {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr) auto auto;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 14px;
  background: #ffffff;
  color: #334155;
  font-size: 12px;
}

.selected-job-id {
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.selected-job-name {
  min-width: 0;
  overflow: hidden;
  color: #111827;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-job-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
}

.selected-job-time {
  color: #94a3b8;
  font-size: 11px;
}

.status-idle,
.status-queued {
  background: #eef2ff;
  color: #475569;
}

.status-running,
.status-creating {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-finished {
  background: #dcfce7;
  color: #166534;
}

.status-cancelled {
  background: #f1f5f9;
  color: #475569;
}

.status-failed,
.status-error,
.status-disconnected {
  background: #fee2e2;
  color: #991b1b;
}
</style>
