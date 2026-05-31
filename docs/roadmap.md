# Roadmap

FedGuardLab 的目标是逐步构建一个轻量、可视化、可复现的联邦学习安全实验平台。

---

## Stage 1：平台 MVP

- [x] FastAPI 后端
- [x] Vue Dashboard
- [x] WebSocket 实时指标推送
- [x] YAML 配置加载
- [x] Pydantic 配置校验
- [x] 实验结果自动保存
- [x] HTML 报告生成
- [x] 前端打开报告
- [x] 前端选择实验配置

---

## Stage 2：真实联邦学习训练

- [x] 添加 PyTorch MNIST 模型
- [x] 实现 FedAvg
- [x] 实现 IID 数据划分
- [x] 实现 Dirichlet Non-IID 数据划分
- [x] 接入真实 MNIST FedAvg trainer
- [x] 在 Dashboard 中展示真实训练指标

---

## Stage 3：联邦学习安全实验

- [x] 实现真实 label flipping 攻击
- [x] 添加 attack success rate 评估逻辑
- [x] 实现 Median 聚合防御
- [x] 实现 Trimmed Mean 聚合防御
- [x] 实现 Krum 聚合防御
- [x] 实现 backdoor 攻击
- [x] 添加 backdoor + robust aggregation 对比实验
- [ ] 实现 model poisoning 攻击

---

## Stage 4：研究可用性增强

- [x] 支持多实验对比
- [x] 支持指标导出为 CSV
- [x] 支持生成 Markdown 报告
- [x] 支持 Docker Compose 启动
- [x] 添加 GitHub Actions quick test
- [x] 添加 Ruff 代码质量检查
- [ ] 添加更多预设实验场景
- [x] 支持实验历史持久化
- [x] 支持前端清理本地实验历史

---

## 版本记录

### v0.1.0

交互式 FL 安全实验 MVP。

### v0.2.0

Dashboard 对比报告和清理脚本。

### v0.3.0

Krum 鲁棒聚合防御。

### v0.4.0

Docker Compose 开发环境。

### v0.5.0

CSV 和 Markdown 报告导出。

### v0.6.0

Ruff、开发依赖和 GitHub Actions 质量检查。

### v0.7.0

前端实验历史持久化，刷新页面后保留已完成实验记录，并支持清空历史。

### v0.8.0

新增 MNIST trigger-based backdoor attack，并支持 backdoor ASR 评估。

### v0.9.0

新增 Backdoor + FedAvg / Median / Trimmed Mean / Krum 对比实验配置。

### v0.10.0

优化 Dashboard 和实验报告展示效果，并在 README 中加入项目截图。

### v1.0.0

稳定首个展示版：

- 固化当前实验能力；
- 完善 README、docs 和 LICENSE；
- 确认 Docker、CI、报告导出和 Dashboard 主流程可用；
- 前端 build 纳入 CI。

---

## 后续优先级建议

### v1.1.0-beta.1

Focus: experiment job lifecycle visibility and cancellation groundwork.

Planned / implemented items:

- [x] Add lightweight in-memory JobStore.
- [x] Replace global job dict with JobStore.
- [x] Add `GET /jobs`.
- [x] Add `POST /jobs/{job_id}/cancel`.
- [x] Track job timestamps: `created_at`, `started_at`, `finished_at`.
- [x] Filter frontend comparison history to report-ready jobs.
- [x] Persist hidden jobs in frontend comparison history.

### v1.1.0-beta.2

Focus: background task execution and WebSocket decoupling.

- [x] `POST /run` starts background training immediately via `asyncio.create_task`.
- [x] WebSocket `/ws/{job_id}` subscribes to an existing job's metrics and events via `JobEventHub`.
- [x] Refreshing the page or disconnecting WebSocket no longer stops training.
- [x] `POST /jobs/{job_id}/cancel` sets a cancellation flag; the background runner checks it between rounds and stops gracefully.
- [x] Frontend handles `{"event": "cancelled"}` as a neutral status, not an error.
- [x] `JobEventHub` — lightweight async pub/sub with per-job `SubscriberQueue`.
- [x] `run_job` — standalone async function that drives one experiment end-to-end.

Still in-memory; no database, Redis, or Celery.

### v1.1.0-beta.3

Focus: API healthcheck, Docker Compose readiness, and live API smoke test.

- [x] `GET /health` — returns `{"status": "ok", "service": "fedguardlab-api"}`.
- [x] Docker Compose healthcheck on backend — frontend waits for `service_healthy`.
- [x] Live API smoke test (`python api_smoke_test.py`) — uses Python stdlib, no external deps.
- [x] `FEDGUARDLAB_API_BASE` env var to override API address in smoke test.
- [x] Runner cancellation race fix — check cancel flag before entering "running" state.

Next steps:

- [ ] Durable job persistence (survive backend restarts).
- [ ] True cancellation: signal trainer to stop mid-round, not only between rounds.
- [ ] Multi-worker task queue (if concurrent experiments are needed).

### v1.1.0-rc.1

Release candidate — polish, documentation, and final stabilization.

- [ ] Frontend Cancel Experiment button (`web/src/App.vue`).
- [ ] API smoke test `--wait-finished` option.
- [ ] CHANGELOG.md。
- [ ] release checklist (`docs/release-checklist.md`)。
- [ ] README / docs final polish。
- [ ] Screenshots review。

### v1.1.0

Documentation and release stabilization — no new major features.

- 固化 v1.1.0-beta / rc 全部能力；
- 完善已知限制说明；
- 确认 README、docs、CHANGELOG 和 release checklist 齐全；
- 确认 Docker、CI、前端 build 和 smoke test 全流程可用。

### v1.2.0-alpha.1

Focus: durable job persistence (lightweight JSON, no database).

- [x] `JobStore` accepts optional `storage_path` parameter.
- [x] Job metadata and metrics are saved to `reports/jobs/index.json`.
- [x] On startup, existing jobs are restored from `index.json`.
- [x] Corrupt or missing `index.json` is handled gracefully (empty store).
- [x] `_load()` is backward-compatible with older JSON missing `cancel_requested` or `metrics`.
- [x] Report files (`reports/jobs/{job_id}/`) remain unchanged.

Known limitations:

- Single-process writes only; not suitable for multi-worker concurrency.
- Full `index.json` rewrite on every mutation (acceptable at current scale).
- Future v1.2 may upgrade to SQLite or a database backend.

### v1.2.0-alpha.2

Focus: job artifact index — expose report file metadata through the API.

- [x] `GET /jobs` and `GET /status/{job_id}` now return `has_report` and `artifacts`.
- [x] `artifacts` dict contains `config_json`, `metrics_csv`, `summary_md`, `report_html` (string paths).
- [x] Artifact metadata persisted to `index.json` via `JobStore.set_artifacts()`.
- [x] `save_job_results()` calls `build_job_artifacts()` and writes metadata after report generation.
- [x] Frontend `loadRecentJobsFromApi()` uses `job.artifacts?.report_html` + `job.has_report` to gate report availability.
- [x] Reports are still served via `GET /reports/{job_id}` — local file paths are never exposed to the browser.
- [x] API smoke test `--wait-finished` checks `has_report`, `artifacts`, and `report_html` presence.

### v1.2.0-alpha.3

Focus: restart recovery smoke test and artifact index consistency.

- [x] Add `api_smoke_test.py --check-recovery <job_id>`.
- [x] Verify recovered jobs through `GET /jobs` and `GET /status/{job_id}` after backend restart.
- [x] Validate artifact keys and artifact file existence.
- [x] Validate persisted `reports/jobs/index.json` consistency with API status response.
- [x] Fix `summary_md` artifact path to match the generated Markdown report file.

### v1.2.0-alpha.4

Focus: Jobs API filtering and sorting.

- [x] Add `GET /jobs?status=...`.
- [x] Add `GET /jobs?limit=...`.
- [x] Add `GET /jobs?sort=created_at_desc`.
- [x] Add `GET /jobs?sort=created_at_asc`.
- [x] Validate invalid `/jobs` query parameters in `api_smoke_test.py`.
- [ ] Polish frontend Recent Jobs filtering UX.

### v1.2.0-alpha.5

Focus: frontend Recent Jobs filtering UX.

- [x] Add Recent Jobs status filter.
- [x] Wire frontend filter state to `GET /jobs?status=...`.
- [x] Clarify default filter as "Finished with reports".
- [x] Keep non-finished jobs visible but excluded from comparison selection.
- [x] Keep existing Recent Jobs artifact/report metadata compatibility.
- [ ] Add Recent Jobs limit/sort controls.
- [ ] Polish report/artifact badges.

### v1.2.0-alpha.6

Focus: frontend Recent Jobs limit and sort controls.

- [x] Add Recent Jobs limit control.
- [x] Add Recent Jobs sort control.
- [x] Wire frontend controls to `GET /jobs?limit=...&sort=...`.
- [x] Keep controls compatible with the Recent Jobs status filter.
- [ ] Polish report/artifact badges.
- [ ] Add optional frontend recovery UX hints.

### v1.2.0-alpha.7

Focus: frontend report/artifact availability polish.

- [x] Add Recent Jobs report badge.
- [x] Add Recent Jobs artifacts badge.
- [x] Add no-report fallback badge.
- [x] Preserve existing report links and comparison selection behavior.
- [ ] Add optional frontend recovery UX hints.

### v1.2.0-beta.1

Focus: v1.2 stabilization and release readiness.

- [x] Consolidate alpha.1-alpha.7 documentation.
- [x] Confirm durable JobStore recovery validation path.
- [x] Confirm artifact metadata/index validation path.
- [x] Confirm Jobs API filter/sort validation path.
- [x] Confirm Recent Jobs UX validation path.
- [ ] Run full beta release validation from the release checklist.
- [ ] Prepare v1.2.0-rc.1 after beta validation is stable.

### v1.2.0-rc.1

Focus: release candidate readiness.

- [x] Confirm beta.1 validation path.
- [x] Confirm durable JobStore recovery validation.
- [x] Confirm artifact metadata/index validation.
- [x] Confirm Jobs API filter/sort validation.
- [x] Confirm Recent Jobs UX validation.
- [ ] Run final RC validation from the release checklist.
- [ ] Prepare v1.2.0 final release after RC validation is stable.

### v1.2.0

Backdoor attack 增强：

- 支持更多 trigger pattern；
- 支持更多目标标签攻击；
- 支持 backdoor ASR 评估优化。
