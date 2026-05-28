# FedGuardLab

FedGuardLab 是一个面向联邦学习安全实验的交互式实验平台。

项目目标不是做一个“大而全”的联邦学习 benchmark，而是提供一个轻量、可视化、可复现的实验环境，帮助学生、研究者和开发者更直观地理解联邦学习中的攻击、防御和实验流程。

当前版本已经完成平台 MVP，并接入了真实的 MNIST + FedAvg 联邦学习训练流程。用户可以在前端选择 simulated demo 或 real MNIST FedAvg demo，运行实验、查看实时指标，并生成可复现的 HTML 报告。

> 注意：项目同时保留 simulated trainer 和 real MNIST FedAvg trainer。simulated trainer 用于快速演示 Dashboard 与报告流程；real MNIST FedAvg trainer 用于验证真实联邦学习训练闭环。

---

## 项目特性

- Vue + Vite 前端 Dashboard
- FastAPI 后端服务
- WebSocket 实时推送实验指标
- YAML 实验配置文件
- Pydantic 配置校验
- 支持 simulated trainer 快速演示
- 支持真实 MNIST + FedAvg 联邦学习训练
- 支持前端选择不同实验配置
- 自动保存实验配置和指标
- 自动生成 HTML 实验报告
- 前端页面可直接打开实验报告
- 实验报告展示训练模式、客户端数量、数据集、划分方式、攻击与防御信息

---

## 当前架构

```text
Vue Dashboard
    ↓
Experiment Selector
    ↓
FastAPI /run?config_path=...
    ↓
WebSocket /ws/{job_id}
    ↓
Simulated Trainer 或 Real MNIST FedAvg Trainer
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
│   ├── label_flip_demo.yaml
│   └── mnist_fedavg_demo.yaml
├── fedguardlab/
│   ├── config/
│   │   ├── loader.py
│   │   └── schema.py
│   ├── core/
│   │   ├── aggregation.py
│   │   ├── data.py
│   │   ├── mnist_fedavg.py
│   │   ├── models.py
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
python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
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

打开页面后，可以选择实验配置并点击：

```text
Run Experiment
```

---

## 当前支持的实验

### 1. Simulated Label Flipping Demo

配置文件：

```text
configs/label_flip_demo.yaml
```

用途：

- 快速验证 Dashboard；
- 快速验证 WebSocket；
- 快速生成实验报告；
- 模拟 label flipping 攻击下的指标变化。

---

### 2. Real MNIST FedAvg Demo

配置文件：

```text
configs/mnist_fedavg_demo.yaml
```

用途：

- 使用 PyTorch 加载 MNIST；
- 将训练集 IID 划分到多个客户端；
- 每个客户端进行本地训练；
- 使用 FedAvg 聚合客户端模型；
- 在测试集上评估全局模型；
- 将真实训练结果推送到前端并生成报告。

---

### 3. Real MNIST FedAvg Label Flip Demo

配置文件：

```text
configs/mnist_fedavg_label_flip_demo.yaml
```

用途：

- 使用真实 MNIST 数据集；
- 使用 IID 数据划分；
- 设置 5 个客户端；
- 设置前 2 个客户端为恶意客户端；
- 在恶意客户端本地训练数据中执行 1 → 7 label flipping；
- 使用 FedAvg 聚合全局模型；
- 计算全局 accuracy、loss 和 attack success rate；
- 在 HTML 报告中展示客户端标签分布和 ASR。

---

### 4. Real MNIST Label Flip + Median Defense

配置文件：

```text
configs/mnist_median_label_flip_demo.yaml
```

用途：

- 使用真实 MNIST 数据集；
- 设置 5 个客户端；
- 设置前 2 个客户端为恶意客户端；
- 在恶意客户端中执行 1 → 7 label flipping；
- 使用 Median 聚合替代 FedAvg；
- 对比鲁棒聚合对 ASR 的抑制效果。

---

### 5. Real MNIST Label Flip + Trimmed Mean Defense

配置文件：

```text
configs/mnist_trimmed_mean_label_flip_demo.yaml
```

用途：

- 使用真实 MNIST 数据集；
- 设置 5 个客户端；
- 设置前 2 个客户端为恶意客户端；
- 在恶意客户端中执行 1 → 7 label flipping；
- 使用 Trimmed Mean 聚合防御；
- 通过 ASR、accuracy 和 loss 观察防御效果。

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

- `config.json` 保存本次实验配置；
- `metrics.json` 保存每一轮实验指标；
- `report.html` 是自动生成的 HTML 实验报告。

前端页面会在实验完成后显示 `Open HTML Report` 链接，可以直接在浏览器中打开报告。

---

## 示例配置

### Simulated Label Flipping Demo

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

### Real MNIST FedAvg Demo

```yaml
experiment:
  name: "mnist_fedavg_demo"
  seed: 42
  rounds: 3

training:
  mode: "real"
  local_epochs: 1
  batch_size: 64
  learning_rate: 0.01
  max_train_samples: 5000
  max_test_samples: 1000

federated:
  num_clients: 5
  malicious_clients: 0
  aggregation: "fedavg"

dataset:
  name: "mnist"
  partition: "iid"
  alpha: null

attack:
  type: "none"
  source_label: null
  target_label: null

defense:
  type: "none"

metrics:
  - accuracy
  - loss
```

---

## 当前实验指标

当前系统会实时生成并展示以下指标：

- `round`：当前通信轮次；
- `accuracy`：全局模型准确率；
- `loss`：测试集损失；
- `attack_success_rate`：攻击成功率；
- `trainer`：训练器类型；
- `mode`：训练模式；
- `dataset`：数据集名称；
- `partition`：数据划分方式；
- `num_clients`：客户端数量；
- `malicious_clients`：恶意客户端数量；
- `aggregation`：聚合方法；
- `attack`：攻击类型；
- `defense`：防御方法；
- `device`：训练设备。

这些指标会通过 WebSocket 实时推送到前端，并同时用于生成实验报告。

---

## Roadmap

### Stage 1：平台 MVP

- [x] FastAPI 后端
- [x] Vue Dashboard
- [x] WebSocket 实时指标推送
- [x] YAML 配置加载
- [x] Pydantic 配置校验
- [x] 实验结果自动保存
- [x] HTML 报告生成
- [x] 前端打开报告
- [x] 前端选择实验配置

### Stage 2：真实联邦学习训练

- [x] 添加 PyTorch MNIST 模型
- [x] 实现 FedAvg
- [x] 实现 IID 数据划分
- [x] 接入真实 MNIST FedAvg trainer
- [x] 在 Dashboard 中展示真实训练指标
- [ ] 实现 Dirichlet Non-IID 数据划分

### Stage 3：联邦学习安全实验

- [x] 实现真实 label flipping 攻击
- [x] 添加 attack success rate 评估逻辑
- [x] 实现 median 聚合防御
- [x] 实现 trimmed mean 聚合防御
- [ ] 实现 backdoor 攻击
- [ ] 实现 model poisoning 攻击
- [ ] 实现 Krum 聚合防御

### Stage 4：研究可用性增强

- [ ] 支持多实验对比
- [ ] 支持指标导出为 CSV
- [ ] 支持生成 Markdown 报告
- [ ] 支持 Docker 启动
- [ ] 添加 GitHub Actions smoke test
- [ ] 添加更多预设实验场景

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

当前项目已经完成：

```text
浏览器选择实验
  ↓
浏览器启动实验
  ↓
后端创建任务
  ↓
真实或模拟 trainer 运行
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

当前已经支持 IID、Dirichlet Non-IID、真实 label flipping 攻击、ASR 评估、Median 防御和 Trimmed Mean 防御。下一阶段将继续实现 Krum、防御对比报告和多实验对比视图。

---

## 技术栈

### 后端

- Python
- FastAPI
- Uvicorn
- WebSocket
- Pydantic
- PyYAML
- Jinja2
- NumPy
- Pandas
- PyTorch
- torchvision

### 前端

- Vue
- Vite
- Chart.js
- vue-chartjs

### 后续计划引入

- Docker
- GitHub Actions
- Flower，可选

## 当前版本

`v0.1.0`

已完成：

- 交互式实验 Dashboard；
- 真实 MNIST + FedAvg；
- IID / Dirichlet Non-IID；
- Label Flipping 攻击；
- ASR 评估；
- Median / Trimmed Mean 防御；
- 单实验报告；
- 多实验对比报告。

---

## License

MIT