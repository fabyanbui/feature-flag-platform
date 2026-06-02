---
agent: "agent"
description: "Produce a decision record template."
---

Output a decision record in Markdown using this template. Keep placeholders if values are unknown.

## Title
${input:title:<short decision title>}

## Context
${input:context:<what prompted this decision>}

## Decision
${input:decision:<what we decided>}

## Alternatives
- ${input:alt1:<alternative 1>}
- ${input:alt2:<alternative 2>}

## Consequences
- ${input:consequences:<impact on architecture/UX/ops>}

## Sources
- ${input:sources:<docs path(s)>}
