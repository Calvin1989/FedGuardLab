# FedGuardLab

![Quick Test](https://github.com/Calvin1989/FedGuardLab/actions/workflows/quick-test.yml/badge.svg)

FedGuardLab 是一个面向联邦学习安全实验的交互式实验平台。

项目目标不是做一个“大而全”的联邦学习 benchmark，而是提供一个轻量、可视化、可复现的实验环境，帮助学生、研究者和开发者更直观地理解联邦学习中的攻击、防御和实验流程。

---

## 核心特性

- Vue + Vite 前端 Dashboard
- FastAPI 后端服务
- WebSocket 实时推送实验指标
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
- GitHub Actions + Ruff + quick test

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

---

## Docker 启动

确保已经安装 Docker Desktop。

```bash
docker compose up --build
```

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

## 当前版本

`v0.7.0`

当前版本支持：

- 交互式实验 Dashboard
- 真实 MNIST FedAvg
- Label Flipping 攻击与 ASR 评估
- Median / Trimmed Mean / Krum 鲁棒聚合
- HTML / CSV / Markdown 报告导出
- 多实验对比报告
- Docker Compose 启动
- GitHub Actions + Ruff + quick test
- 前端实验历史持久化
- 刷新页面后保留已完成实验记录
- 支持清空 Dashboard 历史记录

---

## License

MIT
