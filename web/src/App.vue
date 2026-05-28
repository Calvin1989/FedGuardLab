<script setup>
import { computed, ref } from "vue";
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
        Click the button to start an experiment.
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
</style>
