# Release Checklist

## Before tagging

1. Ensure working tree is clean:

   ```bash
   git status
   ```

2. Run linter:

   ```bash
   ruff check .
   ```

3. Run quick test:

   ```bash
   python quick_test.py
   ```

4. Build frontend:

   ```bash
   cd web
   npm install
   npm run build
   ```

5. Validate Docker config:

   ```bash
   docker compose config
   ```

6. Build and start containers:

   ```bash
   docker compose build
   docker compose up -d
   ```

7. Verify backend health:

   ```bash
   curl http://127.0.0.1:8000/health
   curl http://127.0.0.1:8000/configs
   ```

8. Run live API smoke test:

   ```bash
   python api_smoke_test.py
   python api_smoke_test.py --wait-finished
   ```

9. Verify durable job store:

   After the smoke test, confirm `reports/jobs/index.json` exists and contains job records:

   ```bash
   cat reports/jobs/index.json
   ```

   Restart the API and verify jobs persist:

   ```powershell
   Invoke-RestMethod "http://127.0.0.1:8000/jobs"
   ```

10. Verify artifact metadata:

    After `--wait-finished` completes, confirm the status response includes artifact metadata:

    ```powershell
    $jobId = "<job_id from smoke test>"
    $status = Invoke-RestMethod "http://127.0.0.1:8000/status/$jobId"
    # Expect: has_report = True, artifacts.report_html present
    $status.has_report
    $status.artifacts
    ```

    Also confirm `index.json` contains persisted artifact data:

    ```bash
    cat reports/jobs/index.json | grep has_report
    ```

11. Verify restart recovery (v1.2.0-alpha.3):

    After `--wait-finished` completes, copy the finished `job_id` from the output, then restart the backend and run the recovery check:

    ```powershell
    docker compose restart backend
    python api_smoke_test.py --check-recovery <job_id>
    ```

    This validates:

    - `/jobs` recovery — job appears in the list.
    - `/status/{job_id}` recovery — status is `finished`, metrics are present.
    - Artifact metadata — all expected keys present with non-empty string values.
    - Artifact file existence — each artifact path points to an existing file.
    - `reports/jobs/index.json` consistency — persisted data matches the API status response.

12. Verify `/jobs` query parameters (v1.2.0-alpha.4):

    ```powershell
    python api_smoke_test.py
    python api_smoke_test.py --wait-finished
    ```

    Both commands now cover:

    - `GET /jobs?limit=1` — returns at most 1 job.
    - `GET /jobs?sort=created_at_desc` — returns 200.
    - `GET /jobs?sort=created_at_asc` — returns 200.
    - `GET /jobs?status=finished` — returns 200; all jobs have status `finished`.
    - Invalid query parameters return 400:
      - `status=unknown`
      - `limit=0`
      - `sort=unknown`

13. Verify Recent Jobs status filter (v1.2.0-alpha.5):

    Build the frontend:

    ```powershell
    cd web
    npm run build
    cd ..
    ```

    Start the stack:

    ```powershell
    docker compose up -d
    ```

    Open the frontend and verify the Recent Jobs status filter:

    - Finished with reports
    - Finished
    - Running
    - Cancelled
    - Failed
    - Queued

    Verify that changing the filter reloads Recent Jobs through the Jobs API.

    Verify that non-finished jobs are visible for status inspection but not selectable for comparison.

    Verify that artifact/report metadata remains visible for finished jobs.

14. Verify Recent Jobs limit/sort controls (v1.2.0-alpha.6):

    Build the frontend:

    ```powershell
    cd web
    npm run build
    cd ..
    ```

    Start the stack:

    ```powershell
    docker compose up -d
    ```

    Open the frontend and verify Recent Jobs controls:

    - Limit: 10, 20, 50
    - Sort: Newest first, Oldest first
    - Status filter still works together with limit/sort

    Verify that changing limit or sort reloads Recent Jobs through the Jobs API.

    Verify that finished jobs with reports remain selectable for comparison.

    Verify that non-finished jobs remain excluded from comparison selection.

15. Stop containers:

   ```bash
   docker compose down
   ```

## Tagging

```bash
git checkout main
git pull origin main
git tag <version>
git push origin <version>
```

## GitHub Release

- Choose the correct tag.
- Mark alpha / beta / rc versions as pre-release.
- Include release notes (reference [CHANGELOG.md](../CHANGELOG.md)).
- Mention known limitations.

## After release

- Verify tag exists locally and remotely (`git tag -l`, `git ls-remote --tags`).
- Verify GitHub Release page.
- Start next feature branch from `main`.

---

## Windows PowerShell 注意事项

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
