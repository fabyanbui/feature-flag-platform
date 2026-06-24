# Playwright MCP Local Browser Cache Fix — Codex Session Summary

Purpose: reusable context distilled from one Codex session. Use this as a reference, not a transcript.

## Scope

This session fixed the repository's Playwright MCP setup so Codex can reliably
use browser tools from the project workspace. The user asked to test Playwright
MCP, diagnose why Chromium looked missing even though the file existed locally,
clean unnecessary local Playwright setup artifacts, and add ignore rules for
generated Playwright MCP files.

The work was limited to Codex/MCP local tooling. No product code, backend API,
admin dashboard, demo app, database schema, feature-flag evaluation logic, or
MVP behavior should be inferred as changed by this session.

## High-signal outcomes

- Playwright MCP was initially reachable, but failed to launch Chromium with:

  ```text
  Failed to launch chromium because executable doesn't exist at
  /home/fabyanbui/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome
  ```

- The path existed and was executable from the normal shell:

  ```text
  /home/fabyanbui/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome
  Google Chrome for Testing 149.0.7827.55
  ```

- A direct Playwright launch using that browser succeeded only when run outside
  the Codex command sandbox. Inside the command sandbox, Chromium crashed with a
  crashpad-related Linux permission error. This established that the root issue
  was not a missing Chromium download; it was a mismatch between the Playwright
  MCP runtime/sandbox and browser cache visibility/launch permissions.
- The durable fix was to make Playwright MCP project-scoped and point it at an
  ignored repo-local browser cache:

  ```text
  .playwright-browsers/chromium-1228/chrome-linux64/chrome
  ```

- The project-scoped MCP command in `.codex/config.toml` now:
  - optionally sources `.env` if it exists,
  - defaults `CHROMIUM_BROWSER_PATH` to the repo-local ignored Chromium path,
  - checks the executable exists with `test -x`,
  - starts `@playwright/mcp@latest` with `--headless --no-sandbox --isolated`.
- Codex had to be restarted after changing the MCP config. Playwright MCP
  servers are loaded at session start; the already-running server continued to
  use its old path until restart.
- After restart, Playwright MCP successfully navigated to `https://example.com/`
  and returned page title `Example Domain`.
- Later validation confirmed Playwright MCP still worked after cleaning old home
  directory Playwright caches.

## Files and artifacts

### Repository files intentionally changed

- `.codex/config.toml`
  - Replaced the fragile Playwright MCP setup with a project-scoped command that
    uses `bash -lc`, optional `.env`, and a repo-local Chromium default.
  - Current key command shape:

    ```toml
    [mcp_servers.playwright]
    command = "bash"
    args = [
      "-lc",
      '''test ! -f ./.env || . ./.env \
      && : "${CHROMIUM_BROWSER_PATH:=$PWD/.playwright-browsers/chromium-1228/chrome-linux64/chrome}" \
      && test -x "$CHROMIUM_BROWSER_PATH" \
      && exec npx @playwright/mcp@latest --executable-path "$CHROMIUM_BROWSER_PATH" \
      --headless --no-sandbox --isolated
      '''
    ]
    ```

- `.env.example`
  - Documents `CHROMIUM_BROWSER_PATH` as optional.
  - Notes that `.codex/config.toml` defaults to:

    ```text
    .playwright-browsers/chromium-1228/chrome-linux64/chrome
    ```

- `.gitignore`
  - Adds Playwright MCP local/generated paths:

    ```gitignore
    .playwright-browsers/
    .playwright-mcp/
    ```

### Local-only artifacts intentionally kept

- `.playwright-browsers/`
  - Ignored by Git.
  - Contains the repo-local Chromium runtime currently needed for reliable
    Playwright MCP operation in this environment.
  - Size observed during the session: about `646M`.
  - Do not commit this directory.

### Local-only artifacts intentionally removed

- `~/.cache/ms-playwright`
- `~/.cache/ms-playwright-go`
- `~/.cache/ms-playwright-mcp`

These were leftover or duplicate Playwright runtime/output caches outside the
repo. They were removed after the project-scoped `.playwright-browsers/` setup
was confirmed to work.

### Global Codex config cleanup

- `~/.codex/config.toml`
  - Removed a stale global Playwright MCP block that pointed to:

    ```text
    /usr/bin/chromium-browser
    ```

  - This avoids conflicting global/project MCP definitions. The project-scoped
    `.codex/config.toml` is now the durable source for this repo's Playwright MCP
    setup.

### Temporary changes reverted

During cleanup, Codex briefly misunderstood "refactor the codebase" and edited
the demo app. The user clarified that only Playwright MCP local setup should be
cleaned. The following unintended demo changes were reverted:

- `apps/demo/src/App.tsx`
- `apps/demo/src/demo-config.ts`
- `apps/demo/src/demo-users.ts`
- `apps/demo/src/evaluation-api.ts`

No demo app source changes remain from this session.

## Decisions and guardrails

- Prefer project-scoped MCP configuration for this repository over a global
  Playwright MCP block. This prevents stale browser paths in global config from
  breaking repo work.
- Keep Playwright MCP output and browser runtime local-only:
  - `.playwright-browsers/` is a large local browser cache.
  - `.playwright-mcp/` is generated output/snapshot state from tool calls.
- Do not print or document `.env` secrets. This session only referenced the
  `CHROMIUM_BROWSER_PATH` key and did not expose credentials.
- If Playwright MCP fails after config edits, restart Codex before deeper
  debugging. The running MCP server may still be using old config.
- This MCP tooling work is separate from product guardrails in `AGENTS.md`.
  Future product work must still preserve deterministic evaluation, stable
  non-PII rollout keys, safe defaults, append-only audit logging, and
  control-plane/data-plane separation.

## Validation and caveats

### Validated successfully

- `codex mcp list`
  - Confirmed the active project Playwright MCP command uses the repo-local
    `CHROMIUM_BROWSER_PATH` fallback.
- Playwright MCP actual tool calls:

  ```text
  browser_navigate https://example.com
  ```

  Result:

  ```text
  Page URL: https://example.com/
  Page Title: Example Domain
  ```

- Generated `.playwright-mcp/` snapshot directories were removed after tests.
- Home Playwright cache cleanup was checked:

  ```text
  ~/.cache/ms-playwright absent
  ~/.cache/ms-playwright-go absent
  ~/.cache/ms-playwright-mcp absent
  ```

### Caveats

- `.playwright-browsers/` must remain present locally unless the MCP config is
  changed to use another accessible Chromium executable.
- If the repo is cloned fresh, a future developer must either:
  - recreate `.playwright-browsers/chromium-1228/chrome-linux64/chrome`, or
  - set `CHROMIUM_BROWSER_PATH` in local `.env` to a valid Chromium/Chrome
    executable accessible to the Playwright MCP process.
- The current session observed Git status showing only these intended repo files
  changed:

  ```text
  .codex/config.toml
  .env.example
  .gitignore
  ```

## Best reusable next prompt

```text
Verify the project-scoped Playwright MCP setup for this repo. Use
`codex mcp list` to confirm `.codex/config.toml` points Playwright MCP at the
repo-local `.playwright-browsers/chromium-1228/chrome-linux64/chrome` fallback,
run a `browser_navigate` smoke test against `https://example.com`, and remove
the generated `.playwright-mcp/` snapshot directory afterward. Do not edit app
source code.
```

## Source notes

- Source was the current Codex conversation, not a local session log.
- Relevant durable repo files:
  - `AGENTS.md`
  - `.codex/config.toml`
  - `.env.example`
  - `.gitignore`
  - `docs/codex/mcp-tool-selection.md`
- Relevant skill:
  - `.agents/skills/codex-session-reference/SKILL.md`
