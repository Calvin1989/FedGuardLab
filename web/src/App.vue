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
} from "./composables/dashboardFormatters.js";
import { computed, onMounted, ref, watch } from "vue";

const API_BASE = "http://127.0.0.1:8000";
const WS_BASE = "ws://127.0.0.1:8000";

const jobId = ref("");
const status = ref("idle");
const metrics = ref([]);
const errorMessage = ref("");
const reportUrl = ref("");

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

function resetComparisonAfterJobsChanged() {
  comparisonUrl.value = "";
  comparisonError.value = "";
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
  loadComparisonHistory,
});

const comparisonStatus = ref("idle");
const comparisonError = ref("");
const comparisonUrl = ref("");
const comparisonArtifacts = ref({});
const comparisonInsights = ref({});
const comparisonHistory = ref([]);
const comparisonHistoryStatus = ref("idle");
const comparisonHistoryError = ref("");


let socket = null;

const latestMetric = computed(() => {
  if (metrics.value.length === 0) {
    return null;
  }
  return metrics.value[metrics.value.length - 1];
});

const chartData = computed(() => {
  return {
    labels: metrics.value.map((item) => item.round),
    datasets: [
      {
        label: t.value.accuracy,
        data: metrics.value.map((item) => item.accuracy),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.12)",
        borderWidth: 3,
        tension: 0.35,
        pointRadius: 3,
      },
      {
        label: t.value.loss,
        data: metrics.value.map((item) => item.loss),
        borderColor: "#dc2626",
        backgroundColor: "rgba(220, 38, 38, 0.12)",
        borderWidth: 3,
        tension: 0.35,
        pointRadius: 3,
      },
      {
        label: t.value.asr,
        data: metrics.value.map((item) => item.attack_success_rate),
        borderColor: "#16a34a",
        backgroundColor: "rgba(22, 163, 74, 0.12)",
        borderWidth: 3,
        tension: 0.35,
        pointRadius: 3,
      },
    ],
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: true,
      text: t.value.chartTitle,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
}));

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

async function createComparisonReport() {
  comparisonError.value = "";
  comparisonUrl.value = "";
  comparisonArtifacts.value = {};
  comparisonInsights.value = {};

  if (selectedJobIds.value.length < 2) {
    comparisonError.value = t.value.selectAtLeastTwo;
    return;
  }

  comparisonStatus.value = "creating";

  try {
    const response = await fetch(`${API_BASE}/comparisons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        job_ids: selectedJobIds.value,
        title: buildComparisonTitle(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Failed to create comparison report");
    }

    comparisonUrl.value = data.comparison_url;
    comparisonArtifacts.value = data.artifacts || {};
    comparisonInsights.value = data.insights || {};
    comparisonStatus.value = "finished";
    loadComparisonHistory().catch((error) => {
      console.warn("Failed to refresh comparison history:", error);
    });
  } catch (error) {
    comparisonError.value = error.message;
    comparisonStatus.value = "error";
  }
}

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

function comparisonArtifactUrl(key) {
  const artifacts = comparisonArtifacts.value || {};

  if (artifacts[key]) {
    return artifacts[key];
  }

  if (!comparisonUrl.value) {
    return "";
  }

  const fallbackUrls = {
    comparison_html_url: comparisonUrl.value,
    comparison_csv_url: `${comparisonUrl.value}/comparison.csv`,
    comparison_json_url: `${comparisonUrl.value}/comparison.json`,
  };

  return fallbackUrls[key] || "";
}

function comparisonHistoryArtifactUrl(item, key) {
  return comparisonHistoryArtifactUrlBase(API_BASE, item, key);
}

function formatComparisonMetric(value) {
  return formatComparisonMetricBase(value);
}

function mapComparisonHistoryItem(item) {
  const artifacts = item.artifacts || {};
  return {
    comparison_id: item.comparison_id || "",
    title: item.title || t.value.comparisonHistoryUntitled,
    created_at: item.created_at || "",
    job_ids: Array.isArray(item.job_ids) ? item.job_ids : [],
    job_count: item.job_count ?? (Array.isArray(item.job_ids) ? item.job_ids.length : 0),
    best_accuracy: formatComparisonMetric(item.best_accuracy),
    lowest_loss: formatComparisonMetric(item.lowest_loss),
    lowest_asr: formatComparisonMetric(item.lowest_asr),
    has_report: item.has_report !== false,
    artifacts,
  };
}

const comparisonHistoryItemsForDisplay = computed(() =>
  comparisonHistory.value.map((item) => {
    const htmlUrl = comparisonHistoryArtifactUrl(item, "comparison_html_url");
    const csvUrl = comparisonHistoryArtifactUrl(item, "comparison_csv_url");
    const jsonUrl = comparisonHistoryArtifactUrl(item, "comparison_json_url");

    return {
      comparison_id: item.comparison_id,
      title: item.title,
      createdAtLabel: formatEventTime(item.created_at),
      job_count: item.job_count,
      best_accuracy: item.best_accuracy,
      lowest_loss: item.lowest_loss,
      lowest_asr: item.lowest_asr,
      htmlUrl: htmlUrl ? withLang(htmlUrl) : "",
      csvUrl: csvUrl || "",
      jsonUrl: jsonUrl || "",
    };
  })
);

async function loadComparisonHistory() {
  comparisonHistoryStatus.value = "loading";
  comparisonHistoryError.value = "";

  try {
    const params = new URLSearchParams();
    params.set("limit", "10");
    params.set("sort", "created_at_desc");

    const response = await fetch(`${API_BASE}/comparisons?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || t.value.comparisonHistoryFailed);
    }

    comparisonHistory.value = Array.isArray(data.comparisons)
      ? data.comparisons.map(mapComparisonHistoryItem)
      : [];
    comparisonHistoryStatus.value = "idle";
  } catch (error) {
    comparisonHistoryError.value = error.message;
    comparisonHistoryStatus.value = "error";
    throw error;
  }
}

function formatStorageBytes(value) {
  return formatStorageBytesBase(value);
}

async function cancelCurrentJob() {
  if (!jobId.value) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/jobs/${jobId.value}/cancel`, {
      method: "POST",
    });

    if (response.ok) {
      status.value = "cancelled";
      errorMessage.value = "";
      if (socket) {
        socket.close();
        socket = null;
      }
    } else {
      const data = await response.json();
      errorMessage.value = data.detail || `Failed to cancel job: ${response.status}`;
    }
  } catch (error) {
    errorMessage.value = error.message;
  }
}

async function startExperiment() {
  errorMessage.value = "";
  metrics.value = [];
  jobId.value = "";
  reportUrl.value = "";
  status.value = "creating";

  if (socket) {
    socket.close();
    socket = null;
  }

  try {
    const response = await fetch(
      `${API_BASE}/run?config_path=${encodeURIComponent(selectedConfig.value)}`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create run: ${response.status}`);
    }

    const data = await response.json();
    jobId.value = data.job_id;
    status.value = "running";

    socket = new WebSocket(`${WS_BASE}/ws/${data.job_id}`);

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.error) {
        errorMessage.value = message.error;
        status.value = "error";
        socket.close();
        return;
      }

      if (message.event === "cancelled") {
        status.value = "cancelled";
        errorMessage.value = "";
        socket.close();
        return;
      }

      if (message.event === "finished") {
        status.value = "finished";
        reportUrl.value = `${API_BASE}/reports/${jobId.value}`;

        const finalMetric = metrics.value[metrics.value.length - 1] || {};
        const experimentName = getSelectedExperimentLabel();

        unhideJobId(jobId.value);

        recentJobs.value = [
          {
            job_id: jobId.value,
            status: "finished",
            label: experimentName,
            name: experimentName,
            experiment_name: experimentName,
            config_path: selectedConfig.value,
            aggregation: finalMetric.aggregation || "unknown",
            defense: finalMetric.defense || "unknown",
            attack: finalMetric.attack || "unknown",
            final_accuracy: finalMetric.accuracy ?? 0,
            final_loss: finalMetric.loss ?? 0,
            final_asr: finalMetric.attack_success_rate ?? 0,
            metrics_count: metrics.value.length,
            report_url: `${API_BASE}/reports/${jobId.value}`,
            has_report: true,
            artifacts: {
              report_html_url: `${API_BASE}/reports/${jobId.value}`,
              metrics_csv_url: `${API_BASE}/reports/${jobId.value}/metrics.csv`,
              summary_md_url: `${API_BASE}/reports/${jobId.value}/report.md`,
              metrics_json_url: `${API_BASE}/reports/${jobId.value}/metrics.json`,
              config_json_url: `${API_BASE}/reports/${jobId.value}/config.json`,
            },
          },
          ...recentJobs.value.filter((job) => job.job_id !== jobId.value),
        ].slice(0, 20);

        saveRecentJobs();
        loadRecentJobsFromApi().catch((error) => {
          console.warn("Failed to refresh jobs after run finished:", error);
        });

        socket.close();
        return;
      }

      metrics.value = [...metrics.value, message];
    };

    socket.onerror = () => {
      errorMessage.value = "WebSocket connection error";
      status.value = "error";
    };

    socket.onclose = () => {
      if (status.value === "running") {
        status.value = "disconnected";
      }
    };
  } catch (error) {
    errorMessage.value = error.message;
    status.value = "error";
  }
}
</script>

<template>
  <main class="page">
    <GlobalToolbar :language="language" @select-language="setLanguage" />

    <DashboardSectionNav
      :sections="dashboardNavigationSections"
      :active-section="activeDashboardSection"
      @select="setDashboardSection"
    />

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
  padding: 22px 24px 64px;
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

/* Dashboard shell */
.dashboard-section-panel {
  display: contents;
}

.dashboard-shell {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
  margin-bottom: 26px;
}

/* Comparison card */
.comparison-card {
  position: relative;
  overflow: hidden;
  padding: 24px 26px;
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
  min-height: 34px;
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

.secondary-button {
  border: 1px solid rgba(96, 165, 250, 0.48);
  background: #eff6ff;
  color: #2563eb;
}

/* Empty state */
.empty-state {
  width: 100%;
  min-height: 82px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  border: 1px dashed rgba(148, 163, 184, 0.34);
  border-radius: 18px;
  color: #64748b;
  text-align: center;
  font-size: 13px;
  line-height: 1.6;
}

.empty-state.small {
  min-height: 70px;
  margin-top: 16px;
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
  margin-top: 16px;
  padding: 14px;
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

/* Responsive */
@media (max-width: 860px) {
  .page {
    padding: 18px 14px 56px;
  }

  .page > *,
  .dashboard-shell,
  .comparison-card {
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
