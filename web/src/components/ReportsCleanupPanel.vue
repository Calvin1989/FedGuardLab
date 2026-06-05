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
  <section class="reports-cleanup-panel card-base animate-fade-in">
    <!-- Explanation Header -->
    <div class="reports-maintenance-header">
      <div class="header-icon">💾</div>
      <div class="header-text">
        <h3 class="text-h3">{{ copy.reportsCleanupTitle }}</h3>
        <p class="text-secondary">{{ copy.reportsCleanupHint }}</p>
      </div>
      <div class="reports-cleanup-actions-top">
        <button
          class="btn btn-secondary"
          :disabled="status === 'loading' || runBusy"
          @click="emit('run-cleanup', true)"
        >
          <span>🔍</span>
          {{ runStatus === "running" && runMode === "dry-run" ? copy.reportsCleanupRunning : copy.reportsCleanupRunDryRun }}
        </button>
        <button
          class="btn btn-danger-outline"
          :disabled="status === 'loading' || runBusy || !hasCandidates"
          @click="emit('run-cleanup', false)"
        >
          <span>🧹</span>
          {{ runStatus === "running" && runMode === "delete" ? copy.reportsCleanupDeleting : copy.reportsCleanupDeleteRun }}
        </button>
        <button
          class="btn btn-outline"
          :disabled="status === 'loading' || runBusy"
          @click="emit('refresh')"
        >
          <span>🔄</span>
          {{ copy.reportsCleanupRefresh }}
        </button>
      </div>
    </div>

    <div v-if="status === 'loading'" class="empty-state small">
      {{ copy.reportsCleanupLoading }}
    </div>

    <div v-else-if="error" class="error-feedback">
      <strong>{{ copy.reportsCleanupFailed }}</strong>
      <span>{{ error }}</span>
    </div>

    <div v-else-if="summary" class="reports-cleanup-content">
      <!-- Running Results -->
      <div v-if="runError" class="error-feedback">
        <strong>{{ copy.reportsCleanupRunFailed }}</strong>
        <span>{{ runError }}</span>
      </div>

      <div v-if="runResult" class="reports-cleanup-run-result">
        <div class="reports-cleanup-run-result-heading">
          <div class="flex items-center gap-2">
            <span class="text-xl">✨</span>
            <h3 class="text-h3">{{ copy.reportsCleanupRunResult }}</h3>
          </div>
          <span class="tag tag-primary">
            {{ runResult.dry_run ? copy.reportsCleanupRunDryResult : copy.reportsCleanupRunDeleteResult }}
          </span>
        </div>
        <div class="reports-cleanup-stats-grid">
          <div class="stat-card">
            <span class="stat-icon">📂</span>
            <span class="stat-value">{{ runResult.candidate_count }}</span>
            <span class="stat-label">{{ copy.reportsCleanupCandidates }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🗑️</span>
            <span class="stat-value">{{ runResult.deleted_count }}</span>
            <span class="stat-label">{{ copy.reportsCleanupDeleted }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">📉</span>
            <span class="stat-value">{{ deletedSizeLabel }}</span>
            <span class="stat-label">{{ copy.reportsCleanupDeletedSize }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">⏩</span>
            <span class="stat-value">{{ runResult.skipped.length }}</span>
            <span class="stat-label">{{ copy.reportsCleanupSkipped }}</span>
          </div>
        </div>
      </div>

      <!-- Current Statistics -->
      <div class="stats-section">
        <div class="section-title-row">
          <h4 class="text-sm font-bold uppercase tracking-wider text-muted">{{ copy.reportsCleanupOverview }}</h4>
        </div>
        <div class="reports-cleanup-stats-grid">
          <div class="stat-card stat-card-highlight">
            <span class="stat-icon">📊</span>
            <span class="stat-value">{{ totalSizeLabel }}</span>
            <span class="stat-label">{{ copy.reportsCleanupTotalSize }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">📄</span>
            <span class="stat-value">{{ summary.total_count }}</span>
            <span class="stat-label">{{ copy.reportsCleanupTotalCount }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">⏳</span>
            <span class="stat-value">{{ preview.candidate_count }}</span>
            <span class="stat-label">{{ copy.reportsCleanupCandidates }}</span>
          </div>
          <div class="stat-card stat-card-warning" v-if="preview.candidate_count > 0">
            <span class="stat-icon">⚠️</span>
            <span class="stat-value">{{ candidateSizeLabel }}</span>
            <span class="stat-label">{{ copy.reportsCleanupCandidateSize }}</span>
          </div>
          <div class="stat-card stat-card-success" v-else>
            <span class="stat-icon">✅</span>
            <span class="stat-value">{{ copy.reportsCleanupOptimal }}</span>
            <span class="stat-label">{{ copy.reportsCleanupStorageStatus }}</span>
          </div>
        </div>
      </div>

      <!-- Preview Table -->
      <div v-if="hasCandidates" class="reports-cleanup-preview-section">
        <div class="preview-header">
          <span class="text-lg">📋</span>
          <h3 class="text-h3">{{ copy.reportsCleanupCandidatePreview }}</h3>
          <p class="text-xs text-muted">{{ copy.reportsCleanupPreviewLimit }}</p>
        </div>
        <div class="table-container">
          <table class="base-table">
            <thead>
              <tr>
                <th>{{ copy.reportsCleanupCandidateName }}</th>
                <th>{{ copy.reportsCleanupCandidateType }}</th>
                <th>{{ copy.reportsCleanupCandidateSize }}</th>
                <th>{{ copy.reportsCleanupCandidateModified }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in candidatesForDisplay" :key="item.id">
                <td class="text-sm font-semibold">
                  <span class="file-icon">{{ item.type === 'job' ? '📁' : '📊' }}</span>
                  {{ item.name }}
                </td>
                <td>
                  <span class="tag tag-outline text-xs">{{ item.type }}</span>
                </td>
                <td class="text-sm font-mono">{{ item.sizeLabel }}</td>
                <td class="text-sm text-muted">{{ item.modifiedAtLabel }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.reports-cleanup-panel {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.reports-maintenance-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 20px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border-card);
}

.header-icon {
  font-size: 40px;
  background: var(--color-primary-light);
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
}

.header-text h3 {
  margin: 0 0 4px 0;
}

.header-text p {
  margin: 0;
  font-size: 14px;
}

.reports-cleanup-actions-top {
  display: flex;
  gap: 12px;
}

.reports-cleanup-content {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.reports-cleanup-run-result {
  padding: 24px;
  background: var(--color-success-light);
  border: 1px solid var(--color-success-border);
  border-radius: var(--radius-xl);
}

.reports-cleanup-run-result-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.stats-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title-row {
  padding-left: 4px;
}

.reports-cleanup-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: white;
  border: 1px solid var(--color-border-card);
  border-radius: var(--radius-lg);
  text-align: center;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary-border);
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 12px;
  opacity: 0.8;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text-main);
  margin-bottom: 4px;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.stat-card-highlight {
  background: var(--color-primary-light);
  border-color: var(--color-primary-border);
}

.stat-card-highlight .stat-value {
  color: var(--color-primary);
}

.stat-card-warning {
  background: var(--color-warning-light);
  border-color: var(--color-warning-border);
}

.stat-card-warning .stat-value {
  color: var(--color-warning);
}

.stat-card-success {
  background: var(--color-success-light);
  border-color: var(--color-success-border);
}

.stat-card-success .stat-value {
  color: var(--color-success);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.file-icon {
  margin-right: 8px;
  font-size: 16px;
}

@media (max-width: 1024px) {
  .reports-maintenance-header {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .header-icon {
    margin: 0 auto;
  }
  .reports-cleanup-actions-top {
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .reports-cleanup-actions-top {
    flex-direction: column;
    width: 100%;
  }
  .reports-cleanup-actions-top .btn {
    width: 100%;
  }
}
</style>
