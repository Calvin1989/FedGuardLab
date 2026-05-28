# 配置文件说明

FedGuardLab 使用 YAML 文件描述实验配置。配置文件默认存放在：

```text
configs/
```

---

## 通用结构

典型配置结构如下：

```yaml
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
