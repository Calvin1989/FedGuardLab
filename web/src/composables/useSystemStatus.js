import { computed, ref } from "vue";

export function useSystemStatus({ API_BASE, t, language }) {
  const apiStatus = ref("idle");
  const apiStatusError = ref("");
  const lastCheckedAt = ref(null);

  const apiStatusLabel = computed(() => {
    const lang = language?.value || "zh";
    const labels = {
      online: lang === "en" ? "Online" : "在线",
      offline: lang === "en" ? "Offline" : "离线",
      checking: lang === "en" ? "Checking..." : "检查中...",
      idle: lang === "en" ? "Unknown" : "未知",
    };
    return labels[apiStatus.value] || labels.idle;
  });

  const apiStatusTone = computed(() => {
    if (apiStatus.value === "online") return "success";
    if (apiStatus.value === "offline") return "error";
    if (apiStatus.value === "checking") return "pending";
    return "neutral";
  });

  async function checkApiStatus() {
    apiStatus.value = "checking";
    apiStatusError.value = "";

    try {
      const response = await fetch(`${API_BASE}/configs`);
      if (response.ok) {
        apiStatus.value = "online";
        lastCheckedAt.value = new Date().toISOString();
      } else {
        apiStatus.value = "offline";
        apiStatusError.value = `HTTP ${response.status}`;
        lastCheckedAt.value = new Date().toISOString();
      }
    } catch (error) {
      apiStatus.value = "offline";
      apiStatusError.value = error.message || "Network error";
      lastCheckedAt.value = new Date().toISOString();
    }
  }

  return {
    apiStatus,
    apiStatusError,
    lastCheckedAt,
    apiStatusLabel,
    apiStatusTone,
    checkApiStatus,
  };
}
