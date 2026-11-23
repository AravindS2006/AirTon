# Notebooks

## Colab runner (current)

[colab/airton_colab_training.ipynb](colab/airton_colab_training.ipynb) is a thin,
output-free runner. It clones the private repository using a Colab Secret
(`GITHUB_TOKEN`, fine-grained and read-only), scrubs the token from the Git
remote, checks out a pinned ref, installs `.[ml,deep,validation]`, runs the
tests and the repository's training scripts, and downloads a results zip. It
contains no model code. Clear all outputs before committing changes to it; the
repository check rejects notebooks with outputs. Do not use Colab for real
patient data without an approved data-protection arrangement.

## Recovered training notebooks

Three archived notebooks contain the actual historical cell source:
airton-ml-2024.ipynb (14cells), airton-glaucoma-deeplearn.ipynb (50cells), and
airton-glaucoma-deeplearn-copy.ipynb (53cells). These names indicate historical
source families; exact creation/modification dates are in the evidence register.

Outputs, attachments, execution counts and provider UI metadata were removed
from these Git copies. Original bytes are preserved under ignored local-private/source.
Original SHA-256 hashes are embedded in archive metadata and the recovery manifest.
The originals contain retinal images and private Drive directory listings.

These are archives, not an instruction to execute. They include Colab shell
commands, dataset downloads, deletion of model output folders, dynamic eval,
unreviewed model loading and known correctness defects. See
[the complete static audit](../recovered-model-audit.md) before reproduction.
No original notebook was executed during repository recovery.
