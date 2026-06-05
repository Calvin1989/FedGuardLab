<template>
  <div class="topbar-brand">
    <span class="brand-mark" aria-hidden="true"></span>
    <span>FedGuardLab</span>
  </div>
</template>

<style scoped>
.topbar-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #172554;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  transition: opacity 0.16s ease;
}

.topbar-brand:hover {
  opacity: 0.82;
}

.brand-mark {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, #22c55e, #2563eb);
  box-shadow:
    0 0 0 5px rgba(59, 130, 246, 0.10),
    0 8px 20px rgba(37, 99, 235, 0.20);
}

@media (max-width: 560px) {
  .topbar-brand {
    font-size: 11px;
  }
}
</style>
