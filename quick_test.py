import asyncio
import torch

from fedguardlab.config.loader import load_config
from fedguardlab.core.aggregation import aggregate
from fedguardlab.core.trainer import run_fake_experiment


CONFIGS_TO_LOAD = [
    "configs/label_flip_demo.yaml",
    "configs/mnist_fedavg_demo.yaml",
    "configs/mnist_fedavg_dirichlet_demo.yaml",
    "configs/mnist_fedavg_label_flip_demo.yaml",
    "configs/mnist_median_label_flip_demo.yaml",
    "configs/mnist_trimmed_mean_label_flip_demo.yaml",
    "configs/mnist_krum_label_flip_demo.yaml",
]


def test_config_loading() -> None:
    for config_path in CONFIGS_TO_LOAD:
        config = load_config(config_path)
        assert config.experiment.name
        assert config.federated.num_clients > 0
        assert config.dataset.name


def test_aggregation_methods() -> None:
    client_states = [
        {
            "weight": torch.tensor([1.0, 2.0, 3.0]),
            "bias": torch.tensor([1.0]),
        },
        {
            "weight": torch.tensor([2.0, 3.0, 4.0]),
            "bias": torch.tensor([2.0]),
        },
        {
            "weight": torch.tensor([100.0, 100.0, 100.0]),
            "bias": torch.tensor([100.0]),
        },
        {
            "weight": torch.tensor([3.0, 4.0, 5.0]),
            "bias": torch.tensor([3.0]),
        },
        {
            "weight": torch.tensor([4.0, 5.0, 6.0]),
            "bias": torch.tensor([4.0]),
        },
    ]

    client_sizes = [10, 10, 10, 10, 10]

    for method in ["fedavg", "median", "trimmed_mean"]:
        state = aggregate(
            client_states=client_states,
            client_sizes=client_sizes,
            method=method,
            trim_ratio=0.2,
        )
        assert "weight" in state
        assert "bias" in state

    krum_state = aggregate(
        client_states=client_states,
        client_sizes=client_sizes,
        method="krum",
        num_malicious=1,
    )
    assert "weight" in krum_state
    assert "bias" in krum_state


async def test_simulated_trainer() -> None:
    config = load_config("configs/label_flip_demo.yaml")
    config.experiment.rounds = 2

    metrics = []

    async for metric in run_fake_experiment(config):
        metrics.append(metric)

    assert len(metrics) == 2
    assert "accuracy" in metrics[-1]
    assert "attack_success_rate" in metrics[-1]


async def main() -> None:
    print("[RUN] config loading")
    test_config_loading()
    print("[OK] config loading")

    print("[RUN] aggregation methods")
    test_aggregation_methods()
    print("[OK] aggregation methods")

    print("[RUN] simulated trainer")
    await test_simulated_trainer()
    print("[OK] simulated trainer")

    print("All quick tests passed.")


if __name__ == "__main__":
    asyncio.run(main())
