<script setup>
/**
 * JobDetailPanel — displays job detail header, metric grid, exports,
 * and event timeline for the selected job.
 *
 * Pure display; all values received via props.
 * Emits "archive" when the user clicks the archive/restore button.
 */
import JobDetailMetricGrid from "./JobDetailMetricGrid.vue";
import JobEventTimeline from "./JobEventTimeline.vue";

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
  /** Whether the job is eligible for comparison */
  isComparable: {
    type: Boolean,
    default: false,
  },
  /** Whether archive/restore action is in progress */
  isActionDisabled: {
    type: Boolean,
    default: false,
  },
  /** Pre-computed HTML report URL (with lang param) */
  reportHtmlUrl: {
    type: String,
    default: "",
  },
  /** Pre-computed export items: [{url, icon, label, disabled}] */
  exportItems: {
    type: Array,
    default: () => [],
  },
  /** Pre-computed lifecycle display events */
  lifecycleEvents: {
    type: Array,
    default: () => [],
  },
  /** Pre-computed round display events */
  roundEvents: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["archive"]);
</script>

<template>
  <div v-if="job" class="job-detail-panel animate-fade-in">
    <div class="job-detail-header">
      <div class="job-detail-title-stack">
        <p class="detail-section-title">{{ copy.jobDetailTitle }}</p>
        <h2 class="text-h2">{{ job.label || job.experiment_name || job.config_path || "—" }}</h2>
        <div class="job-detail-meta">
          <span
            class="tag"
            :class="isComparable ? 'tag-success' : 'tag-muted'"
          >
            {{ isComparable ? copy.comparisonReady : copy.comparisonUnavailable }}
          </span>
          <span
            v-if="job.archived"
            class="tag tag-warning"
          >
            {{ copy.archivedBadge }}
          </span>
          <span
            v-if="!job.has_report"
            class="tag tag-danger"
          >
            {{ copy.reportUnavailable }}
          </span>
        </div>
      </div>

      <div class="job-detail-actions">
        <button
          class="btn btn-outline"
          :disabled="isActionDisabled"
          :title="copy.archiveHint"
          @click="emit('archive')"
        >
          {{ job.archived ? copy.restoreAction : copy.archiveAction }}
        </button>

        <a
          v-if="job.has_report && reportHtmlUrl"
          class="btn btn-primary"
          :href="reportHtmlUrl"
          target="_blank"
          rel="noreferrer"
        >
          {{ copy.openHtmlReportShort || copy.openHtmlReport }}
        </a>
      </div>
    </div>

    <JobDetailMetricGrid
      :copy="copy"
      :job="job"
      :artifacts-count="artifactsCount"
    />

    <div v-if="job.has_report" class="detail-exports">
      <h3 class="text-h3">{{ copy.exportsTitle }}</h3>
      <div class="detail-exports-grid">
        <template v-for="item in exportItems" :key="item.key">
          <a
            v-if="!item.disabled && item.url"
            class="btn btn-secondary btn-sm"
            :href="item.url"
            target="_blank"
            rel="noreferrer"
          >
            <span class="detail-export-icon">{{ item.icon }}</span>
            <span class="detail-export-label">{{ item.label }}</span>
          </a>
          <span v-else class="btn btn-secondary btn-sm disabled">
            <span class="detail-export-icon">{{ item.icon }}</span>
            <span class="detail-export-label">{{ item.label }}</span>
          </span>
        </template>
      </div>
    </div>

    <JobEventTimeline
      :copy="copy"
      :lifecycle-events="lifecycleEvents"
      :round-events="roundEvents"
    />
  </div>
</template>

<style scoped>
.job-detail-panel {
  display: grid;
  gap: 24px;
  padding: 24px;
  border-radius: var(--radius-lg);
  background: var(--color-bg-page);
  border: 1px solid var(--color-border-card);
}

.job-detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.job-detail-title-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.detail-section-title {
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.job-detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.job-detail-actions {
  display: flex;
  gap: 12px;
}

.detail-exports {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: white;
  border: 1px solid var(--color-border-card);
  border-radius: var(--radius-lg);
}

.detail-exports-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.detail-export-icon {
  font-size: 14px;
}

.tag-muted {
  background: var(--color-border-card);
  color: var(--color-text-secondary);
}

@media (max-width: 720px) {
  .job-detail-header {
    flex-direction: column;
    gap: 16px;
  }

  .job-detail-actions {
    width: 100%;
  }

  .job-detail-actions > * {
    flex: 1;
  }
}
</style>
