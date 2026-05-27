import asyncio
import random
from typing import AsyncGenerator, Dict, Any

from fedguardlab.config.schema import FedGuardConfig


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
        }
