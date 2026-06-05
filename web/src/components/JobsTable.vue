<script setup>
defineProps({
  copy: { type: Object, required: true },
  jobs: { type: Array, required: true },
});

const emit = defineEmits(["toggle-selection", "toggle-detail"]);
</script>

<template>
  <table class="jobs-table">
    <thead>
      <tr>
        <th>{{ copy.tableSelect }}</th>
        <th>{{ copy.tableExperiment }}</th>
        <th>{{ copy.tableAggregation }}</th>
        <th>{{ copy.tableDefense }}</th>
        <th>{{ copy.tableAttack }}</th>
        <th>{{ copy.tableAccuracy }}</th>
        <th>{{ copy.tableLoss }}</th>
        <th>{{ copy.tableAsr }}</th>
        <th>{{ copy.tableArtifacts }}</th>
        <th>{{ copy.tableReport }}</th>
      </tr>
    </thead>

    <tbody>
      <tr
        v-for="job in jobs"
        :key="job.job_id"
        class="job-row"
        :class="{ 'job-row-selected': job.isDetailSelected, 'selected': job.isDetailSelected, 'archived': job.archived }"
        @click="emit('toggle-detail', job.job_id)"
      >
        <td class="job-select-cell">
          <input
            type="checkbox"
            :checked="job.isSelected"
            :disabled="!job.canCompare"
            @change="emit('toggle-selection', job.job_id)"
          />
        </td>
        <td>
          <div class="job-label">{{ job.label }}</div>
          <div class="job-id">{{ job.job_id }}</div>
        </td>
        <td>{{ job.aggregation }}</td>
        <td>{{ job.defense }}</td>
        <td>{{ job.attack }}</td>
        <td>{{ job.final_accuracy }}</td>
        <td>{{ job.final_loss }}</td>
        <td>{{ job.final_asr }}</td>
        <td>
          <div class="job-badges">
            <span v-if="job.archived" class="job-badge archived">{{ copy.archivedBadge }}</span>
            <span v-if="job.has_report" class="job-badge success">{{ copy.badgeReport }}</span>
            <span v-if="job.hasArtifacts" class="job-badge">{{ copy.badgeArtifacts }}</span>
            <span v-if="!job.has_report && !job.hasArtifacts" class="job-badge muted">{{ copy.badgeNoReport }}</span>
          </div>
        </td>
        <td>
          <a
            v-if="job.status === 'finished' && job.has_report && job.report_url"
            class="report-link"
            :href="job.reportUrlWithLang"
            target="_blank"
          >
            {{ copy.openHtmlReportShort || copy.openHtmlReport }}
          </a>
          <span v-else>{{ copy.notReady }}</span>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.jobs-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 16px;
  background: #ffffff;
  font-size: 12px;
}

.jobs-table th,
.jobs-table td {
  padding: 9px 12px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.88);
  text-align: left;
  vertical-align: middle;
}

.jobs-table th {
  background: #f8fafc;
  color: #334155;
  font-size: 12px;
  font-weight: 900;
}

.jobs-table tr:last-child td {
  border-bottom: 0;
}

.jobs-table input[type="checkbox"] {
  width: 18px;
  height: 18px;
  min-height: 0;
  padding: 0;
  border-radius: 5px;
  cursor: pointer;
}

@media (max-width: 1180px) {
  .jobs-table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
}

/* Row */
.job-row {
  cursor: pointer;
}

.job-row:hover,
.job-row-selected,
.job-row.selected {
  background: rgba(37, 99, 235, 0.04);
}

.job-row.archived {
  opacity: 0.76;
}

.job-row.archived .job-label,
.job-row.archived .job-id {
  color: #64748b;
}

/* Cell content */
.job-label {
  color: #111827;
  font-weight: 900;
}

.job-id {
  margin-top: 2px;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
}

/* Badges */
.job-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.job-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 3px 9px;
  border-radius: 999px;
  background: #edf2ff;
  color: #334155;
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
}

.job-badge.success {
  background: #dcfce7;
  color: #166534;
}

.job-badge.muted {
  background: #f1f5f9;
  color: #64748b;
}

.job-badge.archived {
  border-color: rgba(203, 213, 225, 0.95);
  background: #e2e8f0;
  color: #475569;
}

/* Select cell */
.job-select-cell {
  min-width: 46px;
}

.job-select-cell input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.job-select-cell input[type="checkbox"]:disabled {
  cursor: not-allowed;
}

/* Report link (base + table override) */
.report-link {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 16px;
  border: 1px solid rgba(96, 165, 250, 0.48);
  border-radius: 13px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  word-break: keep-all;
  cursor: pointer;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 9px;
  font-weight: 700;
}

.jobs-table .report-link {
  min-height: 28px;
  padding: 0 10px;
  font-size: 12px;
}

/* Status colors */
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
