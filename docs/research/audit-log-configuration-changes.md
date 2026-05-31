# Audit Log for Feature Flag Configuration Changes

## Why this matters
Feature flag configuration is effectively production control. A single toggle or targeting rule change can expose hidden features, alter risk posture, or impact user experience at scale. An audit log for configuration changes provides:

- **Accountability:** Who changed what, when, and why.
- **Traceability:** Reconstruction of historical state for incident analysis and rollbacks.
- **Compliance:** Evidence of change control and least-privilege operations.
- **Operational safety:** Faster root-cause analysis for regressions linked to flag changes.

Security logging guidance emphasizes comprehensive, consistent application logging and audit trails for data modification events, as well as clear ownership of log integrity and storage. NIST’s log management guidance and OWASP’s logging guidance highlight the need for structured, reliable, and centrally managed logs to support security and operational use cases.  

## Scope: what must be logged
Audit logs should capture all **configuration mutations** to the feature-flag control plane, including:

### Flag-level changes
- Create, update, archive, delete, restore.
- Enable/disable changes, default variations.
- Targeting rules, segments, prerequisites, fallbacks.
- Percentage rollouts, gradual ramps, schedule-based rules.
- Flag type changes (boolean → multivariate).

### Environment and project changes
- Environment creation, deletion, or policy updates.
- Permission changes for flag management roles.
- API key creation, rotation, revocation, and scope changes.

### Segment and targeting assets
- Segment create/update/delete.
- Clause or rule changes inside segments.
- Shared targeting templates or rule libraries.

### Governance workflows
- Approval requests, approvals, rejections.
- Emergency overrides and break-glass access.
- Rollback or restore actions, including revert-to-previous-version.

### Configuration import/export
- Bulk imports, exports, or migrations.
- Changes applied by automation or CI/CD pipelines.

## Minimum event schema (fields)
Audit logs should be structured and queryable. A high-fidelity event schema typically includes:

- **event_id:** Unique immutable identifier.
- **timestamp:** ISO 8601 with timezone; include monotonic sequence if possible.
- **actor:** user ID, service account, or API token; include role at time of change.
- **actor_type:** human, service, system.
- **action:** create/update/delete/enable/disable/approve/rollback.
- **resource_type:** flag, environment, segment, rule, project, API key.
- **resource_id / key:** stable identifier and human-readable key.
- **environment_id:** prod/staging/dev scope where applicable.
- **request_context:** IP, user agent, source app, request ID, correlation ID.
- **change_reason:** freeform justification or linked ticket.
- **before / after:** full snapshot or structural diff (JSON).
- **version:** revision number for resource; ensures consistent reconstruction.
- **status:** success/failure + error details if failed.

## Diff strategy: snapshot vs structural diff
Two common patterns:

1. **Full snapshot** (before and after):
   - Pros: Simplest to reconstruct past state; robust for troubleshooting.
   - Cons: Larger storage footprint.
2. **Structural diff** (JSON Patch or field-level diffs):
   - Pros: Smaller, clear intent.
   - Cons: Harder to reconstruct without replay logic.

**Recommendation:** Store both a compact diff and a normalized full snapshot (at least for critical entities like flags and environments). This enables efficient UI display while keeping reconstruction reliable.

## Storage, integrity, and retention
Audit logs must be durable and tamper-evident:

- **Append-only storage:** Use write-only append logs; avoid edits in place.
- **Immutability:** Restrict delete/update; require elevated privileges for retention changes.
- **Cryptographic integrity:** Consider hash chaining or signing for non-repudiation.
- **Separation of duties:** Logging service should have separate credentials from admin UI.
- **Retention policy:** Define retention per compliance needs (e.g., 1–7 years).
- **Exportability:** Allow export to SIEM or data lake (CEF/JSON/JSONL).

NIST log management guidance stresses centralized and controlled logging with processes to preserve integrity and support investigations. OWASP logging guidance highlights that audit trails should be designed for security and operational use cases, and that log data should be protected and structured for analysis.

## Access control and visibility
Audit logs are sensitive. Access must be restricted:

- **Role-based access:** read-only roles for auditors, security, compliance.
- **Environment scoping:** limit visibility to approved environments.
- **Masked secrets:** do not log plaintext API keys or sensitive tokens.
- **Pagination and filtering:** query by time range, actor, resource, environment.

## User experience (UX) expectations
Provide an **audit log UI** with:

- Timeline view for recent changes.
- Filters by flag, actor, environment, and action.
- Diff view with before/after and a clear summary.
- Links to the exact flag state at that revision.
- “Revert” or “restore version” button with a preview.

## Change workflow integration
Audit logs are most valuable when integrated into workflows:

- **Approval gate:** approval events recorded alongside change events.
- **Change reason enforcement:** require a ticket ID for production changes.
- **Automation tagging:** label events applied by CI/CD or scripts.
- **Policy enforcement:** forbid changes outside approved windows, log rejects.

## Reliability and ordering considerations
In distributed systems, ordering matters:

- **Idempotency:** de-duplicate retries using event_id or request_id.
- **Clock skew:** store server-side time, not client time.
- **Ordering:** use monotonic sequence numbers per resource.
- **Atomicity:** ensure audit entry is committed with the change transaction.

## Failure modes to design against
- **Partial writes:** change committed but log not written (or vice versa).
- **Silent bypass:** admin API or automation path not instrumented.
- **Over-logging:** noisy logs without actionable context.
- **Under-logging:** missing changes for segments, API keys, or permissions.

## Example audit event (JSON)
```json
{
  "event_id": "evt_01JAZXQH2W9Z2M3KQ4E5B4K4Q8",
  "timestamp": "2026-05-29T05:32:19.184Z",
  "actor": { "id": "user_1287", "email": "devops@example.com", "role": "prod-admin" },
  "actor_type": "human",
  "action": "update",
  "resource_type": "flag",
  "resource_id": "flag_7f82",
  "resource_key": "new_checkout_flow",
  "environment_id": "prod",
  "request_context": {
    "ip": "203.0.113.8",
    "user_agent": "Mozilla/5.0",
    "request_id": "req_3b4d"
  },
  "change_reason": "INC-4921 mitigate checkout errors",
  "version": 18,
  "before": {
    "enabled": true,
    "rules": [{ "segment": "beta", "rollout": 50 }]
  },
  "after": {
    "enabled": true,
    "rules": [{ "segment": "beta", "rollout": 5 }]
  },
  "status": "success"
}
```

## Engineering checklist
- Instrument every mutation path (UI, API, CLI, automation).
- Persist audit entry in the same transaction as the configuration change.
- Enforce immutable storage with retention and export policies.
- Provide fine-grained filters and reliable diff rendering.
- Link audit events to versions so restore operations are safe and deterministic.

## Sources
- OWASP Logging Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- NIST SP 800-92: Guide to Computer Security Log Management — https://csrc.nist.gov/publications/detail/sp/800-92/final
