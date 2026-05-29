import asyncio
import json
import uuid
from pathlib import Path

from fedguardlab.config.loader import load_config
from fedguardlab.core.trainer import run_experiment
from fedguardlab.reporting.comparison import generate_comparison_report
from fedguardlab.reporting.generator import generate_html_report

TEST_OUTPUT_DIR = Path("reports/jobs")
TEST_COMPARISON_DIR = Path("reports/comparisons")


CONFIGS_TO_TEST = [
    "configs/label_flip_demo.yaml",
    "configs/mnist_fedavg_demo.yaml",
    "configs/mnist_fedavg_dirichlet_demo.yaml",
    "configs/mnist_fedavg_label_flip_demo.yaml",
    "configs/mnist_fedavg_backdoor_demo.yaml",
    "configs/mnist_median_backdoor_demo.yaml",
    "configs/mnist_trimmed_mean_backdoor_demo.yaml",
    "configs/mnist_krum_backdoor_demo.yaml",
    "configs/mnist_median_label_flip_demo.yaml",
    "configs/mnist_trimmed_mean_label_flip_demo.yaml",
    "configs/mnist_krum_label_flip_demo.yaml",
]


def shrink_config(config):
    config.experiment.rounds = 1

    if config.training.mode == "real":
        config.training.max_train_samples = 500
        config.training.max_test_samples = 200
        config.training.local_epochs = 1
        config.training.batch_size = 64

    return config


async def run_config(config_path: str):
    config = load_config(config_path)
    config = shrink_config(config)

    metrics = []

    async for metric in run_experiment(config):
        metrics.append(metric)

    if len(metrics) == 0:
        raise AssertionError(f"No metrics produced for {config_path}")

    final_metric = metrics[-1]

    required_keys = [
        "round",
        "accuracy",
        "loss",
        "attack_success_rate",
        "aggregation",
        "attack",
        "defense",
        "trainer",
    ]

    for key in required_keys:
        if key not in final_metric:
            raise AssertionError(f"Missing key '{key}' in metrics for {config_path}")

    return config, metrics


def save_test_job(config, metrics):
    job_id = f"smoke-{uuid.uuid4()}"
    job_dir = TEST_OUTPUT_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    job = {
        "status": "finished",
        "config": config.model_dump(),
        "metrics": metrics,
    }

    (job_dir / "config.json").write_text(
        json.dumps(job["config"], indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    (job_dir / "metrics.json").write_text(
        json.dumps(metrics, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    report_path = generate_html_report(job_id, job, job_dir)

    if not report_path.exists():
        raise AssertionError(f"Report not generated for job_id={job_id}")

    return job_id


async def main():
    print("Running FedGuardLab smoke tests...")

    generated_job_ids = []

    for config_path in CONFIGS_TO_TEST:
        print(f"[RUN] {config_path}")
        config, metrics = await run_config(config_path)
        job_id = save_test_job(config, metrics)
        generated_job_ids.append(job_id)
        final_metric = metrics[-1]
        print(
            "[OK]",
            config.experiment.name,
            "accuracy=",
            final_metric["accuracy"],
            "asr=",
            final_metric["attack_success_rate"],
        )

    comparison_path = generate_comparison_report(
        job_ids=generated_job_ids[-4:],
        title="Smoke Test Comparison",
    )

    if not comparison_path.exists():
        raise AssertionError("Comparison report was not generated")

    print(f"[OK] comparison report generated: {comparison_path}")
    print("All smoke tests passed.")


if __name__ == "__main__":
    asyncio.run(main())
