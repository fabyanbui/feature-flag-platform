---
name: codex-history-index
description: Use when creating or updating a compact daily Codex session history index for this repo under docs/codex/history, especially from local ~/.codex session logs, so future Codex sessions can quickly recover context without loading raw transcripts.
---

## Goal
Create a short, high-signal context index for a day of Codex work.

Output path:

```text
docs/codex/history/YYYY-MM-DD-context-index.md
```

## Workflow
1. Identify the date to summarize. Default to today in the active session timezone.
2. Read local session logs from:

   ```text
   ~/.codex/sessions/YYYY/MM/DD/*.jsonl
   ```

3. Filter to sessions whose `cwd` is this repo.
4. Summarize outcomes, not transcripts.
5. Write or update the daily context index file.
6. Validate with:

   ```bash
   git diff --check -- docs/codex/history/YYYY-MM-DD-context-index.md
   markdownlint docs/codex/history/YYYY-MM-DD-context-index.md  # if installed
   ```

## File shape
Use these headings, in this order:

```markdown
# Codex Context History — YYYY-MM-DD

Purpose: compact context for future Codex sessions. Use this as an index, not a transcript.

## Read first
## Repo guardrails to keep
## What happened today
## Current observed working tree notes
## Best next prompt for Codex
## Session index, compressed
```

## Include
- Active authority: `AGENTS.md`.
- Durable context files: `docs/codex/`, `.codex/`, `.agents/skills/`.
- Decisions that affect future work.
- Files or directories created, removed, renamed, or made authoritative.
- Tool/MCP setup status only when useful for future work.
- Current filesystem caveats discovered during the summary.
- One reusable prompt for the next Codex session.
- A compressed timeline with only meaningful sessions or workstreams.

## Exclude
- Raw transcripts.
- Long tables of every retry unless they change future behavior.
- Full command outputs.
- Secrets, tokens, `.env` values, personal access tokens, private URLs.
- Repeated failed attempts unless they explain a durable setup rule.
- Speculation not supported by session logs or current filesystem inspection.

## Style
- Keep the file easy for Codex to index: short bullets, stable headings, concrete paths.
- Prefer fewer than 200 lines.
- Use exact paths and command snippets only when they help future work.
- If session history conflicts with the filesystem, trust the filesystem and note the conflict.

## Repo-specific reminders
- Preserve deterministic evaluation.
- Preserve append-only audit logging.
- Preserve safe defaults and fail-closed evaluation.
- Preserve control-plane/data-plane separation.
- Keep `.env.example` aligned with `.env` variable shape using safe placeholders only.
