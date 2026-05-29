# 实验说明

FedGuardLab 当前提供 simulated demo 和 real MNIST demo 两类实验。

---

## 1. Simulated Label Flipping Demo

配置文件：

```text
configs/label_flip_demo.yaml
```

用途：

- 快速验证 Dashboard；
- 快速验证 WebSocket；
- 快速生成实验报告；
- 模拟 label flipping 攻击下的指标变化。

该实验不运行真实神经网络训练，适合快速展示平台流程。

---

## 2. Real MNIST FedAvg Demo

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

## 3. Real MNIST FedAvg Label Flip Demo

配置文件：

```text
configs/mnist_fedavg_label_flip_demo.yaml
```

用途：

- 使用真实 MNIST 数据集；
- 使用 IID 数据划分；
- 设置 5 个客户端；
- 设置前 2 个客户端为恶意客户端；
- 在恶意客户端本地训练数据中执行 `1 -> 7` label flipping；
- 使用 FedAvg 聚合全局模型；
- 计算 accuracy、loss 和 attack success rate；
- 在报告中展示客户端标签分布和 ASR。

---

## 4. Real MNIST Label Flip + Median Defense

配置文件：

```text
configs/mnist_median_label_flip_demo.yaml
```

用途：

- 使用真实 MNIST 数据集；
- 设置 5 个客户端；
- 设置前 2 个客户端为恶意客户端；
- 执行 `1 -> 7` label flipping；
- 使用 Median 聚合替代 FedAvg；
- 观察 Median 对 ASR 的抑制效果。

---

## 5. Real MNIST Label Flip + Trimmed Mean Defense

配置文件：

```text
configs/mnist_trimmed_mean_label_flip_demo.yaml
```

用途：

- 使用真实 MNIST 数据集；
- 设置 5 个客户端；
- 设置前 2 个客户端为恶意客户端；
- 执行 `1 -> 7` label flipping；
- 使用 Trimmed Mean 聚合防御；
- 通过 ASR、accuracy 和 loss 观察防御效果。

---

## 6. Real MNIST Label Flip + Krum Defense

配置文件：

```text
configs/mnist_krum_label_flip_demo.yaml
```

用途：

- 使用真实 MNIST 数据集；
- 设置 7 个客户端；
- 设置前 2 个客户端为恶意客户端；
- 执行 `1 -> 7` label flipping；
- 使用 Krum 鲁棒聚合防御；
- 通过 ASR、accuracy 和 loss 观察防御效果。

注意：Krum 要求客户端数量满足：

```text
num_clients > 2 * num_malicious_clients + 2
```

因此该实验使用 7 个客户端和 2 个恶意客户端。

---

## 7. Real MNIST FedAvg Backdoor Demo

配置文件：

```text
configs/mnist_fedavg_backdoor_demo.yaml
```

用途：

- 使用真实 MNIST 数据集；
- 设置 5 个客户端；
- 设置前 2 个客户端为恶意客户端；
- 在恶意客户端样本右下角添加 trigger；
- 将投毒样本标签改为目标标签 7；
- 使用 FedAvg 聚合全局模型；
- 通过 backdoor ASR 评估攻击成功率。

---

## 实验对比

前端 Dashboard 支持勾选多个已完成实验，并生成 comparison report。

也可以使用命令行：

```bash
python compare_jobs.py JOB_ID_1 JOB_ID_2 JOB_ID_3 --title "Label Flipping Defense Comparison"
```

输出目录：

```text
reports/comparisons/<comparison_id>/
├── comparison.html
├── comparison.json
└── comparison.csv
```
