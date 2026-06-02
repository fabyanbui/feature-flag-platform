---
agent: "agent"
description: "Produce an API endpoint spec template."
---

Output an API endpoint spec in Markdown using this template. Keep placeholders if values are unknown.

## Endpoint
`${input:method:<METHOD>} ${input:path:/v1/<path>}`

## Purpose
${input:purpose:<why this endpoint exists>}

## Request
```json
${input:request:{}}
```

## Response
```json
${input:response:{}}
```

## Validation
- ${input:validation:<rules>}

## Error codes
- NOT_FOUND
- VALIDATION_ERROR
- CONFLICT

## Audit logging
- ${input:audit:<what is logged and when>}

## Sources
- ${input:sources:<docs path(s)>}
