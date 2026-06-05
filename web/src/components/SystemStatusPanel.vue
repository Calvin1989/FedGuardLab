<script setup>
defineProps({
  apiStatus: { type: String, default: "idle" },
  apiStatusLabel: { type: String, default: "Unknown" },
  apiStatusTone: { type: String, default: "neutral" },
  apiStatusError: { type: String, default: "" },
  experimentCount: { type: Number, default: 0 },
  recentJobCount: { type: Number, default: 0 },
  language: { type: String, default: "zh" },
  testsSummary: { type: String, default: "" },
  lastCheckedAt: { type: String, default: null },
});

const emit = defineEmits(["refresh"]);
</script>

<template>
  <div class="system-status-panel">
    <div class="status-tiles">
      <div class="status-tile">
        <span class="tile-label">{{ language === "en" ? "API" : "API 服务" }}</span>
        <span class="tile-value" :class="`tone-${apiStatusTone}`">
          <span class="status-dot" :class="`dot-${apiStatusTone}`"></span>
          {{ apiStatusLabel }}
        </span>
      </div>

      <div class="status-tile">
        <span class="tile-label">{{ language === "en" ? "Configs" : "实验配置" }}</span>
        <span class="tile-value">{{ experimentCount }}</span>
      </div>

      <div class="status-tile">
        <span class="tile-label">{{ language === "en" ? "Recent Jobs" : "最近任务" }}</span>
        <span class="tile-value">{{ recentJobCount }}</span>
      </div>

      <div class="status-tile">
        <span class="tile-label">{{ language === "en" ? "Language" : "语言" }}</span>
        <span class="tile-value">{{ language === "en" ? "English" : "中文" }}</span>
      </div>

      <div class="status-tile">
        <span class="tile-label">{{ language === "en" ? "Tests" : "测试覆盖" }}</span>
        <span class="tile-value">{{ testsSummary }}</span>
      </div>
    </div>

    <button
      class="refresh-button"
      :disabled="apiStatus === 'checking'"
      :title="language === 'en' ? 'Refresh status' : '刷新状态'"
      @click="emit('refresh')"
    >
      {{ apiStatus === "checking" ? "..." : "↻" }}
    </button>
  </div>
</template>

<style scoped>
.system-status-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.04);
  animation: cardFadeIn 0.28s ease-out both;
}

.status-tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  flex: 1;
  min-width: 0;
}

.status-tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.tile-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
  white-space: nowrap;
}

.tile-value {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-success {
  background: #22c55e;
  box-shadow: 0 0 4px rgba(34, 197, 94, 0.4);
}

.dot-error {
  background: #ef4444;
  box-shadow: 0 0 4px rgba(239, 68, 68, 0.4);
}

.dot-pending {
  background: #f59e0b;
  box-shadow: 0 0 4px rgba(245, 158, 11, 0.4);
  animation: pulse-dot 1.2s ease-in-out infinite;
}

.dot-neutral {
  background: #94a3b8;
}

.tone-success {
  color: #16a34a;
}

.tone-error {
  color: #dc2626;
}

.tone-pending {
  color: #d97706;
}

.refresh-button {
  appearance: none;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
  font-size: 14px;
  font-weight: 700;
  padding: 4px 8px;
  cursor: pointer;
  transition: background-color 0.14s ease, border-color 0.14s ease;
  flex-shrink: 0;
}

.refresh-button:hover:not(:disabled) {
  background: #eff6ff;
  border-color: rgba(96, 165, 250, 0.48);
  color: #2563eb;
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
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

@media (max-width: 640px) {
  .status-tiles {
    gap: 4px 12px;
  }

  .tile-label {
    font-size: 9px;
  }

  .tile-value {
    font-size: 12px;
  }
}
</style>
