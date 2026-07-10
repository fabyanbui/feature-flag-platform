# Phase 10 Recommended Test Coverage Map

## Purpose

This document maps Phase 10 evaluation-contract requirements to automated test
evidence.

## Authoritative Precedence

```text
FLAG_ARCHIVED
-> FLAG_DISABLED
-> GROUP_KILL_SWITCH (Phase 12)
-> KILL_SWITCH
-> GLOBAL_ON
-> ordered enabled rules
-> DEFAULT_OFF
```

`GROUP_KILL_SWITCH` is reserved for Phase 12 and is not currently exposed by
the backend contract.

## Coverage

| Requirement | Test evidence |
| --- | --- |
| Archived outranks disabled | `returns FLAG_ARCHIVED before FLAG_DISABLED` |
| Disabled outranks kill switch | `returns FLAG_DISABLED before KILL_SWITCH` |
| Kill switch outranks global on | `returns KILL_SWITCH before GLOBAL_ON` |
| Rule-type precedence | `uses type precedence before priority across different rule types` |
| Same-type priority | `uses lower priority first within the same rule type` |
| Multiple allowlist rules | `continues to the next user allowlist rule when an earlier rule does not match` |
| Multiple percentage rules | `continues to a later percentage rule when an earlier rule does not match` |
| Disabled rules ignored | `ignores a disabled matching rule and uses the next enabled rule` |
| Percentage boundaries | `evaluates $targetingKey correctly at $percentage percent` |
| Stable hash fixtures | `returns the expected bucket for %s` |
| Stable complete result | `returns the same complete result for repeated evaluations of $targetingKey` |
| Missing targeting key | `returns INVALID_CONTEXT when percentage rule is reached without targetingKey` |
| Disabled percentage context | `ignores a disabled percentage rule when targetingKey is missing` |
| Earlier rule avoids percentage context | `does not require targetingKey when a user allowlist rule matches first` |
| Whitespace targeting key | `returns INVALID_CONTEXT for a whitespace-only targetingKey` |
| Repository failure | `returns safe ERROR result when repository throws` |
| Engine-path failure | `returns safe ERROR result when evaluation engine processing throws` |

## Phase Gate

Phase 10 passes when:

- focused evaluation tests pass,
- the complete backend unit suite passes,
- the backend builds successfully,
- documentation matches the tested precedence,
- no `GROUP_KILL_SWITCH` reason is exposed before Phase 12,
- `git diff --check` reports no errors.
