"""Regression tests for v1.6.1 report and artifact fixes.

Covers:
1. Single experiment report template renders without missing variable errors.
2. Comparison report template renders without missing variable errors.
3. Finished job artifact files are generated correctly.
4. Comparison artifact files are generated correctly.
5. JobStore persistence preserves data across simulated restarts.
6. Summary fields are derivable from persisted config and metrics.
"""

from __future__ import annotations

import csv
import json
import uuid
from pathlib import Path

import pytest

from api.jobs import JobRecord, JobStore
from fedguardlab.reporting.comparison import (
    compute_comparison_insights,
    generate_comparison_report,
    load_job_summary,
)
from fedguardlab.reporting.generator import generate_html_report

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_config(
    name: str = "test_experiment",
    aggregation: str = "fedavg",
    defense: str = "none",
    attack: str = "none",
) -> dict:
    """Create a minimal config dict matching the expected nested structure."""
    return {
        "experiment": {"name": name, "rounds": 2},
        "federated": {
            "aggregation": aggregation,
            "num_clients": 3,
            "malicious_clients": 0,
        },
        "defense": {"type": defense},
        "attack": {"type": attack},
        "dataset": {"name": "mnist", "partition": "iid"},
        "training": {"mode": "fake"},
    }


def _make_metrics(n: int = 2) -> list[dict]:
    """Create *n* rounds of minimal metrics."""
    metrics = []
    for i in range(1, n + 1):
        metrics.append(
            {
                "round": i,
                "accuracy": 0.5 + i * 0.1,
                "loss": 1.0 - i * 0.1,
                "attack_success_rate": 0.3 - i * 0.05,
                "aggregation": "fedavg",
                "attack": "none",
                "defense": "none",
                "trainer": "fake",
                "mode": "fake",
                "dataset": "mnist",
                "partition": "iid",
                "num_clients": 3,
                "malicious_clients": 0,
                "device": "cpu",
            }
        )
    return metrics


def _seed_job_dir(
    job_dir: Path,
    config: dict,
    metrics: list[dict],
) -> None:
    """Write config.json and metrics.json to a job directory."""
    job_dir.mkdir(parents=True, exist_ok=True)
    (job_dir / "config.json").write_text(
        json.dumps(config, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    (job_dir / "metrics.json").write_text(
        json.dumps(metrics, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


# ---------------------------------------------------------------------------
# Test 1 – Single experiment report template rendering
# ---------------------------------------------------------------------------


class TestSingleReportRendering:
    """generate_html_report should succeed with minimal job data."""

    def test_renders_with_all_variables(self, tmp_path: Path) -> None:
        job_id = str(uuid.uuid4())
        config = _make_config()
        metrics = _make_metrics(2)
        job = {"status": "finished", "config": config, "metrics": metrics}

        report_path = generate_html_report(job_id, job, tmp_path)
        assert report_path.exists()
        html = report_path.read_text(encoding="utf-8")
        assert job_id in html
        assert "test_experiment" in html

    def test_renders_with_empty_metrics(self, tmp_path: Path) -> None:
        """Empty metrics list should fall back to default final_metric."""
        job_id = str(uuid.uuid4())
        config = _make_config()
        job = {"status": "finished", "config": config, "metrics": []}

        report_path = generate_html_report(job_id, job, tmp_path)
        assert report_path.exists()
        assert report_path.stat().st_size > 0

    def test_artifact_urls_present_in_html(self, tmp_path: Path) -> None:
        """Rendered HTML should contain artifact download URLs."""
        job_id = str(uuid.uuid4())
        config = _make_config()
        metrics = _make_metrics(1)
        job = {"status": "finished", "config": config, "metrics": metrics}

        report_path = generate_html_report(job_id, job, tmp_path)
        html = report_path.read_text(encoding="utf-8")
        # The template renders artifact_urls for download links.
        assert f"/reports/{job_id}/config.json" in html
        assert f"/reports/{job_id}/metrics.json" in html


# ---------------------------------------------------------------------------
# Test 2 – Comparison report template rendering
# ---------------------------------------------------------------------------


class TestComparisonReportRendering:
    """generate_comparison_report should succeed with seeded job data."""

    def test_renders_with_two_jobs(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        job_ids = []
        for i in range(2):
            jid = str(uuid.uuid4())
            config = _make_config(name=f"exp_{i}")
            metrics = _make_metrics(2)
            _seed_job_dir(tmp_path / jid, config, metrics)
            job_ids.append(jid)

        monkeypatch.setattr(
            "fedguardlab.reporting.comparison.JOBS_DIR", tmp_path
        )
        comp_dir = tmp_path / "comparisons"
        monkeypatch.setattr(
            "fedguardlab.reporting.comparison.COMPARISONS_DIR", comp_dir
        )

        output_path = generate_comparison_report(
            job_ids=job_ids, title="Regression Test Comparison"
        )
        assert output_path.exists()
        html = output_path.read_text(encoding="utf-8")
        assert "exp_0" in html
        assert "exp_1" in html

    def test_renders_with_single_job(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Single-job comparison should still render."""
        jid = str(uuid.uuid4())
        config = _make_config()
        metrics = _make_metrics(1)
        _seed_job_dir(tmp_path / jid, config, metrics)

        monkeypatch.setattr(
            "fedguardlab.reporting.comparison.JOBS_DIR", tmp_path
        )
        comp_dir = tmp_path / "comparisons"
        monkeypatch.setattr(
            "fedguardlab.reporting.comparison.COMPARISONS_DIR", comp_dir
        )

        output_path = generate_comparison_report(job_ids=[jid])
        assert output_path.exists()
        assert output_path.stat().st_size > 0


# ---------------------------------------------------------------------------
# Test 3 – Job artifact file generation
# ---------------------------------------------------------------------------


class TestJobArtifactFiles:
    """After report generation all expected artifact files should exist."""

    def test_all_artifacts_generated(self, tmp_path: Path) -> None:
        job_id = str(uuid.uuid4())
        config = _make_config()
        metrics = _make_metrics(2)
        job = {"status": "finished", "config": config, "metrics": metrics}

        # Write config.json and metrics.json (mimics save_job_results).
        (tmp_path / "config.json").write_text(
            json.dumps(config, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        (tmp_path / "metrics.json").write_text(
            json.dumps(metrics, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

        generate_html_report(job_id, job, tmp_path)

        for filename in (
            "config.json",
            "metrics.json",
            "metrics.csv",
            "report.md",
            "report.html",
        ):
            path = tmp_path / filename
            assert path.exists(), f"{filename} should exist"
            assert path.stat().st_size > 0, f"{filename} should be non-empty"

    def test_metrics_csv_has_rows(self, tmp_path: Path) -> None:
        config = _make_config()
        metrics = _make_metrics(3)
        job = {"status": "finished", "config": config, "metrics": metrics}

        generate_html_report(str(uuid.uuid4()), job, tmp_path)

        csv_path = tmp_path / "metrics.csv"
        reader = csv.reader(csv_path.open(encoding="utf-8"))
        rows = list(reader)
        assert len(rows) == 4  # header + 3 data rows

    def test_report_md_has_experiment_name(self, tmp_path: Path) -> None:
        config = _make_config(name="md_test_experiment")
        metrics = _make_metrics(2)
        job = {"status": "finished", "config": config, "metrics": metrics}

        generate_html_report(str(uuid.uuid4()), job, tmp_path)

        md_path = tmp_path / "report.md"
        content = md_path.read_text(encoding="utf-8")
        assert "md_test_experiment" in content


# ---------------------------------------------------------------------------
# Test 4 – Comparison artifact file generation
# ---------------------------------------------------------------------------


class TestComparisonArtifactFiles:
    """Comparison report generation should produce all expected files."""

    def _generate(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, n: int = 2
    ) -> tuple[Path, list[str]]:
        job_ids = []
        for i in range(n):
            jid = str(uuid.uuid4())
            config = _make_config(name=f"comp_{i}")
            metrics = _make_metrics(2)
            _seed_job_dir(tmp_path / jid, config, metrics)
            job_ids.append(jid)

        monkeypatch.setattr(
            "fedguardlab.reporting.comparison.JOBS_DIR", tmp_path
        )
        comp_dir = tmp_path / "comparisons"
        monkeypatch.setattr(
            "fedguardlab.reporting.comparison.COMPARISONS_DIR", comp_dir
        )

        output_path = generate_comparison_report(
            job_ids=job_ids, title="Artifact Test"
        )
        return output_path, job_ids

    def test_comparison_files_generated(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        output_path, _ = self._generate(tmp_path, monkeypatch)
        comp_dir = output_path.parent

        for filename in ("comparison.html", "comparison.csv", "comparison.json"):
            path = comp_dir / filename
            assert path.exists(), f"{filename} should exist"
            assert path.stat().st_size > 0, f"{filename} should be non-empty"

    def test_comparison_json_has_experiment_fields(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        output_path, job_ids = self._generate(tmp_path, monkeypatch)

        meta = json.loads(
            (output_path.parent / "comparison.json").read_text(encoding="utf-8")
        )
        assert meta["title"] == "Artifact Test"
        assert len(meta["experiments"]) == len(job_ids)

        for exp in meta["experiments"]:
            assert "aggregation" in exp
            assert "defense" in exp
            assert "attack" in exp
            assert "final_accuracy" in exp
            assert "final_loss" in exp
            assert "final_asr" in exp

    def test_comparison_csv_has_rows(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        output_path, _ = self._generate(tmp_path, monkeypatch, n=3)

        csv_path = output_path.parent / "comparison.csv"
        reader = csv.reader(csv_path.open(encoding="utf-8"))
        rows = list(reader)
        assert len(rows) == 4  # header + 3 data rows


# ---------------------------------------------------------------------------
# Test 5 – JobStore persistence across simulated restarts
# ---------------------------------------------------------------------------


class TestJobStorePersistence:
    """JobStore should survive a simulated backend restart."""

    def test_summary_fields_survive_restart(self, tmp_path: Path) -> None:
        index_path = tmp_path / "index.json"

        config = _make_config(
            aggregation="median", defense="krum", attack="label_flipping"
        )
        metrics = _make_metrics(3)

        store1 = JobStore(storage_path=index_path)
        job_id = str(uuid.uuid4())
        store1.create(
            JobRecord(
                job_id=job_id,
                config_path="configs/test.yaml",
                config=config,
                status="finished",
                metrics=metrics,
                has_report=True,
                artifacts={"config_json": "path/to/config.json"},
            )
        )

        # Simulate restart: create a new store from the same file.
        store2 = JobStore(storage_path=index_path)
        job = store2.get(job_id)

        assert job is not None
        assert job.status == "finished"
        assert job.has_report is True
        assert job.config["federated"]["aggregation"] == "median"
        assert job.config["defense"]["type"] == "krum"
        assert job.config["attack"]["type"] == "label_flipping"
        assert len(job.metrics) == 3
        assert job.metrics[-1]["accuracy"] == pytest.approx(0.8)
        assert job.artifacts["config_json"] == "path/to/config.json"

    def test_multiple_jobs_survive_restart(self, tmp_path: Path) -> None:
        index_path = tmp_path / "index.json"

        store1 = JobStore(storage_path=index_path)
        ids = []
        for i in range(3):
            jid = str(uuid.uuid4())
            store1.create(
                JobRecord(
                    job_id=jid,
                    config_path=f"configs/test_{i}.yaml",
                    config=_make_config(name=f"job_{i}"),
                    status="finished",
                    metrics=_make_metrics(i + 1),
                )
            )
            ids.append(jid)

        store2 = JobStore(storage_path=index_path)
        assert len(store2.list()) == 3
        for jid in ids:
            assert store2.get(jid) is not None

    def test_has_report_and_artifacts_persisted(self, tmp_path: Path) -> None:
        index_path = tmp_path / "index.json"

        store = JobStore(storage_path=index_path)
        jid = str(uuid.uuid4())
        store.create(
            JobRecord(
                job_id=jid,
                config_path="configs/test.yaml",
                config=_make_config(),
                status="finished",
                metrics=_make_metrics(1),
            )
        )

        artifacts = {
            "config_json": f"reports/jobs/{jid}/config.json",
            "metrics_json": f"reports/jobs/{jid}/metrics.json",
        }
        store.set_artifacts(jid, has_report=True, artifacts=artifacts)

        # Reload.
        store2 = JobStore(storage_path=index_path)
        job = store2.get(jid)
        assert job.has_report is True
        assert job.artifacts["config_json"] == f"reports/jobs/{jid}/config.json"


# ---------------------------------------------------------------------------
# Test 6 – Summary field derivation
# ---------------------------------------------------------------------------


class TestSummaryFieldComputation:
    """Summary fields should be derivable from persisted config and metrics."""

    def test_summary_fields_from_config_and_metrics(
        self, tmp_path: Path
    ) -> None:
        config = _make_config(
            aggregation="trimmed_mean",
            defense="median",
            attack="backdoor",
        )
        metrics = _make_metrics(3)

        index_path = tmp_path / "index.json"
        store = JobStore(storage_path=index_path)
        jid = str(uuid.uuid4())
        store.create(
            JobRecord(
                job_id=jid,
                config_path="configs/test.yaml",
                config=config,
                status="finished",
                metrics=metrics,
                has_report=True,
                artifacts={"config_json": "path"},
            )
        )

        job = store.get(jid)

        # Config-derived fields.
        assert job.config.get("federated", {}).get("aggregation") == "trimmed_mean"
        assert job.config.get("defense", {}).get("type") == "median"
        assert job.config.get("attack", {}).get("type") == "backdoor"

        # Metric-derived fields.
        final = job.metrics[-1]
        assert final.get("accuracy") == pytest.approx(0.8)
        assert final.get("loss") == pytest.approx(0.7)
        assert final.get("attack_success_rate") == pytest.approx(0.15)

        # Artifact flag.
        assert job.has_report is True

    def test_load_job_summary_from_disk(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """load_job_summary should read seeded files and return expected keys."""
        jid = str(uuid.uuid4())
        config = _make_config(
            aggregation="krum", defense="krum", attack="backdoor"
        )
        metrics = _make_metrics(2)
        _seed_job_dir(tmp_path / jid, config, metrics)

        monkeypatch.setattr(
            "fedguardlab.reporting.comparison.JOBS_DIR", tmp_path
        )

        summary = load_job_summary(jid)

        assert summary["job_id"] == jid
        assert summary["experiment_name"] == "test_experiment"
        assert summary["aggregation"] == "krum"
        assert summary["defense"] == "krum"
        assert summary["attack"] == "backdoor"
        assert summary["final_accuracy"] == pytest.approx(0.7)
        assert summary["final_loss"] == pytest.approx(0.8)
        assert summary["final_asr"] == pytest.approx(0.2)


# ---------------------------------------------------------------------------
# Test 7 – Job event timeline
# ---------------------------------------------------------------------------


class TestJobEventTimeline:
    """JobStore events should persist and cover the full lifecycle."""

    def test_finished_job_has_lifecycle_events(self, tmp_path: Path) -> None:
        index_path = tmp_path / "index.json"
        store = JobStore(storage_path=index_path)
        jid = str(uuid.uuid4())

        store.create(
            JobRecord(
                job_id=jid,
                config_path="configs/test.yaml",
                config=_make_config(),
            )
        )
        store.add_event(jid, {"type": "created", "message": "Job created"})
        store.add_event(jid, {"type": "started", "message": "Job started"})
        store.add_event(
            jid,
            {
                "type": "round_progress",
                "message": "Round 1/2",
                "round": 1,
                "total_rounds": 2,
                "metrics": {"accuracy": 0.6, "loss": 0.9, "attack_success_rate": 0.25},
            },
        )
        store.add_event(
            jid,
            {"type": "artifact_written", "message": "Artifacts saved"},
        )
        store.add_event(
            jid, {"type": "finished", "message": "Job finished successfully"}
        )
        store.set_status(jid, "finished")

        # Reload from disk.
        store2 = JobStore(storage_path=index_path)
        job = store2.get(jid)

        assert job is not None
        assert len(job.events) == 5
        types = [e["type"] for e in job.events]
        assert types == [
            "created",
            "started",
            "round_progress",
            "artifact_written",
            "finished",
        ]

    def test_failed_job_has_failed_event(self, tmp_path: Path) -> None:
        index_path = tmp_path / "index.json"
        store = JobStore(storage_path=index_path)
        jid = str(uuid.uuid4())

        store.create(
            JobRecord(
                job_id=jid,
                config_path="configs/test.yaml",
                config=_make_config(),
            )
        )
        store.add_event(jid, {"type": "created", "message": "Job created"})
        store.add_event(jid, {"type": "started", "message": "Job started"})
        store.add_event(
            jid,
            {
                "type": "failed",
                "message": "Job failed",
                "details": {
                    "error": "CUDA out of memory",
                    "traceback_summary": "RuntimeError: CUDA out of memory",
                },
            },
        )
        store.set_status(jid, "failed", error="CUDA out of memory")

        store2 = JobStore(storage_path=index_path)
        job = store2.get(jid)

        assert job is not None
        assert job.status == "failed"
        failed_events = [e for e in job.events if e["type"] == "failed"]
        assert len(failed_events) == 1
        assert failed_events[0]["details"]["error"] == "CUDA out of memory"
        assert "traceback_summary" in failed_events[0]["details"]

    def test_cancelled_job_has_cancelled_event(self, tmp_path: Path) -> None:
        index_path = tmp_path / "index.json"
        store = JobStore(storage_path=index_path)
        jid = str(uuid.uuid4())

        store.create(
            JobRecord(
                job_id=jid,
                config_path="configs/test.yaml",
                config=_make_config(),
            )
        )
        store.add_event(jid, {"type": "created", "message": "Job created"})
        store.add_event(jid, {"type": "started", "message": "Job started"})
        store.add_event(
            jid, {"type": "cancelled", "message": "Job cancelled"}
        )
        store.set_status(jid, "cancelled")

        store2 = JobStore(storage_path=index_path)
        job = store2.get(jid)

        assert job is not None
        assert job.status == "cancelled"
        cancelled_events = [e for e in job.events if e["type"] == "cancelled"]
        assert len(cancelled_events) == 1

    def test_events_persist_across_restart(self, tmp_path: Path) -> None:
        index_path = tmp_path / "index.json"
        store1 = JobStore(storage_path=index_path)
        jid = str(uuid.uuid4())

        store1.create(
            JobRecord(
                job_id=jid,
                config_path="configs/test.yaml",
                config=_make_config(),
            )
        )
        store1.add_event(jid, {"type": "created", "message": "Job created"})
        store1.add_event(jid, {"type": "started", "message": "Job started"})

        # Simulate restart.
        store2 = JobStore(storage_path=index_path)
        job = store2.get(jid)

        assert job is not None
        assert len(job.events) == 2
        assert job.events[0]["type"] == "created"
        assert job.events[1]["type"] == "started"

    def test_round_progress_event_has_metrics(self, tmp_path: Path) -> None:
        index_path = tmp_path / "index.json"
        store = JobStore(storage_path=index_path)
        jid = str(uuid.uuid4())

        store.create(
            JobRecord(
                job_id=jid,
                config_path="configs/test.yaml",
                config=_make_config(),
            )
        )
        store.add_event(
            jid,
            {
                "type": "round_progress",
                "message": "Round 1/5",
                "round": 1,
                "total_rounds": 5,
                "metrics": {
                    "accuracy": 0.55,
                    "loss": 1.2,
                    "attack_success_rate": 0.7,
                },
            },
        )

        job = store.get(jid)
        assert job is not None
        rp = job.events[0]
        assert rp["type"] == "round_progress"
        assert rp["round"] == 1
        assert rp["total_rounds"] == 5
        assert rp["metrics"]["accuracy"] == pytest.approx(0.55)
        assert rp["metrics"]["loss"] == pytest.approx(1.2)
        assert rp["metrics"]["attack_success_rate"] == pytest.approx(0.7)


# ---------------------------------------------------------------------------
# Test 8 – Comparison insights
# ---------------------------------------------------------------------------


class TestComparisonInsights:
    """compute_comparison_insights should derive correct highlights."""

    def _make_experiments(self) -> list[dict]:
        return [
            {
                "job_id": "aaa",
                "experiment_name": "exp_fedavg",
                "aggregation": "fedavg",
                "defense": "none",
                "attack": "label_flipping",
                "final_accuracy": 0.90,
                "final_loss": 0.25,
                "final_asr": 0.40,
            },
            {
                "job_id": "bbb",
                "experiment_name": "exp_median",
                "aggregation": "median",
                "defense": "median",
                "attack": "label_flipping",
                "final_accuracy": 0.88,
                "final_loss": 0.18,
                "final_asr": 0.12,
            },
            {
                "job_id": "ccc",
                "experiment_name": "exp_krum",
                "aggregation": "krum",
                "defense": "krum",
                "attack": "label_flipping",
                "final_accuracy": 0.85,
                "final_loss": 0.30,
                "final_asr": 0.08,
            },
        ]

    def test_best_accuracy(self) -> None:
        experiments = self._make_experiments()
        insights = compute_comparison_insights(experiments, lang="en")
        assert insights["best_accuracy"]["job_id"] == "aaa"
        assert insights["best_accuracy"]["value"] == pytest.approx(0.90)

    def test_lowest_loss(self) -> None:
        experiments = self._make_experiments()
        insights = compute_comparison_insights(experiments, lang="en")
        assert insights["lowest_loss"]["job_id"] == "bbb"
        assert insights["lowest_loss"]["value"] == pytest.approx(0.18)

    def test_lowest_asr(self) -> None:
        experiments = self._make_experiments()
        insights = compute_comparison_insights(experiments, lang="en")
        assert insights["lowest_asr"]["job_id"] == "ccc"
        assert insights["lowest_asr"]["value"] == pytest.approx(0.08)

    def test_winner_identified(self) -> None:
        experiments = self._make_experiments()
        insights = compute_comparison_insights(experiments, lang="en")
        assert insights["winner"] is not None
        assert insights["winner"]["job_id"] == "aaa"
        assert "Highest accuracy" in insights["winner_reason"]

    def test_tradeoff_summary(self) -> None:
        experiments = self._make_experiments()
        insights = compute_comparison_insights(experiments, lang="en")
        assert "highest accuracy" in insights["tradeoff_summary"].lower() or \
               "lowest loss" in insights["tradeoff_summary"].lower()

    def test_risk_hint_high_asr(self) -> None:
        experiments = self._make_experiments()
        # exp_fedavg has ASR 0.40, not > 0.5, so no risk hint
        insights = compute_comparison_insights(experiments, lang="en")
        # None of the experiments have ASR > 0.5
        assert insights["risk_hint"] == ""

    def test_risk_hint_triggered(self) -> None:
        experiments = self._make_experiments()
        experiments[0]["final_asr"] = 0.75  # High ASR
        insights = compute_comparison_insights(experiments, lang="en")
        assert "exp_fedavg" in insights["risk_hint"]
        assert "high ASR" in insights["risk_hint"]

    def test_zh_labels(self) -> None:
        experiments = self._make_experiments()
        insights = compute_comparison_insights(experiments, lang="zh")
        assert "准确率最高" in insights["winner_reason"]

    def test_single_experiment(self) -> None:
        experiments = [self._make_experiments()[0]]
        insights = compute_comparison_insights(experiments, lang="en")
        assert insights["best_accuracy"]["job_id"] == "aaa"
        assert insights["winner"]["job_id"] == "aaa"
        # Trade-off needs 2+ experiments
        assert insights["tradeoff_summary"] == ""

    def test_empty_experiments(self) -> None:
        insights = compute_comparison_insights([], lang="en")
        assert insights == {}

    def test_missing_asr_all_zero(self) -> None:
        experiments = self._make_experiments()
        for e in experiments:
            e["final_asr"] = 0
        insights = compute_comparison_insights(experiments, lang="en")
        # All ASR are 0, so lowest_asr should be None
        assert insights["lowest_asr"] is None

    def test_insights_in_comparison_json(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Generated comparison.json should include insights."""
        job_ids = []
        for i in range(2):
            jid = str(uuid.uuid4())
            config = _make_config(name=f"insight_{i}")
            metrics = _make_metrics(2)
            _seed_job_dir(tmp_path / jid, config, metrics)
            job_ids.append(jid)

        monkeypatch.setattr(
            "fedguardlab.reporting.comparison.JOBS_DIR", tmp_path
        )
        comp_dir = tmp_path / "comparisons"
        monkeypatch.setattr(
            "fedguardlab.reporting.comparison.COMPARISONS_DIR", comp_dir
        )

        output_path = generate_comparison_report(
            job_ids=job_ids, title="Insight Test", lang="en"
        )
        meta = json.loads(
            (output_path.parent / "comparison.json").read_text(encoding="utf-8")
        )
        assert "insights" in meta
        assert "best_accuracy" in meta["insights"]
        assert "lowest_loss" in meta["insights"]
        assert "winner" in meta["insights"]

    def test_insights_in_comparison_html(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Generated comparison.html should contain insight section."""
        job_ids = []
        for i in range(2):
            jid = str(uuid.uuid4())
            config = _make_config(name=f"html_insight_{i}")
            metrics = _make_metrics(2)
            _seed_job_dir(tmp_path / jid, config, metrics)
            job_ids.append(jid)

        monkeypatch.setattr(
            "fedguardlab.reporting.comparison.JOBS_DIR", tmp_path
        )
        comp_dir = tmp_path / "comparisons"
        monkeypatch.setattr(
            "fedguardlab.reporting.comparison.COMPARISONS_DIR", comp_dir
        )

        output_path = generate_comparison_report(
            job_ids=job_ids, title="HTML Insight Test", lang="en"
        )
        html = output_path.read_text(encoding="utf-8")
        assert "Result Insights" in html
        assert "Best Accuracy" in html
