<script setup>
/**
 * JobDetailMetricGrid — displays job detail metadata in a 4-column grid.
 *
 * Pure display; all values received via props.
 */
defineProps({
  /** Localised UI copy (the `t` computed from App.vue) */
  copy: {
    type: Object,
    required: true,
  },
  /** The selected job object */
  job: {
    type: Object,
    required: true,
  },
  /** Pre-computed artifact count */
  artifactsCount: {
    type: Number,
    default: 0,
  },
})
</script>

<template>
  <div class="job-detail-grid">
    <div class="detail-item detail-item-wide">
      <span>{{ copy.jobDetailId }}</span>
      <strong>{{ job.job_id || "—" }}</strong>
    </div>

    <div class="detail-item">
      <span>{{ copy.jobDetailStatus }}</span>
      <strong>{{ copy.statusValues[job.status] || job.status || "—" }}</strong>
    </div>

    <div class="detail-item">
      <span>{{ copy.jobDetailArtifacts }}</span>
      <strong>{{ artifactsCount }}</strong>
    </div>

    <div class="detail-item detail-item-wide">
      <span>{{ copy.jobDetailConfig }}</span>
      <strong>{{ job.config_path || "—" }}</strong>
    </div>

    <div class="detail-item">
      <span>{{ copy.jobDetailCreated }}</span>
      <strong>{{ job.created_at || "—" }}</strong>
    </div>

    <div class="detail-item">
      <span>{{ copy.jobDetailStarted }}</span>
      <strong>{{ job.started_at || "—" }}</strong>
    </div>

    <div class="detail-item">
      <span>{{ copy.jobDetailFinished }}</span>
      <strong>{{ job.finished_at || "—" }}</strong>
    </div>

    <div class="detail-item">
      <span>{{ copy.jobDetailReport }}</span>
      <strong>{{ job.has_report ? copy.available : copy.notReady }}</strong>
    </div>

    <div v-if="job.config && job.config.experiment" class="detail-item highlight-item">
      <span>{{ copy.roundsLabel }}</span>
      <strong>{{ job.config.experiment.rounds || "—" }}</strong>
    </div>

    <div v-if="job.config && job.config.federated" class="detail-item highlight-item">
      <span>{{ copy.clientsLabel }}</span>
      <strong>{{ job.config.federated.num_clients || "—" }}</strong>
    </div>

    <div v-if="job.config && job.config.federated" class="detail-item highlight-item">
      <span>{{ copy.maliciousClientsLabel }}</span>
      <strong>{{ job.config.federated.malicious_clients ?? "—" }}</strong>
    </div>

    <div v-if="job.config && job.config.training" class="detail-item highlight-item">
      <span>{{ copy.lrLabel }}</span>
      <strong>{{ job.config.training.learning_rate || "—" }}</strong>
    </div>
  </div>
</template>

<style scoped>
.job-detail-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.job-detail-grid .detail-item-wide {
  grid-column: span 2;
}

.detail-item {
  min-width: 0;
  min-height: 54px;
  padding: 10px 12px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 14px;
  background: #ffffff;
}

.detail-item.highlight-item {
  background: var(--color-primary-light);
  border-color: var(--color-primary-border);
}

.detail-item.highlight-item span {
  color: var(--color-primary);
}

.detail-item.highlight-item strong {
  color: var(--color-primary-dark, #1e40af);
  font-size: 15px;
  font-weight: 800;
}

.detail-item span {
  display: block;
  margin-bottom: 3px;
  color: #64748b;
  font-size: 11px;
  font-weight: 900;
}

.detail-item strong {
  display: block;
  color: #111827;
  font-size: 13px;
  line-height: 1.22;
  overflow-wrap: anywhere;
}

@media (max-width: 1180px) {
  .job-detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .job-detail-grid .detail-item-wide {
    grid-column: 1 / -1;
  }
}

@media (max-width: 860px) {
  .job-detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .job-detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
