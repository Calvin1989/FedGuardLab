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

Focus: stable release for durable jobs, artifacts, recovery validation, and Recent Jobs UX.

- [x] Complete durable JobStore persistence.
- [x] Complete job artifact metadata indexing.
- [x] Complete restart recovery validation.
- [x] Complete Jobs API filtering/sorting.
- [x] Complete Recent Jobs status/limit/sort controls.
- [x] Complete Recent Jobs report/artifact badges.
- [x] Complete beta.1 and rc.1 readiness documentation.
- [ ] Run final release validation from the release checklist.
- [ ] Create `v1.2.0` tag after final PR is merged to main.

### v1.3.0-alpha.1 — completed

Focus: CI workflow standardization for lint, quick tests, and frontend build.

- [x] CI workflow standardized as `.github/workflows/ci.yml`.
- [x] CI covers `ruff check .`.
- [x] CI covers `python quick_test.py`.
- [x] CI covers frontend `npm run build` under `web/`.
- [x] Docker Compose smoke tests deferred to alpha.2.

Notes:

- Docker Compose smoke validation is intentionally deferred to v1.3.0-alpha.2.
- This alpha remains lightweight and focused on CI reliability.

### v1.3.0-alpha.2 — completed

Focus: manual Docker Smoke workflow.

- [x] Created `.github/workflows/docker-smoke.yml` with `workflow_dispatch` trigger.
- [x] Docker smoke is not triggered on push or PR — manual only.
- [x] Docker smoke is independent from main CI (`ci.yml`).
- [x] Covers: `docker compose config` / `build` / `up` / `api_smoke_test.py` / `--wait-finished` / `restart backend` / `--check-recovery` / `down`.

### v1.3.0-alpha.3 — completed

Focus: finished job id output for smoke recovery.

- [x] `api_smoke_test.py` supports `--write-finished-job-id <path>` to write the finished job UUID to a file.
- [x] `--write-finished-job-id` requires `--wait-finished`; errors early otherwise.
- [x] Docker Smoke workflow reads `smoke_finished_job_id.txt` instead of parsing logs with regex.
- [x] Recovery check uses the UUID read from the file.

### v1.3.0-alpha.4 — completed

Focus: validation workflow documentation.

- [x] `docs/development.md` updated with recommended local verification order.
- [x] CI section in README updated to reference `ci.yml` and `docker-smoke.yml`.
- [x] `smoke_finished_job_id.txt` noted as temporary file,不应提交。

### v1.3.0-beta.1 — completed

Focus: Beta readiness validation for v1.3.

Beta.1 阶段不新增功能，不修改运行时代码，不改变 CI 触发策略。重点是稳定性验证和 release readiness。

Checklist：

- [x] `ruff check .`
- [x] `python quick_test.py`
- [x] `cd web && npm run build`
- [x] `docker compose config`
- [x] `docker compose build`
- [x] `docker compose up -d`
- [x] `python api_smoke_test.py`
- [x] `python api_smoke_test.py --wait-finished --write-finished-job-id smoke_finished_job_id.txt`
- [x] `docker compose restart backend`
- [x] `python api_smoke_test.py --check-recovery <真实 finished job UUID>`
- [x] `docker compose down`
- [x] GitHub Actions CI passing
- [x] GitHub Actions Docker Smoke manual workflow passing

### v1.3.0-rc.1 — completed

Focus: Release candidate validation for v1.3.0.

rc.1 阶段不新增功能，不修改运行时代码，不改变 CI 触发策略。重点是 final release candidate validation。

Checklist：

- [x] `ruff check .`
- [x] `python quick_test.py`
- [x] 前端构建检查（PowerShell 用户不要使用 `cd web && npm run build`，应分两行执行）：
  - `cd web`
  - `npm run build`
  - `cd ..`
- [x] `docker compose config`
- [x] `docker compose build`
- [x] `docker compose up -d`
- [x] `python api_smoke_test.py`
- [x] `python api_smoke_test.py --wait-finished --write-finished-job-id smoke_finished_job_id.txt`
- [x] `type smoke_finished_job_id.txt` — 确认 UUID 已写入
- [x] `docker compose restart backend`
- [x] 等待 backend healthy 后执行 `python api_smoke_test.py --check-recovery <真实 finished job UUID>`
- [x] `docker compose down`
- [x] `Remove-Item smoke_finished_job_id.txt` — 清理临时文件
- [x] GitHub Actions CI passing
- [x] GitHub Actions Docker Smoke manual workflow passing on main

### v1.3.0 — completed

Focus: Stable v1.3 validation and release reliability.

v1.3.0 不新增 runtime feature，重点是 Developer Experience / Validation / Release Reliability。

Checklist：

- [x] `ruff check .`
- [x] `python quick_test.py`
- [x] 前端构建检查（PowerShell 分两行执行）：
  - `cd web`
  - `npm run build`
  - `cd ..`
- [x] `docker compose config`
- [x] `docker compose build`
- [x] `docker compose up -d`
- [x] `python api_smoke_test.py`
- [x] `python api_smoke_test.py --wait-finished --write-finished-job-id smoke_finished_job_id.txt`
- [x] `type smoke_finished_job_id.txt` — 确认 UUID 已写入
- [x] `docker compose restart backend`
- [x] wait for backend healthy
- [x] `python api_smoke_test.py --check-recovery <真实 finished job UUID>`
- [x] `docker compose down`
- [x] `Remove-Item smoke_finished_job_id.txt` — 清理临时文件
- [x] GitHub Actions CI passing on main
- [x] GitHub Actions Docker Smoke manual workflow passing on main
- [x] Final tag 打在 main merge commit 上（PR 合并后）

---

## v1.4.0 Roadmap

v1.4.0 主题：Experiment Usability + Reproducibility + Project Polish.

### v1.4.0-alpha.1 — completed

Focus: experiment config catalog metadata.

- [x] `GET /configs` now returns an optional `metadata` object per config item: `name`, `description`, `category`, `tags`.
- [x] Backward compatible: existing fields unchanged; metadata read from raw YAML separately.
- [x] All existing configs under `configs/` include metadata.
- [x] `docs/configs.md` updated with metadata field documentation.

### v1.4.0-alpha.2 — completed

Focus: frontend config metadata display.

- [x] After selecting a config, a lightweight info block shows: display name, description, category, and tags.
- [x] Tags rendered as small badges.
- [x] Safe fallback when metadata is missing.

### v1.4.0-alpha.3 — completed

Focus: frontend config category filter.

- [x] Category filter dropdown above the experiment selector, defaulting to "All categories".
- [x] Category list dynamically extracted, deduplicated, and sorted.
- [x] Selecting a category filters the config dropdown; auto-selects first available config if current is excluded.
- [x] Empty state: "No configs available for this category."

### v1.4.0-alpha.4 — completed

Focus: Recent Jobs detail panel.

- [x] Clicking a job row shows a lightweight detail card below the table.
- [x] Detail card displays: job_id, status, config_path, created_at, started_at, finished_at, report availability, artifacts count.
- [x] Selected row gets a subtle highlight; clicking again deselects.
- [x] Shows "Select a job to inspect details." when no job is selected.

### v1.4.0-beta.1 — completed

Focus: Beta readiness validation for v1.4.

Beta.1 阶段不新增功能，不修改运行时代码，不改变 CI 触发策略。重点是稳定性验证和 release readiness。

Checklist：

- [x] `ruff check .`
- [x] `python quick_test.py`
- [x] 前端构建检查（PowerShell 分两行执行）：
  - `cd web`
  - `npm run build`
  - `cd ..`
- [x] `python api_smoke_test.py`
- [x] `docker compose config`
- [x] `docker compose build`
- [x] `docker compose up -d`
- [x] `python api_smoke_test.py --wait-finished --write-finished-job-id smoke_finished_job_id.txt`
- [x] `type smoke_finished_job_id.txt` — 确认 UUID 已写入
- [x] `docker compose restart backend`
- [x] wait for backend healthy
- [x] `python api_smoke_test.py --check-recovery <真实 finished job UUID>`
- [x] `docker compose down`
- [x] `Remove-Item smoke_finished_job_id.txt` — 清理临时文件
- [x] GitHub Actions CI passing
- [x] GitHub Actions Docker Smoke manual workflow passing

### v1.4.0-rc.1 — completed

Focus: Release candidate validation for v1.4.0.

rc.1 阶段不新增功能，不修改运行时代码，不改变 CI 触发策略。重点是 final release candidate validation。

Checklist：

- [x] `ruff check .`
- [x] `python quick_test.py`
- [x] 前端构建检查（PowerShell 分两行执行）：
  - `cd web`
  - `npm run build`
  - `cd ..`
- [x] `python api_smoke_test.py`
- [x] `docker compose config`
- [x] `docker compose build`
- [x] `docker compose up -d`
- [x] `python api_smoke_test.py --wait-finished --write-finished-job-id smoke_finished_job_id.txt`
- [x] `type smoke_finished_job_id.txt` — 确认 UUID 已写入
- [x] `docker compose restart backend`
- [x] `Start-Sleep -Seconds 10`
- [x] `python api_smoke_test.py --check-recovery <真实 finished job UUID>`
- [x] `docker compose down`
- [x] `Remove-Item smoke_finished_job_id.txt` — 清理临时文件
- [x] GitHub Actions CI passing
- [x] GitHub Actions Docker Smoke manual workflow passing on main

### v1.4.0

Focus: Stable v1.4 experiment usability and release polish.

v1.4.0 不新增 runtime feature，重点是 Experiment Usability + Reproducibility + Project Polish。

Checklist：

- [ ] `ruff check .`
- [ ] `python quick_test.py`
- [ ] 前端构建检查（PowerShell 分两行执行）：
  - `cd web`
  - `npm run build`
  - `cd ..`
- [ ] `python api_smoke_test.py`
- [ ] `docker compose config`
- [ ] `docker compose build`
- [ ] `docker compose up -d`
- [ ] `python api_smoke_test.py --wait-finished --write-finished-job-id smoke_finished_job_id.txt`
- [ ] `type smoke_finished_job_id.txt` — 确认 UUID 已写入
- [ ] `docker compose restart backend`
- [ ] `Start-Sleep -Seconds 10`
- [ ] `python api_smoke_test.py --check-recovery <真实 finished job UUID>`
- [ ] `docker compose down`
- [ ] `Remove-Item smoke_finished_job_id.txt` — 清理临时文件
- [ ] GitHub Actions CI passing on main
- [ ] GitHub Actions Docker Smoke manual workflow passing on main
- [ ] Final tag 打在 main merge commit 上（PR 合并后）

---

## v1.5.0 Roadmap

v1.5.0 主题：Frontend Localization + UI Polish.

v1.5.0 目标：

- 页面默认中文显示。
- 支持中文 / English 手动切换。
- 使用 localStorage 保存语言选择。
- 不使用 IP 判断语言。
- 页面视觉美化，提升卡片、按钮、表格、状态标签的一致性。

### v1.5.0-alpha.1

Focus: Frontend localization with Chinese default and English toggle.

- [ ] 页面默认语言改为中文。
- [ ] 添加中 / 英文手动切换控件。
- [ ] 使用 localStorage 持久化用户语言选择。
- [ ] 不引入 vue-i18n；使用轻量本地 translations object 管理文本。
- [ ] 不使用 IP 地理位置判断语言。
- [ ] 覆盖 Dashboard 主要文本：标题、按钮、标签、状态、表格列头、提示语。

### v1.5.0-alpha.2

Focus: Dashboard visual polish.

- [ ] 卡片样式统一：圆角、阴影、间距。
- [ ] 按钮样式统一：颜色、hover 状态、disabled 状态。
- [ ] 表格样式统一：行高、边框、斑马纹。
- [ ] 状态标签样式统一：颜色编码、圆角 badge。
- [ ] 不改 API、不改训练逻辑、不改后端代码。

### v1.5.0-beta.1 — completed

Focus: Beta readiness validation for localized and polished v1.5 UI.

Beta.1 阶段不新增功能，不修改运行时代码，不改变 CI 触发策略。重点是稳定性验证和 release readiness。

v1.5 alpha series 已完成：

- v1.5.0-alpha.1：Frontend localization with Chinese default and English toggle。
- v1.5.0-alpha.1：Localized HTML experiment and comparison reports via `?lang=zh` / `?lang=en`。
- v1.5.0-alpha.2：Dashboard visual polish。
- v1.5.0-alpha.2：Unified Experiment Report and Comparison Report visual style。

Checklist：

- [x] `ruff check .`
- [x] `python quick_test.py`
- [x] 前端构建检查：
  - `cd web`
  - `npm run build`
  - `cd ..`
- [x] `python api_smoke_test.py`
- [x] 目视检查首页中文默认。
- [x] 目视检查 English 切换。
- [x] 目视检查刷新后语言保持。
- [x] 目视检查 `/reports/<job_id>?lang=zh`。
- [x] 目视检查 `/reports/<job_id>?lang=en`。
- [x] 目视检查 `/comparisons/<comparison_id>?lang=zh`。
- [x] 目视检查 `/comparisons/<comparison_id>?lang=en`。
- [x] `docker compose config`
- [x] `docker compose build`
- [x] `docker compose up -d`
- [x] `python api_smoke_test.py --wait-finished --write-finished-job-id smoke_finished_job_id.txt`
- [x] `type smoke_finished_job_id.txt` — 确认 UUID 已写入
- [x] `docker compose restart backend`
- [x] `Start-Sleep -Seconds 10`
- [x] `python api_smoke_test.py --check-recovery <真实 finished job UUID>`
- [x] `docker compose down`
- [x] `Remove-Item smoke_finished_job_id.txt` — 清理临时文件
- [x] GitHub Actions CI passing
- [x] GitHub Actions Docker Smoke manual workflow passing

### v1.5.0-rc.1 — completed

Focus: Release candidate validation for localized and polished v1.5 UI.

rc.1 阶段不新增功能，不修改运行时代码，不改变 CI 触发策略。重点是 final release candidate validation。

v1.5.0-beta.1 已完成 beta readiness。

Checklist：

- [x] `ruff check .`
- [x] `python quick_test.py`
- [x] 前端构建检查：
  - `cd web`
  - `npm run build`
  - `cd ..`
- [x] `python api_smoke_test.py`
- [x] 目视检查首页默认中文。
- [x] 目视检查 English 切换。
- [x] 目视检查刷新后语言保持。
- [x] 目视检查 report 链接带 `?lang=zh` / `?lang=en`。
- [x] 目视检查 `/reports/<job_id>?lang=zh`。
- [x] 目视检查 `/reports/<job_id>?lang=en`。
- [x] 目视检查 `/comparisons/<comparison_id>?lang=zh`。
- [x] 目视检查 `/comparisons/<comparison_id>?lang=en`。
- [x] `docker compose config`
- [x] `docker compose build`
- [x] `docker compose up -d`
- [x] `python api_smoke_test.py --wait-finished --write-finished-job-id smoke_finished_job_id.txt`
- [x] `type smoke_finished_job_id.txt` — 确认 UUID 已写入
- [x] `docker compose restart backend`
- [x] `Start-Sleep -Seconds 10`
- [x] `python api_smoke_test.py --check-recovery <真实 finished job UUID>`
- [x] `docker compose down`
- [x] `Remove-Item smoke_finished_job_id.txt` — 清理临时文件
- [x] GitHub Actions CI passing
- [x] GitHub Actions Docker Smoke manual workflow passing on main

### v1.5.0

Focus: Stable localized and polished FedGuardLab UI.

v1.5.0 不新增 runtime feature，重点是 Frontend Localization + UI Polish。

v1.5.0 release scope：

- Frontend localization with Chinese default.
- English language toggle.
- localStorage language persistence.
- Localized HTML Experiment Report.
- Localized HTML Comparison Report.
- Dashboard visual polish.
- Unified report page visual style.
- Beta readiness documentation.
- Release candidate readiness documentation.

Checklist：

- [ ] `ruff check .`
- [ ] `python quick_test.py`
- [ ] 前端构建检查：
  - `cd web`
  - `npm run build`
  - `cd ..`
- [ ] `python api_smoke_test.py`
- [ ] 目视检查首页默认中文。
- [ ] 目视检查 English 切换。
- [ ] 目视检查刷新后语言保持。
- [ ] 目视检查 report 链接带 `?lang=zh` / `?lang=en`。
- [ ] 目视检查 `/reports/<job_id>?lang=zh`。
- [ ] 目视检查 `/reports/<job_id>?lang=en`。
- [ ] 目视检查 `/comparisons/<comparison_id>?lang=zh`。
- [ ] 目视检查 `/comparisons/<comparison_id>?lang=en`。
- [ ] `docker compose config`
- [ ] `docker compose build`
- [ ] `docker compose up -d`
- [ ] `python api_smoke_test.py --wait-finished --write-finished-job-id smoke_finished_job_id.txt`
- [ ] `type smoke_finished_job_id.txt` — 确认 UUID 已写入
- [ ] `docker compose restart backend`
- [ ] `Start-Sleep -Seconds 10`
- [ ] `python api_smoke_test.py --check-recovery <真实 finished job UUID>`
- [ ] `docker compose down`
- [ ] `Remove-Item smoke_finished_job_id.txt` — 清理临时文件
- [ ] GitHub Actions CI passing on main
- [ ] GitHub Actions Docker Smoke manual workflow passing on main
- [ ] Final tag 打在 main merge commit 上（PR 合并后）

---

## v1.6.0 Roadmap

v1.6.0 主题：Experiment Comparison UX + Export Polish.

v1.6.0 目标：

- Comparison report 显示更清晰的实验摘要。
- Comparison report 显示参与对比的 job 列表及每个 job 的详细信息。
- Comparison report 保持 zh/en 双语。
- 首页 comparison 区域 UX 优化。
- 导出入口更清晰统一。
- 不引入新依赖。
- 不改变现有 API 行为。
- 不新增训练算法、攻击算法。
- 不大规模重构后端、不引入新数据库、不引入新 UI 框架。

### v1.6.0-alpha.1 — completed

Focus: Comparison report metadata polish.

- [x] Comparison report 显示更清晰的实验摘要（comparison summary）。
- [x] Comparison report 显示参与对比的 job 列表。
- [x] Comparison report 显示每个 job 的 config、status、created_at、finished_at。
- [x] Comparison report 保持 zh/en 双语（`?lang=zh` / `?lang=en`）。
- [x] 不改变现有 API 行为，不修改后端逻辑。
- [x] 不引入新依赖。

### v1.6.0-alpha.2 — completed

Focus: Frontend comparison UX polish.

- [x] 首页 comparison 区域更清晰。
- [x] 选中 jobs 后显示更好的对比预览。
- [x] 对比按钮和状态提示更明确。
- [x] 不引入新依赖。
- [x] 不改变现有 API 行为。

### v1.6.0-alpha.3 — completed

Focus: Export/download entry polish.

- [x] report / CSV / Markdown 下载入口更清晰。
- [x] job detail panel 中导出入口更统一。
- [x] comparison export 入口更清晰。
- [x] 不引入新依赖。
- [x] 不改变现有 API 行为。

### v1.6.0-beta.1

Focus: Beta readiness validation for v1.6.

Beta.1 阶段不新增功能，不新增依赖，不改 API，不修改运行时代码，不改变 CI 触发策略。重点是稳定性验证和 release readiness。

v1.6 alpha series 已完成：

- v1.6.0-alpha.1：Comparison report metadata polish（comparison report 显示 job 摘要信息）。
- v1.6.0-alpha.2：Frontend comparison UX polish（已选择实验预览、comparison 创建反馈优化）。
- v1.6.0-alpha.3：Export/download entry polish（job 导出区域、comparison 导出区域、report 页面导出优化）。

Beta.1 验证重点：

- comparison report metadata 是否准确。
- selected jobs preview 是否清晰。
- comparison creation feedback 是否稳定。
- job exports 和 comparison exports 是否易发现。
- zh/en 双语是否一致。
- report 页面风格是否统一。

Checklist：

- [ ] `ruff check .`
- [ ] `python quick_test.py`
- [ ] 前端构建检查：
  - `cd web`
  - `npm run build`
  - `cd ..`
- [ ] `python api_smoke_test.py`
- [ ] 目视检查 comparison report 显示 job 摘要信息。
- [ ] 目视检查 comparison report `?lang=zh` / `?lang=en`。
- [ ] 目视检查首页 comparison 区域 UX。
- [ ] 目视检查导出入口。
- [ ] `docker compose config`
- [ ] `docker compose build`
- [ ] `docker compose up -d`
- [ ] `python api_smoke_test.py --wait-finished --write-finished-job-id smoke_finished_job_id.txt`
- [ ] `type smoke_finished_job_id.txt` — 确认 UUID 已写入
- [ ] `docker compose restart backend`
- [ ] `Start-Sleep -Seconds 10`
- [ ] `python api_smoke_test.py --check-recovery <真实 finished job UUID>`
- [ ] `docker compose down`
- [ ] `Remove-Item smoke_finished_job_id.txt` — 清理临时文件
- [ ] GitHub Actions CI passing
- [ ] GitHub Actions Docker Smoke manual workflow passing

### v1.6.0-rc.1

Focus: Release candidate validation for v1.6.0.

rc.1 阶段不新增功能，不修改运行时代码，不改变 CI 触发策略。重点是 final release candidate validation。

v1.6.0-beta.1 已完成 beta readiness。

Checklist：

- [ ] `ruff check .`
- [ ] `python quick_test.py`
- [ ] 前端构建检查：
  - `cd web`
  - `npm run build`
  - `cd ..`
- [ ] `python api_smoke_test.py`
- [ ] 目视检查 comparison report 显示 job 摘要信息。
- [ ] 目视检查 comparison report `?lang=zh` / `?lang=en`。
- [ ] 目视检查首页 comparison 区域 UX。
- [ ] 目视检查导出入口。
- [ ] `docker compose config`
- [ ] `docker compose build`
- [ ] `docker compose up -d`
- [ ] `python api_smoke_test.py --wait-finished --write-finished-job-id smoke_finished_job_id.txt`
- [ ] `type smoke_finished_job_id.txt` — 确认 UUID 已写入
- [ ] `docker compose restart backend`
- [ ] `Start-Sleep -Seconds 10`
- [ ] `python api_smoke_test.py --check-recovery <真实 finished job UUID>`
- [ ] `docker compose down`
- [ ] `Remove-Item smoke_finished_job_id.txt` — 清理临时文件
- [ ] GitHub Actions CI passing
- [ ] GitHub Actions Docker Smoke manual workflow passing on main

### v1.6.0

Focus: Stable comparison UX and export polish.

v1.6.0 不新增 runtime feature，重点是 Experiment Comparison UX + Export Polish。

v1.6.0 release scope：

- Comparison report metadata polish.
- Frontend comparison UX polish.
- Export/download entry polish.
- Beta readiness documentation.
- Release candidate readiness documentation.

Checklist：

- [ ] `ruff check .`
- [ ] `python quick_test.py`
- [ ] 前端构建检查：
  - `cd web`
  - `npm run build`
  - `cd ..`
- [ ] `python api_smoke_test.py`
- [ ] 目视检查 comparison report 显示 job 摘要信息。
- [ ] 目视检查 comparison report `?lang=zh` / `?lang=en`。
- [ ] 目视检查首页 comparison 区域 UX。
- [ ] 目视检查导出入口。
- [ ] `docker compose config`
- [ ] `docker compose build`
- [ ] `docker compose up -d`
- [ ] `python api_smoke_test.py --wait-finished --write-finished-job-id smoke_finished_job_id.txt`
- [ ] `type smoke_finished_job_id.txt` — 确认 UUID 已写入
- [ ] `docker compose restart backend`
- [ ] `Start-Sleep -Seconds 10`
- [ ] `python api_smoke_test.py --check-recovery <真实 finished job UUID>`
- [ ] `docker compose down`
- [ ] `Remove-Item smoke_finished_job_id.txt` — 清理临时文件
- [ ] GitHub Actions CI passing on main
- [ ] GitHub Actions Docker Smoke manual workflow passing on main
- [ ] Final tag 打在 main merge commit 上（PR 合并后）
