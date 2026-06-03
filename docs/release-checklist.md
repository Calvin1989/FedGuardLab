# Release Checklist

本清单适用于 FedGuardLab 当前及后续 release / rc / final 验证。

原则：

- release tag 必须打在 PR 合并后的最新 main commit 上。
- 不在功能分支、旧 commit 或未合并 commit 上打 tag。
- release / rc / final 验证必须确认 API、训练核心逻辑、Docker runtime 和 report/artifact URL 未被无意改变。
- 文档-only release PR 也必须跑基础验证，避免误碰源码或配置。

---

## 1. 开始前确认状态

```powershell
git switch main
git fetch origin
git pull --ff-only origin main
git status --short --branch
git log --oneline --decorate --max-count=8
git tag --points-at HEAD
```

要求：

- working tree clean。
- 本地 main 与 origin/main 一致。
- 如果是准备新 release tag，HEAD 必须是目标 release PR 合并后的 main 最新 commit。

---

## 2. 基础验证

```powershell
python -m ruff check .
python quick_test.py
python -m pytest
cd web
npm run build
cd ..
```

说明：

- `python -m ruff check .`：代码质量检查。
- `python quick_test.py`：轻量训练、报告生成和基础路径检查。
- `python -m pytest`：回归测试，包括 report/artifact、event timeline、comparison insights、config preview 和 reports cleanup。
- `npm run build`：前端构建检查。

---

## 3. Live API Smoke

`python api_smoke_test.py` 需要 backend 已启动。

单独开一个终端启动本地 backend：

```powershell
uvicorn api.main:app --reload
```

然后在仓库根目录执行：

```powershell
python api_smoke_test.py
```

如果使用 Docker Compose 启动 backend：

```powershell
docker compose up -d
python api_smoke_test.py
docker compose down
```

---

## 4. Release / RC / Final Docker 全流程

release、rc、final 版本必须在基础验证通过后执行完整 Docker 验证：

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
git status --short --branch
```

该流程验证：

- Docker Compose 配置合法。
- backend / frontend 镜像可构建。
- backend healthcheck 可通过。
- API smoke 可通过。
- finished job 可持久化。
- backend restart 后 recovery check 可通过。
- 临时 smoke 文件不会遗留在 working tree。

如果 Docker 验证中途失败，先清理：

```powershell
docker compose down
if (Test-Path smoke_finished_job_id.txt) { Remove-Item smoke_finished_job_id.txt }
git status --short --branch
```

---

## 5. GitHub PR 流程

下面使用 `release/<version>-docs` 作为示例分支名；实际版本请替换为当前 release、rc 或 maintenance 版本。

```powershell
git switch main
git pull --ff-only origin main
git switch -c release/<version>-docs

python -m ruff check .
python quick_test.py
python -m pytest
cd web
npm run build
cd ..
python api_smoke_test.py

git status --short --branch
git add README.md CHANGELOG.md docs/roadmap.md docs/development.md docs/release-checklist.md
git commit -m "docs: sync <version> release documentation"
git push -u origin release/<version>-docs
```

PR title：

```text
docs: sync <version> release documentation
```

PR body 模板：

```markdown
## Summary

- Sync <version> release documentation status.
- Keep README, CHANGELOG, roadmap, development docs, and release checklist consistent.
- Confirm validation scope and compatibility notes.

## Safety

- Documentation-only change.
- No runtime code change.
- No API behavior change.
- No training core logic change.
- No report artifact URL change.
- No Docker runtime behavior change.
- No dependency change.

## Verification

- [ ] git diff --check
- [ ] python -m ruff check .
- [ ] python quick_test.py
- [ ] python -m pytest
- [ ] cd web && npm run build
- [ ] python api_smoke_test.py
- [ ] Docker full flow, if this is release / rc / final validation
```

---

## 6. PR 合并后打 tag

只有 release / rc / final 需要 tag。普通文档清理、repo hygiene、CI maintenance PR 不需要 tag。

PR 合并后必须先同步 main：

```powershell
git switch main
git fetch origin
git pull --ff-only origin main
git status --short --branch
git log --oneline --decorate --max-count=8
```

确认 HEAD 是目标 release commit 后，再创建 tag：

轻量 tag：

```powershell
git tag <version>
git push origin <version>
```

或 annotated tag：

```powershell
git tag -a <version> -m "<version>"
git push origin <version>
```

确认 tag：

```powershell
git tag --points-at HEAD
git ls-remote --tags origin <version>
```

---

## 7. GitHub Release

如果需要 GitHub Release：

1. 打开 GitHub Releases。
2. 选择刚创建的 `<version>` tag。
3. Release notes 应与 CHANGELOG 对应版本一致。
4. 明确写出兼容性说明：
   - no API behavior change, unless this release intentionally changes API;
   - no training core logic change, unless this release intentionally changes training logic;
   - no report artifact URL change;
   - no Docker runtime behavior change, unless documented;
   - no new dependency, unless documented.

---

## 8. 合并后本地清理

```powershell
git switch main
git pull --ff-only origin main
git branch --merged
git status --short --branch
```

如果 GitHub 已删除远端分支，本地通常也会在 `gh pr merge --delete-branch` 后删除对应分支。

如需手动删除本地分支：

```powershell
git branch -d release/<version>-docs
```

---

## 9. 常见错误

### tag 打在旧 commit 上

修复前先确认远端 tag 是否已经发布。如果已经发布，不要直接覆盖，先评估是否需要删除并重建 tag。

检查：

```powershell
git show <version> --no-patch --decorate
git log --oneline --decorate --max-count=8
git ls-remote --tags origin <version>
```

### main 上误提交

如果误在 main 上本地提交但还没有 push，优先新建分支保留提交，再把 main reset 回 origin/main：

```powershell
git branch rescue/local-main-commit
git fetch origin
git reset --hard origin/main
git switch rescue/local-main-commit
```

### api_smoke_test.py 失败

先确认 backend 是否运行：

```powershell
curl http://127.0.0.1:8000/health
```

PowerShell 环境变量写法：

```powershell
$env:FEDGUARDLAB_API_BASE = "http://127.0.0.1:8000"
python api_smoke_test.py
Remove-Item Env:FEDGUARDLAB_API_BASE
```
