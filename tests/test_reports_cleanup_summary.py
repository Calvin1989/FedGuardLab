from pathlib import Path

from api import main as api_main


def _write_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def test_reports_cleanup_summary_is_dry_run(
    tmp_path: Path,
    monkeypatch,
) -> None:
    jobs_dir = tmp_path / "jobs"
    comparisons_dir = tmp_path / "comparisons"

    _write_file(jobs_dir / "job-a" / "report.html", "<html>A</html>")
    _write_file(jobs_dir / "job-b" / "metrics.json", "{}")
    _write_file(
        comparisons_dir / "comparison-a" / "comparison.json",
        "{}",
    )

    monkeypatch.setattr(api_main, "REPORTS_DIR", jobs_dir)
    monkeypatch.setattr(api_main, "COMPARISONS_DIR", comparisons_dir)

    data = api_main.build_reports_cleanup_summary(keep_latest=1)

    assert data["dry_run"] is True
    assert data["deletes_files"] is False
    assert data["keep_latest_per_kind"] == 1
    assert data["jobs"]["count"] == 2
    assert data["comparisons"]["count"] == 1
    assert data["total_size_bytes"] > 0
    assert data["cleanup_preview"]["candidate_count"] == 1
    assert data["cleanup_preview"]["candidate_size_bytes"] > 0
    assert len(data["cleanup_preview"]["candidates"]) == 1


def test_reports_cleanup_summary_handles_missing_dirs(
    tmp_path: Path,
    monkeypatch,
) -> None:
    monkeypatch.setattr(api_main, "REPORTS_DIR", tmp_path / "missing_jobs")
    monkeypatch.setattr(
        api_main,
        "COMPARISONS_DIR",
        tmp_path / "missing_comparisons",
    )

    data = api_main.build_reports_cleanup_summary()

    assert data["dry_run"] is True
    assert data["deletes_files"] is False
    assert data["jobs"]["count"] == 0
    assert data["comparisons"]["count"] == 0
    assert data["total_size_bytes"] == 0
    assert data["cleanup_preview"]["candidate_count"] == 0
    assert data["cleanup_preview"]["candidates"] == []