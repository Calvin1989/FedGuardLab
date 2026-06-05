<script setup>
import DashboardSectionHeading from "./components/DashboardSectionHeading.vue";
import GlobalToolbar from "./components/GlobalToolbar.vue";
import HistoryManagementStrip from "./components/HistoryManagementStrip.vue";
import JobsEmptyState from "./components/JobsEmptyState.vue";
import JobsSectionHeader from "./components/JobsSectionHeader.vue";
import JobsTable from "./components/JobsTable.vue";
import ConfigPreview from "./components/ConfigPreview.vue";
import DashboardSectionNav from "./components/DashboardSectionNav.vue";
import ComparisonInsightsPanel from "./components/ComparisonInsightsPanel.vue";
import ComparisonResultCard from "./components/ComparisonResultCard.vue";
import ComparisonHistoryPanel from "./components/ComparisonHistoryPanel.vue";
import ComparisonStatusFeedback from "./components/ComparisonStatusFeedback.vue";
import JobDetailPanel from "./components/JobDetailPanel.vue";
import LeaderboardPanel from "./components/LeaderboardPanel.vue";
import SelectedJobsPreview from "./components/SelectedJobsPreview.vue";
import ReportsCleanupPanel from "./components/ReportsCleanupPanel.vue";
import RunCommandPanel from "./components/RunCommandPanel.vue";
import RuntimeMonitorPanel from "./components/RuntimeMonitorPanel.vue";
import { useI18n } from "./composables/useI18n.js";
import { useExperimentOptions } from "./composables/useExperimentOptions.js";
import { useReportsCleanup } from "./composables/useReportsCleanup.js";
import { useRecentJobs } from "./composables/useRecentJobs.js";
import { useComparison } from "./composables/useComparison.js";
import { useRuntimeMonitor } from "./composables/useRuntimeMonitor.js";
import {
  formatDisplayValue as formatDisplayValueBase,
  formatMetricValue as formatMetricValueBase,
  titleizeDisplayValue as titleizeDisplayValueBase,
  formatComparisonMetric as formatComparisonMetricBase,
  formatStorageBytes as formatStorageBytesBase,
  eventIcon as eventIconBase,
  formatAttackDisplay as formatAttackDisplayBase,
  formatDefenseDisplay as formatDefenseDisplayBase,
  formatEventMessage as formatEventMessageBase,
  formatEventTime as formatEventTimeBase,
  jobArtifactUrl as jobArtifactUrlBase,
  comparisonHistoryArtifactUrl as comparisonHistoryArtifactUrlBase,
  hasArtifacts as hasArtifactsBase,
} from "./composables/dashboardFormatters.js";
import { computed, onMounted, ref, watch } from "vue";

const API_BASE = "http://127.0.0.1:8000";
const WS_BASE = "ws://127.0.0.1:8000";

const errorMessage = ref("");

const DASHBOARD_SECTION_STORAGE_KEY = "fedguardlab_dashboard_section";

const {
  language,
  t,
  setLanguage,
  withLang,
  getConfigKey,
  getLocalizedConfigDisplay,
  formatConfigTag,
} = useI18n();

function formatAttackDisplay(attackConfig, fallbackValue = "") {
  return formatAttackDisplayBase({ t, language }, attackConfig, fallbackValue);
}

function formatDefenseDisplay(defenseConfig, fallbackValue = "") {
  return formatDefenseDisplayBase({ t, language }, defenseConfig, fallbackValue);
}

const {
  selectedConfig,
  experimentOptions,
  selectedCategory,
  selectedConfigOption,
  selectedExperimentDescription,
  selectedConfigPreview,
  displayConfigPreview,
  selectedConfigMetadata,
  configCategories,
  filteredExperimentOptions,
  loadExperimentOptions,
  getSelectedExperimentLabel,
} = useExperimentOptions({
  API_BASE,
  errorMessage,
  t,
  getLocalizedConfigDisplay,
  formatConfigTag,
  formatAttackDisplay,
  formatDefenseDisplay,
});

let _resetComparisonResult = () => {};

function resetComparisonAfterJobsChanged() {
  _resetComparisonResult();
}

const {
  recentJobs,
  jobStatusFilter,
  jobArchiveFilter,
  recentJobsLimit,
  recentJobsSort,
  selectedJobIds,
  selectedDetailJobId,
  historyActionError,
  historyActionStatus,
  canSelectJobForComparison,
  accuracyLeaderboard,
  asrLeaderboard,
  comparableJobsCount,
  historyArchiveFilterLabel,
  toggleJobSelection,
  loadHiddenJobIds,
  saveHiddenJobIds,
  hideJobIds,
  unhideJobId,
  loadRecentJobs,
  mapApiJobToRecentJob,
  loadRecentJobsFromApi,
  selectedDetailJob,
  recentJobsForDisplay,
  selectedDetailArtifactsCount,
  selectedJobsForPreview,
  selectedLifecycleEvents,
  selectedRoundEvents,
  detailExportItems,
  lifecycleDisplayEvents,
  roundDisplayEvents,
  toggleDetailJob,
  setJobArchived,
  saveRecentJobs,
  buildComparisonTitle,
  clearRecentJobs,
  deleteSelectedJobs,
} = useRecentJobs({
  API_BASE,
  t,
  withLang,
  jobArtifactUrl,
  hasArtifacts,
  formatDisplayValue: formatDisplayValueBase,
  formatMetricValue: formatMetricValueBase,
  titleizeDisplayValue: titleizeDisplayValueBase,
  formatEventMessage,
  formatEventTime,
  eventIcon,
  onJobsCleared: resetComparisonAfterJobsChanged,
});

const {
  comparisonStatus,
  comparisonError,
  comparisonUrl,
  comparisonArtifacts,
  comparisonInsights,
  comparisonHistory,
  comparisonHistoryStatus,
  comparisonHistoryError,
  resetComparisonResult,
  createComparisonReport: createComparisonReportBase,
  comparisonArtifactUrl,
  comparisonHistoryItemsForDisplay,
  loadComparisonHistory,
  clearComparisonHistory,
} = useComparison({
  API_BASE,
  t,
  withLang,
  selectedJobIds,
  buildComparisonTitle,
  formatComparisonMetric: formatComparisonMetricBase,
  formatEventTime,
  comparisonHistoryArtifactUrl: (item, key) =>
    comparisonHistoryArtifactUrlBase(API_BASE, item, key),
});

async function handleCreateComparisonReport() {
  await createComparisonReportBase();
  if (comparisonStatus.value === "finished") {
    setDashboardSection("comparisons");
  }
}

_resetComparisonResult = resetComparisonResult;

const dashboardSections = ["run", "jobs", "comparisons", "leaderboard", "reports"];

const dashboardSectionIds = new Set(dashboardSections);

function getInitialDashboardSection() {
  const savedSection = window.localStorage.getItem(DASHBOARD_SECTION_STORAGE_KEY);
  return dashboardSectionIds.has(savedSection) ? savedSection : "run";
}

const activeDashboardSection = ref(getInitialDashboardSection());

function setDashboardSection(sectionId) {
  if (!dashboardSectionIds.has(sectionId)) {
    return;
  }

  activeDashboardSection.value = sectionId;
  window.localStorage.setItem(DASHBOARD_SECTION_STORAGE_KEY, sectionId);
}

const dashboardNavigationSections = computed(() =>
  dashboardSections.map((sectionId) => ({
    id: sectionId,
    label: t.value.dashboardSectionLabels?.[sectionId] || sectionId,
  }))
);

const currentDashboardSectionCopy = computed(
  () => t.value.dashboardSectionCopy?.[activeDashboardSection.value] || {}
);

const {
  reportsCleanupSummary,
  reportsCleanupStatus,
  reportsCleanupError,
  reportsCleanupRunStatus,
  reportsCleanupRunMode,
  reportsCleanupRunError,
  reportsCleanupRunResult,
  reportsCleanupPreview,
  reportsCleanupPreviewCandidates,
  reportsCleanupOldestModifiedAt,
  reportsCleanupLatestModifiedAt,
  reportsCleanupHasCandidates,
  reportsCleanupRunBusy,
  reportsCleanupTotalSizeLabel,
  reportsCleanupCandidateSizeLabel,
  reportsCleanupDeletedSizeLabel,
  reportsCleanupOldestLabel,
  reportsCleanupLatestLabel,
  reportsCleanupCandidatesForDisplay,
  loadReportsCleanupSummary,
  runReportsCleanup,
} = useReportsCleanup({
  API_BASE,
  t,
  formatStorageBytes,
  formatEventTime,
  loadRecentJobs: loadRecentJobs,
  loadComparisonHistory: loadComparisonHistory,
});

function handleExperimentFinished({
  jobId: finishedJobId,
  finalMetric,
  experimentName,
  selectedConfig: config,
  metricsCount,
  reportUrl: finishedReportUrl,
}) {
  unhideJobId(finishedJobId);

  recentJobs.value = [
    {
      job_id: finishedJobId,
      status: "finished",
      label: experimentName,
      name: experimentName,
      experiment_name: experimentName,
      config_path: config,
      aggregation: finalMetric.aggregation || "unknown",
      defense: finalMetric.defense || "unknown",
      attack: finalMetric.attack || "unknown",
      final_accuracy: finalMetric.accuracy ?? 0,
      final_loss: finalMetric.loss ?? 0,
      final_asr: finalMetric.attack_success_rate ?? 0,
      metrics_count: metricsCount,
      report_url: finishedReportUrl,
      has_report: true,
      artifacts: {
        report_html_url: finishedReportUrl,
        metrics_csv_url: `${finishedReportUrl}/metrics.csv`,
        summary_md_url: `${finishedReportUrl}/report.md`,
        metrics_json_url: `${finishedReportUrl}/metrics.json`,
        config_json_url: `${finishedReportUrl}/config.json`,
      },
    },
    ...recentJobs.value.filter((job) => job.job_id !== finishedJobId),
  ].slice(0, 20);

  saveRecentJobs();
  loadRecentJobsFromApi().catch((error) => {
    console.warn("Failed to refresh jobs after run finished:", error);
  });
}

function resolveConfigOptionValue(jobConfigPath) {
  if (!jobConfigPath || experimentOptions.value.length === 0) {
    return null;
  }

  const normalize = (p) => {
    if (!p) return "";
    let base = p.split("/").pop() || p;
    base = base.replace(/\.(ya?ml)$/i, "");
    return base.toLowerCase();
  };

  const jobNorm = normalize(jobConfigPath);

  for (const opt of experimentOptions.value) {
    const candidates = [
      opt.value,
      opt.path,
      opt.config_path,
      opt.key,
      opt.name,
      opt.label,
      opt.metadata?.name_key,
    ].filter(Boolean);

    for (const c of candidates) {
      if (c === jobConfigPath) return opt.value;
    }

    for (const c of candidates) {
      if (normalize(c) === jobNorm) return opt.value;
    }
  }

  return null;
}

const selectedReusableJob = computed(() => {
  if (selectedJobIds.value.length !== 1) return null;
  return recentJobs.value.find((j) => j.job_id === selectedJobIds.value[0]) || null;
});

function getJobConfigCandidates(job) {
  if (!job) return [];
  const candidates = [job.config_path, job.experiment_name].filter(
    (v) => typeof v === "string" && v.trim() !== ""
  );
  return [...new Set(candidates)];
}

const canReuseSelectedJobConfig = computed(() => {
  const job = selectedReusableJob.value;
  return selectedJobIds.value.length === 1 && getJobConfigCandidates(job).length > 0;
});

function reuseSelectedJobConfig() {
  const job = selectedReusableJob.value;
  const candidates = getJobConfigCandidates(job);
  if (candidates.length === 0) {
    errorMessage.value = t.value.reuseConfigUnavailable;
    return;
  }

  let matchedValue = null;
  for (const candidate of candidates) {
    matchedValue = resolveConfigOptionValue(candidate);
    if (matchedValue) break;
  }

  if (!matchedValue) {
    errorMessage.value = t.value.reuseConfigNotFound;
    return;
  }

  errorMessage.value = "";
  selectedCategory.value = "all";
  selectedConfig.value = matchedValue;
  setDashboardSection("run");
}

const {
  jobId,
  status,
  metrics,
  reportUrl,
  latestMetric,
  chartData,
  chartOptions,
  configOverrides,
  resetConfigOverrides,
  applyPreset,
  cancelCurrentJob,
  startExperiment,
} = useRuntimeMonitor({
  API_BASE,
  WS_BASE,
  t,
  selectedConfig,
  getSelectedExperimentLabel,
  onExperimentFinished: handleExperimentFinished,
  errorMessage,
});

const mergedConfigPreview = computed(() => {
  if (!displayConfigPreview.value) return null;
  const overrides = configOverrides.value;
  return {
    ...displayConfigPreview.value,
    rounds: overrides.experiment?.rounds ?? displayConfigPreview.value.rounds,
    clients: overrides.federated?.num_clients ?? displayConfigPreview.value.clients,
    malicious_clients: overrides.federated?.malicious_clients ?? displayConfigPreview.value.malicious_clients,
    learning_rate: overrides.training?.learning_rate ?? displayConfigPreview.value.learning_rate,
    batch_size: overrides.training?.batch_size ?? displayConfigPreview.value.batch_size,
    local_epochs: overrides.training?.local_epochs ?? displayConfigPreview.value.local_epochs,
    poison_fraction: overrides.attack?.poison_fraction ?? displayConfigPreview.value.poison_fraction,
  };
});

watch(selectedConfigOption, (newVal) => {
  if (newVal?.preview) {
    const p = newVal.preview;
    configOverrides.value = {
      experiment: { rounds: p.rounds },
      federated: { num_clients: p.clients, malicious_clients: p.malicious_clients },
      training: {
        learning_rate: p.learning_rate,
        batch_size: p.batch_size,
        local_epochs: p.local_epochs
      },
      attack: { poison_fraction: p.poison_fraction ?? 1.0 },
    };
  }
}, { immediate: true });

onMounted(async () => {
  await loadExperimentOptions();

  try {
    await loadRecentJobsFromApi();
  } catch (error) {
    loadRecentJobs();
  }

  try {
    await loadComparisonHistory();
  } catch (error) {
    console.warn("Failed to load comparison history:", error);
  }

  try {
    await loadReportsCleanupSummary();
  } catch (error) {
    console.warn("Failed to load reports cleanup summary:", error);
  }
});

function eventIcon(type) {
  return eventIconBase(type);
}

function formatEventMessage(ev) {
  return formatEventMessageBase({ language }, ev);
}

function formatEventTime(ts) {
  return formatEventTimeBase({ language }, ts);
}

function jobArtifactUrl(job, key) {
  return jobArtifactUrlBase(API_BASE, job, key);
}

function formatStorageBytes(value) {
  return formatStorageBytesBase(value);
}

function hasArtifacts(job) {
  return hasArtifactsBase(job, jobArtifactUrl);
}

</script>

<template>
  <main class="page">
    <header class="app-header">
      <GlobalToolbar :language="language" @select-language="setLanguage" />
      <DashboardSectionNav
        :sections="dashboardNavigationSections"
        :active-section="activeDashboardSection"
        @select="setDashboardSection"
      />
    </header>

    <section v-show="activeDashboardSection === 'run'" class="dashboard-shell">
      <RunCommandPanel
        :copy="t"
        v-model:selected-category="selectedCategory"
        v-model:selected-config="selectedConfig"
        :category-options="configCategories"
        :config-options="filteredExperimentOptions"
        :config-metadata="selectedConfigMetadata"
        :config-description="selectedExperimentDescription"
        :config-preview="mergedConfigPreview"
        :config-label="getSelectedExperimentLabel()"
        :is-running="status === 'creating' || status === 'running'"
        :config-overrides="configOverrides"
        @start="startExperiment"
        @cancel="cancelCurrentJob"
        @reset-overrides="resetConfigOverrides"
        @apply-preset="applyPreset"
      />

      <RuntimeMonitorPanel
        :copy="t"
        :status="status"
        :job-id="jobId"
        :error-message="errorMessage"
        :report-url="reportUrl"
        :latest-metric="latestMetric"
        :metrics="metrics"
        :chart-data="chartData"
        :chart-options="chartOptions"
        :with-lang="withLang"
      />
    </section>

    <section
      v-if="activeDashboardSection === 'jobs' || activeDashboardSection === 'comparisons' || activeDashboardSection === 'leaderboard'"
      class="dashboard-main-card card-base"
    >
      <DashboardSectionHeading :copy="currentDashboardSectionCopy" />

      <div
        v-if="activeDashboardSection === 'leaderboard'"
        class="dashboard-section-panel dashboard-leaderboard-panel"
      >
        <LeaderboardPanel
          :copy="t"
          :accuracy-rank="accuracyLeaderboard"
          :asr-rank="asrLeaderboard"
        />
      </div>

      <div
        v-if="activeDashboardSection === 'jobs'"
        class="dashboard-section-panel dashboard-jobs-panel"
      >
      <JobsSectionHeader
        v-model:status-filter="jobStatusFilter"
        v-model:archive-filter="jobArchiveFilter"
        v-model:limit="recentJobsLimit"
        v-model:sort="recentJobsSort"
        :copy="t"
        :show-filters="activeDashboardSection === 'jobs'"
      >
        <template #default>
          <div class="section-actions">
            <button
              class="btn btn-secondary"
              :disabled="!canReuseSelectedJobConfig"
              @click="reuseSelectedJobConfig"
            >
              {{ t.reuseConfig }}
            </button>

            <button
              class="btn btn-secondary"
              :disabled="selectedJobIds.length === 0"
              @click="deleteSelectedJobs"
            >
              {{ t.deleteSelected }}
            </button>

            <button
              class="btn btn-secondary"
              :disabled="recentJobs.length === 0"
              @click="clearRecentJobs"
            >
              {{ t.clearHistory }}
            </button>

            <button
              class="btn btn-primary"
              :disabled="selectedJobIds.length < 2 || comparisonStatus === 'creating'"
              @click="handleCreateComparisonReport"
            >
              {{ comparisonStatus === "creating" ? t.generating : t.generateReport }}
            </button>
          </div>
        </template>
      </JobsSectionHeader>

      <HistoryManagementStrip
        v-if="activeDashboardSection === 'jobs'"
        :copy="t"
        :total-jobs="recentJobs.length"
        :comparable-jobs="comparableJobsCount"
        :selected-jobs="selectedJobIds.length"
        :active-filter-label="historyArchiveFilterLabel"
      />

      <div v-if="historyActionError" class="comparison-feedback error-feedback history-action-error">
        <span>{{ historyActionError }}</span>
      </div>

      <LeaderboardPanel
        v-if="activeDashboardSection === 'leaderboard'"
        :copy="t"
        :accuracy-rank="accuracyLeaderboard"
        :asr-rank="asrLeaderboard"
      />

      <JobsEmptyState
        v-if="recentJobs.length === 0"
        :copy="t"
        :status-filter="jobStatusFilter"
      />

      <JobsTable
        v-else
        :copy="t"
        :jobs="recentJobsForDisplay"
        @toggle-selection="toggleJobSelection"
        @toggle-detail="toggleDetailJob"
      />

      <div v-if="recentJobs.length > 0" class="job-detail-card">
        <JobDetailPanel
          v-if="selectedDetailJob"
          :copy="t"
          :job="selectedDetailJob"
          :artifacts-count="selectedDetailArtifactsCount"
          :is-comparable="canSelectJobForComparison(selectedDetailJob)"
          :is-action-disabled="historyActionStatus !== 'idle'"
          :report-html-url="selectedDetailJob.report_url ? withLang(selectedDetailJob.report_url) : ''"
          :export-items="detailExportItems"
          :lifecycle-events="lifecycleDisplayEvents"
          :round-events="roundDisplayEvents"
          @archive="setJobArchived(selectedDetailJob, !selectedDetailJob.archived)"
        />

        <div v-else class="empty-state small">
          {{ t.jobDetailHint }}
        </div>
      </div>
      </div>

      <div
        v-if="activeDashboardSection === 'comparisons'"
        class="dashboard-section-panel dashboard-comparisons-panel"
      >
      <div v-if="selectedJobIds.length > 0" class="comparison-active-selection">
        <SelectedJobsPreview
          :copy="t"
          :selected-jobs="selectedJobsForPreview"
        />
        <div class="selection-actions-bar">
          <button
            class="btn btn-primary"
            :disabled="selectedJobIds.length < 2 || comparisonStatus === 'creating'"
            @click="handleCreateComparisonReport"
          >
            {{ comparisonStatus === "creating" ? t.generating : t.generateReport }}
          </button>
        </div>
      </div>

      <ComparisonStatusFeedback
        kind="creating"
        :copy="t"
        :status="comparisonStatus"
        :error="comparisonError"
      />

      <ComparisonResultCard
        v-if="comparisonStatus === 'finished' && comparisonUrl"
        :copy="t"
        :html-url="withLang(comparisonArtifactUrl('comparison_html_url'))"
        :csv-url="comparisonArtifactUrl('comparison_csv_url')"
        :json-url="comparisonArtifactUrl('comparison_json_url')"
      />

      <ComparisonInsightsPanel
        v-if="comparisonStatus === 'finished' && comparisonInsights && (comparisonInsights.best_accuracy || comparisonInsights.winner)"
        :copy="t"
        :insights="comparisonInsights"
      />

      <ComparisonHistoryPanel
        :copy="t"
        :status="comparisonHistoryStatus"
        :error="comparisonHistoryError"
        :items="comparisonHistoryItemsForDisplay"
        @refresh="loadComparisonHistory"
        @clear="clearComparisonHistory"
      />

      <ComparisonStatusFeedback
        kind="error"
        :copy="t"
        :status="comparisonStatus"
        :error="comparisonError"
      />

      <div v-if="selectedJobIds.length < 2 && selectedJobIds.length > 0 && comparisonStatus !== 'finished'" class="comparison-hint">
        {{ t.selectedJobsHint }}
      </div>
      </div>
    </section>

    <section v-if="activeDashboardSection === 'reports'" class="dashboard-main-card card-base">
      <DashboardSectionHeading :copy="currentDashboardSectionCopy" />

      <ReportsCleanupPanel
        :copy="t"
        :status="reportsCleanupStatus"
        :error="reportsCleanupError"
        :summary="reportsCleanupSummary"
        :preview="reportsCleanupPreview"
        :candidates-for-display="reportsCleanupCandidatesForDisplay"
        :has-candidates="reportsCleanupHasCandidates"
        :run-status="reportsCleanupRunStatus"
        :run-mode="reportsCleanupRunMode"
        :run-busy="reportsCleanupRunBusy"
        :run-error="reportsCleanupRunError"
        :run-result="reportsCleanupRunResult"
        :total-size-label="reportsCleanupTotalSizeLabel"
        :candidate-size-label="reportsCleanupCandidateSizeLabel"
        :deleted-size-label="reportsCleanupDeletedSizeLabel"
        :oldest-modified-label="reportsCleanupOldestLabel"
        :latest-modified-label="reportsCleanupLatestLabel"
        @refresh="loadReportsCleanupSummary"
        @run-cleanup="runReportsCleanup"
      />
    </section>
  </main>
</template>

<style scoped>
/* Page layout */
.page {
  min-height: 100vh;
  padding: 24px 32px 64px;
}

.page > *,
.dashboard-shell,
.comparison-card {
  width: min(1280px, calc(100vw - 64px));
  margin-left: auto;
  margin-right: auto;
}

/* Product header shell */
.app-header {
  margin: 0 auto 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--color-border-card);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: var(--shadow-sm);
}

/* Dashboard shell */
.dashboard-section-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-shell {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.comparison-active-selection {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.selection-actions-bar {
  display: flex;
  justify-content: flex-end;
}

/* Main content cards */
.dashboard-main-card {
  padding: 32px;
  animation: fadeIn 0.4s ease-out both;
}

.dashboard-main-card .job-detail-card {
  margin-top: 24px;
}

/* Section actions */
.section-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
  align-items: center;
}

/* Feedback and hints */
.comparison-feedback,
.comparison-hint {
  margin-top: 16px;
  padding: 16px;
  border-radius: var(--radius-md);
  background: white;
  border: 1px solid var(--color-border-card);
  font-size: 14px;
}

.error-feedback {
  background: var(--color-danger-light);
  border-color: var(--color-danger-border);
  color: var(--color-danger);
}

/* Empty state */
.empty-state {
  width: 100%;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  border: 2px dashed var(--color-border-card);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
  text-align: center;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
}

.empty-state.small {
  min-height: 80px;
  padding: 16px;
  margin-top: 16px;
}

/* Responsive */
@media (max-width: 860px) {
  .page {
    padding: 16px;
  }

  .page > *,
  .dashboard-shell,
  .comparison-card,
  .app-header {
    width: 100%;
  }

  .section-actions {
    justify-content: stretch;
  }

  .section-actions > button {
    flex: 1;
  }
}
</style>
