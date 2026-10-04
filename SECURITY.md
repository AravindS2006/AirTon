# Security and privacy

This version accepts only synthetic records through a local demonstration API.
It is not a clinical service. Report a security issue privately to a designated
team maintainer; no public security contact has yet been supplied. Do not include
real records or working credentials in an issue.

The service binds to loopback, requires an environment-provided bearer token of
at least 32 characters, bounds request size, validates a strict record contract,
and detects conflicting replay. It does not implement production TLS, user roles,
tenant authorization, encrypted storage, clinical consent verification, protected
audit logs, or incident response. These are release requirements, not completed
features. See [the threat model](docs/cloud/security-and-privacy.md).
