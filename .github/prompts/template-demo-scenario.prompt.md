---
agent: "agent"
description: "Produce a demo scenario template."
---

Output a demo scenario in Markdown using this template. Keep placeholders if values are unknown.

## Scenario name
${input:name:<name>}

## User context
```json
{
  "userId": "${input:userId:}",
  "roles": ${input:roles:[]},
  "attributes": ${input:attributes:{}}
}
```

## Expected evaluation
```json
{
  "enabled": ${input:enabled:true},
  "reason": "${input:reason:}"
}
```

## UI behavior
- ${input:behavior:<what is shown/hidden>}

## Sources
- `docs/requirement/demo/demo-app.md`
