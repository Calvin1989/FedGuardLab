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

function getStatusClass(status) {
  if (status === 'finished') return 'success';
  if (status === 'running' || status === 'creating') return 'primary';
  if (status === 'failed') return 'danger';
  if (status === 'queued') return 'warning';
  return 'muted';
}
</script>

<template>
  <div class="selected-jobs-preview card-base">
    <div class="selected-jobs-header">
      <h3 class="text-h3">{{ copy.selectedJobsTitle }}</h3>
      <span class="tag tag-primary">{{ selectedJobs.length }}</span>
    </div>

    <div class="selected-jobs-list">
      <div
        v-for="job in selectedJobs"
        :key="job.job_id"
        class="selected-job-chip"
      >
        <span class="job-id text-xs text-muted font-mono">{{ job.job_id.slice(0, 8) }}</span>
        <span class="job-name text-sm font-semibold">
          {{ job.experiment_name || job.config_path || "—" }}
        </span>
        <span
          class="tag text-xs"
          :class="'tag-' + getStatusClass(job.status)"
        >
          {{ copy.statusValues[job.status] || job.status || "—" }}
        </span>
        <span class="job-time text-xs text-muted">
          {{ job.finished_at || job.created_at || "—" }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.selected-jobs-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.selected-jobs-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-jobs-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.selected-job-chip {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  grid-template-areas:
    "id name status"
    "id time status";
  gap: 4px 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--color-border-card);
  border-radius: var(--radius-md);
  background: white;
  transition: all var(--transition-fast);
}

.selected-job-chip:hover {
  border-color: var(--color-primary-border);
  box-shadow: var(--shadow-sm);
}

.job-id { grid-area: id; }
.job-name { grid-area: name; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.job-time { grid-area: time; }
.tag { grid-area: status; }

@media (max-width: 640px) {
  .selected-jobs-list {
    grid-template-columns: 1fr;
  }
}
</style>
