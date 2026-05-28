import asyncio
import random
from typing import AsyncGenerator, Dict, Any

from fedguardlab.config.schema import FedGuardConfig
from fedguardlab.core.mnist_fedavg import run_mnist_fedavg_experiment


async def run_fake_experiment(
    config: FedGuardConfig,
) -> AsyncGenerator[Dict[str, Any], None]:
    rounds = config.experiment.rounds

    accuracy = 0.45
    attack_success_rate = 0.75
    loss = 1.8

    for current_round in range(1, rounds + 1):
        await asyncio.sleep(0.4)

        accuracy += random.uniform(0.01, 0.03)
        accuracy = min(accuracy, 0.95)

        loss -= random.uniform(0.03, 0.08)
        loss = max(loss, 0.15)

        if config.defense.type == "none":
            attack_success_rate += random.uniform(-0.02, 0.02)
        else:
            attack_success_rate -= random.uniform(0.02, 0.06)

        attack_success_rate = max(0.05, min(attack_success_rate, 0.98))

        yield {
            "round": current_round,
            "accuracy": round(accuracy, 4),
            "loss": round(loss, 4),
            "attack_success_rate": round(attack_success_rate, 4),
            "aggregation": config.federated.aggregation,
            "attack": config.attack.type,
            "defense": config.defense.type,
            "trainer": "simulated",
            "mode": config.training.mode,
            "dataset": config.dataset.name,
            "partition": config.dataset.partition,
            "num_clients": config.federated.num_clients,
            "malicious_clients": config.federated.malicious_clients,
            "device": "n/a",
        }


async def run_experiment(
    config: FedGuardConfig,
) -> AsyncGenerator[Dict[str, Any], None]:
    if config.training.mode == "real":
        async for metric in run_mnist_fedavg_experiment(config):
            yield metric
        return

    async for metric in run_fake_experiment(config):
        yield metric
