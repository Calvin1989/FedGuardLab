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
const selectedDetailJobId = ref("");
const RECENT_JOBS_STORAGE_KEY = "fedguardlab_recent_jobs";
const HIDDEN_JOBS_STORAGE_KEY = "fedguardlab_hidden_jobs";
const LANGUAGE_STORAGE_KEY = "fedguardlab_language";

const language = ref(window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || "zh");

const messages = {
  zh: {
    eyebrow: "FedGuardLab",
    heroTitle: "联邦学习安全实验平台",
    heroSubtitle: "运行模拟或真实联邦学习安全实验，实时查看训练指标，在一个面板中对比攻防效果。",
    categoryLabel: "分类",
    allCategories: "全部分类",
    experimentLabel: "实验",
    noConfigsForCategory: "当前分类没有可用配置。",
    runExperiment: "运行实验",
    running: "运行中...",
    cancelExperiment: "取消实验",
    statusLabel: "状态",
    jobLabel: "任务 ID",
    errorLabel: "错误",
    reportLabel: "报告",
    openHtmlReport: "查看 HTML 报告",
    round: "轮次",
    accuracy: "准确率",
    loss: "损失",
    asr: "攻击成功率",
    chartTitle: "实时联邦学习指标",
    emptyChart: "启动新实验以查看实时指标。已完成的实验将保存在下方的对比历史中。",
    comparisonTitle: "实验对比",
    comparisonHint: "选择至少两个已完成的实验，生成对比报告。",
    statusFilter: "状态",
    limitFilter: "数量",
    sortFilter: "排序",
    newestFirst: "最新优先",
    oldestFirst: "最早优先",
    deleteSelected: "删除所选",
    clearHistory: "清空历史",
    generateReport: "生成对比报告",
    generating: "生成中...",
    emptyAll: "已完成且有报告的实验将显示在这里。",
    emptyFiltered: "没有找到{status}的任务。",
    tableSelect: "选择",
    tableExperiment: "实验",
    tableAggregation: "聚合",
    tableDefense: "防御",
    tableAttack: "攻击",
    tableAccuracy: "准确率",
    tableLoss: "损失",
    tableAsr: "ASR",
    tableArtifacts: "产物",
    tableReport: "报告",
    badgeReport: "报告",
    badgeArtifacts: "产物",
    badgeNoReport: "无报告",
    open: "查看",
    notReady: "未就绪",
    jobDetailTitle: "任务详情",
    jobDetailId: "任务 ID",
    jobDetailStatus: "状态",
    jobDetailConfig: "配置路径",
    jobDetailCreated: "创建时间",
    jobDetailStarted: "开始时间",
    jobDetailFinished: "完成时间",
    jobDetailReport: "报告",
    jobDetailArtifacts: "产物数量",
    openReport: "查看报告",
    notAvailable: "暂无",
    jobDetailHint: "点击任务行查看详情。",
    comparisonLabel: "对比",
    openComparisonReport: "查看对比报告",
    selectAtLeastTwo: "请至少选择两个已完成的实验。",
    statusValues: {
      idle: "空闲",
      creating: "创建中",
      running: "运行中",
      finished: "已完成",
      cancelled: "已取消",
      failed: "失败",
      error: "错误",
      disconnected: "已断开",
      queued: "排队中",
    },
  },
  en: {
    eyebrow: "FedGuardLab",
    heroTitle: "Interactive FL Security Playground",
    heroSubtitle: "Run simulated or real federated learning security experiments, stream live metrics, and compare attack-defense outcomes in one dashboard.",
    categoryLabel: "Category",
    allCategories: "All categories",
    experimentLabel: "Experiment",
    noConfigsForCategory: "No configs available for this category.",
    runExperiment: "Run Experiment",
    running: "Running...",
    cancelExperiment: "Cancel Experiment",
    statusLabel: "Status",
    jobLabel: "Job ID",
    errorLabel: "Error",
    reportLabel: "Report",
    openHtmlReport: "Open HTML Report",
    round: "Round",
    accuracy: "Accuracy",
    loss: "Loss",
    asr: "Attack Success Rate",
    chartTitle: "Live Federated Learning Metrics",
    emptyChart: "Start a new experiment to see live metrics here. Finished experiments are saved in the comparison history below.",
    comparisonTitle: "Experiment Comparison",
    comparisonHint: "Select at least two finished experiments and generate a comparison report.",
    statusFilter: "Status",
    limitFilter: "Limit",
    sortFilter: "Sort",
    newestFirst: "Newest first",
    oldestFirst: "Oldest first",
    deleteSelected: "Delete Selected",
    clearHistory: "Clear History",
    generateReport: "Generate Comparison Report",
    generating: "Generating...",
    emptyAll: "Finished experiments with reports will appear here.",
    emptyFiltered: "No {status} jobs found.",
    tableSelect: "Select",
    tableExperiment: "Experiment",
    tableAggregation: "Aggregation",
    tableDefense: "Defense",
    tableAttack: "Attack",
    tableAccuracy: "Accuracy",
    tableLoss: "Loss",
    tableAsr: "ASR",
    tableArtifacts: "Artifacts",
    tableReport: "Report",
    badgeReport: "Report",
    badgeArtifacts: "Artifacts",
    badgeNoReport: "No report",
    open: "Open",
    notReady: "Not ready",
    jobDetailTitle: "Job Detail",
    jobDetailId: "Job ID",
    jobDetailStatus: "Status",
    jobDetailConfig: "Config Path",
    jobDetailCreated: "Created",
    jobDetailStarted: "Started",
    jobDetailFinished: "Finished",
    jobDetailReport: "Report",
    jobDetailArtifacts: "Artifacts",
    openReport: "Open Report",
    notAvailable: "Not available",
    jobDetailHint: "Select a job to inspect details.",
    comparisonLabel: "Comparison",
    openComparisonReport: "Open Comparison Report",
    selectAtLeastTwo: "Please select at least two finished experiments.",
    statusValues: {
      idle: "idle",
      creating: "creating",
      running: "running",
      finished: "finished",
      cancelled: "cancelled",
      failed: "failed",
      error: "error",
      disconnected: "disconnected",
      queued: "queued",
    },
  },
};

const t = computed(() => messages[language.value] || messages.zh);

function setLanguage(lang) {
  language.value = lang;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

function withLang(url) {
  if (!url) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}lang=${language.value}`;
}
const comparisonStatus = ref("idle");
const comparisonError = ref("");
const comparisonUrl = ref("");

const experimentOptions = ref([]);
const selectedCategory = ref("all");

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
});


const selectedExperimentDescription = computed(() => {
  const option = experimentOptions.value.find(
    (item) => item.value === selectedConfig.value
  );

  return option?.description || "";
});


const selectedConfigMetadata = computed(() => {
  const option = experimentOptions.value.find(
    (item) => item.value === selectedConfig.value
  );

  if (!option?.metadata) {
    return null;
  }

  const meta = option.metadata;

  return {
    name: meta.name || option.label || selectedConfig.value,
    description: meta.description || "",
    category: meta.category || "",
    tags: Array.isArray(meta.tags) ? meta.tags : [],
  };
});


const configCategories = computed(() => {
  const cats = new Set(
    experimentOptions.value.map(
      (opt) => opt.metadata?.category || "uncategorized"
    )
  );
  return [...cats].sort();
});


const filteredExperimentOptions = computed(() => {
  if (selectedCategory.value === "all") {
    return experimentOptions.value;
  }
  return experimentOptions.value.filter(
    (opt) => (opt.metadata?.category || "uncategorized") === selectedCategory.value
  );
});


watch(selectedCategory, () => {
  const current = filteredExperimentOptions.value.find(
    (opt) => opt.value === selectedConfig.value
  );
  if (!current && filteredExperimentOptions.value.length > 0) {
    selectedConfig.value = filteredExperimentOptions.value[0].value;
  }
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
            report_url: `${API_BASE}/reports/${job.job_id}`,
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


const selectedDetailJob = computed(() => {
  if (!selectedDetailJobId.value) {
    return null;
  }
  return recentJobs.value.find((j) => j.job_id === selectedDetailJobId.value) || null;
});


const selectedDetailArtifactsCount = computed(() => {
  if (!selectedDetailJob.value?.artifacts) {
    return 0;
  }
  return Object.values(selectedDetailJob.value.artifacts).filter(Boolean).length;
});


function toggleDetailJob(jobId) {
  selectedDetailJobId.value =
    selectedDetailJobId.value === jobId ? "" : jobId;
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
      <p class="eyebrow">{{ t.eyebrow }}</p>
      <h1>{{ t.heroTitle }}</h1>
      <p class="subtitle">{{ t.heroSubtitle }}</p>

      <div class="lang-switcher">
        <button
          class="lang-button"
          :class="{ active: language === 'zh' }"
          @click="setLanguage('zh')"
        >
          中文
        </button>
        <button
          class="lang-button"
          :class="{ active: language === 'en' }"
          @click="setLanguage('en')"
        >
          English
        </button>
      </div>

      <div class="control-panel">
        <label class="field-label" for="category-filter">
          {{ t.categoryLabel }}
        </label>

        <select
          id="category-filter"
          v-model="selectedCategory"
          class="experiment-select"
          :disabled="status === 'creating' || status === 'running'"
        >
          <option value="all">{{ t.allCategories }}</option>
          <option
            v-for="cat in configCategories"
            :key="cat"
            :value="cat"
          >
            {{ cat }}
          </option>
        </select>

        <label class="field-label" for="experiment-select">
          {{ t.experimentLabel }}
        </label>

        <select
          v-if="filteredExperimentOptions.length > 0"
          id="experiment-select"
          v-model="selectedConfig"
          class="experiment-select"
          :disabled="status === 'creating' || status === 'running'"
        >
          <option
            v-for="option in filteredExperimentOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>

        <p v-else class="config-empty-filter">
          {{ t.noConfigsForCategory }}
        </p>

        <p class="option-description">
          {{ selectedExperimentDescription }}
        </p>

        <div v-if="selectedConfigMetadata" class="config-metadata">
          <div class="config-metadata-name">
            {{ selectedConfigMetadata.name }}
          </div>
          <div
            v-if="selectedConfigMetadata.description"
            class="config-metadata-description"
          >
            {{ selectedConfigMetadata.description }}
          </div>
          <div
            v-if="selectedConfigMetadata.category"
            class="config-metadata-category"
          >
            {{ selectedConfigMetadata.category }}
          </div>
          <div
            v-if="selectedConfigMetadata.tags.length > 0"
            class="config-metadata-tags"
          >
            <span
              v-for="tag in selectedConfigMetadata.tags"
              :key="tag"
              class="config-tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <div class="button-row">
          <button
            class="run-button"
            :disabled="
              status === 'creating' ||
              status === 'running' ||
              filteredExperimentOptions.length === 0
            "
            @click="startExperiment"
          >
            {{ status === "running" ? t.running : t.runExperiment }}
          </button>

          <button
            v-if="status === 'creating' || status === 'running'"
            class="secondary-button"
            @click="cancelCurrentJob"
          >
            {{ t.cancelExperiment }}
          </button>
        </div>
      </div>
    </section>

    <section class="status-card">
      <div>
        <strong>{{ t.statusLabel }}:</strong>
        <span>{{ t.statusValues[status] || status }}</span>
      </div>

      <div v-if="jobId">
        <strong>{{ t.jobLabel }}:</strong>
        <span>{{ jobId }}</span>
      </div>

      <div v-if="errorMessage" class="error">
        <strong>{{ t.errorLabel }}:</strong>
        <span>{{ errorMessage }}</span>
      </div>

      <div v-if="reportUrl">
        <strong>{{ t.reportLabel }}:</strong>
        <a class="report-link" :href="withLang(reportUrl)" target="_blank">
          {{ t.openHtmlReport }}
        </a>
      </div>
    </section>

    <section v-if="latestMetric" class="metric-grid">
      <div class="metric-card">
        <span>{{ t.round }}</span>
        <strong>{{ latestMetric.round }}</strong>
      </div>

      <div class="metric-card">
        <span>{{ t.accuracy }}</span>
        <strong>{{ latestMetric.accuracy }}</strong>
      </div>

      <div class="metric-card">
        <span>{{ t.loss }}</span>
        <strong>{{ latestMetric.loss }}</strong>
      </div>

      <div class="metric-card">
        <span>{{ t.asr }}</span>
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
        {{ t.emptyChart }}
      </div>
    </section>

    <section class="comparison-card">
      <div class="section-header">
        <div>
          <h2>{{ t.comparisonTitle }}</h2>
          <p>{{ t.comparisonHint }}</p>
          <div class="job-filters">
            <label class="status-filter">
              {{ t.statusFilter }}:
              <select v-model="jobStatusFilter">
                <option value="all">{{ t.statusValues.finished }} ({{ t.badgeReport }})</option>
                <option value="finished">{{ t.statusValues.finished }}</option>
                <option value="running">{{ t.statusValues.running }}</option>
                <option value="cancelled">{{ t.statusValues.cancelled }}</option>
                <option value="failed">{{ t.statusValues.failed }}</option>
                <option value="queued">{{ t.statusValues.queued }}</option>
              </select>
            </label>

            <label class="status-filter">
              {{ t.limitFilter }}:
              <select v-model.number="recentJobsLimit">
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
              </select>
            </label>

            <label class="status-filter">
              {{ t.sortFilter }}:
              <select v-model="recentJobsSort">
                <option value="created_at_desc">{{ t.newestFirst }}</option>
                <option value="created_at_asc">{{ t.oldestFirst }}</option>
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
      </div>

      <div v-if="recentJobs.length === 0" class="empty-state small">
        <template v-if="jobStatusFilter === 'all'">
          {{ t.emptyAll }}
        </template>
        <template v-else>
          {{ t.emptyFiltered.replace('{status}', t.statusValues[jobStatusFilter] || jobStatusFilter) }}
        </template>
      </div>

      <table v-else class="jobs-table">
        <thead>
          <tr>
            <th>{{ t.tableSelect }}</th>
            <th>{{ t.tableExperiment }}</th>
            <th>{{ t.tableAggregation }}</th>
            <th>{{ t.tableDefense }}</th>
            <th>{{ t.tableAttack }}</th>
            <th>{{ t.tableAccuracy }}</th>
            <th>{{ t.tableLoss }}</th>
            <th>{{ t.tableAsr }}</th>
            <th>{{ t.tableArtifacts }}</th>
            <th>{{ t.tableReport }}</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="job in recentJobs"
            :key="job.job_id"
            class="job-row"
            :class="{ 'job-row-selected': selectedDetailJobId === job.job_id }"
            @click="toggleDetailJob(job.job_id)"
          >
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
                <span v-if="job.has_report" class="job-badge success">{{ t.badgeReport }}</span>
                <span v-if="hasArtifacts(job)" class="job-badge">{{ t.badgeArtifacts }}</span>
                <span v-if="!job.has_report && !hasArtifacts(job)" class="job-badge muted">{{ t.badgeNoReport }}</span>
              </div>
            </td>
            <td>
              <a
                v-if="job.status === 'finished'"
                class="report-link"
                :href="withLang(job.report_url)"
                target="_blank"
              >
                {{ t.open }}
              </a>
              <span v-else>{{ t.notReady }}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="job-detail-card">
        <template v-if="selectedDetailJob">
          <div class="job-detail-header">
            <strong>{{ t.jobDetailTitle }}</strong>
            <span class="job-detail-name">
              {{ selectedDetailJob.label || selectedDetailJob.experiment_name }}
            </span>
          </div>
          <div class="job-detail-grid">
            <div class="job-detail-row">
              <span class="job-detail-label">{{ t.jobDetailId }}</span>
              <span class="job-detail-value job-detail-mono">{{ selectedDetailJob.job_id }}</span>
            </div>
            <div class="job-detail-row">
              <span class="job-detail-label">{{ t.jobDetailStatus }}</span>
              <span class="job-detail-value">{{ t.statusValues[selectedDetailJob.status] || selectedDetailJob.status }}</span>
            </div>
            <div class="job-detail-row">
              <span class="job-detail-label">{{ t.jobDetailConfig }}</span>
              <span class="job-detail-value job-detail-mono">{{ selectedDetailJob.config_path }}</span>
            </div>
            <div class="job-detail-row">
              <span class="job-detail-label">{{ t.jobDetailCreated }}</span>
              <span class="job-detail-value">{{ selectedDetailJob.created_at || "—" }}</span>
            </div>
            <div class="job-detail-row">
              <span class="job-detail-label">{{ t.jobDetailStarted }}</span>
              <span class="job-detail-value">{{ selectedDetailJob.started_at || "—" }}</span>
            </div>
            <div class="job-detail-row">
              <span class="job-detail-label">{{ t.jobDetailFinished }}</span>
              <span class="job-detail-value">{{ selectedDetailJob.finished_at || "—" }}</span>
            </div>
            <div class="job-detail-row">
              <span class="job-detail-label">{{ t.jobDetailReport }}</span>
              <span class="job-detail-value">
                <a
                  v-if="selectedDetailJob.has_report"
                  class="report-link"
                  :href="withLang(selectedDetailJob.report_url)"
                  target="_blank"
                >
                  {{ t.openReport }}
                </a>
                <span v-else>{{ t.notAvailable }}</span>
              </span>
            </div>
            <div class="job-detail-row">
              <span class="job-detail-label">{{ t.jobDetailArtifacts }}</span>
              <span class="job-detail-value">{{ selectedDetailArtifactsCount }}</span>
            </div>
          </div>
        </template>
        <p v-else class="job-detail-hint">
          {{ t.jobDetailHint }}
        </p>
      </div>

      <div v-if="comparisonError" class="error comparison-message">
        <strong>{{ t.errorLabel }}:</strong>
        <span>{{ comparisonError }}</span>
      </div>

      <div v-if="comparisonUrl" class="comparison-message">
        <strong>{{ t.comparisonLabel }}:</strong>
        <a class="report-link" :href="withLang(comparisonUrl)" target="_blank">
          {{ t.openComparisonReport }}
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

.lang-switcher {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
  width: fit-content;
}

.lang-button {
  padding: 6px 16px;
  border: 0;
  background: white;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.lang-button:not(:last-child) {
  border-right: 1px solid #cbd5e1;
}

.lang-button.active {
  background: #0f172a;
  color: white;
}

.lang-button:hover:not(.active) {
  background: #f1f5f9;
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

.config-metadata {
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.5;
}

.config-metadata-name {
  font-weight: 700;
  color: #0f172a;
}

.config-metadata-description {
  margin-top: 4px;
  color: #475569;
}

.config-metadata-category {
  margin-top: 6px;
  color: #64748b;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.config-metadata-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.config-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: #e2e8f0;
  color: #475569;
}

.config-empty-filter {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
  font-style: italic;
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

.job-row {
  cursor: pointer;
}

.job-row:hover {
  background: #f8fafc;
}

.job-row-selected {
  background: #eff6ff;
}

.job-detail-card {
  margin-top: 16px;
  padding: 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

.job-detail-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.job-detail-header strong {
  font-size: 14px;
  color: #0f172a;
}

.job-detail-name {
  font-size: 13px;
  color: #64748b;
}

.job-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 24px;
  font-size: 13px;
}

.job-detail-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.job-detail-label {
  font-weight: 600;
  color: #64748b;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.job-detail-value {
  color: #0f172a;
}

.job-detail-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  word-break: break-all;
}

.job-detail-hint {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
  font-style: italic;
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
