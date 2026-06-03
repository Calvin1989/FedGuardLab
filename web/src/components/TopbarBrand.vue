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
  color: #1e3a8a;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
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

.topbar-brand {
  color: #172554;
  font-size: 12px;
  letter-spacing: 0.16em;
}

.topbar-brand {
  font-weight: 800;
  letter-spacing: 0.13em;
}
</style>
