import { computed, ref, watch } from "vue";

const RECENT_JOBS_STORAGE_KEY = "fedguardlab_recent_jobs";
const HIDDEN_JOBS_STORAGE_KEY = "fedguardlab_hidden_jobs";

export function useRecentJobs({
  API_BASE,
  t,
  withLang,
  jobArtifactUrl,
  hasArtifacts,
  formatDisplayValue,
  formatMetricValue,
  titleizeDisplayValue,
  formatEventMessage,
  formatEventTime,
  eventIcon,
  onJobsCleared,
}) {
  const recentJobs = ref([]);
  const jobStatusFilter = ref("all");
  const jobArchiveFilter = ref("active");
  const recentJobsLimit = ref(20);
  const recentJobsSort = ref("created_at_desc");
  const selectedJobIds = ref([]);
  const selectedDetailJobId = ref("");
  const historyActionError = ref("");
  const historyActionStatus = ref("idle");

  function canSelectJobForComparison(job) {
    return (
      job.archived !== true &&
      job.status === "finished" &&
      job.metrics_count > 0 &&
      job.has_report === true &&
      Boolean(job.report_url)
    );
  }

  const comparableJobsCount = computed(() =>
    recentJobs.value.filter((job) => canSelectJobForComparison(job)).length
  );

  const historyArchiveFilterLabel = computed(() => {
    if (jobArchiveFilter.value === "archived") {
      return t.value.archiveArchived;
    }

    if (jobArchiveFilter.value === "all") {
      return t.value.archiveAll;
    }

    return t.value.archiveActive;
  });

  function toggleJobSelection(jobId) {
    if (selectedJobIds.value.includes(jobId)) {
      selectedJobIds.value = selectedJobIds.value.filter((id) => id !== jobId);
      return;
    }

    selectedJobIds.value = [...selectedJobIds.value, jobId];
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

  function mapApiJobToRecentJob(job) {
    const artifacts = job.artifacts || {};
    const hasReport = job.has_report === true;
    const experimentName =
      job.experiment_name || job.config_path || "Unknown Experiment";

    return {
      job_id: job.job_id,
      status: job.status,
      config_path: job.config_path,
      config: job.config || {},
      experiment_name: experimentName,
      name: experimentName,
      label: experimentName,
      aggregation: formatDisplayValue(job.aggregation),
      defense: formatDisplayValue(job.defense),
      attack: titleizeDisplayValue(job.attack || "none"),
      accuracy: formatMetricValue(job.final_accuracy),
      loss: formatMetricValue(job.final_loss),
      attack_success_rate: formatMetricValue(job.final_asr),
      asr: formatMetricValue(job.final_asr),
      final_accuracy: job.final_accuracy,
      final_loss: job.final_loss,
      final_asr: job.final_asr,
      final_metric: job.final_metric || {},
      metrics_count: job.metrics_count || 0,
      error: job.error,
      created_at: job.created_at,
      started_at: job.started_at,
      finished_at: job.finished_at,
      report_url: hasReport
        ? artifacts.report_html_url || `${API_BASE}/reports/${job.job_id}`
        : "",
      has_report: hasReport,
      artifacts,
      events: job.events || [],
      archived: job.archived === true,
      archived_at: job.archived_at || null,
    };
  }

  async function loadRecentJobsFromApi() {
    const filter = jobStatusFilter.value;
    const params = new URLSearchParams();
    params.set("limit", String(recentJobsLimit.value));
    params.set("sort", recentJobsSort.value);
    params.set("archived", jobArchiveFilter.value);

    if (filter !== "all" && filter !== "finished_report") {
      params.set("status", filter);
    }

    const response = await fetch(`${API_BASE}/jobs?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Failed to load jobs");
    }

    const hiddenIds = loadHiddenJobIds();
    const visibleJobs = data.jobs.filter((job) => !hiddenIds.has(job.job_id));

    if (filter === "finished_report") {
      recentJobs.value = visibleJobs
        .filter(
          (job) =>
            job.status === "finished" &&
            job.metrics_count > 0 &&
            job.has_report === true
        )
        .map(mapApiJobToRecentJob);
      return;
    }

    recentJobs.value = visibleJobs.map(mapApiJobToRecentJob);
  }

  const selectedDetailJob = computed(() => {
    if (!selectedDetailJobId.value) {
      return null;
    }
    return (
      recentJobs.value.find((j) => j.job_id === selectedDetailJobId.value) ||
      null
    );
  });

  const recentJobsForDisplay = computed(() =>
    recentJobs.value.map((job) => ({
      ...job,
      statusLabel: t.value.statusValues[job.status] || job.status,
      reportUrlWithLang: job.report_url ? withLang(job.report_url) : "",
      canCompare: canSelectJobForComparison(job),
      isSelected: selectedJobIds.value.includes(job.job_id),
      isDetailSelected: selectedDetailJobId.value === job.job_id,
      hasArtifacts: hasArtifacts(job),
    }))
  );

  const selectedDetailArtifactsCount = computed(() => {
    const job = selectedDetailJob.value;
    if (!job) {
      return 0;
    }

    return [
      jobArtifactUrl(job, "report_html"),
      jobArtifactUrl(job, "metrics_csv"),
      jobArtifactUrl(job, "summary_md"),
      jobArtifactUrl(job, "metrics_json"),
      jobArtifactUrl(job, "config_json"),
    ].filter(Boolean).length;
  });

  const selectedJobsForPreview = computed(() =>
    selectedJobIds.value
      .map((selectedJobId) =>
        recentJobs.value.find((job) => job.job_id === selectedJobId)
      )
      .filter(Boolean)
  );

  const selectedLifecycleEvents = computed(() => {
    const events = selectedDetailJob.value?.events || [];
    return events.filter((event) => event.type !== "round_progress");
  });

  const selectedRoundEvents = computed(() => {
    const events = selectedDetailJob.value?.events || [];
    return events.filter((event) => event.type === "round_progress");
  });

  const accuracyLeaderboard = computed(() => {
    return recentJobs.value
      .filter((j) => j.status === "finished" && j.final_accuracy !== undefined)
      .sort((a, b) => b.final_accuracy - a.final_accuracy)
      .slice(0, 10);
  });

  const asrLeaderboard = computed(() => {
    return recentJobs.value
      .filter((j) => j.status === "finished" && j.final_asr !== undefined)
      .sort((a, b) => a.final_asr - b.final_asr)
      .slice(0, 10);
  });

  const EXPORT_ARTIFACT_KEYS = [
    { key: "report_html", icon: "📊", labelKey: "exportHtmlReport" },
    { key: "metrics_csv", icon: "📄", labelKey: "exportCsvMetrics" },
    { key: "summary_md", icon: "📝", labelKey: "exportMarkdownReport" },
    { key: "metrics_json", icon: "{ }", labelKey: "exportMetricsJson" },
    { key: "config_json", icon: "⚙", labelKey: "exportConfigJson" },
  ];

  const detailExportItems = computed(() => {
    const job = selectedDetailJob.value;
    if (!job || !job.has_report) {
      return [];
    }

    return EXPORT_ARTIFACT_KEYS.map((entry) => {
      const url = jobArtifactUrl(job, entry.key);
      const href =
        entry.key === "report_html" ? withLang(url || "") : url || "";
      return {
        key: entry.key,
        url: href,
        icon: entry.icon,
        label: t.value[entry.labelKey] || entry.labelKey,
        disabled: !url,
      };
    });
  });

  const lifecycleDisplayEvents = computed(() =>
    selectedLifecycleEvents.value.map((ev) => ({
      icon: eventIcon(ev.type),
      eventClass: "event-" + ev.type,
      badgeClass: "badge-" + ev.type,
      badgeText: t.value.eventType[ev.type] || ev.type,
      time: formatEventTime(ev.created_at),
      message: formatEventMessage(ev),
      isFailed: ev.type === "failed" && Boolean(ev.details),
      error: ev.details?.error || "",
      traceback: ev.details?.traceback_summary || "",
    }))
  );

  const roundDisplayEvents = computed(() =>
    selectedRoundEvents.value.map((ev) => ({
      badgeText: t.value.eventType.round_progress,
      roundLabel: `${t.value.eventRound} ${ev.round}/${ev.total_rounds}`,
      time: formatEventTime(ev.created_at),
      hasMetrics: Boolean(ev.metrics),
      accuracy: ev.metrics?.accuracy ?? "",
      loss: ev.metrics?.loss ?? "",
      asr: ev.metrics?.attack_success_rate ?? "",
    }))
  );

  function toggleDetailJob(jobId) {
    selectedDetailJobId.value =
      selectedDetailJobId.value === jobId ? "" : jobId;
  }

  async function setJobArchived(job, archived) {
    if (!job?.job_id) {
      return;
    }

    historyActionError.value = "";
    historyActionStatus.value = archived ? "archiving" : "restoring";

    try {
      const action = archived ? "archive" : "restore";
      const response = await fetch(
        `${API_BASE}/jobs/${job.job_id}/${action}`,
        {
          method: "POST",
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const fallbackMessage = archived
          ? t.value.archiveFailed
          : t.value.restoreFailed;
        throw new Error(
          data.detail || `${fallbackMessage}: ${response.status}`
        );
      }

      if (archived) {
        selectedJobIds.value = selectedJobIds.value.filter(
          (id) => id !== job.job_id
        );
      }

      await loadRecentJobsFromApi();

      const stillVisible = recentJobs.value.some(
        (item) => item.job_id === job.job_id
      );
      selectedDetailJobId.value = stillVisible ? job.job_id : "";
    } catch (error) {
      historyActionError.value = error.message;
    } finally {
      historyActionStatus.value = "idle";
    }
  }

  watch(
    [jobStatusFilter, jobArchiveFilter, recentJobsLimit, recentJobsSort],
    () => {
      loadRecentJobsFromApi().catch((error) => {
        console.warn("Failed to reload jobs after filter change:", error);
      });
    }
  );

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
    const aggregations = [
      ...new Set(selectedJobs.map((job) => job.aggregation)),
    ];

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
    window.localStorage.removeItem(RECENT_JOBS_STORAGE_KEY);

    if (typeof onJobsCleared === "function") {
      onJobsCleared();
    }
  }

  function deleteSelectedJobs() {
    const selectedIds = new Set(selectedJobIds.value);

    hideJobIds([...selectedIds]);

    recentJobs.value = recentJobs.value.filter(
      (job) => !selectedIds.has(job.job_id)
    );

    selectedJobIds.value = [];

    saveRecentJobs();

    if (typeof onJobsCleared === "function") {
      onJobsCleared();
    }
  }

  return {
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
    accuracyLeaderboard,
    asrLeaderboard,
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
  };
}
