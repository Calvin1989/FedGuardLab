# FedGuardLab

![Quick Test](https://github.com/Calvin1989/FedGuardLab/actions/workflows/quick-test.yml/badge.svg)

FedGuardLab 是一个面向联邦学习安全实验的交互式实验平台。

项目目标不是做一个“大而全”的联邦学习 benchmark，而是提供一个轻量、可视化、可复现的实验环境，帮助学生、研究者和开发者更直观地理解联邦学习中的攻击、防御和实验流程。

---

## 核心特性

- Vue + Vite 前端 Dashboard
- FastAPI 后端服务
- 后台任务执行，WebSocket 解耦订阅
- YAML 实验配置
- Pydantic 配置校验
- Simulated trainer 快速演示
- 真实 MNIST + FedAvg 联邦学习训练
- IID / Dirichlet Non-IID 数据划分
- Label Flipping 攻击与 ASR 评估
- Median / Trimmed Mean / Krum 鲁棒聚合防御
- 单实验 HTML / CSV / Markdown 报告
- 多实验对比报告
- Docker Compose 一键启动
- GitHub Actions + Ruff + quick test + frontend build

---

## Screenshots

### Dashboard

![Dashboard](docs/screenshots/dashboard.png)

### Experiment Report

![Experiment Report](docs/screenshots/experiment-report.png)

### Comparison Report

![Comparison Report](docs/screenshots/comparison-report.png)

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/Calvin1989/FedGuardLab.git
cd FedGuardLab
```

### 2. 创建并激活 Python 环境

```bash
conda create -n fedguardlab python=3.11 -y
conda activate fedguardlab
```

### 3. 安装后端依赖

```bash
python -m pip install -r requirements-cpu.txt
```

其中 `requirements-cpu.txt` 会安装 CPU 版 PyTorch，适合普通本地开发和 CI 环境。

### 4. 启动后端

```bash
uvicorn api.main:app --reload
```

后端默认运行在：

```text
http://127.0.0.1:8000
```

API 文档：

```text
http://127.0.0.1:8000/docs
```

### 5. 启动前端

打开另一个终端：

```bash
cd web
npm install
npm run dev
```

默认前端地址：

```text
http://localhost:3000
```

如果 3000 端口被占用，Vite 会自动切换到 3001、3002 等端口。

### 6. Live API Smoke Test

后端启动后，可以用 live smoke test 验证 API 是否正常工作：

```bash
python api_smoke_test.py
```

如果 API 不在默认地址，通过环境变量覆盖：

**PowerShell：**

```powershell
$env:FEDGUARDLAB_API_BASE = "http://127.0.0.1:8000"
python api_smoke_test.py
Remove-Item Env:FEDGUARDLAB_API_BASE
```

**Bash：**

```bash
FEDGUARDLAB_API_BASE=http://127.0.0.1:8000 python api_smoke_test.py
```

默认流程：GET /health → GET /configs → POST /run → 等待 job 离开 created → POST /run（第二个 job）→ cancel → 确认 cancelled。

如果需要等待第一个 job 完整执行完毕（含 metrics 产出）：

```bash
python api_smoke_test.py --wait-finished
```

该脚本使用 Python 标准库（`urllib.request`），不依赖 `requests` 或 `httpx`。

---

## Docker 启动

确保已经安装 Docker Desktop。

```bash
docker compose up --build
```

`docker compose` 会通过 healthcheck 等待 backend healthy 后再启动 frontend，无需手动处理启动顺序。

前端：

```text
http://localhost:3000
```

后端 API：

```text
http://localhost:8000/docs
```

停止服务：

```bash
docker compose down
```

---

## 当前支持能力

FedGuardLab 当前支持：

- Simulated Label Flipping Demo
- Real MNIST FedAvg Demo
- Real MNIST FedAvg Label Flip Demo
- Real MNIST Label Flip + Median Defense
- Real MNIST Label Flip + Trimmed Mean Defense
- Real MNIST Label Flip + Krum Defense

详细实验说明见：

- [实验说明](docs/experiments.md)
- [配置文件说明](docs/configs.md)

---

## 实验输出

单实验输出目录：

```text
reports/jobs/<job_id>/
├── config.json
├── metrics.json
├── metrics.csv
├── report.html
└── report.md
```

多实验对比输出目录：

```text
reports/comparisons/<comparison_id>/
├── comparison.html
├── comparison.json
└── comparison.csv
```

这些运行产物默认不会提交到 GitHub。

---

## 项目文档

- [实验说明](docs/experiments.md)
- [配置文件说明](docs/configs.md)
- [开发与测试](docs/development.md)
- [Roadmap](docs/roadmap.md)

---

## API 接口

### Job lifecycle API

FedGuardLab exposes lightweight job lifecycle endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check, returns `{"status": "ok", "service": "fedguardlab-api"}`. |
| `GET` | `/configs` | List available experiment configs. |
| `POST` | `/run?config_path=...` | Create a new experiment job and start background training. |
| `GET` | `/jobs` | List persisted jobs. |
| `GET` | `/status/{job_id}` | Get job status and timestamps. |
| `GET` | `/results/{job_id}` | Get job config, metrics, and report paths. |
| `GET` | `/reports/{job_id}` | Open the generated HTML report. |
| `POST` | `/jobs/{job_id}/cancel` | Mark a pending or running job as cancelled. |

Since v1.1.0-beta.2, `POST /run` starts background training immediately. WebSocket `/ws/{job_id}` only subscribes to an existing job's real-time metrics and events — it no longer triggers training. Refreshing the page or disconnecting WebSocket will not stop the backend training process.

`POST /jobs/{job_id}/cancel` sets a cancellation request. The background runner checks this flag between training rounds and stops gracefully.

Since v1.2.0, FedGuardLab persists lightweight job metadata through a JSON-backed durable JobStore. Generated reports and artifact metadata can be rediscovered after backend restart for finished jobs. This remains a lightweight local persistence mechanism, not a distributed multi-worker task queue; there is still no database, Redis, or Celery.

### Jobs API query parameters

`GET /jobs` supports optional query parameters for lightweight filtering and sorting:

```text
GET /jobs?status=finished
GET /jobs?limit=5
GET /jobs?sort=created_at_desc
GET /jobs?sort=created_at_asc
GET /jobs?status=finished&limit=5&sort=created_at_desc
```

Supported `status` values:

- `queued`
- `running`
- `finished`
- `failed`
- `cancelled`

Supported `sort` values:

- `created_at_desc`
- `created_at_asc`

`limit` must be a positive integer; values exceeding 100 are clamped to 100. Invalid parameters return HTTP 400.

The API smoke test validates both supported and invalid `/jobs` query parameters.

### Recent Jobs filtering

The frontend Recent Jobs panel supports status filtering:

- Finished with reports
- Finished
- Running
- Cancelled
- Failed
- Queued

Status filters are backed by the `GET /jobs?status=...` API. Non-finished jobs can be inspected in the table but are not selectable for comparison.

### Recent Jobs limit and sort controls

The frontend Recent Jobs panel also supports lightweight list controls:

- Limit: 10, 20, or 50 jobs
- Sort: Newest first or Oldest first

These controls are backed by the `GET /jobs?limit=...&sort=...` API and work together with the Recent Jobs status filter.

### Recent Jobs report and artifact badges

The frontend Recent Jobs panel shows lightweight badges for report and artifact availability:

- `Report` when a report is available
- `Artifacts` when artifact metadata is indexed
- `No report` when no report or artifact metadata is available

These badges are backed by the persisted job metadata fields `has_report` and `artifacts`.

### v1.2 beta readiness

The v1.2 alpha series now covers durable JobStore persistence, artifact metadata indexing, restart recovery validation, Jobs API filtering/sorting, and Recent Jobs UX controls. The beta phase focuses on stabilization and release validation rather than adding broad new runtime features.

### v1.2 release candidate readiness

The v1.2 beta validation path covers backend checks, frontend build, Docker Compose build/startup, API smoke tests, finished-job artifact validation, and restart recovery checks. The rc.1 phase focuses on final release-candidate validation before the v1.2.0 final release.

### v1.2 stable release scope

FedGuardLab v1.2 focuses on durable job history, artifact metadata indexing, backend restart recovery validation, Jobs API filtering/sorting, and Recent Jobs UX improvements. The final release validation path covers backend checks, frontend build, Docker Compose startup, API smoke tests, finished-job artifact validation, and restart recovery checks.

完整接口文档：

```text
http://127.0.0.1:8000/docs
```

---

## 当前版本

`v1.2.0`

v1.2.0 focus: durable job history, artifact metadata indexing, restart recovery validation, Jobs API filtering/sorting, and Recent Jobs UX improvements.

当前版本支持：

- 交互式实验 Dashboard
- 真实 MNIST FedAvg
- Label Flipping 攻击与 ASR 评估
- Median / Trimmed Mean / Krum 鲁棒聚合
- HTML / CSV / Markdown 报告导出
- 多实验对比报告
- Docker Compose 启动（含 healthcheck readiness）
- GitHub Actions + Ruff + quick test + 前端 build
- 前端实验历史持久化
- 刷新页面后保留已完成实验记录
- 支持清空 Dashboard 历史记录
- Trigger-based Backdoor Attack
- Backdoor ASR 评估
- Backdoor + FedAvg / Median / Trimmed Mean / Krum 对比实验
- Label Flipping 与 Backdoor 两类攻击对比场景
- Dashboard 和实验报告展示优化
- README 项目截图展示
- Dashboard 支持删除选中的历史实验记录
- 后台任务执行（POST /run 启动异步训练，不依赖 WebSocket）
- WebSocket 解耦（刷新页面不影响后台训练）
- 基于 cancellation flag 的任务取消
- GET /health 健康检查接口
- Live API Smoke Test（`python api_smoke_test.py`）
- JSON-backed durable JobStore
- Job artifact metadata index
- Backend restart recovery validation
- Jobs API filtering/sorting
- Recent Jobs status filter
- Recent Jobs limit/sort controls
- Recent Jobs report/artifact badges

---

## License

MIT
