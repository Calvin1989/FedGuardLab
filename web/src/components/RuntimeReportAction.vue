<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  href: {
    type: String,
    required: false,
    default: "",
  },
  linkLabel: {
    type: String,
    required: true,
  },
  notReadyLabel: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div class="stat-card">
    <span class="text-secondary text-xs font-bold uppercase tracking-wider">{{ label }}</span>
    <a
      v-if="href"
      class="btn btn-primary btn-sm"
      :href="href"
      target="_blank"
    >
      {{ linkLabel }}
    </a>
    <strong v-else class="text-muted text-sm">{{ notReadyLabel }}</strong>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border: 1px solid var(--color-border-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
  min-height: 64px;
}

.stat-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.text-xs { font-size: 11px; }
.text-sm { font-size: 13px; }
.font-bold { font-weight: 700; }
.uppercase { text-transform: uppercase; }
.tracking-wider { letter-spacing: 0.05em; }

.btn-sm {
  width: 100%;
  font-size: 11px;
  padding: 6px;
}
</style>
