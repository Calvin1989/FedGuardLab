<script setup>
defineProps({
  copy: { type: Object, required: true },
  jobs: { type: Array, required: true },
});

const emit = defineEmits(["toggle-selection", "toggle-detail"]);
</script>

<template>
  <div class="table-container">
    <table class="base-table jobs-table">
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
          :class="{ 'selected': job.isDetailSelected, 'archived': job.archived }"
          @click="emit('toggle-detail', job.job_id)"
        >
          <td class="job-select-cell" @click.stop>
            <input
              type="checkbox"
              class="checkbox-base"
              :checked="job.isSelected"
              :disabled="!job.canCompare"
              @change="emit('toggle-selection', job.job_id)"
            />
          </td>
          <td>
            <div class="job-label text-h3">{{ job.label }}</div>
            <div class="job-id text-xs text-muted font-mono">{{ job.job_id }}</div>
          </td>
          <td class="text-sm">{{ job.aggregation }}</td>
          <td class="text-sm">{{ job.defense }}</td>
          <td class="text-sm">{{ job.attack }}</td>
          <td class="text-sm font-mono">{{ job.final_accuracy }}</td>
          <td class="text-sm font-mono">{{ job.final_loss }}</td>
          <td class="text-sm font-mono">{{ job.final_asr }}</td>
          <td>
            <div class="job-badges">
              <span v-if="job.archived" class="tag tag-outline archived">{{ copy.archivedBadge }}</span>
              <span v-if="job.has_report" class="tag tag-success">{{ copy.badgeReport }}</span>
              <span v-if="job.hasArtifacts" class="tag tag-primary">{{ copy.badgeArtifacts }}</span>
              <span v-if="!job.has_report && !job.hasArtifacts" class="tag tag-muted">{{ copy.badgeNoReport }}</span>
            </div>
          </td>
          <td>
            <a
              v-if="job.status === 'finished' && job.has_report && job.report_url"
              class="btn btn-secondary btn-sm"
              :href="job.reportUrlWithLang"
              target="_blank"
              @click.stop
            >
              {{ copy.openHtmlReportShort || copy.openHtmlReport }}
            </a>
            <span v-else class="text-muted text-xs">{{ copy.notReady }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.job-row.selected {
  background: var(--color-primary-light);
  box-shadow: inset 4px 0 0 var(--color-primary);
}

.job-row.archived {
  opacity: 0.7;
}

.job-label {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 2px;
}

.job-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.checkbox-base {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.tag-outline {
  background: transparent;
  border: 1px solid var(--color-border-card);
  color: var(--color-text-secondary);
}

.tag-muted {
  background: #f1f5f9;
  color: var(--color-text-muted);
}
</style>
