# Codex Session Reference Skills

Purpose: concise reference for the repo-scoped skills that turn Codex conversation context into durable docs under `docs/codex/reference/`.

## Skills added

- `.agents/skills/codex-session-reference/SKILL.md` summarizes one Codex session or session log into a compact context reference.
- `.agents/skills/codex-latest-response-reference/SKILL.md` turns the latest completed assistant response in the current session into a fuller standalone reference document.

## Shared output convention

- Store generated documents under `docs/codex/reference/`.
- Choose filenames from document content, not from time.
- Use lowercase kebab-case names that are easy for Codex to index.
- Do not include dates, timestamps, random IDs, or generic names like `session-summary.md` or `latest-response.md`.
- Prefer updating an existing same-topic reference over creating duplicates.

## Difference from daily history index

- `codex-history-index` remains for compact daily work history under `docs/codex/history/YYYY-MM-DD-context-index.md`.
- `codex-session-reference` is for one session or workstream and writes a topic-named reference file.
- `codex-latest-response-reference` is for preserving the latest response as a full standalone document.

## Repo guardrails to preserve

- Required MVP deliverables remain prioritized before recommended enhancements.
- Deterministic evaluation, stable non-PII rollout keys, and fail-closed defaults must stay visible in relevant references.
- Mutations should preserve append-only audit logging and transaction boundaries.
- Control-plane management concerns should remain separate from data-plane evaluation concerns.
