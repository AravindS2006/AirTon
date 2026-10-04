# Infrastructure and operations work area

No live infrastructure is provisioned. Do not deploy the standard-library demo
API as a clinical service. Cloud service choices, regions and costs remain open.

Before writing deployment IaC, approve identity/authorization, TLS, storage/key
management, device provisioning/revocation, backup/restore, retention, audit,
monitoring, incident response, signed updates and clinician workflow requirements.
Keep test/demo and clinical environments isolated. Use secret references rather
than values in source. Store reviewed architecture and provider cost estimates
here, followed by versioned IaC when a provider has been selected.

Proposed environments: synthetic development; access-controlled bench research;
approved clinical study; separately reviewed released service. Promotion needs
evidence gates, not just a working deployment command.
