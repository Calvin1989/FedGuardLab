# Release Checklist

本清单适用于 FedGuardLab v1.8.x 之后的 release / rc / final 验证。

原则：

- release 前先从最新 `main` 建分支。
- PR 合并后再在 `main` 的 merge commit 上打 tag。
- 文档-only 变更也要跑轻量验证，避免误碰源码、配置或前端。
- rc / final 版本必须跑完整 Docker recovery smoke。

---

## 1. 开始前确认

```powershell
git checkout main
git pull origin main
git status
```

期望：

```text
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

---

## 2. 建议分支命名

文档 / 发布一致性修复：

```powershell
git checkout -b docs/v1.8.1-release-consistency
```

功能开发：

```powershell
git checkout -b feature/<short-name>
```

修复：

```powershell
git checkout -b fix/<short-name>
```

---

## 3. 常规本地验证

每次改完建议从项目根目录执行：

```powershell
python -m ruff check .
python quick_test.py
python -m pytest
cd web
npm run build
cd ..
python api_smoke_test.py
```

说明：

- `python -m ruff check .`：代码质量检查。
- `python quick_test.py`：轻量训练、报告生成和基础路径检查。
- `python -m pytest`：回归测试，包括 report/artifact、event timeline、comparison insights、config preview。
- `npm run build`：前端构建检查。
- `python api_smoke_test.py`：需要 backend 已启动，用于 live API smoke。

如果后端尚未启动，可以单独开一个终端：

```powershell
uvicorn api.main:app --reload
```

或者用 Docker 启动：

```powershell
docker compose up -d
python api_smoke_test.py
docker compose down
```

---

## 4. Release / RC / Final Docker 全流程

release、rc、final 版本必须执行完整 Docker 验证：

```powershell
docker compose config
docker compose build
docker compose up -d
python api_smoke_test.py --wait-finished --write-finished-job-id smoke_finished_job_id.txt
$jobId = Get-Content smoke_finished_job_id.txt
docker compose restart backend
Start-Sleep -Seconds 10
python api_smoke_test.py --check-recovery $jobId
docker compose down
Remove-Item smoke_finished_job_id.txt
git status
```

该流程验证：

- Docker Compose 配置合法。
- backend / frontend image 能成功构建。
- 容器启动后 backend API 可用。
- smoke job 能完成并写出 finished job id。
- backend restart 后，finished job 能通过 durable job store 恢复。
- artifact metadata 和 artifact 文件仍能被 API 读取。
- Docker 资源和临时文件已清理。

如果 Docker 验证中途失败，先清理：

```powershell
docker compose down
if (Test-Path smoke_finished_job_id.txt) { Remove-Item smoke_finished_job_id.txt }
git status
```

---

## 5. GitHub PR 流程

从项目根目录执行：

```powershell
git checkout main
git pull origin main
git checkout -b docs/v1.8.1-release-consistency

python -m ruff check .
python quick_test.py
python -m pytest
cd web
npm run build
cd ..
python api_smoke_test.py

git status
git add README.md CHANGELOG.md docs/roadmap.md docs/development.md docs/release-checklist.md .gitignore
git commit -m "docs: sync v1.8 release documentation"
git push origin docs/v1.8.1-release-consistency

@"
## 摘要

同步 v1.8.0 release 文档状态，修正 README、CHANGELOG、roadmap、development docs 和 release checklist 中的版本与验证流程不一致问题。

## 变更内容

- 将 README 当前稳定版本更新为 v1.8.0，并补充 v1.8.0 能力摘要。
- 将 CHANGELOG 中的 v1.8.0 final 内容整理为正式 v1.8.0 段落。
- 将 docs/roadmap.md 中 v1.8.0 beta / rc / final 验证项同步为已完成状态。
- 更新 docs/development.md 中 CI、Docker Smoke、本地验证和 release 验证说明。
- 重写 docs/release-checklist.md，使其匹配当前 v1.8.x PowerShell 验证流程。
- 将 smoke_finished_job_id.txt 加入 .gitignore，避免 Docker recovery smoke 临时文件误提交。

## 验证

- [ ] python -m ruff check .
- [ ] python quick_test.py
- [ ] python -m pytest
- [ ] cd web && npm run build
- [ ] python api_smoke_test.py

## 说明

- 文档-only 变更。
- 不改变 API。
- 不改变训练逻辑。
- 不改变 report/artifact URL。
- 不改变 Docker runtime 行为。
"@ | Set-Content -Encoding UTF8 pr-body.md

gh pr create --base main --head docs/v1.8.1-release-consistency --title "docs: sync v1.8 release documentation" --body-file pr-body.md
Remove-Item pr-body.md
```

如本地没有启动 backend，`python api_smoke_test.py` 会失败；这时应先启动 backend，或在 PR 描述的验证部分明确写出未运行原因。

---

## 6. PR 标题模板

```text
docs: sync v1.8 release documentation
```

---

## 7. PR 描述模板

```markdown
## 摘要

同步 v1.8.0 release 文档状态，修正 README、CHANGELOG、roadmap、development docs 和 release checklist 中的版本与验证流程不一致问题。

## 变更内容

- 将 README 当前稳定版本更新为 v1.8.0，并补充 v1.8.0 能力摘要。
- 将 CHANGELOG 中的 v1.8.0 final 内容整理为正式 v1.8.0 段落。
- 将 docs/roadmap.md 中 v1.8.0 beta / rc / final 验证项同步为已完成状态。
- 更新 docs/development.md 中 CI、Docker Smoke、本地验证和 release 验证说明。
- 重写 docs/release-checklist.md，使其匹配当前 v1.8.x PowerShell 验证流程。
- 将 smoke_finished_job_id.txt 加入 .gitignore，避免 Docker recovery smoke 临时文件误提交。

## 验证

- [ ] python -m ruff check .
- [ ] python quick_test.py
- [ ] python -m pytest
- [ ] cd web && npm run build
- [ ] python api_smoke_test.py

## 说明

- 文档-only 变更。
- 不改变 API。
- 不改变训练逻辑。
- 不改变 report/artifact URL。
- 不改变 Docker runtime 行为。
```

---

## 8. PR 合并后打 tag

PR 合并后，从本地 `main` 执行：

```powershell
git checkout main
git pull origin main
git status
git tag v1.8.1
git push origin v1.8.1
```

如果需要带注释 tag：

```powershell
git tag -a v1.8.1 -m "v1.8.1"
git push origin v1.8.1
```

---

## 9. GitHub Release

在 GitHub Release 页面：

- 选择正确 tag。
- alpha / beta / rc 标记为 pre-release。
- final release 不标记 pre-release。
- release notes 引用 `CHANGELOG.md`。
- 明确写出验证范围和已知限制。

---

## 10. 删除分支和检查状态

PR 合并且 tag 推送完成后：

```powershell
git branch -d docs/v1.8.1-release-consistency
git push origin --delete docs/v1.8.1-release-consistency
git fetch --prune
git status
git tag -l "v1.8.*"
git ls-remote --tags origin "v1.8.*"
```

---

## 11. Windows PowerShell 注意事项

Bash 环境变量写法不能直接在 PowerShell 中运行：

```bash
# Bash — 不适用于 PowerShell
FEDGUARDLAB_API_BASE=http://127.0.0.1:8000 python api_smoke_test.py
```

PowerShell 使用 `$env:VAR = "value"`：

```powershell
$env:FEDGUARDLAB_API_BASE = "http://127.0.0.1:8000"
python api_smoke_test.py
Remove-Item Env:FEDGUARDLAB_API_BASE
```
