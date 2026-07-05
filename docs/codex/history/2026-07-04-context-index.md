# Codex Context History — 2026-07-04

Purpose: compact context for future Codex sessions. Use this as an index, not a transcript.

## Read first

- Active authority: `AGENTS.md`.
- Product and deadline sources:
  - `docs/requirement/requirement-init.md`
  - `docs/requirement/info-init.md`
  - `docs/plan/project-goal.md`
- Roadmap sources:
  - `docs/plan/implementation-roadmap.md` is the protected completed MVP path.
  - `docs/plan/recommended-enhancements-roadmap.md` is the active enhancement
    path and gate source.
- Durable Codex context:
  - `docs/codex/`
  - `.codex/`
  - `.agents/skills/`
- Final release evidence to reuse before presentation/report edits:
  - `docs/release/final-recommended-release-review.md`
  - `docs/release/demo-script.md`
  - `docs/design/software-architecture-document.md`

## Repo guardrails to keep

- Preserve deterministic evaluation and stable non-PII rollout keys.
- Preserve fail-closed defaults and safe evaluation responses.
- Preserve append-only audit logging for control-plane mutations.
- Preserve control-plane/data-plane separation.
- Keep evaluation precedence aligned with `AGENTS.md`:
  archived flag -> disabled config -> group kill switch -> flag kill switch ->
  global on -> ordered enabled rules -> default off.
- Evaluation responses must include `enabled`, `reason`, `projectKey`, and
  `flagKey`; missing project or flag returns `enabled=false` with
  `reason=NOT_FOUND`.
- Recommended phases are already complete through Phase 20 from roadmap and
  release evidence; avoid reopening gated work without failing evidence.
- For report/slides, submission is due July 7, 2026 and presentation is July 9,
  2026. Slides and report remain required artifacts.

## What happened today

- Created the previous daily history index:
  - `docs/codex/history/2026-07-03-context-index.md`
  - Current filesystem evidence shows it is committed as `469be18` on branch
    `chore/demo-optimization-maintenance`.
- Report sibling directory work in `../VDT2026_MiniProject_report`:
  - Removed many unused LaTeX heading labels from the report, then rewrote one
    remaining cross-reference to avoid a required label.
  - Reduced report code listings from roughly 269 blocks / 2200+ lines to a much
    smaller set focused on evaluation contracts, precedence, stable hashing,
    fail-closed handling, constraints, audit, and representative API errors.
  - Ran a broad source-code alignment pass against this repo's actual release:
    `/v1` APIs, Swagger at `/docs`, no environment CRUD controller, rule-set
    replacement behavior, actual reason codes, snapshot cache semantics,
    aggregate statistics, server-resolved demo RBAC, SDK methods, Docker/demo
    evidence, and `FlagGroup` / `FlagGroupConfig` data model notes.
  - Rebuilt the report with `pdflatex`, `biber`, and repeated `pdflatex` until
    the final run completed.
- A later July 5 continuation in a July 4-created session was interrupted while
  starting another report review. Treat it as not part of the July 4 outcome.

## Current observed working tree notes

- Repo status before creating this file: clean working tree on
  `chore/demo-optimization-maintenance`, ahead of origin by 1 commit.
- `docs/codex/history/2026-07-03-context-index.md` is no longer untracked; it is
  present in the July 4 commit.
- `docs/codex/history/2026-07-04-context-index.md` is the new file from this
  summary task.
- Sibling report repo `../VDT2026_MiniProject_report` is dirty with many modified
  `.tex` files plus `main.pdf`; those files are outside this repo.
- Current filesystem inspection of the sibling report found no duplicate labels,
  but did find heading labels still present. If the desired final state is zero
  chapter/section/subsection/subsubsection labels, re-run a fresh label audit and
  trust current files over the earlier session summary.
- Current sibling report code-listing snapshot: 25 `lstlisting` blocks and about
  168 nonblank listing lines.

## Best next prompt for Codex

Use `AGENTS.md` and `docs/codex/history/2026-07-04-context-index.md` as context.
Continue presentation-readiness work without regressing the completed MVP or
recommended Phase 20 baseline. First inspect the current filesystem, especially
`../VDT2026_MiniProject_report`, because July 4 report sessions edited a sibling
repo and current files may differ from earlier session summaries. Validate any
report change with LaTeX build checks and keep source-code claims aligned to the
actual NestJS/Prisma/admin/demo/SDK implementation in this repo.

## Session index, compressed

- `rollout-2026-07-04T15-36-31-019f2c45-addd-7c61-beab-50703b25f00e.jsonl`
  - Cwd: `/home/fabyanbui/drive/feature-flag-platform`.
  - Workstream: `codex-history-index` for July 3.
  - Outcome: wrote `docs/codex/history/2026-07-03-context-index.md`, validated
    whitespace, noted `markdownlint` unavailable, and reported the new file.
- `rollout-2026-07-04T15-36-54-019f2c46-0476-7262-b716-18312f03bcb2.jsonl`
  - Cwd: `/home/fabyanbui/drive/feature-flag-platform`; most edits targeted the
    sibling report repo `../VDT2026_MiniProject_report`.
  - 15:41-15:45: removed unused heading labels and rewrote the one referenced
    label occurrence in the report.
  - 15:47-15:50: reduced excessive report code listings and confirmed a LaTeX
    build passed.
  - 22:26-23:48: used release/source evidence to realign report text with the
    implemented platform; rebuilt with `pdflatex`, `biber`, and final `pdflatex`.
  - 2026-07-05 continuation in this same log started but was interrupted and
    should be summarized in the July 5 index if meaningful work continues.
