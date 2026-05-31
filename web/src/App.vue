<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale
);

const API_BASE = "http://127.0.0.1:8000";
const WS_BASE = "ws://127.0.0.1:8000";

const jobId = ref("");
const status = ref("idle");
const metrics = ref([]);
const errorMessage = ref("");
const reportUrl = ref("");
const selectedConfig = ref("");

const recentJobs = ref([]);
const jobStatusFilter = ref("all");
const recentJobsLimit = ref(20);
const recentJobsSort = ref("created_at_desc");
const selectedJobIds = ref([]);
const RECENT_JOBS_STORAGE_KEY = "fedguardlab_recent_jobs";
const HIDDEN_JOBS_STORAGE_KEY = "fedguardlab_hidden_jobs";
const comparisonStatus = ref("idle");
const comparisonError = ref("");
const comparisonUrl = ref("");

const experimentOptions = ref([]);

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
        label: "Accuracy",
        data: metrics.value.map((item) => item.accuracy),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.12)",
        borderWidth: 3,
        tension: 0.35,
        pointRadius: 3,
      },
      {
        label: "Loss",
        data: metrics.value.map((item) => item.loss),
        borderColor: "#dc2626",
        backgroundColor: "rgba(220, 38, 38, 0.12)",
        borderWidth: 3,
        tension: 0.35,
        pointRadius: 3,
      },
      {
        label: "Attack Success Rate",
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

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: true,
      text: "Live Federated Learning Metrics",
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

onMounted(async () => {
  await loadExperimentOptions();

  try {
    await loadRecentJobsFromApi();
  } catch (error) {
    loadRecentJobs();
  }
});


const selectedExperimentDescription = computed(() => {
  const option = experimentOptions.value.find(
    (item) => item.value === selectedConfig.value
  );

  return option?.description || "";
});


function getSelectedExperimentLabel() {
  const option = experimentOptions.value.find(
    (item) => item.value === selectedConfig.value
  );

  return option ? option.label : selectedConfig.value;
}


async function loadExperimentOptions() {
  try {
    const response = await fetch(`${API_BASE}/configs`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Failed to load configs");
    }

    experimentOptions.value = data.configs.filter((item) => item.valid);

    if (!selectedConfig.value && experimentOptions.value.length > 0) {
      selectedConfig.value = experimentOptions.value[0].value;
    }
  } catch (error) {
    errorMessage.value = error.message;
  }
}


function canSelectJobForComparison(job) {
  return (
    job.status === "finished" &&
    job.metrics_count > 0 &&
    Boolean(job.report_url)
  );
}


function toggleJobSelection(jobId) {
  if (selectedJobIds.value.includes(jobId)) {
    selectedJobIds.value = selectedJobIds.value.filter((id) => id !== jobId);
    return;
  }

  selectedJobIds.value = [...selectedJobIds.value, jobId];
}


async function createComparisonReport() {
  comparisonError.value = "";
  comparisonUrl.value = "";

  if (selectedJobIds.value.length < 2) {
    comparisonError.value = "Please select at least two finished experiments.";
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
    comparisonStatus.value = "finished";
  } catch (error) {
    comparisonError.value = error.message;
    comparisonStatus.value = "error";
  }
}


function loadHiddenJobIds() {
  const rawValue = window.localStorage.getItem(HIDDEN_JOBS_STORAGE_KEY);

  if (!rawValue) {
    return new Set();
  }

  try {
    const parsedIds = JSON.parse(rawValue);

    if (Array.isArray(parsedIds)) {
      return new Set(parsedIds);
    }
  } catch (error) {
    console.warn("Failed to load hidden jobs from localStorage:", error);
    window.localStorage.removeItem(HIDDEN_JOBS_STORAGE_KEY);
  }

  return new Set();
}


function saveHiddenJobIds(hiddenIds) {
  window.localStorage.setItem(
    HIDDEN_JOBS_STORAGE_KEY,
    JSON.stringify([...hiddenIds])
  );
}


function hideJobIds(jobIds) {
  const hiddenIds = loadHiddenJobIds();

  jobIds.forEach((jobId) => {
    if (jobId) {
      hiddenIds.add(jobId);
    }
  });

  saveHiddenJobIds(hiddenIds);
}


function unhideJobId(jobId) {
  const hiddenIds = loadHiddenJobIds();

  hiddenIds.delete(jobId);
  saveHiddenJobIds(hiddenIds);
}


function loadRecentJobs() {
  const rawValue = window.localStorage.getItem(RECENT_JOBS_STORAGE_KEY);

  if (!rawValue) {
    return;
  }

  try {
    const parsedJobs = JSON.parse(rawValue);
    const hiddenIds = loadHiddenJobIds();

    if (Array.isArray(parsedJobs)) {
      recentJobs.value = parsedJobs.filter(
        (job) => !hiddenIds.has(job.job_id)
      );
    }
  } catch (error) {
    console.warn("Failed to load recent jobs from localStorage:", error);
    window.localStorage.removeItem(RECENT_JOBS_STORAGE_KEY);
  }
}


async function loadRecentJobsFromApi() {
  const filter = jobStatusFilter.value;
  const params = new URLSearchParams();
  params.set("limit", String(recentJobsLimit.value));
  params.set("sort", recentJobsSort.value);

  if (filter !== "all") {
    params.set("status", filter);
  }

  const response = await fetch(`${API_BASE}/jobs?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to load jobs");
  }

  const hiddenIds = loadHiddenJobIds();

  if (filter === "all") {
    // Default view: only finished jobs with full results (backward-compatible)
    const finishedJobs = data.jobs.filter(
      (job) =>
        job.status === "finished" &&
        job.metrics_count > 0 &&
        job.has_report === true &&
        !hiddenIds.has(job.job_id)
    );

    const hydratedJobs = await Promise.all(
      finishedJobs.map(async (job) => {
        try {
          const resultResponse = await fetch(`${API_BASE}/results/${job.job_id}`);
          const result = await resultResponse.json();

          if (!resultResponse.ok) {
            return null;
          }

          const config = result.config || {};
          const metrics = result.metrics || [];
          const lastMetric = metrics[metrics.length - 1] || {};

          const experimentName =
            config.experiment?.name || job.experiment_name || "Unknown Experiment";

          return {
            job_id: job.job_id,
            status: job.status,
            config_path: job.config_path,
            experiment_name: experimentName,
            name: experimentName,
            label: experimentName,
            aggregation: config.federated?.aggregation || "unknown",
            defense: config.defense?.type || "unknown",
            attack: config.attack?.type || "unknown",
            accuracy: lastMetric.accuracy ?? 0,
            loss: lastMetric.loss ?? 0,
            attack_success_rate: lastMetric.attack_success_rate ?? 0,
            asr: lastMetric.attack_success_rate ?? 0,
            final_accuracy: lastMetric.accuracy ?? 0,
            final_loss: lastMetric.loss ?? 0,
            final_asr: lastMetric.attack_success_rate ?? 0,
            metrics_count: job.metrics_count,
            error: job.error,
            created_at: job.created_at,
            started_at: job.started_at,
            finished_at: job.finished_at,
            report_url:
              job.has_report && job.artifacts?.report_html
                ? `${API_BASE}/reports/${job.job_id}`
                : `${API_BASE}/reports/${job.job_id}`,
            has_report: job.has_report === true,
            artifacts: job.artifacts || {},
          };
        } catch (error) {
          return null;
        }
      })
    );

    recentJobs.value = hydratedJobs.filter((job) => job !== null);
  } else {
    // Specific status filter: show raw jobs without hydration
    const filtered = data.jobs.filter((job) => !hiddenIds.has(job.job_id));

    recentJobs.value = filtered.map((job) => ({
      job_id: job.job_id,
      status: job.status,
      config_path: job.config_path,
      experiment_name: job.experiment_name || "Unknown Experiment",
      name: job.experiment_name || "Unknown Experiment",
      label: job.experiment_name || "Unknown Experiment",
      aggregation: "—",
      defense: "—",
      attack: "—",
      accuracy: "—",
      loss: "—",
      attack_success_rate: "—",
      asr: "—",
      final_accuracy: "—",
      final_loss: "—",
      final_asr: "—",
      metrics_count: job.metrics_count,
      error: job.error,
      created_at: job.created_at,
      started_at: job.started_at,
      finished_at: job.finished_at,
      report_url: `${API_BASE}/reports/${job.job_id}`,
      has_report: job.has_report === true,
      artifacts: job.artifacts || {},
    }));
  }
}


function hasArtifacts(job) {
  return job.artifacts && Object.keys(job.artifacts).length > 0;
}


watch([jobStatusFilter, recentJobsLimit, recentJobsSort], () => {
  loadRecentJobsFromApi().catch((error) => {
    console.warn("Failed to reload jobs after filter change:", error);
  });
});


function saveRecentJobs() {
  window.localStorage.setItem(
    RECENT_JOBS_STORAGE_KEY,
    JSON.stringify(recentJobs.value.slice(0, 20))
  );
}


function buildComparisonTitle() {
  const selectedJobs = recentJobs.value.filter((job) =>
    selectedJobIds.value.includes(job.job_id)
  );

  const attacks = [...new Set(selectedJobs.map((job) => job.attack))];
  const aggregations = [...new Set(selectedJobs.map((job) => job.aggregation))];

  if (attacks.length === 1 && attacks[0] !== "unknown") {
    return `${attacks[0]} Aggregation Comparison`;
  }

  if (aggregations.length > 1) {
    return "Robust Aggregation Comparison";
  }

  return "FedGuardLab Experiment Comparison";
}


function clearRecentJobs() {
  hideJobIds(recentJobs.value.map((job) => job.job_id));

  recentJobs.value = [];
  selectedJobIds.value = [];
  comparisonUrl.value = "";
  comparisonError.value = "";
  window.localStorage.removeItem(RECENT_JOBS_STORAGE_KEY);
}


function deleteSelectedJobs() {
  const selectedIds = new Set(selectedJobIds.value);

  hideJobIds([...selectedIds]);

  recentJobs.value = recentJobs.value.filter(
    (job) => !selectedIds.has(job.job_id)
  );

  selectedJobIds.value = [];
  comparisonUrl.value = "";
  comparisonError.value = "";

  saveRecentJobs();
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
          },
          ...recentJobs.value.filter((job) => job.job_id !== jobId.value),
        ].slice(0, 20);

        saveRecentJobs();

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
    <section class="hero">
      <p class="eyebrow">FedGuardLab</p>
      <h1>Interactive FL Security Playground</h1>
      <p class="subtitle">
        Run simulated or real federated learning security experiments, stream live
        metrics, and compare attack-defense outcomes in one dashboard.
      </p>

      <div class="control-panel">
        <label class="field-label" for="experiment-select">
          Experiment
        </label>

        <select
          id="experiment-select"
          v-model="selectedConfig"
          class="experiment-select"
          :disabled="status === 'creating' || status === 'running'"
        >
          <option
            v-for="option in experimentOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>

        <p class="option-description">
          {{ selectedExperimentDescription }}
        </p>

        <div class="button-row">
          <button
            class="run-button"
            :disabled="
              status === 'creating' ||
              status === 'running' ||
              experimentOptions.length === 0
            "
            @click="startExperiment"
          >
            {{ status === "running" ? "Running..." : "Run Experiment" }}
          </button>

          <button
            v-if="status === 'creating' || status === 'running'"
            class="secondary-button"
            @click="cancelCurrentJob"
          >
            Cancel Experiment
          </button>
        </div>
      </div>
    </section>

    <section class="status-card">
      <div>
        <strong>Status:</strong>
        <span>{{ status }}</span>
      </div>

      <div v-if="jobId">
        <strong>Job ID:</strong>
        <span>{{ jobId }}</span>
      </div>

      <div v-if="errorMessage" class="error">
        <strong>Error:</strong>
        <span>{{ errorMessage }}</span>
      </div>

      <div v-if="reportUrl">
        <strong>Report:</strong>
        <a class="report-link" :href="reportUrl" target="_blank">
          Open HTML Report
        </a>
      </div>
    </section>

    <section v-if="latestMetric" class="metric-grid">
      <div class="metric-card">
        <span>Round</span>
        <strong>{{ latestMetric.round }}</strong>
      </div>

      <div class="metric-card">
        <span>Accuracy</span>
        <strong>{{ latestMetric.accuracy }}</strong>
      </div>

      <div class="metric-card">
        <span>Loss</span>
        <strong>{{ latestMetric.loss }}</strong>
      </div>

      <div class="metric-card">
        <span>Attack Success Rate</span>
        <strong>{{ latestMetric.attack_success_rate }}</strong>
      </div>
    </section>

    <section class="chart-card">
      <Line
        v-if="metrics.length > 0"
        :data="chartData"
        :options="chartOptions"
      />

      <div v-else class="empty-state">
        Start a new experiment to see live metrics here. Finished experiments are
        saved in the comparison history below.
      </div>
    </section>

    <section class="comparison-card">
      <div class="section-header">
        <div>
          <h2>Experiment Comparison</h2>
          <p>
            Select at least two finished experiments and generate a comparison report.
          </p>
          <div class="job-filters">
            <label class="status-filter">
              Status:
              <select v-model="jobStatusFilter">
                <option value="all">Finished with reports</option>
                <option value="finished">Finished</option>
                <option value="running">Running</option>
                <option value="cancelled">Cancelled</option>
                <option value="failed">Failed</option>
                <option value="queued">Queued</option>
              </select>
            </label>

            <label class="status-filter">
              Limit:
              <select v-model.number="recentJobsLimit">
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
              </select>
            </label>

            <label class="status-filter">
              Sort:
              <select v-model="recentJobsSort">
                <option value="created_at_desc">Newest first</option>
                <option value="created_at_asc">Oldest first</option>
              </select>
            </label>
          </div>
        </div>

        <div class="section-actions">
          <button
            class="secondary-button"
            :disabled="selectedJobIds.length === 0"
            @click="deleteSelectedJobs"
          >
            Delete Selected
          </button>

          <button
            class="secondary-button"
            :disabled="recentJobs.length === 0"
            @click="clearRecentJobs"
          >
            Clear History
          </button>

          <button
            class="run-button"
            :disabled="selectedJobIds.length < 2 || comparisonStatus === 'creating'"
            @click="createComparisonReport"
          >
            {{
              comparisonStatus === "creating"
                ? "Generating..."
                : "Generate Comparison Report"
            }}
          </button>
        </div>
      </div>

      <div v-if="recentJobs.length === 0" class="empty-state small">
        <template v-if="jobStatusFilter === 'all'">
          Finished experiments with reports will appear here.
        </template>
        <template v-else>
          No {{ jobStatusFilter }} jobs found.
        </template>
      </div>

      <table v-else class="jobs-table">
        <thead>
          <tr>
            <th>Select</th>
            <th>Experiment</th>
            <th>Aggregation</th>
            <th>Defense</th>
            <th>Attack</th>
            <th>Accuracy</th>
            <th>Loss</th>
            <th>ASR</th>
            <th>Artifacts</th>
            <th>Report</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="job in recentJobs" :key="job.job_id">
            <td>
              <input
                type="checkbox"
                :checked="selectedJobIds.includes(job.job_id)"
                :disabled="!canSelectJobForComparison(job)"
                @change="toggleJobSelection(job.job_id)"
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
                <span v-if="job.has_report" class="job-badge success">Report</span>
                <span v-if="hasArtifacts(job)" class="job-badge">Artifacts</span>
                <span v-if="!job.has_report && !hasArtifacts(job)" class="job-badge muted">No report</span>
              </div>
            </td>
            <td>
              <a
                v-if="job.status === 'finished'"
                class="report-link"
                :href="job.report_url"
                target="_blank"
              >
                Open
              </a>
              <span v-else>Not ready</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="comparisonError" class="error comparison-message">
        <strong>Error:</strong>
        <span>{{ comparisonError }}</span>
      </div>

      <div v-if="comparisonUrl" class="comparison-message">
        <strong>Comparison:</strong>
        <a class="report-link" :href="comparisonUrl" target="_blank">
          Open Comparison Report
        </a>
      </div>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 40px;
  background: #f8fafc;
  color: #0f172a;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

.hero {
  max-width: 900px;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: #2563eb;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: 40px;
  line-height: 1.1;
}

.subtitle {
  max-width: 720px;
  margin: 16px 0 24px;
  color: #475569;
  font-size: 16px;
}

.run-button {
  padding: 12px 18px;
  border: 0;
  border-radius: 12px;
  background: #0f172a;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.run-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.status-card,
.chart-card,
.metric-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.status-card {
  display: grid;
  gap: 8px;
  padding: 18px;
  margin-bottom: 24px;
}

.status-card span {
  margin-left: 8px;
  color: #475569;
}

.error span {
  color: #dc2626;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  padding: 18px;
}

.metric-card span {
  display: block;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 14px;
}

.metric-card strong {
  font-size: 28px;
}

.chart-card {
  height: 420px;
  padding: 24px;
}

.empty-state {
  height: 100%;
  display: grid;
  place-items: center;
  color: #64748b;
}

.report-link {
  margin-left: 8px;
  color: #2563eb;
  font-weight: 700;
  text-decoration: none;
}

.report-link:hover {
  text-decoration: underline;
}

.control-panel {
  display: grid;
  gap: 10px;
  max-width: 420px;
}

.button-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.field-label {
  font-weight: 700;
  color: #334155;
}

.experiment-select {
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: white;
  color: #0f172a;
  font-size: 14px;
}

.option-description {
  margin: 0 0 8px;
  color: #64748b;
  font-size: 14px;
}

.comparison-card {
  margin-top: 24px;
  padding: 24px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.section-header h2 {
  margin: 0 0 8px;
}

.section-header p {
  margin: 0;
  color: #64748b;
}

.job-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.status-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #475569;
}

.status-filter select {
  padding: 4px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  color: #1e293b;
  cursor: pointer;
}

.jobs-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
  font-size: 14px;
}

.jobs-table th,
.jobs-table td {
  padding: 10px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  vertical-align: top;
}

.jobs-table th {
  background: #f8fafc;
  color: #334155;
}

.job-label {
  font-weight: 700;
  color: #0f172a;
}

.job-id {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
  word-break: break-all;
}

.job-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.job-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: #e2e8f0;
  color: #475569;
}

.job-badge.success {
  background: #dcfce7;
  color: #166534;
}

.job-badge.muted {
  background: #f1f5f9;
  color: #94a3b8;
}

.comparison-message {
  margin-top: 16px;
}

.small {
  height: 120px;
}

.section-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.secondary-button {
  border: 1px solid #cbd5e1;
  background: white;
  color: #334155;
  padding: 10px 16px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
}

.secondary-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
