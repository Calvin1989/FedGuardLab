import random
from typing import List

import torch
from torch.utils.data import Dataset


def add_trigger_to_image(
    image: torch.Tensor,
    trigger_size: int = 4,
    trigger_value: float = 2.8,
) -> torch.Tensor:
    triggered_image = image.clone()
    triggered_image[..., -trigger_size:, -trigger_size:] = trigger_value
    return triggered_image


def add_trigger_to_batch(
    images: torch.Tensor,
    trigger_size: int = 4,
    trigger_value: float = 2.8,
) -> torch.Tensor:
    triggered_images = images.clone()
    triggered_images[..., -trigger_size:, -trigger_size:] = trigger_value
    return triggered_images


class BackdoorDataset(Dataset):
    def __init__(
        self,
        dataset: Dataset,
        target_label: int,
        poison_fraction: float = 1.0,
        trigger_size: int = 4,
        trigger_value: float = 2.8,
        seed: int = 42,
    ) -> None:
        if poison_fraction < 0 or poison_fraction > 1:
            raise ValueError("poison_fraction must be in [0, 1]")

        self.dataset = dataset
        self.target_label = target_label
        self.trigger_size = trigger_size
        self.trigger_value = trigger_value

        indices = list(range(len(dataset)))
        random.Random(seed).shuffle(indices)

        poison_count = int(len(indices) * poison_fraction)
        self.poison_indices = set(indices[:poison_count])

    def __len__(self) -> int:
        return len(self.dataset)

    def __getitem__(self, index: int):
        image, label = self.dataset[index]

        if index in self.poison_indices:
            image = add_trigger_to_image(
                image=image,
                trigger_size=self.trigger_size,
                trigger_value=self.trigger_value,
            )
            label = self.target_label

        return image, label


def apply_backdoor_to_clients(
    client_datasets: List[Dataset],
    malicious_clients: int,
    target_label: int,
    poison_fraction: float = 1.0,
    trigger_size: int = 4,
    trigger_value: float = 2.8,
    seed: int = 42,
) -> List[Dataset]:
    poisoned_clients = []

    for client_id, dataset in enumerate(client_datasets):
        if client_id < malicious_clients:
            poisoned_clients.append(
                BackdoorDataset(
                    dataset=dataset,
                    target_label=target_label,
                    poison_fraction=poison_fraction,
                    trigger_size=trigger_size,
                    trigger_value=trigger_value,
                    seed=seed + client_id,
                )
            )
        else:
            poisoned_clients.append(dataset)

    return poisoned_clients
