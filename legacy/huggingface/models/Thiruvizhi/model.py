import torch
import torch.nn as nn

class MyModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(768, 2)  # Example

    def forward(self, x):
        return self.fc(x)

# Load weights
model = MyModel()
model.load_state_dict(torch.load("best_vit_model.pth", map_location="cpu"))
