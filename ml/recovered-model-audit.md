# Recovered AirTon ML audit

This is a static source/output audit, not a rerun or clinical evaluation.
Original notebooks were downloaded without execution. Three source-only versions
are retained in [notebooks](notebooks/README.md). Aggregate result figures are in
artifacts/research. Two public Keras weight files were downloaded to ignored
models/weights and SHA-256 verified; their HDF5 configuration was read without
loading a Keras model or running prediction.

## Experiment lineage

| Experiment | Actual code and data evidence | Recorded result / limit |
|---|---|---|
| Early Keras CNN | AIRTON_ML cells 3-7; 256x256 RGB, two Conv32/pool stages, Dense128, sigmoid; Adam/binary cross-entropy; 30 epochs | Loader logs: 455 training and 64 validation images. Last logged validation accuracy 0.7656, not an independent clinical test |
| Published custom CNN | airton_static/train.py and Airton_streamlit/train.py; 100x100 RGB, Conv64/128/256/512/512, BN, Dense64/128, sigmoid; Adam; 200 epochs configured | my_model2.h5 is present. No attributable train/validation manifest or numerical evaluation recovered |
| VGG19 initial | DeepLearn cell 33; ImageNet pretrained, two output logits, SGD lr0.001, 30 epochs | Lowest-validation-loss checkpoint: epoch16, accuracy62/84=0.738095 |
| ResNet18 | DeepLearn cell39; pretrained, two outputs, SGD lr0.01, decay0.001, 30epochs | Selected epoch7, accuracy62/84=0.738095. Freeze helper re-enables all parameters |
| DenseNet169 custom head | DeepLearn cell42; pretrained, custom dense head ending sigmoid, cross-entropy, SGD lr0.01, decay0.0001, 30epochs | Selected epoch27, recorded accuracy0.738095; logits/loss mismatch needs correction |
| VGG19 custom head | DeepLearn cells44-46; Dense4096/1024/256/64/2 plus sigmoid, SGD lr0.001, 30epochs | Selected epoch2, recorded accuracy0.428571; logits/loss mismatch |
| VGG16 | Cells30 and45 construct/display models | Architecture demonstration; no completed VGG16 training result recovered |
| Thiruvizhi | Later same-author Hub publication | Card claims EfficientNet-B0/ACRIMA/U-Net/Grad-CAM; config/code/weight name disagree. No quantified evaluation recovered |

VGG19 and ResNet18 evaluation cells37/40 output the same0.738095 accuracy as the
selected checkpoints. These are historical notebook outputs, not reproduced
results. No sensitivity, specificity, ROC-AUC or confidence intervals were
originally reported as text for these runs.

## Dataset actually used in the supplied notebook

Cells4-5 name [sshikamaru/glaucoma-detection](https://www.kaggle.com/datasets/sshikamaru/glaucoma-detection).
Cells10-13 load glaucoma.csv and ORIGA image/.mat paths. Recorded counts are
650 images:482 label0 and168 label1. The code's mapping is **0=normal,
1=glaucoma**. The original
[ORIGA publication](https://doi.org/10.1109/IEMBS.2010.5626137) is the provenance
reference; the notebook's Kaggle output declares CC0-1.0, which alone does not
resolve original collection/release rights or commercial suitability.

Cell25 randomly samples168 normal images and retains168 glaucoma images,
then applies an unstratified25% image split. This yields252 training and84
held-out images, inferred from336 selected rows and the code. No participant
grouping, frozen split manifest or independent final test is recorded. The
test_dl set is reused as validation for checkpoint selection and experimentation.
Performance cannot be presented as unbiased final-test performance.

The early455/64 dataset is a separate folder-based cohort with class0/class1
paths. Its image counts and class mapping must not be assumed to match ORIGA,
ACRIMA, or the folder of Drishti image names encountered in Drive. Presence of
a dataset folder is not proof of its use in a particular checkpoint.

## Material errors and reproducibility gaps

1. **Confusion-matrix labels reversed.** Cell36 calls confusion_matrix on the
   numeric labels then sets axes to ['Glaucoma','Normal']. Given the notebook
   mapping, the correct order is ['Normal','Glaucoma']. The archived figures
   preserve the original error; do not use their visible class names directly.
2. **Train/inference mismatch.** Training uses manual optic annotations for
   cropping and MONAI NormalizeIntensityD. The detection cell uses a full image,
   ImageNet means/std and an epoch11 checkpoint path, whereas training selected
   epoch16. Deployment provenance and preprocessing are inconsistent.
3. **Annotation availability.** Manual .mat optic masks are used to locate the
   training crop. The same annotations will not be available on a new patient
   image. A separately evaluated locator is needed before adopting this workflow.
4. **Test-set reuse.** The same held-out images select checkpoints and compare
   architectures. Create a validation set and reserve an independent final test.
5. **Grouping unavailable.** No patient IDs/split hashes are recorded. Both eyes,
   repeats and dataset overlap could cross partitions. Establish provenance
   before claiming patient independence.
6. **Freeze helper ineffective.** Cell38 first freezes early ResNet children,
   then sets requires_grad=True on every child. The recorded run is not the
   described partial-freeze experiment.
7. **Sigmoid with cross-entropy.** Custom DenseNet/VGG heads supply sigmoid
   outputs to CrossEntropyLoss, which expects unnormalized logits. Correct
   the objective/head pairing and retrain; do not repair the historical record.
8. **Evaluation argument ignored.** evaluate_model accepts test_loader but loops
   over global test_dl. This can silently evaluate the wrong partition.
9. **Crop boundaries unchecked.** remove_black_padding uses x-p/y-p directly;
   negative bounds may yield bad crops. Empty contours/images/masks are not
   handled consistently.
10. **MONAI monkey patch and mixed seeds.** The notebook patches random-state
    internals and combines seeds0/123. Pin a compatible environment and use
    supported deterministic APIs.
11. **Training-count denominator.** drop_last=True discards four of252 training
    samples per epoch but accuracy divides by252. Record processed counts.
12. **Early notebook inference defects.** A standalone '+' makes cell10 invalid
    Python; raw image inference omits training's1/255 scaling and compares a
    sigmoid output with exact1. validation_steps=int(30/32) evaluates to0,
    so the source and recorded logs cannot be assumed to reproduce unchanged.
13. **CDR placeholder.** Copy notebook cell52 sets cup_area=disc_area*0.6,
    forcing a ratio0.6 when a contour exists. This is not cup segmentation or
    a measured CDR.

## Correct interpretation of the aggregate matrices

Natural numeric order is0,1. The VGG figure shows [[39,9],[13,23]] and ResNet
[[35,13],[9,27]], each84 samples. Correcting only the axis interpretation gives:

| Model | TN | FP | FN | TP | Sensitivity | Specificity | Accuracy |
|---|---|---|---|---|---|---|---|
| VGG19 selected |39|9|13|23|23/36=63.89%|39/48=81.25%|62/84=73.81%|
| ResNet18 selected |35|13|9|27|27/36=75.00%|35/48=72.92%|62/84=73.81%|

These values are **audit calculations from archived plots**, not original
reported metrics or rerun results. Both sets were used for model selection.
No confidence interval, external validity or clinical sensitivity claim follows.
The machine-readable
[historical results](../models/historical-results.json) retains this distinction.

## Published weight and model-card lineage

my_model2.h5 is74,157,296bytes; provider hash
c4198d700ba8fcedf590e3378ba513357372490338cb6163b1a6441f7d199ca8.
Gmodel.h5 is189,104,112bytes; hash
cdf7c6cf943d71dc04729221210d2711107f0500679e85f01b82e2d69abf9608.
The saved input shapes100px and256px match the respective source families,
but architecture agreement alone does not prove that recovered notebooks
produced those exact weights. No TensorFlow inference was run.

The AIRTON model repository contains only .gitattributes at the recovered
revision, not a usable weight release. Actual files were published in Spaces.

Thiruvizhi's README describes256px EfficientNet-B0, one output, dropout0.3 and
best_glaucoma_model.pth. config.json describes224px, two labels and dropout0.2.
model.py defines only Linear(768,2), loads at import, and names best_vit_model.pth.
The published file is343,650,539bytes and has provider hash
577a62f6fa57a42be0ff40eb185dcd18178880b9a250589af618adf82e4af5ed.
It was not downloaded/deserialized. No release should consume it until the
training code, architecture, preprocessing, label mapping and checkpoint match.

## Next usable ML work

For the first home-monitoring product, prioritize **IOP metrology and acquisition
quality**, using synchronized device signals and independent reference pressure.
Fundus classifiers do not estimate AirTon IOP from an air-puff pressure sensor.
For retinal research, preserve historical code, create rights-reviewed manifests,
fix preprocessing/labels/objectives, establish subject/domain partitions, and
rerun into a new experiment ID with complete lineage and independent evaluation.
Do not overwrite historical outputs to make them appear corrected.
