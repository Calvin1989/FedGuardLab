import { computed, ref } from "vue";

export function useComparison({
  API_BASE,
  t,
  withLang,
  selectedJobIds,
  buildComparisonTitle,
  formatComparisonMetric,
  formatEventTime,
  comparisonHistoryArtifactUrl,
}) {
  const comparisonStatus = ref("idle");
  const comparisonError = ref("");
  const comparisonUrl = ref("");
  const comparisonArtifacts = ref({});
  const comparisonInsights = ref({});
  const comparisonHistory = ref([]);
  const comparisonHistoryStatus = ref("idle");
  const comparisonHistoryError = ref("");

  function resetComparisonResult() {
    comparisonUrl.value = "";
    comparisonError.value = "";
    comparisonArtifacts.value = {};
    comparisonInsights.value = {};
    comparisonStatus.value = "idle";
  }

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

  function mapComparisonHistoryItem(item) {
    const artifacts = item.artifacts || {};
    return {
      comparison_id: item.comparison_id || "",
      title: item.title || t.value.comparisonHistoryUntitled,
      created_at: item.created_at || "",
      job_ids: Array.isArray(item.job_ids) ? item.job_ids : [],
      job_count:
        item.job_count ??
        (Array.isArray(item.job_ids) ? item.job_ids.length : 0),
      best_accuracy: formatComparisonMetric(item.best_accuracy),
      lowest_loss: formatComparisonMetric(item.lowest_loss),
      lowest_asr: formatComparisonMetric(item.lowest_asr),
      has_report: item.has_report !== false,
      artifacts,
    };
  }

  const comparisonHistoryItemsForDisplay = computed(() =>
    comparisonHistory.value.map((item) => {
      const htmlUrl = comparisonHistoryArtifactUrl(
        item,
        "comparison_html_url"
      );
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

      const response = await fetch(
        `${API_BASE}/comparisons?${params.toString()}`
      );
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

  async function clearComparisonHistory() {
    if (!confirm(t.value.comparisonHistoryClearConfirm || "Are you sure you want to clear all comparison history?")) {
      return;
    }

    comparisonHistoryStatus.value = "loading";
    comparisonHistoryError.value = "";

    try {
      const response = await fetch(`${API_BASE}/comparisons/all`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to clear comparison history");
      }

      comparisonHistory.value = [];
      comparisonHistoryStatus.value = "idle";
      loadComparisonHistory(); // 重新加载以确认状态
    } catch (error) {
      comparisonHistoryError.value = error.message;
      comparisonHistoryStatus.value = "error";
    }
  }

  return {
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
    mapComparisonHistoryItem,
    comparisonHistoryItemsForDisplay,
    loadComparisonHistory,
    clearComparisonHistory,
  };
}
