<script setup>
import { computed, onMounted, ref } from "vue";
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
const selectedConfig = ref("configs/mnist_fedavg_demo.yaml");

const recentJobs = ref([]);
const selectedJobIds = ref([]);
const RECENT_JOBS_STORAGE_KEY = "fedguardlab_recent_jobs";
const comparisonStatus = ref("idle");
const comparisonError = ref("");
const comparisonUrl = ref("");

const experimentOptions = [
  {
    label: "Real MNIST FedAvg Demo",
    value: "configs/mnist_fedavg_demo.yaml",
    description: "真实 MNIST + 5 个客户端 + FedAvg 聚合",
  },
  {
    label: "Real MNIST FedAvg Dirichlet Demo",
    value: "configs/mnist_fedavg_dirichlet_demo.yaml",
    description: "真实 MNIST + Dirichlet Non-IID 划分 + FedAvg 聚合",
  },
  {
    label: "Real MNIST FedAvg Label Flip Demo",
    value: "configs/mnist_fedavg_label_flip_demo.yaml",
    description: "真实 MNIST + IID 划分 + 2 个恶意客户端执行 1→7 label flipping",
  },
  {
    label: "Real MNIST Label Flip + Median Defense",
    value: "configs/mnist_median_label_flip_demo.yaml",
    description: "真实 MNIST + label flipping + Median 鲁棒聚合防御",
  },
  {
    label: "Real MNIST Label Flip + Trimmed Mean Defense",
    value: "configs/mnist_trimmed_mean_label_flip_demo.yaml",
    description: "真实 MNIST + label flipping + Trimmed Mean 鲁棒聚合防御",
  },
  {
    label: "Real MNIST Label Flip + Krum Defense",
    value: "configs/mnist_krum_label_flip_demo.yaml",
    description: "真实 MNIST + label flipping + Krum 鲁棒聚合防御",
  },
  {
    label: "Simulated Label Flipping Demo",
    value: "configs/label_flip_demo.yaml",
    description: "模拟 label flipping 攻击，用于快速演示 Dashboard",
  },
];

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
        tension: 0.3,
      },
      {
        label: "Loss",
        data: metrics.value.map((item) => item.loss),
        tension: 0.3,
      },
      {
        label: "Attack Success Rate",
        data: metrics.value.map((item) => item.attack_success_rate),
        tension: 0.3,
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

onMounted(() => {
  loadRecentJobs();
});


function getSelectedExperimentLabel() {
  const option = experimentOptions.find(
    (item) => item.value === selectedConfig.value
  );

  return option ? option.label : selectedConfig.value;
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
        title: "Label Flipping Defense Comparison",
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


function loadRecentJobs() {
  const rawValue = window.localStorage.getItem(RECENT_JOBS_STORAGE_KEY);

  if (!rawValue) {
    return;
  }

  try {
    const parsedJobs = JSON.parse(rawValue);

    if (Array.isArray(parsedJobs)) {
      recentJobs.value = parsedJobs;
    }
  } catch (error) {
    console.warn("Failed to load recent jobs from localStorage:", error);
    window.localStorage.removeItem(RECENT_JOBS_STORAGE_KEY);
  }
}


function saveRecentJobs() {
  window.localStorage.setItem(
    RECENT_JOBS_STORAGE_KEY,
    JSON.stringify(recentJobs.value.slice(0, 20))
  );
}


function clearRecentJobs() {
  recentJobs.value = [];
  selectedJobIds.value = [];
  comparisonUrl.value = "";
  comparisonError.value = "";
  window.localStorage.removeItem(RECENT_JOBS_STORAGE_KEY);
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

      if (message.event === "finished") {
        status.value = "finished";
        reportUrl.value = `${API_BASE}/reports/${jobId.value}`;

        const finalMetric = metrics.value[metrics.value.length - 1] || {};

        recentJobs.value = [
          {
            job_id: jobId.value,
            label: getSelectedExperimentLabel(),
            config_path: selectedConfig.value,
            aggregation: finalMetric.aggregation || "unknown",
            defense: finalMetric.defense || "unknown",
            attack: finalMetric.attack || "unknown",
            final_accuracy: finalMetric.accuracy ?? 0,
            final_loss: finalMetric.loss ?? 0,
            final_asr: finalMetric.attack_success_rate ?? 0,
            report_url: `${API_BASE}/reports/${jobId.value}`,
          },
          ...recentJobs.value,
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
      <h1>Interactive Federated Learning Security Playground</h1>
      <p class="subtitle">
        Run a label flipping demo and watch training metrics stream from FastAPI
        through WebSocket in real time.
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
          {{
            experimentOptions.find((option) => option.value === selectedConfig)
              ?.description
          }}
        </p>

        <button
          class="run-button"
          :disabled="status === 'creating' || status === 'running'"
          @click="startExperiment"
        >
          {{ status === "running" ? "Running..." : "Run Experiment" }}
        </button>
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
        </div>

        <div class="section-actions">
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
        Finished experiments will appear here.
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
            <th>Report</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="job in recentJobs" :key="job.job_id">
            <td>
              <input
                type="checkbox"
                :checked="selectedJobIds.includes(job.job_id)"
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
              <a class="report-link" :href="job.report_url" target="_blank">
                Open
              </a>
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
