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
