import { computed, ref } from "vue";

export function useReportsCleanup({
  API_BASE,
  t,
  formatStorageBytes,
  formatEventTime,
  loadRecentJobs,
  loadComparisonHistory,
}) {
  const reportsCleanupSummary = ref(null);
  const reportsCleanupStatus = ref("idle");
  const reportsCleanupError = ref("");
  const reportsCleanupRunStatus = ref("idle");
  const reportsCleanupRunMode = ref("");
  const reportsCleanupRunError = ref("");
  const reportsCleanupRunResult = ref(null);

  const reportsCleanupPreview = computed(() =>
    reportsCleanupSummary.value?.cleanup_preview || {
      candidate_count: 0,
      candidate_size_bytes: 0,
      candidates: [],
    }
  );
  const reportsCleanupPreviewCandidates = computed(() =>
    reportsCleanupPreview.value.candidates.slice(0, 5)
  );
  const reportsCleanupOldestModifiedAt = computed(() =>
    reportsCleanupSummary.value?.jobs?.oldest_modified_at ||
    reportsCleanupSummary.value?.comparisons?.oldest_modified_at ||
    ""
  );
  const reportsCleanupLatestModifiedAt = computed(() =>
    reportsCleanupSummary.value?.jobs?.latest_modified_at ||
    reportsCleanupSummary.value?.comparisons?.latest_modified_at ||
    ""
  );
  const reportsCleanupHasCandidates = computed(
    () => reportsCleanupPreview.value.candidate_count > 0
  );
  const reportsCleanupRunBusy = computed(
    () => reportsCleanupRunStatus.value === "running"
  );

  const reportsCleanupTotalSizeLabel = computed(() =>
    formatStorageBytes(reportsCleanupSummary.value?.total_size_bytes ?? 0)
  );
  const reportsCleanupCandidateSizeLabel = computed(() =>
    formatStorageBytes(reportsCleanupPreview.value?.candidate_size_bytes ?? 0)
  );
  const reportsCleanupDeletedSizeLabel = computed(() =>
    reportsCleanupRunResult.value
      ? formatStorageBytes(reportsCleanupRunResult.value.deleted_size_bytes)
      : "0 B"
  );
  const reportsCleanupOldestLabel = computed(() =>
    formatEventTime(reportsCleanupOldestModifiedAt.value)
  );
  const reportsCleanupLatestLabel = computed(() =>
    formatEventTime(reportsCleanupLatestModifiedAt.value)
  );
  const reportsCleanupCandidatesForDisplay = computed(() =>
    reportsCleanupPreviewCandidates.value.map((item) => ({
      ...item,
      sizeLabel: formatStorageBytes(item.size_bytes),
      modifiedAtLabel: formatEventTime(item.modified_at),
    }))
  );

  function mapReportsCleanupSummary(data) {
    const preview = data.cleanup_preview || {};

    return {
      dry_run: Boolean(data.dry_run),
      deletes_files: Boolean(data.deletes_files),
      reports_root: data.reports_root || "",
      keep_latest_per_kind: data.keep_latest_per_kind ?? 20,
      total_size_bytes: data.total_size_bytes || 0,
      jobs: data.jobs || {},
      comparisons: data.comparisons || {},
      cleanup_preview: {
        candidate_count: preview.candidate_count || 0,
        candidate_size_bytes: preview.candidate_size_bytes || 0,
        candidates: Array.isArray(preview.candidates) ? preview.candidates : [],
      },
    };
  }

  async function loadReportsCleanupSummary() {
    reportsCleanupStatus.value = "loading";
    reportsCleanupError.value = "";

    try {
      const params = new URLSearchParams();
      params.set("keep_latest", "20");

      const response = await fetch(
        `${API_BASE}/reports/cleanup/summary?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || t.value.reportsCleanupFailed);
      }

      reportsCleanupSummary.value = mapReportsCleanupSummary(data);
      reportsCleanupStatus.value = "idle";
    } catch (error) {
      reportsCleanupError.value = error.message;
      reportsCleanupStatus.value = "error";
      throw error;
    }
  }

  function mapReportsCleanupRunResult(data) {
    return {
      dry_run: Boolean(data.dry_run),
      deletes_files: Boolean(data.deletes_files),
      candidate_count: data.candidate_count || 0,
      deleted_count: data.deleted_count || 0,
      deleted_size_bytes: data.deleted_size_bytes || 0,
      skipped: Array.isArray(data.skipped) ? data.skipped : [],
      errors: Array.isArray(data.errors) ? data.errors : [],
    };
  }

  async function runReportsCleanup(dryRun = true) {
    if (reportsCleanupRunBusy.value) {
      return;
    }

    if (!dryRun && !window.confirm(t.value.reportsCleanupConfirm)) {
      return;
    }

    reportsCleanupRunStatus.value = "running";
    reportsCleanupRunMode.value = dryRun ? "dry-run" : "delete";
    reportsCleanupRunError.value = "";
    reportsCleanupRunResult.value = null;

    try {
      const response = await fetch(`${API_BASE}/reports/cleanup/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keep_latest: reportsCleanupSummary.value?.keep_latest_per_kind ?? 20,
          dry_run: dryRun,
          confirm: !dryRun,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || t.value.reportsCleanupRunFailed);
      }

      reportsCleanupRunResult.value = mapReportsCleanupRunResult(data);
      reportsCleanupRunStatus.value = "idle";
      reportsCleanupRunMode.value = "";

      await loadReportsCleanupSummary();

      if (!dryRun) {
        const refreshTasks = [];

        if (typeof loadComparisonHistory === "function") {
          refreshTasks.push(
            loadComparisonHistory().catch((error) => {
              console.warn("Failed to refresh comparison history:", error);
            })
          );
        }

        if (typeof loadRecentJobs === "function") {
          refreshTasks.push(
            loadRecentJobs().catch((error) => {
              console.warn("Failed to refresh job history:", error);
            })
          );
        }

        await Promise.all(refreshTasks);
      }
    } catch (error) {
      reportsCleanupRunError.value = error.message;
      reportsCleanupRunStatus.value = "error";
      reportsCleanupRunMode.value = "";
    }
  }

  return {
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
  };
}
