---
agent: "agent"
description: "Produce a UI screen spec template."
---

Output a UI screen spec in Markdown using this template. Keep placeholders if values are unknown.

## Screen
${input:screen:<name>}

## Purpose
${input:purpose:<what this screen enables>}

## Required data
- ${input:fields:<fields>}

## Actions
- ${input:primary:<primary actions>}
- ${input:secondary:<secondary actions>}

## States
- Loading
- Empty
- Error

## Status semantics
- Status label vs runtime state displayed distinctly

## Accessibility
- Keyboard navigation
- Text-backed status indicators

## Sources
- `docs/requirement/frontend/fe-init.md`
