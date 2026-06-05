import { computed, onBeforeUnmount, ref } from "vue";

export function useRuntimeMonitor({
  API_BASE,
  WS_BASE,
  t,
  selectedConfig,
  getSelectedExperimentLabel,
  onExperimentFinished,
  errorMessage,
}) {
  const jobId = ref("");
  const status = ref("idle");
  const metrics = ref([]);
  const reportUrl = ref("");

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

  function cleanupSocket() {
    if (socket) {
      socket.close();
      socket = null;
    }
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
        cleanupSocket();
      } else {
        const data = await response.json();
        errorMessage.value =
          data.detail || `Failed to cancel job: ${response.status}`;
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

    cleanupSocket();

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

          const finalMetric =
            metrics.value[metrics.value.length - 1] || {};
          const experimentName = getSelectedExperimentLabel();

          if (typeof onExperimentFinished === "function") {
            onExperimentFinished({
              jobId: jobId.value,
              finalMetric,
              experimentName,
              selectedConfig: selectedConfig.value,
              metricsCount: metrics.value.length,
              reportUrl: reportUrl.value,
            });
          }

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

  onBeforeUnmount(() => {
    cleanupSocket();
  });

  return {
    jobId,
    status,
    metrics,
    errorMessage,
    reportUrl,
    latestMetric,
    chartData,
    chartOptions,
    cancelCurrentJob,
    startExperiment,
  };
}
