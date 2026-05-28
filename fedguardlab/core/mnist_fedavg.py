import copy
import random
from typing import AsyncGenerator, Dict, Any, List

import numpy as np
import torch
from torch import nn
from torch.optim import SGD

from fedguardlab.config.schema import FedGuardConfig
from fedguardlab.core.aggregation import fedavg
from fedguardlab.core.data import create_dataloaders, iid_partition, load_mnist_datasets
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
) -> Dict[str, float]:
    model.eval()
    criterion = nn.CrossEntropyLoss(reduction="sum")

    total_loss = 0.0
    correct = 0
    total = 0

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

    return {
        "loss": total_loss / total,
        "accuracy": correct / total,
    }


async def run_mnist_fedavg_experiment(
    config: FedGuardConfig,
) -> AsyncGenerator[Dict[str, Any], None]:
    if config.federated.aggregation.lower() != "fedavg":
        raise ValueError("real MNIST trainer currently supports only FedAvg")

    if config.dataset.partition.lower() != "iid":
        raise ValueError("real MNIST trainer currently supports only IID partition")

    set_seed(config.experiment.seed)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    train_dataset, test_dataset = load_mnist_datasets(
        max_train_samples=config.training.max_train_samples,
        max_test_samples=config.training.max_test_samples,
    )

    client_datasets = iid_partition(
        dataset=train_dataset,
        num_clients=config.federated.num_clients,
        seed=config.experiment.seed,
    )

    client_loaders, test_loader = create_dataloaders(
        client_datasets=client_datasets,
        test_dataset=test_dataset,
        batch_size=config.training.batch_size,
    )

    global_model = SimpleCNN().to(device)

    for current_round in range(1, config.experiment.rounds + 1):
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

        averaged_state = fedavg(client_states, client_sizes)
        global_model.load_state_dict(averaged_state)

        eval_result = evaluate(global_model, test_loader, device)

        yield {
            "round": current_round,
            "accuracy": round(eval_result["accuracy"], 4),
            "loss": round(eval_result["loss"], 4),
            "attack_success_rate": 0.0,
            "aggregation": config.federated.aggregation,
            "attack": config.attack.type,
            "defense": config.defense.type,
            "trainer": "mnist_fedavg",
            "device": str(device),
        }
