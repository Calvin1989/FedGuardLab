<script setup>
/**
 * JobEventTimeline — displays lifecycle events and training round logs.
 *
 * Pure display; all values received via props.
 * Lifecycle and round events are pre-computed display objects from App.vue.
 */
defineProps({
  /** Localised UI copy (the `t` computed from App.vue) */
  copy: {
    type: Object,
    required: true,
  },
  /** Pre-computed lifecycle display events */
  lifecycleEvents: {
    type: Array,
    default: () => [],
  },
  /** Pre-computed round display events */
  roundEvents: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <div class="detail-events compact-events">
    <div class="detail-events-heading">
      <div class="detail-section-heading">
        <h3 class="detail-section-title detail-events-title">{{ copy.eventTimeline }}</h3>
        <p class="detail-section-subtitle detail-events-subtitle">{{ copy.lifecycleEvents }}</p>
      </div>
      <span v-if="roundEvents.length > 0" class="round-count-pill">
        {{ copy.trainingRoundsCount.replace('{count}', roundEvents.length) }}
      </span>
    </div>

    <div v-if="lifecycleEvents.length > 0" class="event-timeline lifecycle-timeline">
      <div
        v-for="(ev, idx) in lifecycleEvents"
        :key="idx"
        class="event-item"
        :class="ev.eventClass"
      >
        <div class="event-body">
          <div class="event-header">
            <span class="event-icon" aria-hidden="true">{{ ev.icon }}</span>
            <span class="event-badge" :class="ev.badgeClass">{{ ev.badgeText }}</span>
            <span class="event-time">{{ ev.time }}</span>
            <span class="event-message">{{ ev.message }}</span>
          </div>
          <div v-if="ev.isFailed" class="event-failure">
            <p><strong>{{ copy.eventFailureReason }}:</strong> {{ ev.error }}</p>
            <pre v-if="ev.traceback" class="event-traceback">{{ ev.traceback }}</pre>
          </div>
        </div>
      </div>
    </div>

    <details v-if="roundEvents.length > 0" class="round-log-panel">
      <summary>
        <div class="detail-section-heading">
          <span class="detail-section-title">{{ copy.trainingRoundsTitle }}</span>
          <span class="detail-section-subtitle">{{ copy.trainingRoundsHint }}</span>
        </div>
        <strong>{{ copy.trainingRoundsCount.replace('{count}', roundEvents.length) }}</strong>
      </summary>
      <div class="round-log-list">
        <div
          v-for="(ev, idx) in roundEvents"
          :key="idx"
          class="round-log-row"
        >
          <div class="round-log-main">
            <span class="event-badge badge-round_progress">{{ ev.badgeText }}</span>
            <strong>{{ ev.roundLabel }}</strong>
            <span>{{ ev.time }}</span>
          </div>
          <div v-if="ev.hasMetrics" class="round-log-metrics">
            <span>{{ copy.accuracy }}: {{ ev.accuracy }}</span>
            <span>{{ copy.loss }}: {{ ev.loss }}</span>
            <span>{{ copy.asr }}: {{ ev.asr }}</span>
          </div>
        </div>
      </div>
    </details>

    <div
      v-if="lifecycleEvents.length === 0 && roundEvents.length === 0"
      class="empty-state small"
    >
      <p>{{ copy.noEvents }}</p>
    </div>
  </div>
</template>

<style scoped>
.detail-events {
  margin-top: 0;
  padding-top: 12px;
  border-top: 1px solid rgba(226, 232, 240, 0.90);
}

.detail-events-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.detail-section-heading {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
}

.detail-section-title,
.detail-events-title {
  margin: 0;
  color: #0f172a;
  font-size: 14px;
  font-weight: 900;
  letter-spacing: -0.01em;
  line-height: 1.2;
  text-transform: none;
}

.detail-section-subtitle,
.detail-events-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.45;
}

.round-count-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 3px 9px;
  border-radius: 999px;
  background: #edf2ff;
  color: #334155;
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
}

.event-timeline {
  display: grid;
  gap: 8px;
}

.event-item {
  display: block;
}

.event-icon {
  flex: 0 0 auto;
  width: auto;
  height: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
  background: transparent;
  font-size: 12px;
  line-height: 1;
}

.event-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 3px 9px;
  border-radius: 999px;
  background: #edf2ff;
  color: #334155;
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
}

.event-body {
  min-height: 0;
  padding: 6px 9px;
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 10px;
  background: #ffffff;
}

.event-header {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  gap: 6px;
  white-space: nowrap;
}

.event-time {
  flex: 0 0 auto;
  color: #94a3b8;
  font-size: 11px;
  line-height: 1.2;
}

.event-time::after {
  content: "\00b7";
  margin-left: 6px;
  color: #cbd5e1;
}

.event-message {
  min-width: 0;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  margin: 0;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-failure {
  margin-top: 10px;
}

.event-traceback {
  overflow: auto;
  max-height: 140px;
  margin-top: 10px;
  padding: 10px;
  border-radius: 12px;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 11px;
}

.round-log-panel {
  margin-top: 8px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.72);
}

.round-log-panel summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  cursor: pointer;
  color: #0f172a;
  font-weight: 900;
}

.round-log-panel summary::-webkit-details-marker {
  display: none;
}

.round-log-panel summary::marker {
  content: "";
}

.round-log-panel summary strong {
  flex: 0 0 auto;
  margin: 0;
  color: #0f172a;
  font-size: 14px;
  font-weight: 900;
  line-height: 1.2;
}

.round-log-panel summary::after {
  width: 8px;
  height: 8px;
  border-right: 2px solid #64748b;
  border-bottom: 2px solid #64748b;
  content: "";
  flex: 0 0 auto;
  transform: rotate(45deg);
  transform-origin: center;
  transition: transform 0.16s ease, border-color 0.16s ease;
}

.round-log-panel[open] summary::after {
  transform: rotate(225deg);
}

.round-log-panel summary:hover::after {
  border-color: #1d4ed8;
}

.round-log-list {
  max-height: 220px;
  overflow: auto;
  padding: 0 12px 12px;
}

.round-log-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  padding: 8px 0;
  border-top: 1px solid rgba(226, 232, 240, 0.90);
}

.round-log-main {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
}

.round-log-main strong {
  color: #111827;
  font-size: 12px;
  font-weight: 800;
}

.round-log-main > span:last-child {
  color: #94a3b8;
  font-size: 11px;
}

.round-log-metrics {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-left: auto;
}

.round-log-metrics > span {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding: 2px 8px;
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.empty-state {
  width: 100%;
  min-height: 82px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  border: 1px dashed rgba(148, 163, 184, 0.34);
  border-radius: 18px;
  color: #64748b;
  text-align: center;
  font-size: 13px;
  line-height: 1.6;
}

.empty-state.small {
  min-height: 70px;
  margin-top: 16px;
}

.lifecycle-timeline {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 8px;
}

@media (max-width: 760px) {
  .lifecycle-timeline {
    grid-template-columns: 1fr;
  }

  .lifecycle-timeline .event-header {
    flex-wrap: wrap;
    white-space: normal;
  }

  .lifecycle-timeline .event-message {
    white-space: normal;
  }
}
</style>
