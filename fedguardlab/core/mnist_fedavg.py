import asyncio
import copy
import random
from typing import Any, AsyncGenerator, Dict, List

import numpy as np
import torch
from torch import nn
from torch.optim import SGD

from fedguardlab.config.schema import FedGuardConfig
from fedguardlab.core.aggregation import aggregate
from fedguardlab.core.attacks.backdoor import (
    add_trigger_to_batch,
    apply_backdoor_to_clients,
)
from fedguardlab.core.attacks.label_flipping import apply_label_flipping_to_clients
from fedguardlab.core.data import (
    create_dataloaders,
    load_mnist_datasets,
    partition_dataset,
    summarize_client_labels,
)
from fedguardlab.core.models import SimpleCNN


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


def train_one_client(
    model: nn.Module,
    train_loader,
    device: torch.device,
    local_epochs: int,
    learning_rate: float,
) -> Dict[str, torch.Tensor]:
    model.train()
    optimizer = SGD(model.parameters(), lr=learning_rate)
    criterion = nn.CrossEntropyLoss()

    for _ in range(local_epochs):
        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            logits = model(images)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()

    return copy.deepcopy(model.state_dict())


def evaluate(
    model: nn.Module,
    test_loader,
    device: torch.device,
    attack_type: str = "none",
    source_label: int | None = None,
    target_label: int | None = None,
) -> Dict[str, float]:
    model.eval()
    criterion = nn.CrossEntropyLoss(reduction="sum")

    total_loss = 0.0
    correct = 0
    total = 0

    attack_source_total = 0
    attack_target_predictions = 0

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            labels = labels.to(device)

            logits = model(images)
            loss = criterion(logits, labels)

            total_loss += loss.item()
            predictions = logits.argmax(dim=1)
            correct += (predictions == labels).sum().item()
            total += labels.size(0)

            if (
                attack_type == "label_flipping"
                and source_label is not None
                and target_label is not None
            ):
                source_mask = labels == source_label
                attack_source_total += source_mask.sum().item()
                attack_target_predictions += (
                    predictions[source_mask] == target_label
                ).sum().item()

    result = {
        "loss": total_loss / total,
        "accuracy": correct / total,
        "attack_success_rate": 0.0,
    }

    if attack_source_total > 0:
        result["attack_success_rate"] = (
            attack_target_predictions / attack_source_total
        )

    return result


def evaluate_backdoor_asr(
    model: nn.Module,
    test_loader,
    target_label: int,
    trigger_size: int,
    trigger_value: float,
    device: torch.device,
) -> float:
    model.eval()

    total = 0
    successful = 0

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            labels = labels.to(device)

            mask = labels != target_label

            if mask.sum().item() == 0:
                continue

            images = images[mask]
            triggered_images = add_trigger_to_batch(
                images=images,
                trigger_size=trigger_size,
                trigger_value=trigger_value,
            )

            outputs = model(triggered_images)
            predictions = outputs.argmax(dim=1)

            successful += (predictions == target_label).sum().item()
            total += labels[mask].numel()

    if total == 0:
        return 0.0

    return successful / total


async def run_mnist_fedavg_experiment(
    config: FedGuardConfig,
) -> AsyncGenerator[Dict[str, Any], None]:
    if config.federated.aggregation.lower() not in {
        "fedavg",
        "median",
        "trimmed_mean",
        "krum",
    }:
        raise ValueError(
            "real MNIST trainer currently supports FedAvg, Median, "
            "Trimmed Mean, and Krum"
        )

    set_seed(config.experiment.seed)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    train_dataset, test_dataset = load_mnist_datasets(
        max_train_samples=config.training.max_train_samples,
        max_test_samples=config.training.max_test_samples,
    )

    client_datasets = partition_dataset(
        dataset=train_dataset,
        num_clients=config.federated.num_clients,
        partition=config.dataset.partition,
        alpha=config.dataset.alpha,
        seed=config.experiment.seed,
    )

    clean_client_label_summary = summarize_client_labels(client_datasets)

    if config.attack.type == "label_flipping":
        if config.attack.source_label is None or config.attack.target_label is None:
            raise ValueError(
                "source_label and target_label are required for label_flipping"
            )

        client_datasets = apply_label_flipping_to_clients(
            client_datasets=client_datasets,
            malicious_clients=config.federated.malicious_clients,
            source_label=config.attack.source_label,
            target_label=config.attack.target_label,
        )

    elif config.attack.type == "backdoor":
        if config.attack.target_label is None:
            raise ValueError("target_label is required for backdoor attack")

        client_datasets = apply_backdoor_to_clients(
            client_datasets=client_datasets,
            malicious_clients=config.federated.malicious_clients,
            target_label=config.attack.target_label,
            poison_fraction=config.attack.poison_fraction,
            trigger_size=config.attack.trigger_size,
            trigger_value=config.attack.trigger_value,
            seed=config.experiment.seed,
        )

    client_label_summary = summarize_client_labels(client_datasets)

    client_loaders, test_loader = create_dataloaders(
        client_datasets=client_datasets,
        test_dataset=test_dataset,
        batch_size=config.training.batch_size,
    )

    global_model = SimpleCNN().to(device)

    for current_round in range(1, config.experiment.rounds + 1):
        await asyncio.sleep(0)

        client_states: List[Dict[str, torch.Tensor]] = []
        client_sizes: List[int] = []

        global_state = copy.deepcopy(global_model.state_dict())

        for client_loader in client_loaders:
            client_model = SimpleCNN().to(device)
            client_model.load_state_dict(global_state)

            client_state = train_one_client(
                model=client_model,
                train_loader=client_loader,
                device=device,
                local_epochs=config.training.local_epochs,
                learning_rate=config.training.learning_rate,
            )

            client_states.append(client_state)
            client_sizes.append(len(client_loader.dataset))

        krum_malicious_clients = (
            config.defense.krum_malicious_clients
            if config.defense.krum_malicious_clients is not None
            else config.federated.malicious_clients
        )

        aggregated_state = aggregate(
            client_states=client_states,
            client_sizes=client_sizes,
            method=config.federated.aggregation,
            trim_ratio=config.defense.trim_ratio,
            num_malicious=krum_malicious_clients,
        )
        global_model.load_state_dict(aggregated_state)

        eval_result = evaluate(
            model=global_model,
            test_loader=test_loader,
            device=device,
            attack_type=config.attack.type,
            source_label=config.attack.source_label,
            target_label=config.attack.target_label,
        )

        attack_success_rate = eval_result["attack_success_rate"]

        if config.attack.type == "backdoor" and config.attack.target_label is not None:
            attack_success_rate = evaluate_backdoor_asr(
                model=global_model,
                test_loader=test_loader,
                target_label=config.attack.target_label,
                trigger_size=config.attack.trigger_size,
                trigger_value=config.attack.trigger_value,
                device=device,
            )

        yield {
            "round": current_round,
            "accuracy": round(eval_result["accuracy"], 4),
            "loss": round(eval_result["loss"], 4),
            "attack_success_rate": round(attack_success_rate, 4),
            "aggregation": config.federated.aggregation,
            "attack": config.attack.type,
            "defense": config.defense.type,
            "trainer": "mnist_fedavg",
            "mode": config.training.mode,
            "dataset": config.dataset.name,
            "partition": config.dataset.partition,
            "num_clients": config.federated.num_clients,
            "malicious_clients": config.federated.malicious_clients,
            "device": str(device),
            "client_label_summary": client_label_summary,
            "clean_client_label_summary": clean_client_label_summary,
        }

        await asyncio.sleep(0)