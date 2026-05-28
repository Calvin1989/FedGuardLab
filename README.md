# FedGuardLab

FedGuardLab 是一个面向联邦学习安全实验的交互式实验平台。

项目目标不是做一个“大而全”的联邦学习 benchmark，而是提供一个轻量、可视化、可复现的实验环境，帮助学生、研究者和开发者更直观地理解联邦学习中的攻击、防御和实验流程。

当前版本是平台 MVP，主要完成了前后端联动、WebSocket 实时指标推送、实验结果保存和 HTML 报告生成。真实联邦学习训练将在下一阶段接入。

> 注意：当前 MVP 使用的是 simulated trainer，用于验证 Dashboard、报告生成和实验调度流程。后续会逐步替换为真实的 MNIST + FedAvg 联邦学习训练流程。

---

## 项目特性

* Vue + Vite 前端 Dashboard
* FastAPI 后端服务
* WebSocket 实时推送实验指标
* YAML 实验配置文件
* Pydantic 配置校验
* 模拟联邦学习训练器
* 自动保存实验配置和指标
* 自动生成 HTML 实验报告
* 前端页面可直接打开实验报告

---

## 当前架构

```text
Vue Dashboard
    ↓
FastAPI /run
    ↓
WebSocket /ws/{job_id}
    ↓
Simulated FL Trainer
    ↓
config.json + metrics.json
    ↓
HTML Report
```

---

## 项目结构

```text
FedGuardLab/
├── api/
│   └── main.py
├── configs/
│   └── label_flip_demo.yaml
├── fedguardlab/
│   ├── config/
│   │   ├── loader.py
│   │   └── schema.py
│   ├── core/
│   │   └── trainer.py
│   └── reporting/
│       ├── generator.py
│       └── templates/
│           └── report.html.j2
├── reports/
├── web/
│   └── src/
│       └── App.vue
├── .gitignore
└── README.md
```

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/Calvin1989/FedGuardLab.git
cd FedGuardLab
```

---

### 2. 创建并激活 Python 环境

```bash
conda create -n fedguardlab python=3.11 -y
conda activate fedguardlab
```

---

### 3. 安装后端依赖

```bash
python -m pip install fastapi "uvicorn[standard]" pydantic pyyaml jinja2 numpy pandas
```

---

### 4. 启动后端

```bash
uvicorn api.main:app --reload
```

后端默认运行在：

```text
http://127.0.0.1:8000
```

FastAPI 自动接口文档：

```text
http://127.0.0.1:8000/docs
```

---

### 5. 安装前端依赖

打开另一个终端：

```bash
cd web
npm install
```

---

### 6. 启动前端

```bash
npm run dev
```

终端会显示类似地址：

```text
http://localhost:3000
```

如果 3000 端口被占用，Vite 会自动切换到 3001、3002 等端口。

打开页面后，点击：

```text
Run Label Flipping Demo
```

即可启动一次模拟实验。

---

## 实验输出

每次实验完成后，系统会自动生成一个以 `job_id` 命名的目录：

```text
reports/jobs/<job_id>/
├── config.json
├── metrics.json
└── report.html
```

其中：

* `config.json` 保存本次实验配置；
* `metrics.json` 保存每一轮实验指标；
* `report.html` 是自动生成的 HTML 实验报告。

前端页面会在实验完成后显示 `Open HTML Report` 链接，可以直接在浏览器中打开报告。

---

## 示例配置

当前默认实验配置位于：

```text
configs/label_flip_demo.yaml
```

内容示例：

```yaml
experiment:
  name: "label_flip_demo"
  seed: 42
  rounds: 20

federated:
  num_clients: 10
  malicious_clients: 2
  aggregation: "fedavg"

dataset:
  name: "mnist"
  partition: "dirichlet"
  alpha: 0.5

attack:
  type: "label_flipping"
  source_label: 1
  target_label: 7

defense:
  type: "none"

metrics:
  - accuracy
  - attack_success_rate
  - loss
```

---

## 当前实验指标

当前模拟训练器会实时生成以下指标：

* `round`：当前通信轮次；
* `accuracy`：模拟全局模型准确率；
* `loss`：模拟训练损失；
* `attack_success_rate`：模拟攻击成功率；
* `aggregation`：聚合方法；
* `attack`：攻击类型；
* `defense`：防御方法。

这些指标会通过 WebSocket 实时推送到前端，并同时用于生成实验报告。

---

## Roadmap

### Stage 1：平台 MVP

* [x] FastAPI 后端
* [x] Vue Dashboard
* [x] WebSocket 实时指标推送
* [x] YAML 配置加载
* [x] Pydantic 配置校验
* [x] 实验结果自动保存
* [x] HTML 报告生成
* [x] 前端打开报告

### Stage 2：真实联邦学习训练

* [ ] 添加 PyTorch MNIST 模型
* [ ] 实现 FedAvg
* [ ] 实现 IID 数据划分
* [ ] 实现 Dirichlet Non-IID 数据划分
* [ ] 用真实 FL trainer 替换 simulated trainer
* [ ] 在 Dashboard 中展示真实训练指标

### Stage 3：联邦学习安全实验

* [ ] 实现 label flipping 攻击
* [ ] 实现 backdoor 攻击
* [ ] 实现 model poisoning 攻击
* [ ] 实现 median 聚合防御
* [ ] 实现 trimmed mean 聚合防御
* [ ] 实现 Krum 聚合防御
* [ ] 添加 attack success rate 评估逻辑

### Stage 4：研究可用性增强

* [ ] 支持多实验对比
* [ ] 支持指标导出为 CSV
* [ ] 支持生成 Markdown 报告
* [ ] 支持 Docker 启动
* [ ] 添加 GitHub Actions smoke test
* [ ] 添加更多预设实验场景

---

## 项目定位

FedGuardLab 的定位是：

> 一个交互式联邦学习安全实验平台。

它不追求一开始覆盖所有联邦学习算法和攻击防御方法，而是优先做好以下几点：

1. 实验配置简单；
2. 实验过程可视化；
3. 实验结果可保存；
4. 实验报告可复现；
5. 后续方便扩展真实攻击和防御算法。

相比传统论文复现仓库，FedGuardLab 更强调工程化、可交互和可展示。

---

## 当前状态

当前项目已经完成平台 MVP：

```text
浏览器启动实验
  ↓
后端创建任务
  ↓
WebSocket 实时推送指标
  ↓
前端实时绘图
  ↓
保存 JSON 结果
  ↓
生成 HTML 报告
  ↓
浏览器打开报告
```

下一阶段将开始接入真实的 MNIST + FedAvg 联邦学习训练流程。

---

## 技术栈

### 后端

* Python
* FastAPI
* Uvicorn
* WebSocket
* Pydantic
* PyYAML
* Jinja2
* NumPy
* Pandas

### 前端

* Vue
* Vite
* Chart.js
* vue-chartjs

### 后续计划引入

* PyTorch
* torchvision
* Flower，可选
* Docker
* GitHub Actions

---

## License

MIT
