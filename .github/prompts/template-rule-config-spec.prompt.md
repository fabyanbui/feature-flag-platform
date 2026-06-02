---
agent: "agent"
description: "Produce a rule configuration spec template."
---

Output a rule configuration spec in Markdown using this template. Keep placeholders if values are unknown.

## Flag
${input:flag:<flag key>}

## Rule order
1. Global disable
2. User allowlist
3. Role targeting
4. Percentage rollout
5. Default off

## Rule definitions
- Global: ${input:global:<on/off>}
- Allowlist: ${input:allowlist:<user ids>}
- Role targeting: ${input:roles:<roles>}
- Percentage rollout: ${input:percentage:<percentage>} + ${input:hash:<stable hashing key>}

## Expected reasons
- GLOBAL_ON / GLOBAL_OFF
- USER_ALLOWLIST
- ROLE_MATCH
- PERCENTAGE
- DEFAULT_OFF

## Sources
- `docs/requirement/backend/be-init.md`
- `docs/requirement/demo/minimal-mvp.md`
