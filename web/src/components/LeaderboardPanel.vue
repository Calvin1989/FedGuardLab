<script setup>
import { ref } from "vue";

const props = defineProps({
  copy: { type: Object, required: true },
  accuracyRank: { type: Array, default: () => [] },
  asrRank: { type: Array, default: () => [] },
});

const activeTab = ref("accuracy"); // "accuracy" | "asr"

function formatMetric(val) {
  if (typeof val !== "number") return "—";
  return val.toFixed(4);
}
</script>

<template>
  <div class="leaderboard-content-wrapper">
    <div class="leaderboard-header-row">
      <div class="tab-group">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'accuracy' }"
          @click="activeTab = 'accuracy'"
        >
          {{ copy.accuracy }}
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'asr' }"
          @click="activeTab = 'asr'"
        >
          {{ copy.asr }}
        </button>
      </div>
    </div>

    <div class="leaderboard-grid">
      <div class="rank-list-card card-base">
        <div class="rank-list-header">
          <div class="rank-icon">{{ activeTab === 'accuracy' ? '🏆' : '🛡️' }}</div>
          <div class="rank-title-group">
            <h3 class="text-h3">{{ activeTab === 'accuracy' ? copy.leaderboardAccuracyRank : copy.leaderboardAsrRank }}</h3>
            <p class="text-xs text-muted">{{ activeTab === 'accuracy' ? 'Higher is better' : 'Lower is better' }}</p>
          </div>
        </div>

        <div v-if="(activeTab === 'accuracy' ? accuracyRank : asrRank).length === 0" class="empty-rank">
          {{ copy.leaderboardNoData }}
        </div>
        
        <table v-else class="base-table rank-table">
          <thead>
            <tr>
              <th style="width: 80px">{{ copy.leaderboardRank }}</th>
              <th>{{ copy.leaderboardExperiment }}</th>
              <th style="width: 120px; text-align: right;">{{ copy.leaderboardValue }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in (activeTab === 'accuracy' ? accuracyRank : asrRank)" :key="item.job_id">
              <td>
                <div class="rank-badge" :class="'rank-' + (index + 1)">
                  {{ index + 1 }}
                </div>
              </td>
              <td>
                <div class="job-info">
                  <span class="job-label text-sm font-bold">{{ item.label }}</span>
                  <span class="job-id text-xs text-muted font-mono">{{ item.job_id.slice(0, 8) }}</span>
                </div>
              </td>
              <td class="rank-value-cell">
                <span class="rank-value font-mono" :class="activeTab === 'accuracy' ? 'text-primary' : 'text-success'">
                  {{ formatMetric(activeTab === 'accuracy' ? item.final_accuracy : item.final_asr) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.leaderboard-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.leaderboard-header-row {
  display: flex;
  justify-content: flex-start;
}

.tab-group {
  display: flex;
  background: white;
  padding: 4px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-card);
  box-shadow: var(--shadow-sm);
}

.tab-btn {
  padding: 8px 24px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-btn.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.rank-list-card {
  background: white;
  padding: 0;
  overflow: hidden;
}

.rank-list-header {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid var(--color-bg-page);
  background: linear-gradient(to right, var(--color-primary-light), transparent);
}

.rank-icon {
  font-size: 32px;
}

.rank-title-group {
  display: flex;
  flex-direction: column;
}

.rank-badge {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 800;
  font-size: 14px;
  background: var(--color-bg-page);
  color: var(--color-text-secondary);
}

.rank-1 { background: #fbbf24; color: white; transform: scale(1.1); box-shadow: 0 0 10px rgba(251, 191, 36, 0.4); }
.rank-2 { background: #94a3b8; color: white; }
.rank-3 { background: #b45309; color: white; }

.job-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rank-value-cell {
  text-align: right;
}

.rank-value {
  font-size: 18px;
  font-weight: 800;
}

.empty-rank {
  padding: 60px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 14px;
}

.rank-table th {
  background: var(--color-bg-page);
  padding: 12px 24px;
}

.rank-table td {
  padding: 16px 24px;
}

@media (max-width: 640px) {
  .tab-group { width: 100%; }
  .tab-btn { flex: 1; }
}
</style>
