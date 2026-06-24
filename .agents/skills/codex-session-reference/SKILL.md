---
name: codex-session-reference
description: Use when summarizing one Codex session, a specific Codex session log, or the current Codex conversation into a concise reusable context reference under docs/codex/reference with a content-based filename that has no date or timestamp.
---

# Codex Session Reference

## Goal

Create a compact, high-signal reference document for one Codex session. Use this for a single workstream or conversation, not a daily history index.

Output directory:

```text
docs/codex/reference/
```

## Source selection

1. Prefer an explicit session source from the user, such as a pasted transcript, a session log path, or a described session ID.
2. If no explicit source is provided, use the current conversation visible in context.
3. If the user asks for a local Codex session log, inspect:

   ```text
   ~/.codex/sessions/YYYY/MM/DD/*.jsonl
   ```

   Filter to records whose `cwd` is this repository.
4. Summarize outcomes and reusable context, not raw transcript turns.

## Filename rule

Choose a filename from the document content, not from time.

- Use `docs/codex/reference/<content-slug>.md`.
- Use lowercase kebab-case.
- Include the main topic, artifact, or durable decision so future Codex can index it quickly.
- Do not include dates, timestamps, random IDs, or generic names such as `session-summary.md`.
- Prefer `feature-flag-rollout-evaluation.md` over `2026-06-03-summary.md`.
- If a matching topic file already exists, update or merge it instead of creating a duplicate.
- If two files would collide but are meaningfully different, add a stable content qualifier such as `backend-api`, `admin-dashboard`, `demo-app`, `audit-logging`, or `skill-workflow`.

## File shape

Use these headings unless the session content clearly needs a tighter shape:

```markdown
# <Content Topic> — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a reference, not a transcript.

## Scope

## High-signal outcomes

## Files and artifacts

## Decisions and guardrails

## Validation and caveats

## Best reusable next prompt

## Source notes

```

## Include

- The user intent and final outcome.
- Durable decisions that affect future Codex work.
- Exact repo paths for files created, edited, removed, renamed, or made authoritative.
- Commands only when they help future execution or validation.
- Validation status and known caveats.
- Repo guardrails from `AGENTS.md` when relevant.
- Links to durable docs under `docs/`, `.codex/`, or `.agents/skills/`.
- A reusable next prompt that can continue the work without the raw transcript.

## Exclude

- Raw transcript dumps.
- Long command output.
- Repeated retries unless they establish a durable setup rule.
- Secrets, tokens, `.env` values, private URLs, or PII.
- Unsupported speculation.
- Date-driven narrative unless the date itself is product-relevant.

## Repo reminders

Preserve the project guardrails while summarizing:

- Required MVP deliverables take priority over enhancements.
- Keep deterministic evaluation, stable non-PII rollout keys, and safe defaults.
- Keep append-only audit logging and transaction boundaries visible for mutation work.
- Keep control-plane management concerns separate from data-plane evaluation concerns.
- Keep feature flag status labels distinct from runtime On/Off state.

## Validation

After writing the reference document, run when available:

```bash
git diff --check -- docs/codex/reference/<content-slug>.md
markdownlint docs/codex/reference/<content-slug>.md  # if installed
```
