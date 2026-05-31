# 开发与测试

本文档记录 FedGuardLab 的开发、测试、清理和 Docker 启动流程。

---

## 安装开发依赖

```bash
python -m pip install -r requirements-dev.txt
```

依赖层级：

```text
requirements.txt       基础后端依赖，不含 PyTorch
requirements-cpu.txt   基础依赖 + CPU PyTorch
requirements-dev.txt   CPU 依赖 + 开发工具
```

---

## Ruff 代码检查

运行 Ruff：

```bash
ruff check .
```

自动修复可修复问题：

```bash
ruff check . --fix
```

Ruff 配置位于：

```text
pyproject.toml
```

---

## 快速测试

```bash
python quick_test.py
```

quick test 会检查：

- 配置文件能否加载；
- 非法配置是否被正确拒绝；
- 聚合函数能否运行；
- simulated trainer 能否运行。

适合在每次提交前快速执行。

---

## 完整 smoke test

```bash
python smoke_test.py
```

smoke test 会检查：

- simulated demo；
- real MNIST FedAvg；
- label flipping；
- Median / Trimmed Mean / Krum；
- HTML 报告生成；
- CSV / Markdown 导出；
- comparison report 生成。

该测试会生成运行产物，完成后可以清理。

---

## 清理运行产物

实验报告和对比报告默认生成在：

```text
reports/jobs/
reports/comparisons/
```

这些目录已经被 `.gitignore` 忽略，不会提交到 GitHub。

清理实验报告：

```bash
python cleanup_reports.py --jobs
```

清理对比报告：

```bash
python cleanup_reports.py --comparisons
```

清理全部报告：

```bash
python cleanup_reports.py --all
```

跳过确认并清理全部报告：

```bash
python cleanup_reports.py --all --yes
```

---

## 前端 build 检查

验证前端代码能否正常构建：

```bash
cd web
npm install
npm run build
```

CI 中同样会执行此步骤，防止 Vue 语法错误、依赖问题或 Chart.js 使用问题未被发现。

---

## Docker 启动

确保已经安装 Docker Desktop。

```bash
docker compose up --build
```

`docker compose` 会通过 healthcheck 等待 backend healthy 后再启动 frontend。healthcheck 使用 Python 标准库请求 `http://127.0.0.1:8000/health`，不依赖 `curl` 或 `wget`。

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

## Job lifecycle smoke test

Start the backend:

```bash
uvicorn api.main:app --reload
```

Create a job (background training starts immediately):

```powershell
$job = Invoke-RestMethod -Method Post "http://127.0.0.1:8000/run?config_path=configs/label_flip_demo.yaml"
$job
```

Check status:

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/status/$($job.job_id)"
```

List jobs:

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/jobs"
```

Cancel a job (sets cancellation flag; runner checks between rounds):

```powershell
Invoke-RestMethod -Method Post "http://127.0.0.1:8000/jobs/$($job.job_id)/cancel"
```

A repeated cancel request should return a 400 error.

To subscribe to real-time metrics, open a WebSocket connection:

```text
ws://127.0.0.1:8000/ws/{job_id}
```

The WebSocket replays already-produced metrics, then streams new ones. Disconnecting it does not stop the background training.

---

## Live API Smoke Test

后端启动后，可以用 live smoke test 验证 API 是否正常工作：

```bash
python api_smoke_test.py
```

该脚本需要后端已经启动（`uvicorn api.main:app --reload`），使用 Python 标准库（`urllib.request` + `json`），不依赖 `requests` 或 `httpx`。

测试流程：GET /health → GET /configs → POST /run → 等待 job 离开 created → POST /run（第二个 job）→ cancel → 确认 cancelled。

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

如果需要等待第一个 job 完整执行完毕（含 metrics 产出）：

```bash
python api_smoke_test.py --wait-finished
```

`--wait-finished` 会轮询 `/status/{job_id}` 最多 60 秒，直到 status == finished 且 metrics_count > 0。

---

## GitHub Actions

项目使用 GitHub Actions 执行：

```bash
ruff check .
python quick_test.py
cd web && npm install && npm run build
```

Workflow 文件：

```text
.github/workflows/quick-test.yml
```
