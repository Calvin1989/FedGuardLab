# Changelog

## Unreleased

- No unreleased changes.

## v1.9.5

- Polished dashboard top navigation, jobs toolbar, jobs table, and comparison/report panel layout for a more consistent UI surface.
- Reduced repeated panel copy and refined comparison/report panel headers without runtime behavior changes.
- Added frontend workflow to reuse experiment configuration from a selected history job.
- Fixed the reuse-config flow: matching now runs at click time against experiment options instead of pre-evaluating in a computed property, and the button is enabled based on config candidate fields alone.
- Fixed reports cleanup refresh callbacks calling `.catch` on synchronous functions by wrapping return values in `Promise.resolve()`.
- No backend API behavior change, no training logic change, and no report artifact URL change.

## v1.9.4

- Added Vitest unit coverage for the dashboard i18n composable helpers.
- Added Vitest unit coverage for experiment option loading, filtering, and preview formatting helpers.
- Added Vitest unit coverage for comparison report creation, history loading, and artifact URL helpers.
- Added Vitest unit coverage for reports cleanup and runtime monitor composables.
- Added Vitest unit coverage for recent jobs loading, filtering, selection, archive, and cleanup behavior.
- Expanded frontend Vitest coverage to 388 tests across dashboard composables.
- No runtime behavior change, no API behavior change, no training logic change, no report artifact URL change, and no new dependency.

## v1.9.3

- Added Vitest-based frontend unit test coverage for dashboard formatter helpers and wired frontend tests into CI.
- Fixed frontend lockfile compatibility for GitHub Actions `npm ci` by pinning Vitest to a Vite 5-compatible 3.x release, with no frontend runtime behavior change.
- Refactored dashboard frontend logic into composables and helpers.
  - Extracted i18n, experiment option loading, reports cleanup, recent jobs, comparison, runtime monitor, and dashboard formatter logic from `App.vue`.
  - Reduced `App.vue` to the root dashboard orchestration layer while keeping template bindings and scoped styles intact.
  - Preserved report artifact URLs, comparison history behavior, recent jobs cleanup behavior, WebSocket runtime monitoring, and dashboard UI bindings.
  - Fixed shared `errorMessage` handling between `useExperimentOptions` and `useRuntimeMonitor`.
  - No documented API behavior change, training logic change, report artifact URL change, or new dependency.

## v1.9.2

- Completed dashboard UI scoped style cleanup after the component extraction work.
  - Removed duplicated and dead App.vue scoped styles.
  - Completed scoped component style migration and cleanup work from PR #140 through PR #151.
  - Kept dashboard UI cleanup scoped to presentation and styling maintenance.
  - No documented API behavior change, training logic change, report artifact URL change, or new dependency in this maintenance release.

## v1.9.1

- Prepared v1.9.1 maintenance release documentation.
  - Recorded GitHub Actions Node 24 compatibility workflow maintenance.
  - Confirmed Docker Smoke workflow after the workflow update.
  - No runtime feature change, no API behavior change, no training logic change, no report artifact URL change, and no new dependency.

## v1.9.0

- Finalized v1.9.0 Experiment Result Management.
  - Added Dashboard history experiment management UI.
  - Added job archive / restore workflow with archived filtering and comparison protection.
  - Added comparison report history API and Dashboard panel.
  - Unified report and artifact entry styling.
  - Added reports cleanup summary API and Dashboard panel.
  - Added reports cleanup run API with safe dry-run default and explicit confirmation requirement for real deletion.
  - Added Dashboard cleanup run controls with browser confirmation before real deletion.
  - Consolidated v1.9 alpha, beta, and release candidate documentation.
  - Kept training core logic and report artifact URLs stable.

## v1.9.0-rc.1

- Prepared v1.9.0 release candidate readiness documentation.
  - Summarized v1.9 Experiment Result Management scope after alpha and beta readiness.
  - Confirmed reports cleanup safety semantics: summary is read-only, cleanup run defaults to dry-run, and real deletion requires explicit confirmation.
  - Confirmed Dashboard cleanup controls require user confirmation before real deletion.
  - Documented final release candidate validation path, including Docker full flow and backend restart recovery.
  - No runtime feature, API behavior, training logic, report artifact URL, Docker runtime, or dependency changes.

## v1.9.0-beta.1

- Prepared v1.9.0 beta readiness documentation.
  - Summarized the completed v1.9 alpha series.
  - Defined beta validation scope for Experiment Result Management.
  - Reconfirmed reports cleanup safety semantics.
  - No runtime feature change, no dependency change, no API behavior change, no training logic change, no report artifact URL change, no Docker runtime change.
  - Validation target:
    - `git diff --check`
    - `python -m ruff check .`
    - `python quick_test.py`
    - `python -m pytest`
    - `cd web && npm run build`
    - `python api_smoke_test.py`
    - Docker Compose full flow and backend restart recovery.

## v1.9.0-alpha.10

- Consolidated v1.9.0 alpha release documentation.
  - Added release notes for the v1.9.0 alpha series.
  - Backfilled changelog coverage for alpha.2 through alpha.9.
  - Documented reports cleanup safety semantics: summary is read-only, cleanup run defaults to dry-run, and real deletion requires explicit confirmation.
  - Documented v1.9 Experiment Result Management scope.
  - No runtime feature, no API behavior change, no training logic change, no report artifact URL change, no Docker runtime change, no dependency change.

## v1.9.0-alpha.9

- Added Dashboard controls for reports cleanup run.
  - Added dry-run preview action.
  - Added cleanup candidates action guarded by browser confirmation.
  - Connected Dashboard to `POST /reports/cleanup/run`.
  - Displayed cleanup run result: candidate count, deleted count, freed space, skipped count, and error count.
  - Refreshed cleanup summary after execution.
  - Attempted to refresh comparison history and job history after confirmed cleanup.
  - Kept default behavior safe; no automatic deletion.

## v1.9.0-alpha.8

- Added reports cleanup run API.
  - Added `POST /reports/cleanup/run`.
  - Default behavior is `dry_run=true`.
  - Real deletion requires `dry_run=false` and `confirm=true`.
  - Cleanup is limited to candidates returned by cleanup summary preview.
  - Added candidate count, deleted count, deleted size, skipped items, and errors to the response.
  - Added path safety checks for reports root and reports tree boundaries.
  - Extended unit tests and API smoke coverage.

## v1.9.0-alpha.7

- Fixed reports cleanup panel layout.
  - Ensured the cleanup panel renders as an independent Dashboard section.
  - Consolidated shared info-panel styling.
  - Reduced long cleanup preview access chains in the template.
  - Kept API, training logic, report artifact URLs, and Docker runtime unchanged.

## v1.9.0-alpha.6

- Added reports cleanup summary foundation.
  - Added `GET /reports/cleanup/summary`.
  - Summarized job reports, comparison reports, total storage size, and modified-time range.
  - Added cleanup preview with candidate count, candidate size, and candidate list.
  - Marked summary as `dry_run=true` and `deletes_files=false`.
  - Added Dashboard read-only summary panel for local reports cleanup strategy.
  - Added tests and smoke coverage.

## v1.9.0-alpha.5

- Unified Dashboard report and artifact entry styling.
  - Normalized report links, detail export items, comparison export items, and comparison history links.
  - Preserved existing report artifact URLs and Dashboard behavior.
  - Kept the change limited to Dashboard UI.

## v1.9.0-alpha.4

- Cleaned up Dashboard CSS overrides.
  - Removed duplicate Dashboard comparison-density CSS.
  - Removed superseded lifecycle timeline style blocks.
  - Cleaned selected-jobs spacing overrides.
  - Preserved final effective timeline, comparison history, and report entry styles.

## v1.9.0-alpha.3

- Added comparison report history management.
  - Added comparison history listing.
  - Added query validation for comparison history limits and sort order.
  - Added Dashboard comparison history table with direct HTML / CSV / JSON access.
  - Preserved existing comparison artifact paths.

## v1.9.0-alpha.2

- Added job archive / restore management.
  - Added archived job state and archived timestamp.
  - Added active / archived / all job filtering.
  - Added archive and restore flow validation.
  - Prevented archived jobs from being used in new comparisons.
  - Preserved existing report artifacts and job recovery behavior.

## v1.9.0-alpha.1

- Started v1.9.0 Experiment Result Management with Dashboard history management UI.
  - Renamed the comparison area to "历史实验与对比".
  - Added history experiment summary stats: listed jobs, comparable jobs, selected jobs, and active filter.
  - Clarified comparison readiness without adding new API endpoints.
  - Reduced redundant status labels in job detail and selected job preview.
  - Polished event timeline copy, icon placement, and Chinese display.
  - Made round progress logs more compact.
  - No API change, no training logic change, no report artifact URL change, no Docker runtime change, no test data structure change.
  - Verified with:
    - `python -m ruff check .`
    - `python quick_test.py`
    - `python -m pytest`
    - `cd web && npm run build`
    - `python api_smoke_test.py`

## v1.8.10

- Polished Dashboard comparison completion state.
  - Hide the "at least 2 experiments" comparison hint after a comparison report has already been generated.
  - Reduced spacing for comparison success feedback, insight cards, export actions, and lifecycle events.
  - Made the lifecycle event timeline more compact on desktop.
  - No API change, no training logic change, no report artifact URL change, no Docker runtime change, no test data structure change.
  - Verified with:
    - `python -m ruff check .`
    - `python quick_test.py`
    - `python -m pytest`
    - `cd web && npm run build`
    - `python api_smoke_test.py`
    - Docker full flow: compose config/build/up, wait-finished smoke run, backend restart recovery, compose down.

## v1.8.9

- Polished Dashboard job detail and comparison density.
  - Compacted job detail card spacing, field grid, exports area, event timeline, round detail log, and selected job chips.
  - Reduced visual load in the lower Dashboard comparison area.
  - Kept the runtime summary behavior from v1.8.8 unchanged.
  - Only modified Dashboard UI styling in `web/src/App.vue`.
  - No API change, no training logic change, no report artifact URL change, no Docker runtime change, no test data structure change.
  - Verified with:
    - `python -m ruff check .`
    - `python quick_test.py`
    - `python -m pytest`
    - `cd web && npm run build`
    - `python api_smoke_test.py`
    - Docker full flow: compose config/build/up, wait-finished smoke run, backend restart recovery, compose down.

## v1.8.8

- Polished Dashboard runtime summary UI.
  - Normalized status values and runtime metric values for visual parity.
  - Hid the report card before experiment start.
  - Displayed report as not ready after experiment start and before report generation.
  - Displayed “HTML 报告 / HTML report” after report generation.
  - Polished runtime summary row, training round detail arrow, config preview localization, Attack / Defense i18n, empty states, and dropdown width.
  - No API change, no training logic change, no report artifact URL change, no Docker runtime change.

## v1.8.0

- Prepared v1.8.0 final release documentation.
  - No new feature, no API change, no training logic change, no new dependency.
  - Final release 不新增功能、不新增依赖、不改变 API、不修改训练核心逻辑。
  - v1.8.0 已完成能力总结：
    - Job event timeline（job 生命周期事件记录）。
    - Runtime diagnostics（运行时诊断）。
    - Failure reason / traceback summary（失败原因与 traceback 摘要）。
    - Result insight cards（结果洞察卡片）。
    - Comparison highlights（对比高亮：best accuracy / lowest loss / lowest ASR）。
    - Winner / trade-off / risk hint（推荐实验 / 权衡分析 / 风险提示）。
    - Config preview（配置预览）。
    - Config explainability（配置字段解释）。
    - Risk level / recommended use（风险级别 / 推荐用途）。
    - Dashboard density polish（首页密度优化）。
    - Dashboard layout rebalance（首页布局再平衡）。
    - 中文 / English 双语支持。
    - Regression tests / CI smoke hardening。
  - v1.8.0 不再新增功能，仅确认 final release readiness。
  - Final release 验证范围：
    - `ruff check .`
    - `python quick_test.py`
    - `python -m pytest`
    - `cd web && npm run build`
    - `python api_smoke_test.py`
    - `docker compose config` / `build` / `up` / `down`
    - `--wait-finished` smoke run
    - backend restart recovery check
    - artifact download check
    - 手动检查中文 / English 首页
    - 手动检查实验报告页面
    - 手动检查对比报告页面
    - GitHub Actions CI check
    - GitHub Actions Docker Smoke check

- Prepared v1.8.0-rc.1 release candidate documentation.
  - No new feature, no API change, no training logic change, no new dependency.
  - RC.1 阶段不新增功能、不新增依赖、不改变 API、不修改训练核心逻辑。
  - v1.8 已完成能力总结：
    - Job event timeline（job 生命周期事件记录）。
    - Runtime diagnostics（运行时诊断）。
    - Failure reason / traceback summary（失败原因与 traceback 摘要）。
    - Comparison result insights（对比结果洞察）。
    - Best accuracy / lowest loss / lowest ASR（最佳准确率 / 最低损失 / 最低 ASR）。
    - Winner / trade-off / risk hint（推荐实验 / 权衡分析 / 风险提示）。
    - Config preview（配置预览）。
    - Config field explanation（配置字段解释）。
    - Risk level / recommended use（风险级别 / 推荐用途）。
    - Dashboard layout rebalance（首页布局再平衡）。
    - 中文 / English 双语支持。
    - Regression tests / CI 保持通过。
  - RC.1 最终验证重点：
    - `ruff check .`
    - `python quick_test.py`
    - `python -m pytest`
    - `cd web && npm run build`
    - `python api_smoke_test.py`
    - `docker compose config` / `build` / `up` / `down`
    - `--wait-finished` smoke run
    - backend restart recovery check
    - artifact download check
    - 手动检查中文 / English 首页
    - 手动检查实验报告页面
    - 手动检查对比报告页面
    - GitHub Actions CI check
    - GitHub Actions Docker Smoke check
  - Final release 前不再做结构性 UI 调整，除非发现阻塞问题。

- Rebalanced dashboard layout for v1.8.0-beta.3.
  - No new feature, no API change, no training logic change.
  - 重新平衡首页布局，优化整体视觉层级。
  - 保持中文 / English 双语。
  - 保持 job event timeline、comparison insights、config preview 功能完整。
  - 不新增依赖，不修改后端 API，不修改训练逻辑，不修改 report 模板。

- Tightened dashboard top layout for v1.8.0-beta.2.
  - No new feature, no API change, no training logic change.
  - 压缩首页 hero/header 区域高度，减少首屏垂直占用。
  - 语言切换按钮移至 header 右上角，与标题同行。
  - 缩短顶部标题和副标题文案。
  - Config preview 改为紧凑摘要（7 个核心字段），默认折叠详细解释。
  - 详细参数说明、recommended use、explanations 收入可展开详情区域。
  - 减少 control-panel、config-metadata、preview-item 的 padding 和间距。
  - 保持中文 / English 双语。
  - 保持 job event timeline、comparison insights、config preview 功能完整。
  - 不新增依赖，不修改后端 API，不修改训练逻辑，不修改 report 模板。

- Prepared v1.8.0-beta.1 readiness documentation.
  - No new runtime feature, no new dependency, no API change, no training logic change.
  - Beta.1 阶段不新增功能、不新增依赖、不改变 API、不修改训练核心逻辑。
  - v1.8 alpha series 已完成：
    - v1.8.0-alpha.1：Job event timeline and runtime diagnostics。
    - v1.8.0-alpha.2：Result insight cards and comparison highlights。
    - v1.8.0-alpha.3：Config preview and explainability polish。
  - v1.8 当前已完成能力：
    - Job event timeline（job 生命周期事件记录）。
    - Runtime diagnostics（运行时诊断）。
    - Failure reason / traceback summary（失败原因与 traceback 摘要）。
    - Comparison result insights（对比结果洞察）。
    - Best accuracy / lowest loss / lowest ASR（最佳准确率 / 最低损失 / 最低 ASR）。
    - Winner / trade-off / risk hint（推荐实验 / 权衡分析 / 风险提示）。
    - Config preview（配置预览）。
    - Config explanations（配置参数解释）。
    - Risk level / recommended use（风险级别 / 推荐用途）。
    - 中文 / English 双语支持。
    - Regression coverage（回归测试覆盖）。
  - Beta.1 验证重点：
    - `ruff check .`
    - `python quick_test.py`
    - `python -m pytest`
    - `cd web && npm run build`
    - `python api_smoke_test.py`
    - `docker compose config` / `build` / `up` / `down`
    - `--wait-finished` smoke run
    - backend restart recovery check
    - artifact download check
    - event timeline 功能验证
    - result insight 功能验证
    - config preview 功能验证
    - zh/en 双语验证
    - GitHub Actions CI check
    - GitHub Actions Docker Smoke check
  - 不新增功能、不新增依赖、不改变 API、不修改训练核心逻辑。

- v1.8.0-alpha.3：Config preview and explainability polish。
  - 为 config catalog 增加 preview / explanation 信息。
  - 解析并展示 dataset、aggregation、attack、defense、rounds、clients 等关键参数。
  - 增加 risk level（风险级别）和 recommended use（推荐用途）。
  - 为聚合、防御、攻击、数据分布等字段提供简短中英文解释。
  - 前端运行实验前新增 config preview card。
  - risk level 按攻击类型和防御配置推断：none/low/medium/high。
  - recommended use 按场景推断：baseline、attack demo、defense comparison 等。
  - 缺失字段时友好降级。
  - 保持中文 / English 双语。
  - 扩展 regression tests（TestConfigPreview，10 个测试）。
  - 不新增依赖，不修改训练核心算法，不改变 config yaml 结构。

- v1.8.0-alpha.2：Result insight cards and comparison highlights。
  - 为 comparison 结果增加 insights / highlights 数据。
  - 识别 best accuracy、lowest loss、lowest ASR。
  - 增加 winner / recommended job 和推荐原因。
  - 增加 trade-off summary（权衡分析）。
  - 增加 risk hint（风险提示），高 ASR 实验会被标记。
  - comparison report（comparison.html.j2）新增结果洞察 section。
  - 首页 comparison UX 新增 result insight cards。
  - insights 写入 comparison.json，持久化可用。
  - POST /comparisons API 返回 insights。
  - 缺失指标时友好降级，不报错。
  - 保持中文 / English 双语。
  - 扩展 regression tests（TestComparisonInsights，12 个测试）。
  - 不新增依赖，不修改训练核心算法，不破坏已有 comparison JSON 字段。

- v1.8.0-alpha.1：Job event timeline and runtime diagnostics。
  - 为 job 增加轻量 events 字段，记录生命周期事件。
  - 事件类型：created、started、round_progress、artifact_written、finished、failed、cancelled。
  - round_progress 记录轮次和关键指标（accuracy、loss、ASR）。
  - failed event 记录 failure reason 和 traceback summary。
  - events 随 job 持久化到 index.json，backend restart 后仍可恢复。
  - GET /jobs 和 GET /status/{job_id} 返回 events。
  - 前端 job detail panel 新增事件时间线区域。
  - 中文 / English 双语支持。
  - 扩展 regression tests（tests/test_report_artifact_regression.py）。
  - 扩展 api_smoke_test.py 事件断言。
  - 不新增依赖，不修改训练核心算法，不破坏已有 API 字段。

- Prepared v1.8.0 roadmap planning.
  - Documentation-only update; no runtime feature, no CI behavior change.
  - v1.8.0 theme: Experiment Observability and Result Insight.
  - v1.8.0 goals：
    - 为 job 增加轻量 event timeline，展示生命周期事件。
    - 失败时显示 failure reason / traceback summary。
    - 首页和 comparison report 增加结果洞察卡片。
    - 高亮最佳 accuracy、最低 loss、最低 ASR。
    - 对比实验时给出简短中文/英文摘要。
    - comparison report 展示 winner / trade-off / risk hint。
    - 运行实验前展示配置预览。
    - 对关键配置字段给出中文/英文解释。
    - 降低用户误选配置的概率。
    - 不新增依赖，除非非常必要。
    - 不重构训练核心。
    - 不破坏现有 API。
    - 不破坏已有 report/artifact URL。
    - 保持中文 / English 双语。
    - 保持 v1.7.0 已有 regression tests 和 CI workflow。
  - v1.8.0-alpha.1：Job event timeline and runtime diagnostics。
  - v1.8.0-alpha.2：Result insight cards and comparison highlights。
  - v1.8.0-alpha.3：Config preview and explainability polish。
  - v1.8.0-beta.1：Beta readiness。
  - v1.8.0-rc.1：Release candidate readiness。
  - v1.8.0：Final release。
  - v1.8 不优先做：新训练算法、新攻击算法、大规模后端重构、新数据库、新 UI 框架、新依赖。

## v1.7.0

v1.7.0 final release — Runtime / Report / Artifact Regression Hardening。

- No new runtime feature, no new dependency, no API change, no training logic change.
- Final release 不新增功能、不新增依赖、不改变 API、不修改训练核心逻辑。
- v1.7 release series 已完成：
  - v1.7.0-alpha.1：report/artifact regression tests。
  - v1.7.0-alpha.2：CI smoke workflow hardening。
  - v1.7.0-beta.1：beta readiness。
  - v1.7.0-rc.1：release candidate readiness。
- v1.7 最终完成能力：
  - report/artifact regression tests（tests/test_report_artifact_regression.py）。
  - pytest 接入主 CI（.github/workflows/ci.yml）。
  - Docker smoke workflow hardening（.github/workflows/docker-smoke.yml）。
  - job artifact 下载回归保护（config.json、metrics.json、metrics.csv、report.md）。
  - comparison artifact 下载回归保护（comparison.html、comparison.csv、comparison.json）。
  - report.html / comparison.html 模板渲染回归保护。
  - summary persistence / restart recovery 回归保护。
  - wait-finished smoke run 自动验证。
- Final release 验证范围：
  - `ruff check .`
  - `python quick_test.py`
  - `python -m pytest`
  - `cd web && npm run build`
  - `python api_smoke_test.py`
  - `docker compose config`
  - `docker compose build`
  - `docker compose up` / `docker compose down`
  - `--wait-finished` smoke run
  - backend restart recovery check
  - artifact download check
  - GitHub Actions CI check
  - GitHub Actions Docker Smoke check
- 不新增功能、不新增依赖、不改变 API、不修改训练核心逻辑。

- Prepared v1.7.0-beta.1 readiness documentation.
  - No new runtime feature, no new dependency, no API change, no training logic change.
  - Beta.1 阶段不新增功能、不新增依赖、不改变 API、不修改训练核心逻辑。
  - v1.7 alpha series 已完成：
    - v1.7.0-alpha.1：report/artifact regression tests。
    - v1.7.0-alpha.2：CI smoke workflow hardening。
  - v1.7 当前已完成能力：
    - report/artifact regression tests（tests/test_report_artifact_regression.py）。
    - pytest 接入 CI（.github/workflows/ci.yml）。
    - Docker smoke workflow hardening（.github/workflows/docker-smoke.yml）。
    - job artifact 下载回归保护（config.json、metrics.json、metrics.csv、report.md）。
    - comparison artifact 下载回归保护（comparison.html、comparison.csv、comparison.json）。
    - report.html / comparison.html 模板渲染回归保护。
    - summary persistence / restart recovery 回归保护。
  - Beta.1 验证重点：
    - `ruff check .`
    - `python quick_test.py`
    - `python -m pytest tests/ -v`
    - `cd web && npm run build`
    - `python api_smoke_test.py`
    - `docker compose config` / `build` / `up` / `down`
    - `--wait-finished` smoke run
    - backend restart recovery check
    - artifact download check
  - 不新增功能、不新增依赖、不改变 API、不修改训练核心逻辑。

- Hardened CI smoke workflows for v1.7.0-alpha.2.
  - Added `python -m pytest tests/ -v` step to `.github/workflows/ci.yml`.
  - Added regression test step to `.github/workflows/docker-smoke.yml`.
  - CI verification chain: ruff → quick_test → pytest → web build.
  - Docker Smoke verification chain: pytest regression → compose config → build → up → api_smoke → wait-finished → restart → recovery → down.

- Added v1.7.0-alpha.1 report and artifact regression tests.
  - New test file: tests/test_report_artifact_regression.py.
  - Covers single-experiment and comparison report template rendering.
  - Covers job artifact file generation (config.json, metrics.json, metrics.csv, report.md).
  - Covers comparison artifact file generation (comparison.csv, comparison.json).
  - Covers JobStore persistence across simulated restarts.
  - Covers summary field derivation (aggregation, defense, attack, final_accuracy, final_loss, final_asr, has_report).
  - Enhanced api_smoke_test.py with summary field assertions and comparison artifact download checks.

- Prepared v1.7 roadmap planning.
  - Documentation-only update; no runtime feature, no CI behavior change.
  - v1.7.0 theme: Runtime / Report / Artifact Regression Hardening.
  - v1.7.0 goals:
    - 把 v1.6.1 修复过的问题固化成自动化测试和 CI 保护。
    - 新增 regression test 覆盖 wait-finished smoke run。
    - 新增 regression test 覆盖 report.html 模板渲染。
    - 新增 regression test 覆盖 comparison.html 模板渲染。
    - 新增 regression test 覆盖 job artifact 下载（config.json、metrics.json、metrics.csv、report.md）。
    - 新增 regression test 覆盖 comparison artifact 下载（comparison.html、comparison.csv、comparison.json）。
    - 新增 regression test 覆盖 backend restart recovery。
    - 强化 CI 验证链路：ruff / quick_test / web build / api_smoke_test / docker compose。
    - 明确不新增依赖、不修改训练核心逻辑、不改变现有 API 行为。
  - v1.7.0-alpha.1: report/artifact regression tests。
  - v1.7.0-alpha.2: CI smoke workflow hardening。
  - v1.7.0-beta.1: Beta readiness。
  - v1.7.0-rc.1: Release candidate readiness。
  - v1.7.0: Final release。
  - v1.7 不优先做：新 UI 功能、新训练算法、新攻击算法、大规模后端重构、新依赖。

- Fixed v1.6.1 runtime metrics and artifact download issues.
  - Real MNIST runs now yield to the event loop before training and after metric publishing so WebSocket dashboards can receive round metrics during execution.
  - `/jobs` and `/status/{job_id}` now expose aggregation, defense, attack, final accuracy, final loss, final ASR, and final metric summary fields.
  - Dashboard job history uses API summary fields, so refreshed pages keep completed experiment metrics instead of showing `—`.
  - Added download routes for job artifacts: `config.json`, `metrics.json`, `metrics.csv`, and `report.md`.
  - Added download routes for comparison artifacts: `comparison.csv` and `comparison.json`.
  - Dashboard, experiment report, and comparison report export entries now link to real downloadable files.
  - Jobs without completed reports can no longer be selected for comparison.

- Prepared v1.6.0 final release readiness documentation.
  - No new runtime feature; focus is Experiment Comparison UX + Export Polish.
  - v1.6.0 release scope:
    - Comparison report metadata polish.
    - Frontend comparison UX polish.
    - Export/download entry polish.
    - Beta readiness documentation.
    - Release candidate readiness documentation.
  - v1.6.0 不新增 runtime feature，重点是 Experiment Comparison UX + Export Polish。
  - Final tag 必须在 PR 合并后打在 main merge commit 上。
- Prepared v1.6.0-rc.1 release candidate readiness documentation.
  - No new runtime code, no new feature, no CI trigger change.
  - v1.6.0-beta.1 已完成 beta readiness。
  - rc.1 阶段不新增功能，不新增依赖，不改 API，不修改运行时代码。
  - v1.6 alpha series 已完成：
    - alpha.1: Comparison report metadata polish。
    - alpha.2: Frontend comparison UX polish。
    - alpha.3: Export/download entry polish。
  - Beta.1 已完成 beta readiness 验证。
  - rc.1 focus: Release candidate validation for v1.6 comparison UX and export polish。
  - rc.1 验证重点：
    - `ruff check .`
    - `python quick_test.py`
    - `cd web && npm run build`
    - `python api_smoke_test.py`
    - Docker Compose config / build / up / down
    - `--wait-finished` smoke run
    - restart recovery check
    - zh/en dashboard 手动检查
    - zh/en experiment report 手动检查
    - zh/en comparison report 手动检查
- Prepared v1.6.0-beta.1 readiness documentation.
  - No new runtime code, no new feature, no CI trigger change.
  - Beta.1 阶段不新增功能，不新增依赖，不改 API。
  - v1.6 alpha series 已完成：
    - alpha.1: Comparison report metadata polish（comparison report 显示 job 摘要信息）。
    - alpha.2: Frontend comparison UX polish（已选择实验预览、comparison 创建反馈优化）。
    - alpha.3: Export/download entry polish（job 导出区域、comparison 导出区域、report 页面导出优化）。
  - Beta.1 focus: Beta readiness validation for v1.6 comparison UX and export polish.
  - 验证重点：
    - comparison report metadata 是否准确。
    - selected jobs preview 是否清晰。
    - comparison creation feedback 是否稳定。
    - job exports 和 comparison exports 是否易发现。
    - zh/en 双语是否一致。
    - report 页面风格是否统一。
- Added clearer export and download entry points for job and comparison artifacts.
  - 首页 job detail panel 新增"导出文件 / Exports"区域。
  - 单实验 job detail 中更清晰地展示 HTML Report、CSV Metrics、Markdown Report。
  - comparison 创建成功后更清晰地展示 Comparison HTML Report、Comparison CSV、Comparison JSON。
  - 实验报告页面（report.html.j2）优化导出链接区域，使用 export label 系统。
  - 对比报告页面（comparison.html.j2）新增独立"导出文件"section，展示 comparison.html、comparison.csv、comparison.json。
  - 保持中文 / English 双语。
  - 不改变现有 API 行为，不改变报告生成路径，不引入新依赖。
- Added frontend comparison selection preview and clearer comparison action states.
  - 新增已选择实验预览区域（Selected Jobs Preview）。
  - 显示已选择 job 数量、短 ID、实验名称、status、完成时间。
  - 优化 comparison 创建按钮状态：未选择足够 jobs 时 disabled 并显示提示。
  - 创建中显示 loading spinner 和提示文案。
  - 创建成功后显示成功提示和 comparison report 链接。
  - 创建失败后显示清晰错误信息。
  - 保持中文 / English 双语。
  - 不修改 API、不修改 report 模板、不引入新依赖。
- Added comparison report metadata section with compared job summaries.
  - Comparison HTML report 新增"参与实验 / Compared Jobs"区域。
  - 显示每个参与对比的 job 的 job_id、experiment_name、config_path、status、created_at、finished_at。
  - 每个 job 提供独立的 report link（带当前语言参数）。
  - Status badge 使用颜色编码：finished 绿色、running 蓝色、failed 红色、cancelled 灰色、created/queued 黄色。
  - comparison.json 新增 `compared_jobs` 字段，持久化 job metadata。
  - 保持 v1.5 zh/en 双语能力（`?lang=zh` / `?lang=en`）。
  - 不改变现有 API 行为，不修改后端逻辑，不引入新依赖。
  - 不修改 `report.html.j2`、不修改前端首页。
- Prepared v1.6 roadmap planning.
  - Documentation-only update; no runtime feature, no CI behavior change.
  - v1.6.0 theme: Experiment Comparison UX + Export Polish.
  - v1.6.0 goals:
    - Comparison report 显示更清晰的实验摘要。
    - Comparison report 显示参与对比的 job 列表及每个 job 的 config、status、created_at、finished_at。
    - Comparison report 保持 zh/en 双语。
    - 不改变现有 API 行为。
    - 首页 comparison 区域更清晰，选中 jobs 后显示更好的对比预览。
    - 对比按钮和状态提示更明确。
    - report / CSV / Markdown 下载入口更清晰。
    - job detail panel 中导出入口更统一。
    - comparison export 入口更清晰。
    - 不引入新依赖。
  - v1.6.0-alpha.1: Comparison report metadata polish.
  - v1.6.0-alpha.2: Frontend comparison UX polish.
  - v1.6.0-alpha.3: Export/download entry polish.
  - v1.6.0-beta.1: Beta readiness.
  - v1.6.0-rc.1: Release candidate readiness.
  - v1.6.0: Final release.
  - v1.6 不优先做：新训练算法、新攻击算法、大规模后端重构、新数据库、新 UI 框架。
- Prepared v1.5.0 final release readiness documentation.
  - No new runtime feature; focus is Frontend Localization + UI Polish.
  - v1.5.0 release scope:
    - Frontend localization with Chinese default.
    - English language toggle.
    - localStorage language persistence.
    - Localized HTML Experiment Report.
    - Localized HTML Comparison Report.
    - Dashboard visual polish.
    - Unified report page visual style.
    - Beta readiness documentation.
    - Release candidate readiness documentation.
  - v1.5.0 不新增 runtime feature，重点是 Frontend Localization + UI Polish。
  - Final tag 必须在 PR 合并后打在 main merge commit 上。
- Prepared v1.5.0-rc.1 release candidate readiness documentation.
  - No new runtime code, no new feature, no CI trigger change.
  - v1.5.0-beta.1 已完成 beta readiness。
  - rc.1 阶段不新增功能，重点是 final release candidate validation。
  - rc.1 focus: Release candidate validation for localized and polished v1.5 UI.
  - rc.1 不修改运行时代码，不新增功能，不改变 CI 触发策略。
- Prepared v1.5.0-beta.1 readiness documentation.
  - No new runtime code, no new feature, no CI trigger change.
  - Beta.1 阶段不新增功能，重点是稳定性验证和 release readiness。
  - Summarized v1.5 alpha series completion:
    - alpha.1: Frontend localization with Chinese default and English toggle.
    - alpha.1: Localized HTML experiment and comparison reports via `?lang=zh` / `?lang=en`.
    - alpha.2: Dashboard visual polish.
    - alpha.2: Unified Experiment Report and Comparison Report visual style.
  - Beta.1 focus: Beta readiness validation for localized and polished v1.5 UI.
  - Beta.1 不修改运行时代码，不新增功能，不改变 CI 触发策略。
- Added dashboard visual polish for a more cohesive localized UI.
  - 页面背景改为多层径向渐变（蓝紫/青色调），视觉更柔和。
  - Hero 区域改为双栏 grid 布局：左侧标题/副标题，右侧控制面板；语言切换定位在 hero 右上角。
  - 按钮统一：primary（深蓝渐变）/ secondary（蓝底蓝字）/ danger / ghost，hover 上浮、disabled 降透明度。
  - 状态标签使用颜色编码 badge：running 蓝色、finished 绿色、failed/error 红色、cancelled 灰色、creating 黄色等。
  - 状态筛选新增"全部状态"选项，可查看所有状态的任务。
  - 表格优化：圆角容器包裹、sticky 表头、渐变背景、行 hover、选中行左侧蓝色边条。
  - Job Detail 面板改为 inspector 风格：圆角卡片、key-value grid。
  - Report 链接统一为 pill 样式 action button。
  - 中文字体 fallback：Inter / Microsoft YaHei / PingFang SC / Noto Sans CJK SC。
  - 移动端响应式：metric-grid 2 列、hero 堆叠、filter 单列、按钮全宽。
  - 不修改业务逻辑、API、后端、package.json。
- Added frontend localization with Chinese default, English toggle, and localized HTML reports.
  - 前端：页面默认中文；右上角提供 中文 / English 切换按钮。
  - 使用 localStorage 持久化语言选择（key: `fedguardlab_language`）。
  - 不使用 IP 判断语言；不引入 vue-i18n 或其他新依赖。
  - 前端覆盖范围：标题、副标题、配置选择、按钮、状态卡片、指标卡片、图表标题、实验对比、Recent Jobs 表格表头和徽章、Job Detail 面板、空状态和错误文案。
  - HTML 报告支持 `?lang=zh` / `?lang=en` query 参数，默认 zh。
  - Experiment Report 和 Comparison Report 的标题、指标标签、表格表头、导出文件说明、注释等主要可见文案根据 lang 切换。
  - 前端打开报告链接自动追加当前语言参数；切换语言后打开的报告同步更新。
  - 技术字段（job_id、config_path、status 值等）保留英文原文。
  - 不修改训练逻辑、workflow、Docker 配置或 package.json。
- Prepared v1.5 roadmap planning.
  - Documentation-only update; no runtime feature, no CI behavior change.
  - v1.5.0 theme: Frontend Localization + UI Polish.
  - v1.5.0 goals:
    - 页面默认中文显示。
    - 支持中文 / English 手动切换。
    - 使用 localStorage 保存语言选择。
    - 不使用 IP 判断语言。
    - 页面视觉美化，提升卡片、按钮、表格、状态标签的一致性。
  - v1.5.0-alpha.1: Frontend localization with Chinese default and English toggle.
    - 不引入 vue-i18n；使用轻量本地 translations object。
  - v1.5.0-alpha.2: Dashboard visual polish.
    - 只做视觉美化，不改 API、不改训练逻辑。
  - v1.5.0-beta.1: Beta readiness.
  - v1.5.0-rc.1: Release candidate readiness.
  - v1.5.0: Final release.
- Prepared v1.4.0 final release readiness documentation.
  - No new runtime feature; focus is Experiment Usability + Reproducibility + Project Polish.
  - v1.4.0 release scope:
    - Experiment config catalog metadata (GET /configs returns metadata block).
    - Frontend config metadata display (name, description, category, tags).
    - Frontend config category filter.
    - Recent Jobs detail panel for inspecting job metadata.
    - Beta readiness documentation.
    - Release candidate readiness documentation.
  - Final tag must be created on the main merge commit after PR is merged.
- Prepared v1.4.0-rc.1 release candidate readiness documentation.
  - No new runtime code, no new feature, no CI trigger change.
  - v1.4.0-beta.1 已完成 beta readiness 文档。
  - rc.1 阶段不新增功能，重点是 final release candidate validation。
- Prepared v1.4.0-beta.1 readiness documentation.
  - No new runtime code, no new feature, no CI trigger change.
  - Beta.1 focus: stability validation and release readiness.
  - Summarized v1.4 alpha series completion:
    - alpha.1: experiment config catalog metadata (GET /configs returns metadata block).
    - alpha.2: frontend config metadata display (name, description, category, tags).
    - alpha.3: frontend config category filter.
    - alpha.4: Recent Jobs detail panel for inspecting job metadata.
- Added Recent Jobs detail panel for inspecting job metadata.
  - Clicking a job row in the Recent Jobs table shows a lightweight detail card below the table.
  - Detail card displays: job_id, status, config_path, created_at, started_at, finished_at, report availability, and artifacts count.
  - If a report is available, an "Open Report" link is shown (reuses existing report URL).
  - Selected row gets a subtle highlight; clicking the same row again deselects it.
  - Shows "Select a job to inspect details." when no job is selected.
  - No new backend API, no modal, no router change.
- Added frontend category filtering for experiment config catalog.
  - New category filter dropdown above the experiment selector, defaulting to "All categories".
  - Category list is dynamically extracted from config metadata, deduplicated, and sorted.
  - Selecting a category filters the config dropdown; selecting a new category auto-selects the first available config if the current one is excluded.
  - Shows "No configs available for this category." when the filtered list is empty.
  - Configs without metadata category use "uncategorized" as fallback.
  - Preserves the v1.4.0-alpha.2 config metadata display block.
- Added frontend display for experiment config catalog metadata.
  - After selecting a config, a lightweight info block shows: display name, description, category, and tags.
  - Tags are rendered as small badges (same style as Recent Jobs badges).
  - Safe fallback when metadata is missing: name defaults to label/path, empty description/category are hidden, missing tags row is hidden.
  - No changes to API call path, backend, package.json, or CSS architecture.
- Added experiment config catalog metadata for v1.4 planning.
  - `GET /configs` now returns an optional `metadata` object per config item: `name`, `description`, `category`, `tags`.
  - Backward compatible: existing fields (`label`, `value`, `description`, `valid`, etc.) are unchanged.
  - If a config YAML has a `metadata` block, its values are used; otherwise fallback defaults apply.
  - `load_config` schema is not modified; metadata is read from raw YAML separately.
  - All existing configs under `configs/` now include metadata.
  - Documentation updated in `docs/configs.md`.
- Prepared v1.4 roadmap planning.
  - Documentation-only update; no runtime feature, no CI behavior change.
  - v1.3.0 release metadata cleanup and roadmap expansion.
  - v1.3.0 final checklist marked as completed in docs/roadmap.md.
  - v1.4.0 theme: Experiment Usability + Reproducibility + Project Polish.
  - Added v1.4.0-alpha.1 through alpha.4 planning and beta/rc/final placeholders.
- Prepared v1.3.0 final release readiness documentation.
  - No new runtime feature; focus is Developer Experience, validation, and release reliability.
  - v1.3.0 release scope:
    - CI workflow standardized as `.github/workflows/ci.yml`.
    - Manual Docker Smoke workflow added as `.github/workflows/docker-smoke.yml`.
    - Docker Smoke covers Docker Compose startup, API smoke, finished-job validation, and backend restart recovery.
    - `api_smoke_test.py` supports `--write-finished-job-id` for stable recovery validation.
    - Validation workflow documentation completed.
  - Final tag must be created on the main merge commit after PR is merged.
- Prepared v1.3.0-rc.1 release candidate readiness documentation.
  - No new runtime code, no new feature, no CI trigger change.
  - v1.3.0-beta.1 已完成 beta readiness 文档。
  - rc.1 阶段不新增功能，重点是 final release candidate validation。
- Prepared v1.3.0-beta.1 readiness documentation.
  - No new runtime code, no new feature, no CI trigger change.
  - Beta.1 focus: stability validation and release readiness.
  - Summarized v1.3 alpha series completion:
    - alpha.1: CI workflow standardized as `ci.yml`.
    - alpha.2: manual Docker Smoke workflow added.
    - alpha.3: `api_smoke_test.py` supports `--write-finished-job-id`; Docker Smoke no longer parses logs for finished job id.
    - alpha.4: validation workflow documentation completed.
- Updated documentation to reflect v1.3.0-alpha progress.
  - Documentation-only update; no new runtime code or CI behavior change.
  - CI workflow standardized as `.github/workflows/ci.yml` (covers ruff check, quick_test.py, frontend build).
  - Manual Docker Smoke workflow added as `.github/workflows/docker-smoke.yml` (`workflow_dispatch` only, not triggered on push / PR).
  - `api_smoke_test.py` supports `--write-finished-job-id <path>` to write the finished job UUID to a file.
  - Docker Smoke workflow reads `smoke_finished_job_id.txt` instead of parsing logs with regex for recovery check.
- Prepared v1.3.0-alpha.2 Docker smoke validation planning.
  - 文档规划变更，无运行时代码变更，无新增 CI 行为。
  - 规划独立 workflow（`docker-smoke.yml`），初期使用 `workflow_dispatch` 手动触发。
  - 规划 Docker smoke 覆盖范围：compose config/build/up、api_smoke_test.py、restart/recovery check、compose down。
- Prepared v1.3 roadmap planning.
  - Clarified v1.3.0-alpha.1 as CI workflow standardization for lint, quick tests, and frontend build.
  - Confirmed Docker Compose smoke validation should be deferred to v1.3.0-alpha.2.
  - No runtime code or CI behavior change is introduced in this documentation-only update.
- Prepared v1.2.0 final release documentation.
  - Consolidated v1.2 durable JobStore, artifact metadata, restart recovery, Jobs API filters, and Recent Jobs UX improvements.
  - Clarified final release validation path.
  - No new runtime feature is introduced in this documentation-only change.
- Prepared v1.2.0-rc.1 release candidate documentation.
  - Confirmed beta.1 validation path for backend, frontend, Docker Compose, API smoke tests, restart recovery, and artifact metadata consistency.
  - Clarified that rc.1 is a release-candidate readiness step with no new runtime features.
  - No new runtime feature is introduced in this documentation-only change.
- Prepared v1.2.0-beta.1 readiness documentation.
  - Consolidated v1.2 alpha milestones from alpha.1 through alpha.7.
  - Clarified release validation expectations for durable JobStore recovery, artifact metadata, Jobs API filters, and Recent Jobs UX.
  - No new runtime feature is introduced in this documentation-only change.
- Added frontend Recent Jobs report/artifact badges.
  - Recent Jobs now shows lightweight badges for: Report, Artifacts, No report.
  - Badges are based on persisted job metadata: `has_report`, `artifacts`.
  - This makes report/artifact availability easier to inspect when browsing recovered jobs.
- Added frontend Recent Jobs limit and sort controls.
  - Users can choose Recent Jobs limit: 10, 20, or 50.
  - Users can sort Recent Jobs by: Newest first, Oldest first.
  - Controls reuse the existing `GET /jobs?limit=...&sort=...` API introduced in alpha.4.
  - Controls work together with the alpha.5 status filter.
- Added frontend Recent Jobs status filter.
  - Users can filter recent jobs by: Finished with reports, Finished, Running, Cancelled, Failed, Queued.
  - The frontend uses the existing `GET /jobs?status=...` API introduced in alpha.4.
  - Non-finished jobs remain visible for status inspection but are not selectable for comparison.
  - This improves navigation when the durable JobStore contains many historical jobs.
- Added basic `GET /jobs` query parameters: `status`, `limit`, `sort`.
  - Supported status filtering: `queued`, `running`, `finished`, `failed`, `cancelled`.
  - Supported sorting: `created_at_desc` (default), `created_at_asc`.
  - Invalid status, limit, or sort values return HTTP 400.
  - `limit` values exceeding 100 are clamped to 100.
  - Added smoke test coverage for valid and invalid `/jobs` query parameters.
- Added restart recovery smoke test for durable JobStore.
  - `api_smoke_test.py --check-recovery <job_id>` verifies that a finished job remains available after backend restart.
  - Recovery check validates `/jobs`, `/status/{job_id}`, artifact metadata, artifact file existence, and `reports/jobs/index.json` consistency.
- Tightened artifact index consistency validation.
  - `api_smoke_test.py --wait-finished` now checks artifact keys, artifact file existence, and persisted index metadata.
  - Fixed `summary_md` artifact path to point to the generated `report.md`.
- Added job artifact index to `GET /jobs` and `GET /status/{job_id}`.
  - Response now includes `has_report` (bool) and `artifacts` (dict).
  - `artifacts` contains paths for `config_json`, `metrics_csv`, `summary_md`, `report_html`.
  - Artifact metadata is persisted to `index.json` alongside existing job data.
  - Frontend uses artifact metadata to gate report availability; actual file paths are never exposed — reports are still served via `GET /reports/{job_id}`.
  - API smoke test (`--wait-finished`) validates artifact metadata in status response.
- Added durable JSON JobStore (`reports/jobs/index.json`).
  - Job metadata and metrics survive backend restarts.
  - Lightweight JSON persistence — no database, ORM, or external dependency.
  - Limitations: single-process writes only; not suitable for multi-worker concurrency.
  - Corrupt or unreadable `index.json` is skipped on startup (empty store).
- Preparing v1.1.0 release candidate.

## v1.1.0-beta.3

- Added GET /health.
- Added Docker Compose backend healthcheck.
- Added live API smoke test.
- Fixed WebSocket subscribe/replay race.
- Fixed background runner cancellation race.

## v1.1.0-beta.2

- Added background job runner.
- Decoupled WebSocket from training execution.
- POST /run now starts background training.
- WebSocket now subscribes to existing job metrics/events.
- Added cancellation flag integration.
- Frontend handles cancelled event.

## v1.1.0-beta.1

- Added in-memory JobStore.
- Added GET /jobs.
- Added POST /jobs/{job_id}/cancel.
- Added job timestamps.
- Added report readiness metadata.
- Improved frontend comparison history behavior.

## v1.1.0-alpha.1

- Hardened config validation.
- Improved API error handling.
- Added frontend dynamic config loading.
- Switched frontend dependency lock to npm package-lock.json.
- Updated README/docs for v1.0.0 and v1.1.0 roadmap.
