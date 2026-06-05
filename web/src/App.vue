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
  createComparisonReport,
  comparisonArtifactUrl,
  comparisonHistoryItemsForDisplay,
  loadComparisonHistory,
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

_resetComparisonResult = resetComparisonResult;

const dashboardSections = ["run", "jobs", "comparisons", "reports"];

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

    <section v-show="activeDashboardSection === 'run'" class="dashboard-shell dashboard-shell-v7">
      <RunCommandPanel
        :copy="t"
        v-model:selected-category="selectedCategory"
        v-model:selected-config="selectedConfig"
        :category-options="configCategories"
        :config-options="filteredExperimentOptions"
        :config-metadata="selectedConfigMetadata"
        :config-description="selectedExperimentDescription"
        :config-preview="displayConfigPreview"
        :config-label="getSelectedExperimentLabel()"
        :is-running="status === 'creating' || status === 'running'"
        @start="startExperiment"
        @cancel="cancelCurrentJob"
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
      v-if="activeDashboardSection === 'jobs' || activeDashboardSection === 'comparisons'"
      class="comparison-card"
    >
      <DashboardSectionHeading :copy="currentDashboardSectionCopy" />

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
              class="secondary-button"
              :disabled="!canReuseSelectedJobConfig"
              @click="reuseSelectedJobConfig"
            >
              {{ t.reuseConfig }}
            </button>

            <button
              class="secondary-button"
              :disabled="selectedJobIds.length === 0"
              @click="deleteSelectedJobs"
            >
              {{ t.deleteSelected }}
            </button>

            <button
              class="secondary-button"
              :disabled="recentJobs.length === 0"
              @click="clearRecentJobs"
            >
              {{ t.clearHistory }}
            </button>

            <button
              class="run-button"
              :disabled="selectedJobIds.length < 2 || comparisonStatus === 'creating'"
              @click="createComparisonReport"
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
      <SelectedJobsPreview
        v-if="selectedJobIds.length > 0"
        :copy="t"
        :selected-jobs="selectedJobsForPreview"
      />

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

    <section v-if="activeDashboardSection === 'reports'" class="comparison-card">
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
/* Global resets */
:global(*) {
  box-sizing: border-box;
}

:global(html) {
  min-height: 100%;
  background:
    radial-gradient(circle at 8% 0%, rgba(37, 99, 235, 0.08), transparent 28%),
    radial-gradient(circle at 92% 2%, rgba(14, 165, 233, 0.09), transparent 30%),
    linear-gradient(135deg, #f8fafc 0%, #f6f8fb 46%, #f7f5fb 100%);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

:global(body) {
  margin: 0;
  min-height: 100vh;
}

/* Page layout */
.page {
  min-height: 100vh;
  padding: 18px 24px 56px;
  color: #101828;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    "PingFang SC",
    "Microsoft YaHei",
    "Noto Sans CJK SC",
    sans-serif;
  font-variant-numeric: tabular-nums;
}

.page > *,
.dashboard-shell,
.comparison-card {
  width: min(1200px, calc(100vw - 48px));
  margin-left: auto;
  margin-right: auto;
}

/* Product header shell */
.app-header {
  width: min(1200px, calc(100vw - 48px));
  margin: 0 auto 10px;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 6px 10px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.48);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 1px 8px rgba(15, 23, 42, 0.025);
}

/* Dashboard shell */
.dashboard-section-panel {
  display: contents;
}

.dashboard-shell {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  margin-bottom: 20px;
}

/* Comparison card */
.comparison-card {
  position: relative;
  overflow: hidden;
  padding: 20px 24px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.07);
}

.comparison-card > * {
  position: relative;
  z-index: 1;
}

.comparison-card .job-detail-card {
  margin-top: 14px;
  padding: 16px;
  border-radius: 16px;
}

.comparison-card .comparison-feedback,
.comparison-card .comparison-hint {
  margin-top: 12px;
}

/* Buttons */
.run-button,
.secondary-button {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 16px;
  border-radius: 10px;
  box-shadow: none;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  word-break: keep-all;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    background-color 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.run-button:not(:disabled):hover,
.secondary-button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.12);
}

.run-button:focus-visible,
.secondary-button:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.5);
  outline-offset: 2px;
}

.secondary-button {
  border: 1px solid rgba(96, 165, 250, 0.48);
  background: #eff6ff;
  color: #2563eb;
}

/* Empty state */
.empty-state {
  width: 100%;
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  border: 1px dashed rgba(148, 163, 184, 0.34);
  border-radius: 18px;
  color: #64748b;
  text-align: center;
  font-size: 13px;
  line-height: 1.6;
}

.empty-state.small {
  min-height: 60px;
  margin-top: 12px;
}

/* Section actions */
.section-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  align-items: flex-end;
}

.section-actions .secondary-button:disabled,
.section-actions .run-button:disabled {
  opacity: 0.48;
  transform: none;
  box-shadow: none;
}

/* Feedback and hints */
.comparison-feedback,
.comparison-hint {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 18px;
  background: #ffffff;
  box-shadow: none;
}

.error-feedback {
  background: #fff1f2;
  color: #9f1239;
}

/* Job detail card */
.job-detail-card {
  border-radius: 18px;
}

/* Scrollbar styling */
:global(::-webkit-scrollbar) {
  width: 7px;
  height: 7px;
}

:global(::-webkit-scrollbar-track) {
  background: transparent;
}

:global(::-webkit-scrollbar-thumb) {
  background: rgba(148, 163, 184, 0.32);
  border-radius: 999px;
}

:global(::-webkit-scrollbar-thumb:hover) {
  background: rgba(100, 116, 139, 0.42);
}

/* Focus-visible for selects */
select:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.4);
  outline-offset: 1px;
}

/* Responsive */
@media (max-width: 860px) {
  .page {
    padding: 14px 14px 48px;
  }

  .page > *,
  .dashboard-shell,
  .comparison-card,
  .app-header {
    width: min(100%, calc(100vw - 28px));
  }

  .comparison-card {
    border-radius: 22px;
  }

  .section-actions {
    justify-content: flex-start;
  }
}

/* Animation */
.dashboard-shell,
.comparison-card,
.job-detail-card {
  animation: cardFadeIn 0.28s ease-out both;
}

.error-feedback {
  animation: cardFadeIn 0.22s ease-out both;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
