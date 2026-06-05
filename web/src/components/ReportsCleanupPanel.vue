<script setup>
defineProps({
  copy: { type: Object, required: true },
  status: { type: String, default: "idle" },
  error: { type: String, default: "" },
  summary: { type: Object, default: null },
  preview: { type: Object, default: () => ({ candidate_count: 0, candidate_size_bytes: 0 }) },
  candidatesForDisplay: { type: Array, default: () => [] },
  hasCandidates: { type: Boolean, default: false },
  runStatus: { type: String, default: "idle" },
  runMode: { type: String, default: "" },
  runBusy: { type: Boolean, default: false },
  runError: { type: String, default: "" },
  runResult: { type: Object, default: null },
  totalSizeLabel: { type: String, default: "0 B" },
  candidateSizeLabel: { type: String, default: "0 B" },
  deletedSizeLabel: { type: String, default: "0 B" },
  oldestModifiedLabel: { type: String, default: "" },
  latestModifiedLabel: { type: String, default: "" },
})

const emit = defineEmits(["refresh", "run-cleanup"]);
</script>

<template>
  <section class="reports-cleanup-panel dashboard-info-panel">
    <div class="reports-cleanup-heading">
      <div class="reports-cleanup-heading-copy">
        <span class="detail-section-title">{{ copy.reportsCleanupTitle }}</span>
        <span class="detail-section-subtitle">{{ copy.reportsCleanupHint }}</span>
      </div>
      <div class="reports-cleanup-actions">
        <button
          class="secondary-button reports-cleanup-action"
          :disabled="status === 'loading' || runBusy"
          @click="emit('refresh')"
        >
          {{ copy.reportsCleanupRefresh }}
        </button>
        <button
          class="secondary-button reports-cleanup-action"
          :disabled="status === 'loading' || runBusy"
          @click="emit('run-cleanup', true)"
        >
          {{ runStatus === "running" && runMode === "dry-run" ? copy.reportsCleanupRunning : copy.reportsCleanupRunDryRun }}
        </button>
        <button
          class="secondary-button reports-cleanup-action reports-cleanup-delete-button"
          :disabled="status === 'loading' || runBusy || !hasCandidates"
          @click="emit('run-cleanup', false)"
        >
          {{ runStatus === "running" && runMode === "delete" ? copy.reportsCleanupDeleting : copy.reportsCleanupDeleteRun }}
        </button>
      </div>
    </div>

    <div v-if="status === 'loading'" class="empty-state small reports-cleanup-empty">
      {{ copy.reportsCleanupLoading }}
    </div>

    <div v-else-if="error" class="comparison-feedback error-feedback reports-cleanup-error">
      <strong>{{ copy.reportsCleanupFailed }}</strong>
      <span>{{ error }}</span>
    </div>

    <div v-else-if="summary" class="reports-cleanup-content">
      <div class="reports-cleanup-mode-row">
        <span class="reports-cleanup-mode-pill safe">
          {{ copy.reportsCleanupDryRun }}
        </span>
        <span class="reports-cleanup-mode-pill muted">
          {{ copy.reportsCleanupSafeMode }}
        </span>
        <span class="reports-cleanup-root" :title="summary.reports_root">
          {{ summary.reports_root }}
        </span>
      </div>

      <div v-if="runError" class="comparison-feedback error-feedback reports-cleanup-error">
        <strong>{{ copy.reportsCleanupRunFailed }}</strong>
        <span>{{ runError }}</span>
      </div>

      <div v-if="runResult" class="reports-cleanup-run-result">
        <div class="reports-cleanup-run-result-heading">
          <strong>{{ copy.reportsCleanupRunResult }}</strong>
          <span>
            {{ runResult.dry_run ? copy.reportsCleanupRunDryResult : copy.reportsCleanupRunDeleteResult }}
          </span>
        </div>
        <div class="reports-cleanup-stats reports-cleanup-run-stats">
          <span class="history-stat">
            <strong>{{ runResult.candidate_count }}</strong>
            <small>{{ copy.reportsCleanupCandidates }}</small>
          </span>
          <span class="history-stat">
            <strong>{{ runResult.deleted_count }}</strong>
            <small>{{ copy.reportsCleanupDeleted }}</small>
          </span>
          <span class="history-stat">
            <strong>{{ deletedSizeLabel }}</strong>
            <small>{{ copy.reportsCleanupDeletedSize }}</small>
          </span>
          <span class="history-stat">
            <strong>{{ runResult.skipped.length }}</strong>
            <small>{{ copy.reportsCleanupSkipped }}</small>
          </span>
          <span class="history-stat">
            <strong>{{ runResult.errors.length }}</strong>
            <small>{{ copy.reportsCleanupErrors }}</small>
          </span>
        </div>
      </div>

      <div class="reports-cleanup-stats">
        <span class="history-stat">
          <strong>{{ totalSizeLabel }}</strong>
          <small>{{ copy.reportsCleanupTotalSize }}</small>
        </span>
        <span class="history-stat">
          <strong>{{ summary.jobs.count || 0 }}</strong>
          <small>{{ copy.reportsCleanupJobReports }}</small>
        </span>
        <span class="history-stat">
          <strong>{{ summary.comparisons.count || 0 }}</strong>
          <small>{{ copy.reportsCleanupComparisonReports }}</small>
        </span>
        <span class="history-stat">
          <strong>{{ preview.candidate_count }}</strong>
          <small>{{ copy.reportsCleanupCandidates }}</small>
        </span>
        <span class="history-stat">
          <strong>{{ candidateSizeLabel }}</strong>
          <small>{{ copy.reportsCleanupCandidateSize }}</small>
        </span>
        <span class="history-stat">
          <strong>{{ summary.keep_latest_per_kind }}</strong>
          <small>{{ copy.reportsCleanupKeepLatest }}</small>
        </span>
      </div>

      <div class="reports-cleanup-meta">
        <span>
          <strong>{{ copy.reportsCleanupOldest }}</strong>
          {{ oldestModifiedLabel }}
        </span>
        <span>
          <strong>{{ copy.reportsCleanupLatest }}</strong>
          {{ latestModifiedLabel }}
        </span>
      </div>

      <div class="reports-cleanup-candidates">
        <div class="reports-cleanup-candidates-heading">
          <strong>{{ copy.reportsCleanupCandidatePreview }}</strong>
          <span>{{ preview.candidate_count }}</span>
        </div>

        <div
          v-if="candidatesForDisplay.length === 0"
          class="empty-state small reports-cleanup-empty"
        >
          {{ copy.reportsCleanupNoCandidates }}
        </div>

        <div v-else class="reports-cleanup-candidate-list">
          <div
            v-for="item in candidatesForDisplay"
            :key="`${item.kind}:${item.id}`"
            class="reports-cleanup-candidate"
          >
            <div>
              <strong>{{ item.id }}</strong>
              <span>{{ item.kind }}</span>
            </div>
            <div class="reports-cleanup-candidate-meta">
              <span>{{ item.sizeLabel }}</span>
              <span>{{ item.modifiedAtLabel }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dashboard-info-panel {
  margin-top: 0;
  padding: 0;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 10px;
  background: #ffffff;
  overflow: hidden;
}

/* Reports cleanup panel and cleanup run result */
.reports-cleanup-content {
  display: grid;
  gap: 0;
}

.reports-cleanup-stats {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0;
}

.reports-cleanup-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  color: #64748b;
  font-size: 12px;
  padding: 10px 14px;
  border-top: 1px solid rgba(148, 163, 184, 0.08);
}

.reports-cleanup-meta strong {
  margin-right: 4px;
  color: #334155;
  font-weight: 600;
}

.reports-cleanup-candidates {
  display: grid;
  gap: 0;
  padding-top: 0;
  border-top: 1px solid rgba(148, 163, 184, 0.08);
}

.reports-cleanup-candidates-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #0f172a;
  font-size: 12px;
  font-weight: 600;
  padding: 10px 14px;
  background: #f8fafc;
}

.reports-cleanup-candidates-heading span {
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
}

.reports-cleanup-candidate-list {
  display: grid;
  gap: 0;
}

.reports-cleanup-candidate {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 6px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.06);
  background: transparent;
  transition: background 0.12s ease;
}

.reports-cleanup-candidate:last-child {
  border-bottom: none;
}

.reports-cleanup-candidate:hover {
  background: #f8fafc;
}

.reports-cleanup-candidate strong {
  display: block;
  overflow: hidden;
  color: #0f172a;
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reports-cleanup-candidate span {
  color: #94a3b8;
  font-size: 11px;
}

.reports-cleanup-candidate-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  white-space: nowrap;
}

/* Reports cleanup run controls */

.secondary-button {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 6px;
  background: #ffffff;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    color 0.16s ease;
}

.secondary-button:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.secondary-button:not(:disabled):hover {
  background: #f8fafc;
  border-color: rgba(148, 163, 184, 0.36);
}

.secondary-button:focus-visible,
.reports-cleanup-delete-button:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.5);
  outline-offset: 2px;
}

.reports-cleanup-delete-button:focus-visible {
  outline-color: rgba(220, 38, 38, 0.5);
}

.reports-cleanup-action {
  min-height: 32px;
  padding: 0 12px;
  white-space: nowrap;
}

.reports-cleanup-delete-button {
  border-color: rgba(220, 38, 38, 0.24);
  background: #ffffff;
  color: #be123c;
}

.reports-cleanup-delete-button:not(:disabled):hover {
  border-color: rgba(220, 38, 38, 0.4);
  background: #fff5f5;
  color: #9f1239;
}

.reports-cleanup-run-result {
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid rgba(37, 99, 235, 0.12);
  border-radius: 8px;
  background: #f8fafc;
  margin: 12px 14px;
}

.reports-cleanup-run-result-heading {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  align-items: center;
  justify-content: space-between;
  color: #0f172a;
  font-size: 12px;
  font-weight: 600;
}

.reports-cleanup-run-result-heading span {
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
}

.reports-cleanup-run-stats {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

/* Run and reports page layout polish */
.reports-cleanup-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 0;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  background: #f8fafc;
}

.reports-cleanup-heading-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.reports-cleanup-heading .detail-section-title {
  display: block;
  margin: 0;
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
}

.reports-cleanup-heading .detail-section-subtitle {
  display: block;
  max-width: 760px;
  margin: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
}

.reports-cleanup-actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  justify-content: flex-end;
}

.reports-cleanup-mode-row {
  display: flex;
  align-items: center;
  min-width: 0;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  background: #f8fafc;
}

.reports-cleanup-mode-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1;
  white-space: nowrap;
  text-transform: uppercase;
}

.reports-cleanup-mode-pill.safe {
  border: 1px solid rgba(34, 197, 94, 0.2);
  background: #f0fdf4;
  color: #166534;
}

.reports-cleanup-mode-pill.muted {
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: #f8fafc;
  color: #64748b;
}

.reports-cleanup-root {
  min-width: 0;
  overflow: hidden;
  color: #94a3b8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Shared utility classes */
.history-stat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  min-height: 52px;
  padding: 8px 14px;
  border-right: 1px solid rgba(148, 163, 184, 0.08);
  background: transparent;
}

.history-stat:last-child {
  border-right: none;
}

.history-stat strong {
  overflow: hidden;
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.history-stat small {
  color: #94a3b8;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.empty-state {
  width: 100%;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #94a3b8;
  text-align: center;
  font-size: 12px;
  line-height: 1.5;
}

.empty-state.small {
  min-height: 48px;
  margin-top: 8px;
}

.comparison-feedback,
.error-feedback {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 8px;
  background: #f8fafc;
}

.error-feedback {
  background: #fff1f2;
  color: #9f1239;
}

/* Responsive */
@media (max-width: 1024px) {
  .reports-cleanup-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .history-stat {
    border-bottom: 1px solid rgba(148, 163, 184, 0.06);
  }
}

@media (max-width: 760px) {
  .reports-cleanup-run-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .reports-cleanup-heading {
    flex-direction: column;
    align-items: stretch;
  }

  .reports-cleanup-actions {
    justify-content: stretch;
  }

  .reports-cleanup-actions .reports-cleanup-action {
    flex: 1 1 140px;
  }
}

@media (max-width: 640px) {
  .reports-cleanup-stats,
  .reports-cleanup-candidate {
    grid-template-columns: 1fr;
  }

  .reports-cleanup-candidate-meta {
    align-items: flex-start;
  }
}
</style>
