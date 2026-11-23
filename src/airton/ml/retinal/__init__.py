"""Corrected retinal-image classification research framework (separate workstream).

This is not part of the IOP estimator and makes no pressure or diagnostic claim.
It addresses the defects recorded in ml/recovered-model-audit.md:

  D1 confusion-matrix labels     explicit label mapping drives every report
  D2 train/inference mismatch    one preprocessing spec stored with the checkpoint
  D3 manual-annotation crops     no annotation-dependent crop at inference
  D4 test-set reuse              validation selects; test evaluated once
  D5 no patient grouping         patient-grouped, label-stratified partitions
  D6 ineffective freeze helper   set_backbone_trainable is tested
  D7 sigmoid + cross-entropy     single logit + BCEWithLogitsLoss
  D8 ignored evaluate argument   evaluate() consumes only the loader it is given
  D9 unchecked crop bounds       crop_box clamps to the image
  D10 mixed seeds / patches      one seed; torch deterministic algorithms
  D11 drop_last denominators     metrics count processed samples
  D13 CDR placeholder            no cup-to-disc ratio is computed or implied

Only manifests that pass governance checks are loaded. No dataset is downloaded
and pretrained weights are opt-in.
"""
