import os
from pathlib import Path

import pytest

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

def _set_tree_mtime(path: Path, timestamp: int) -> None:
    for child in path.rglob("*"):
        os.utime(child, (timestamp, timestamp))
    os.utime(path, (timestamp, timestamp))


def _seed_cleanup_tree(tmp_path: Path) -> tuple[Path, Path, Path, Path]:
    jobs_dir = tmp_path / "jobs"
    comparisons_dir = tmp_path / "comparisons"

    job_old = jobs_dir / "job-old"
    job_new = jobs_dir / "job-new"
    comparison_old = comparisons_dir / "comparison-old"
    comparison_new = comparisons_dir / "comparison-new"

    _write_file(job_old / "report.html", "<html>old job</html>")
    _write_file(job_new / "report.html", "<html>new job</html>")
    _write_file(comparison_old / "comparison.json", '{"old": true}')
    _write_file(comparison_new / "comparison.json", '{"new": true}')

    _set_tree_mtime(job_old, 100)
    _set_tree_mtime(comparison_old, 110)
    _set_tree_mtime(job_new, 200)
    _set_tree_mtime(comparison_new, 210)

    return job_old, job_new, comparison_old, comparison_new


def test_reports_cleanup_run_dry_run_does_not_delete(
    tmp_path: Path,
    monkeypatch,
) -> None:
    job_old, job_new, comparison_old, comparison_new = _seed_cleanup_tree(
        tmp_path
    )

    monkeypatch.setattr(api_main, "REPORTS_DIR", tmp_path / "jobs")
    monkeypatch.setattr(api_main, "COMPARISONS_DIR", tmp_path / "comparisons")

    data = api_main.run_reports_cleanup(
        keep_latest=1,
        dry_run=True,
        confirm=False,
    )

    assert data["dry_run"] is True
    assert data["deletes_files"] is False
    assert data["deleted_count"] == 0
    assert data["skipped_count"] == data["selected_candidate_count"]
    assert job_old.exists()
    assert job_new.exists()
    assert comparison_old.exists()
    assert comparison_new.exists()


def test_reports_cleanup_run_requires_confirm_for_delete(
    tmp_path: Path,
    monkeypatch,
) -> None:
    _seed_cleanup_tree(tmp_path)

    monkeypatch.setattr(api_main, "REPORTS_DIR", tmp_path / "jobs")
    monkeypatch.setattr(api_main, "COMPARISONS_DIR", tmp_path / "comparisons")

    with pytest.raises(ValueError, match="confirm=true"):
        api_main.run_reports_cleanup(
            keep_latest=1,
            dry_run=False,
            confirm=False,
        )


def test_reports_cleanup_run_deletes_only_candidates(
    tmp_path: Path,
    monkeypatch,
) -> None:
    job_old, job_new, comparison_old, comparison_new = _seed_cleanup_tree(
        tmp_path
    )

    monkeypatch.setattr(api_main, "REPORTS_DIR", tmp_path / "jobs")
    monkeypatch.setattr(api_main, "COMPARISONS_DIR", tmp_path / "comparisons")

    data = api_main.run_reports_cleanup(
        keep_latest=1,
        dry_run=False,
        confirm=True,
    )

    assert data["dry_run"] is False
    assert data["deletes_files"] is True
    assert data["deleted_count"] == 2
    assert data["deleted_size_bytes"] > 0
    assert not job_old.exists()
    assert job_new.exists()
    assert not comparison_old.exists()
    assert comparison_new.exists()
