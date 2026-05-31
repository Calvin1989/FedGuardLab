# 配置文件说明

FedGuardLab 使用 YAML 文件描述实验配置。配置文件默认存放在：

```text
configs/
```

---

## 通用结构

典型配置结构如下：

```yaml
metadata:
  name: "MNIST FedAvg Demo"
  description: "Baseline MNIST training with FedAvg, no attack"
  category: "baseline"
  tags:
    - mnist
    - fedavg
    - baseline

experiment:
  name: "experiment_name"
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
  malicious_clients: 2
  aggregation: "fedavg"

dataset:
  name: "mnist"
  partition: "iid"
  alpha: null

attack:
  type: "label_flipping"
  source_label: 1
  target_label: 7

defense:
  type: "none"

metrics:
  - accuracy
  - loss
  - attack_success_rate
```

---

## metadata（可选）

```yaml
metadata:
  name: "MNIST FedAvg Demo"
  description: "Baseline MNIST training with FedAvg, no attack"
  category: "baseline"
  tags:
    - mnist
    - fedavg
    - baseline
```

`metadata` 是可选块，用于丰富 `GET /configs` 返回的配置目录信息，不影响训练逻辑。

字段说明：

- `name`：配置的显示名称，比 `experiment.name` 更友好；未提供时 fallback 为文件名去扩展名。
- `description`：配置的简要描述；未提供时 fallback 为空字符串。
- `category`：配置分类（如 `baseline`、`attack`、`defense`）；未提供时 fallback 为 `uncategorized`。
- `tags`：标签列表，便于筛选和组织；未提供时 fallback 为空数组。

如果配置文件不含 `metadata` 块，`GET /configs` 仍会返回该配置，只是 metadata 字段使用 fallback 值。现有前端不依赖 metadata 字段，因此缺失不会导致问题。

---

## experiment

```yaml
experiment:
  name: "mnist_fedavg_demo"
  seed: 42
  rounds: 3
```

字段说明：

- `name`：实验名称；
- `seed`：随机种子；
- `rounds`：联邦学习通信轮数。

---

## training

```yaml
training:
  mode: "real"
  local_epochs: 1
  batch_size: 64
  learning_rate: 0.01
  max_train_samples: 5000
  max_test_samples: 1000
```

字段说明：

- `mode`：训练模式，支持 `simulated` 和 `real`；
- `local_epochs`：每轮每个客户端本地训练轮数；
- `batch_size`：批大小；
- `learning_rate`：学习率；
- `max_train_samples`：限制训练样本数，便于快速实验；
- `max_test_samples`：限制测试样本数，便于快速实验。

---

## federated

```yaml
federated:
  num_clients: 5
  malicious_clients: 2
  aggregation: "fedavg"
```

字段说明：

- `num_clients`：客户端数量；
- `malicious_clients`：恶意客户端数量；
- `aggregation`：聚合方法。

当前支持：

```text
fedavg
median
trimmed_mean
krum
```

---

## dataset

```yaml
dataset:
  name: "mnist"
  partition: "dirichlet"
  alpha: 0.5
```

字段说明：

- `name`：数据集名称，目前主要支持 `mnist`；
- `partition`：数据划分方式；
- `alpha`：Dirichlet Non-IID 划分参数。

当前支持：

```text
iid
dirichlet
```

---

## attack

```yaml
attack:
  type: "label_flipping"
  source_label: 1
  target_label: 7
```

字段说明：

- `type`：攻击类型；
- `source_label`：原始标签；
- `target_label`：目标标签。

当前支持：

```text
none
label_flipping
backdoor
```

Backdoor attack 示例：

```yaml
attack:
  type: "backdoor"
  target_label: 7
  poison_fraction: 0.5
  trigger_size: 4
  trigger_value: 2.8
```

---

## defense

```yaml
defense:
  type: "trimmed_mean"
  trim_ratio: 0.2
```

字段说明：

- `type`：防御方法；
- `trim_ratio`：Trimmed Mean 的裁剪比例；
- `krum_malicious_clients`：Krum 预计恶意客户端数量。

示例：

```yaml
defense:
  type: "krum"
  krum_malicious_clients: 2
```

---

## metrics

```yaml
metrics:
  - accuracy
  - loss
  - attack_success_rate
```

当前系统会生成并展示：

- `round`
- `accuracy`
- `loss`
- `attack_success_rate`
- `trainer`
- `mode`
- `dataset`
- `partition`
- `num_clients`
- `malicious_clients`
- `aggregation`
- `attack`
- `defense`
- `device`

---

## 配置约束

配置加载时会进行语义校验，以下规则必须满足：

### defense.type 与 aggregation 对应关系

| aggregation | defense.type |
|---|---|
| fedavg | none |
| median | median |
| trimmed_mean | trimmed_mean |
| krum | krum |

使用 FedAvg 时 `defense.type` 必须为 `none`；使用 Median / Trimmed Mean / Krum 时，`defense.type` 必须等于 `federated.aggregation`。

### Dirichlet 划分

当 `dataset.partition` 为 `dirichlet` 时，`dataset.alpha` 必须提供且大于 0。

### Krum 约束

使用 Krum 时，客户端数量必须满足：

```text
num_clients > 2 * krum_malicious_clients + 2
```

例如 2 个恶意客户端至少需要 7 个客户端。

不满足上述约束的配置会在加载时抛出 `ValueError`。