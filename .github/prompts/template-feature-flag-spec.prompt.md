---
agent: "agent"
description: "Produce a feature flag spec template."
---

Output a feature flag spec in Markdown using this template. Keep placeholders if values are unknown.

## Flag identity
- Project key: ${input:projectKey:}
- Flag key: ${input:flagKey:}
- Name: ${input:name:}
- Owner: ${input:owner:}
- Status label (Enabled/Disabled/Archived): ${input:status:}

## Default behavior
- Default state (On/Off): ${input:defaultState:}
- Safe fallback: ${input:safeFallback:}

## Rules
- Allowlist: ${input:allowlist:}
- Role targeting: ${input:roles:}
- Percentage rollout: ${input:percentage:}

## Audit expectations
- Changes must be logged with before/after snapshots.

## Sources
- ${input:sources:<docs path(s)>}
