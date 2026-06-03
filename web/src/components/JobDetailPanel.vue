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
  <div class="job-detail-panel">
    <div class="job-detail-header">
      <div class="job-detail-title-stack">
        <p class="detail-section-title">{{ copy.jobDetailTitle }}</p>
        <h2 class="detail-section-main-title">{{ job.label || job.experiment_name || job.config_path || "—" }}</h2>
        <div class="job-detail-meta">
          <span
            class="job-detail-meta-pill"
            :class="{ ready: isComparable }"
          >
            {{ isComparable ? copy.comparisonReady : copy.comparisonUnavailable }}
          </span>
          <span
            v-if="job.archived"
            class="job-detail-meta-pill archived"
          >
            {{ copy.archivedBadge }}
          </span>
          <span
            v-if="!job.has_report"
            class="job-detail-meta-pill"
          >
            {{ copy.reportUnavailable }}
          </span>
        </div>
      </div>

      <div class="job-detail-actions">
        <button
          class="secondary-button detail-archive-button"
          :disabled="isActionDisabled"
          :title="copy.archiveHint"
          @click="emit('archive')"
        >
          {{ job.archived ? copy.restoreAction : copy.archiveAction }}
        </button>

        <a
          v-if="job.has_report && reportHtmlUrl"
          class="report-link detail-report-link"
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
      <h3 class="detail-exports-title">{{ copy.exportsTitle }}</h3>
      <div class="detail-exports-grid">
        <template v-for="item in exportItems" :key="item.label">
          <a
            v-if="!item.disabled && item.url"
            class="detail-export-item"
            :href="item.url"
            target="_blank"
            rel="noreferrer"
          >
            <span class="detail-export-icon">{{ item.icon }}</span>
            <span class="detail-export-label">{{ item.label }}</span>
          </a>
          <span v-else class="detail-export-item disabled">
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
  gap: 12px;
}

.job-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 0;
}

.job-detail-title-stack {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
}

.detail-section-title {
  margin: 0;
  color: #0f172a;
  font-size: 14px;
  font-weight: 900;
  letter-spacing: -0.01em;
  line-height: 1.2;
  text-transform: none;
}

.detail-section-main-title {
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.2;
}

.job-detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.job-detail-meta-pill {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 999px;
  background: #f8fafc;
  color: #64748b;
  font-size: 10px;
  font-weight: 800;
}

.job-detail-meta-pill.ready {
  border-color: rgba(187, 247, 208, 0.95);
  background: #dcfce7;
  color: #15803d;
}

.job-detail-meta-pill.archived {
  border-color: rgba(203, 213, 225, 0.95);
  background: #e2e8f0;
  color: #475569;
}

.job-detail-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.secondary-button {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(96, 165, 250, 0.48);
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  word-break: keep-all;
  cursor: pointer;
  box-shadow: none;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    background-color 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.secondary-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.secondary-button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.12);
}

.detail-archive-button {
  min-height: 34px;
  padding: 0 12px;
}

.report-link {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 11px;
  border: 1px solid rgba(96, 165, 250, 0.48);
  border-radius: 9px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: none;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    background-color 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.report-link:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.12);
}

.detail-exports {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 0;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 14px;
  background: #f8fafc;
}

.detail-exports-title {
  flex: 0 0 auto;
  margin: 0 0 10px;
  color: #0f172a;
  font-size: 14px;
}

.detail-exports-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
}

.detail-export-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid rgba(96, 165, 250, 0.48);
  border-radius: 9px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: none;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    background-color 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
  min-width: 0;
}

.detail-export-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.12);
}

.detail-export-item.disabled {
  opacity: 0.52;
  cursor: not-allowed;
}

.detail-export-icon {
  display: inline-flex;
  min-width: 16px;
  justify-content: center;
  font-size: 12px;
}

@media (max-width: 720px) {
  .job-detail-header,
  .job-detail-actions,
  .detail-exports {
    align-items: stretch;
    flex-direction: column;
  }

  .detail-exports-title {
    width: 100%;
  }
}
</style>
