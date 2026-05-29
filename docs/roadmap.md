# Roadmap

FedGuardLab 的目标是逐步构建一个轻量、可视化、可复现的联邦学习安全实验平台。

---

## Stage 1：平台 MVP

- [x] FastAPI 后端
- [x] Vue Dashboard
- [x] WebSocket 实时指标推送
- [x] YAML 配置加载
- [x] Pydantic 配置校验
- [x] 实验结果自动保存
- [x] HTML 报告生成
- [x] 前端打开报告
- [x] 前端选择实验配置

---

## Stage 2：真实联邦学习训练

- [x] 添加 PyTorch MNIST 模型
- [x] 实现 FedAvg
- [x] 实现 IID 数据划分
- [x] 实现 Dirichlet Non-IID 数据划分
- [x] 接入真实 MNIST FedAvg trainer
- [x] 在 Dashboard 中展示真实训练指标

---

## Stage 3：联邦学习安全实验

- [x] 实现真实 label flipping 攻击
- [x] 添加 attack success rate 评估逻辑
- [x] 实现 Median 聚合防御
- [x] 实现 Trimmed Mean 聚合防御
- [x] 实现 Krum 聚合防御
- [x] 实现 backdoor 攻击
- [x] 添加 backdoor + robust aggregation 对比实验
- [ ] 实现 model poisoning 攻击

---

## Stage 4：研究可用性增强

- [x] 支持多实验对比
- [x] 支持指标导出为 CSV
- [x] 支持生成 Markdown 报告
- [x] 支持 Docker Compose 启动
- [x] 添加 GitHub Actions quick test
- [x] 添加 Ruff 代码质量检查
- [ ] 添加更多预设实验场景
- [x] 支持实验历史持久化
- [x] 支持前端清理本地实验历史

---

## 版本记录

### v0.1.0

交互式 FL 安全实验 MVP。

### v0.2.0

Dashboard 对比报告和清理脚本。

### v0.3.0

Krum 鲁棒聚合防御。

### v0.4.0

Docker Compose 开发环境。

### v0.5.0

CSV 和 Markdown 报告导出。

### v0.6.0

Ruff、开发依赖和 GitHub Actions 质量检查。

### v0.7.0

前端实验历史持久化，刷新页面后保留已完成实验记录，并支持清空历史。

### v0.8.0

新增 MNIST trigger-based backdoor attack，并支持 backdoor ASR 评估。

### v0.9.0

新增 Backdoor + FedAvg / Median / Trimmed Mean / Krum 对比实验配置。

### v0.10.0

优化 Dashboard 和实验报告展示效果，并在 README 中加入项目截图。

---

## 后续优先级建议

### v0.11.0

Backdoor attack 增强：

- 支持更多 trigger pattern；
- 支持更多目标标签攻击；
- 支持 backdoor ASR 评估优化。

### v1.0.0

稳定首个展示版：

- 固化当前实验能力；
- 完善 README、docs 和 LICENSE；
- 确认 Docker、CI、报告导出和 Dashboard 主流程可用。
