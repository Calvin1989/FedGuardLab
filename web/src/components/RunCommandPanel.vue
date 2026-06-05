<script setup>
import DashboardSectionHeading from "./DashboardSectionHeading.vue";
import ConfigPreview from "./ConfigPreview.vue";

const selectedCategory = defineModel("selectedCategory", { type: String, default: "all" });
const selectedConfig = defineModel("selectedConfig", { type: String, default: "" });

defineProps({
  copy: { type: Object, required: true },
  categoryOptions: { type: Array, default: () => [] },
  configOptions: { type: Array, default: () => [] },
  configMetadata: { type: Object, default: null },
  configDescription: { type: String, default: "" },
  configPreview: { type: Object, default: null },
  configLabel: { type: String, default: "" },
  isRunning: { type: Boolean, default: false },
});

const emit = defineEmits(["start", "cancel"]);
</script>

<template>
  <section class="command-card">
    <DashboardSectionHeading
      :copy="{ kicker: copy.eyebrow, title: copy.heroTitle, hint: copy.heroSubtitle }"
    />

    <div class="command-controls">
      <label class="field-control" for="category-filter">
        <span>{{ copy.categoryLabel }}</span>
        <select
          id="category-filter"
          v-model="selectedCategory"
          class="experiment-select"
          :disabled="isRunning"
        >
          <option value="all">{{ copy.allCategories }}</option>
          <option
            v-for="cat in categoryOptions"
            :key="cat"
            :value="cat"
          >
            {{ cat }}
          </option>
        </select>
      </label>

      <label class="field-control field-control-wide" for="experiment-select">
        <span>{{ copy.experimentLabel }}</span>
        <select
          v-if="configOptions.length > 0"
          id="experiment-select"
          v-model="selectedConfig"
          class="experiment-select"
          :disabled="isRunning"
        >
          <option
            v-for="option in configOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        <span v-else class="config-empty-filter">
          {{ copy.noConfigsForCategory }}
        </span>
      </label>

      <div class="command-run-group">
        <button
          class="run-button"
          :disabled="isRunning || configOptions.length === 0"
          @click="emit('start')"
        >
          {{ isRunning ? copy.running : copy.runExperiment }}
        </button>

        <button
          v-if="isRunning"
          class="secondary-button"
          @click="emit('cancel')"
        >
          {{ copy.cancelExperiment }}
        </button>
      </div>
    </div>

    <div v-if="configMetadata" class="selected-config-summary">
      <div class="selected-config-copy">
        <span class="selected-config-kicker">{{ copy.configPreview }}</span>
        <strong>{{ configMetadata.name || configLabel }}</strong>
        <p>
          {{ configMetadata.description || configDescription }}
        </p>
      </div>

      <div
        v-if="configMetadata.tags.length > 0"
        class="selected-config-tags"
      >
        <span
          v-for="tag in configMetadata.tags"
          :key="tag"
          class="config-tag"
        >
          {{ tag }}
        </span>
      </div>
    </div>

    <ConfigPreview
      v-if="configPreview"
      :preview="configPreview"
      :copy="copy"
    />
  </section>
</template>

<style scoped>
/* Card surface (migrated from App.vue) */
.command-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.04);
  padding: 20px 22px;
  animation: commandFadeIn 0.28s ease-out both;
}

@keyframes commandFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.command-card > * {
  position: relative;
  z-index: 1;
}

.command-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  margin-bottom: 12px;
}

.field-control {
  display: grid;
  min-width: 0;
  gap: 4px;
  flex: 1 1 160px;
}

.field-control-wide {
  flex: 2 1 240px;
}

.field-control > span:first-child {
  color: #475569;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.experiment-select {
  width: 100%;
  min-height: 36px;
  padding: 0 34px 0 10px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
  outline: none;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.experiment-select:focus {
  border-color: rgba(37, 99, 235, 0.48);
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.experiment-select:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.4);
  outline-offset: 1px;
}

.run-button:focus-visible,
.secondary-button:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.5);
  outline-offset: 2px;
}

.run-button {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 20px;
  border: 1px solid #1d4ed8;
  border-radius: 8px;
  background: #2563eb;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  word-break: keep-all;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);
}

.run-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.secondary-button {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 16px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  word-break: keep-all;
  cursor: pointer;
}

.secondary-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.config-empty-filter {
  min-height: 36px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border: 1px dashed rgba(148, 163, 184, 0.46);
  border-radius: 10px;
  color: #64748b;
  font-size: 12px;
}

.command-run-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.selected-config-summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  margin-top: 0;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 10px;
  background: #f8fafc;
  box-shadow: none;
}

.selected-config-copy {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.selected-config-kicker {
  display: block;
  margin: 0;
  color: #2563eb;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.04em;
  line-height: 1.2;
}

.selected-config-copy strong {
  display: block;
  margin: 0;
  color: #0f172a;
  font-size: 14px;
  font-weight: 900;
  line-height: 1.25;
}

.selected-config-copy p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.45;
}

.selected-config-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  max-width: 360px;
}

.config-tag {
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

@media (max-width: 860px) {
  .command-card {
    border-radius: 12px;
  }

  .command-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .field-control,
  .field-control-wide {
    flex: 1 1 auto;
  }

  .selected-config-summary {
    flex-direction: column;
    align-items: stretch;
  }

  .selected-config-tags {
    justify-content: flex-start;
  }
}
</style>
