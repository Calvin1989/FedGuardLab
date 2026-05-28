from torch.utils.data import Dataset


class LabelFlippingDataset(Dataset):
    def __init__(
        self,
        dataset: Dataset,
        source_label: int,
        target_label: int,
    ) -> None:
        self.dataset = dataset
        self.source_label = source_label
        self.target_label = target_label

    def __len__(self) -> int:
        return len(self.dataset)

    def __getitem__(self, index: int):
        image, label = self.dataset[index]

        if int(label) == self.source_label:
            label = self.target_label

        return image, label


def apply_label_flipping_to_clients(
    client_datasets: list[Dataset],
    malicious_clients: int,
    source_label: int,
    target_label: int,
) -> list[Dataset]:
    protected_count = max(0, min(malicious_clients, len(client_datasets)))
    poisoned_datasets = []

    for client_id, dataset in enumerate(client_datasets):
        if client_id < protected_count:
            poisoned_datasets.append(
                LabelFlippingDataset(
                    dataset=dataset,
                    source_label=source_label,
                    target_label=target_label,
                )
            )
        else:
            poisoned_datasets.append(dataset)

    return poisoned_datasets
