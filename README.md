# FedGuardLab

> Current maintenance release: v1.9.5 maintenance release after v1.9.4, documenting dashboard UI refinements, history-based experiment configuration reuse, and reports cleanup action handling fixes.

![CI](https://github.com/Calvin1989/FedGuardLab/actions/workflows/ci.yml/badge.svg)

FedGuardLab 是一个面向联邦学习安全实验的轻量级交互式平台。

它的目标不是构建一个“大而全”的联邦学习 benchmark，而是提供一个易启动、可视化、可复现的实验环境，帮助学生、研究者和开发者直观理解联邦学习中的攻击、防御、训练过程和实验对比。

---

## 功能亮点

* 可视化联邦学习安全实验 Dashboard
* 默认中文界面，支持 English 切换
* FastAPI 后端 + Vue / Vite 前端
* YAML 实验配置与 Pydantic 校验
* 后台任务执行与实时指标查看
* 支持 Simulated trainer 快速演示
* 支持真实 MNIST + FedAvg 联邦学习训练
* 支持 IID / Dirichlet Non-IID 数据划分
* 支持 Label Flipping 攻击与 ASR 评估
* 支持 Backdoor 攻击与 Backdoor ASR 评估
* 支持 Median / Trimmed Mean / Krum 鲁棒聚合防御
* 支持单实验 HTML / CSV / Markdown 报告
* 支持多实验对比报告
* 支持 Docker Compose 一键启动
* 支持 GitHub Actions CI 与 Docker Smoke 验证

---

## 截图预览

### 实验 Dashboard

![Dashboard](docs/screenshots/dashboard.png)

### 实验报告

![Experiment Report](docs/screenshots/experiment-report.png)

### 对比报告

![Comparison Report](docs/screenshots/comparison-report.png)

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/Calvin1989/FedGuardLab.git
cd FedGuardLab
```

### 2. 创建 Python 环境

```bash
conda create -n fedguardlab python=3.11 -y
conda activate fedguardlab
```

### 3. 安装后端依赖

```bash
python -m pip install -r requirements-cpu.txt
```

`requirements-cpu.txt` 使用 CPU 版 PyTorch，适合本地开发、演示和 CI 环境。

### 4. 启动后端

```bash
uvicorn api.main:app --reload
```

后端默认地址：

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

前端默认地址：

```text
http://localhost:3000
```

如果 3000 端口被占用，Vite 会自动切换到其他可用端口。

---

## Docker 启动

确保已经安装 Docker Desktop。

```bash
docker compose up --build
```

访问地址：

```text
前端：http://localhost:3000
后端：http://localhost:8000/docs
```

停止服务：

```bash
docker compose down
```

---

## 常用验证命令

### 后端与基础测试

```bash
ruff check .
python quick_test.py
```

### 前端构建

```bash
cd web
npm run build
cd ..
```

### API Smoke Test

后端启动后运行：

```bash
python api_smoke_test.py
```

等待实验任务完整结束并生成 finished job id：

```bash
python api_smoke_test.py --wait-finished --write-finished-job-id smoke_finished_job_id.txt
```

### Docker Smoke 验证

```bash
docker compose config
docker compose build
docker compose up -d
python api_smoke_test.py --wait-finished --write-finished-job-id smoke_finished_job_id.txt
type smoke_finished_job_id.txt
$jobId = Get-Content smoke_finished_job_id.txt
docker compose restart backend
Start-Sleep -Seconds 10
python api_smoke_test.py --check-recovery $jobId
docker compose down
Remove-Item smoke_finished_job_id.txt
```

---

## 当前支持的实验能力

FedGuardLab 当前支持：

* Simulated Label Flipping Demo
* MNIST FedAvg Demo
* MNIST FedAvg + Label Flipping
* MNIST FedAvg + Backdoor Attack
* Label Flipping + Median Defense
* Label Flipping + Trimmed Mean Defense
* Label Flipping + Krum Defense
* Backdoor + Median Defense
* Backdoor + Trimmed Mean Defense
* Backdoor + Krum Defense
* 多实验指标对比与报告导出

更多说明见：

* [实验说明](docs/experiments.md)
* [配置文件说明](docs/configs.md)

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

* [实验说明](docs/experiments.md)
* [配置文件说明](docs/configs.md)
* [开发与测试](docs/development.md)
* [Roadmap](docs/roadmap.md)

---

## 当前版本

当前维护版本：v1.9.5

版本状态：

* `v1.9.0`：Experiment Result Management final release，完成历史实验管理、归档 / 恢复、对比历史、统一 report/artifact 入口，以及安全的 reports cleanup workflow。
* `v1.9.1`：maintenance release，记录 GitHub Actions Node 24 compatibility workflow maintenance，并确认 Docker Smoke manual workflow 通过。
* `v1.9.2`：maintenance release，记录 dashboard UI scoped style cleanup，移除重复和 dead App.vue scoped styles，并完成 PR #140–#151 范围内的组件 scoped style 迁移与清理。
* `v1.9.5`：maintenance release，优化 dashboard 顶部导航、任务工具栏与表格展示，新增从历史任务复用实验配置的前端流程，并修复 reports cleanup 刷新回调处理问题；无后端 API、训练逻辑或 report artifact URL 变更。
* `v1.9.4`：maintenance release，扩展 dashboard composables 的 Vitest 单元测试覆盖，覆盖 i18n、experiment options、comparison、reports cleanup、runtime monitor 和 recent jobs；前端测试达到 388 passed，无运行时行为变更。
* `v1.9.3`：maintenance release，记录 dashboard frontend composable/helper 重构、Vitest 前端单元测试与 CI 接入，以及 GitHub Actions npm ci lockfile 兼容性修复；无 API 行为、训练逻辑或 report artifact URL 变更。

兼容性说明：

* 不新增运行时依赖。
* 不改变已有 API 路径。
* 不改变训练核心算法。
* 不改变已有 report/artifact URL。
* 不改变 Docker runtime 行为。
* 不改变测试数据结构。
* 继续保持中文 / English 双语支持。

历史版本详情请查看：

* [CHANGELOG](CHANGELOG.md)
* [Roadmap](docs/roadmap.md)

---

## 许可证

MIT
