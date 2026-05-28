from collections import OrderedDict
from typing import Dict, List

import torch


StateDict = Dict[str, torch.Tensor]


def fedavg(client_states: List[StateDict], client_sizes: List[int]) -> StateDict:
    if len(client_states) == 0:
        raise ValueError("client_states cannot be empty")

    total_size = sum(client_sizes)

    if total_size <= 0:
        raise ValueError("total client size must be positive")

    averaged_state = OrderedDict()

    for key in client_states[0].keys():
        averaged_state[key] = sum(
            client_states[i][key] * (client_sizes[i] / total_size)
            for i in range(len(client_states))
        )

    return averaged_state
