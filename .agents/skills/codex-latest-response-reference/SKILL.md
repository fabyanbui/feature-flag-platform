---
name: codex-latest-response-reference
description: Use when turning the latest assistant/Codex response in the current session into a full, standalone, reusable reference document under docs/codex/reference with a content-based filename that has no date or timestamp.
---

# Codex Latest Response Reference

## Goal

Turn the latest assistant response from the current session into a full reference document that future Codex sessions can load without needing the chat transcript.

Output directory:

```text
docs/codex/reference/
```

## Scope selection

1. Use the latest completed assistant response immediately before the user request that triggered this skill.
2. If the latest response is ambiguous, use the most recent substantive assistant response, not a short acknowledgement.
3. If the response depends on earlier context, include only the minimal earlier context needed to make the document standalone.
4. Do not summarize the current in-progress answer recursively.

## Filename rule

Choose a filename from the response content, not from time.

- Use `docs/codex/reference/<content-slug>.md`.
- Use lowercase kebab-case.
- Make the slug specific enough for Codex indexing: include the project area, artifact, workflow, or decision.
- Do not include dates, timestamps, random IDs, or generic names such as `latest-response.md`.
- Prefer `codex-session-reference-skill-workflow.md` over `latest-response-full.md`.
- If a matching topic file already exists, update or merge it instead of creating a duplicate.
- If two files would collide but are meaningfully different, add a stable content qualifier such as `implementation`, `review`, `api-design`, `ui-semantics`, or `skill-workflow`.

## File shape

Use these headings unless the response content clearly needs a more specific structure:

```markdown
# <Content Topic> — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response.

## Original request context

## Full response reference

## Key decisions and rationale

## Commands, files, and artifacts

## Validation checklist

## Risks and caveats

## Reuse prompts

```

## Expansion rules

- Preserve the meaning and ordering of the latest response.
- Expand terse bullets into clear reusable guidance when the response implies a workflow.
- Keep code blocks, commands, paths, and schemas accurate.
- Mark inferred context explicitly; do not invent source facts.
- Prefer stable paths and durable project terminology over chat-specific wording.
- Keep the document useful as future context even if the transcript is unavailable.

## Include

- The original user request or a concise paraphrase of it.
- The complete substance of the latest assistant response.
- Important assumptions, decisions, and rationale.
- Exact files, commands, tools, and validation steps mentioned.
- Follow-up prompts that can reuse or continue the work.
- Repo guardrails from `AGENTS.md` when relevant.

## Exclude

- Chat filler, apologies, and progress-only messages.
- Raw hidden chain-of-thought or private reasoning.
- Secrets, tokens, `.env` values, private URLs, or PII.
- Date or timestamp-based naming.
- Claims not supported by the latest response or visible session context.

## Repo reminders

Keep full response references aligned with this feature flag platform:

- Required MVP deliverables come before recommended enhancements.
- Preserve deterministic evaluation and fail-closed defaults.
- Preserve append-only audit logging for mutations.
- Preserve stable, non-PII rollout and targeting keys.
- Preserve control-plane/data-plane separation.

## Validation

After writing the reference document, run when available:

```bash
git diff --check -- docs/codex/reference/<content-slug>.md
markdownlint docs/codex/reference/<content-slug>.md  # if installed
```
