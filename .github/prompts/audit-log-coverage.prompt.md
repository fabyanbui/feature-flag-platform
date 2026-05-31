---
agent: "agent"
description: "Verify audit log coverage for all mutations."
---

List every mutation path for projects, flags, and rules. For each path, confirm an append-only audit entry is written in the same transaction with before and after snapshots and actor metadata. Highlight any missing coverage.
