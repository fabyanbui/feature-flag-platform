# Phase 6 E2E Evaluation Step Fix — Full Codex Response Reference

Purpose: standalone reference expanded from the latest Codex response.

## Original request context

The user was implementing Phase 6 from
`docs/plan/implementation-roadmap.md`, specifically the early vertical slice:

- create a demo project,
- create a feature flag,
- configure at least one rule,
- evaluate the flag through `/v1/evaluate`,
- display the result in the demo app,
- verify audit entries for setup mutations,
- validate API contracts before expanding UI scope.

The active file was:

```text
apps/backend/test/phase-6-vertical-slice.e2e-spec.ts
```

The user had completed Step 3 and asked:

```text
Fix the step 4 for me.
```

Step 4 was the data-plane evaluation portion of the Phase 6 e2e test. It
needed to evaluate a configured `new-checkout` flag for two synthetic,
non-PII user contexts:

- beta tester: expected `enabled=true`, `variant=on`,
  `reason=ROLE_MATCH`,
- regular user: expected `enabled=false`, `variant=off`,
  `reason=DEFAULT_OFF`.

## Full response reference

Codex fixed Step 4 in `apps/backend/test/phase-6-vertical-slice.e2e-spec.ts`.

The root issue was that the evaluation code had been placed outside the
`it(...)` test block. That caused several correctness problems:

1. `await` was being used at an invalid or unsafe level for the Jest e2e test.
2. `app` was not safely initialized before Supertest requests were made.
3. `rulesResponse` was out of scope for the `matchedRuleId` assertion.
4. Duplicate constants existed above the import statements.

Codex cleaned the file so the full Phase 6 backend flow now runs inside one e2e
test:

```text
create project
→ create flag
→ enable flag
→ configure rule
→ evaluate beta user
→ evaluate regular user
```

The corrected test validates:

- `POST /v1/projects`
- `POST /v1/projects/:projectKey/flags`
- `PATCH /v1/projects/:projectKey/flags/:flagKey`
- `PUT /v1/projects/:projectKey/flags/:flagKey/rules`
- `POST /v1/evaluate` for a matching beta user
- `POST /v1/evaluate` for a non-matching regular user

The beta evaluation assertion expects:

```ts
expect(betaEvaluationResponse.body).toMatchObject({
  projectKey,
  flagKey,
  enabled: true,
  variant: 'on',
  reason: 'ROLE_MATCH',
});
expect(betaEvaluationResponse.body.matchedRuleId).toEqual(
  rulesResponse.body[0].id,
);
```

The regular-user evaluation assertion expects:

```ts
expect(regularEvaluationResponse.body).toMatchObject({
  projectKey,
  flagKey,
  enabled: false,
  variant: 'off',
  reason: 'DEFAULT_OFF',
  matchedRuleId: null,
});
```

Codex then ran the focused Phase 6 e2e test successfully:

```text
Test Suites: 1 passed
Tests:       1 passed
```

The user was told that Step 4 could be considered done and that the next step
would be:

```text
Step 5 — verify audit entries for setup mutations
```

## Key decisions and rationale

### Keep the entire vertical slice in one test body

The Phase 6 e2e flow depends on runtime values produced earlier in the same
test. In particular, the rule ID returned from rule replacement is used to
assert `matchedRuleId` in the evaluation response.

Keeping all setup and evaluation requests inside one `it(...)` block preserves
that scope and makes the test read like a real vertical slice.

### Assert `matchedRuleId` for the beta user

The beta user assertion does not only check `enabled=true`; it also checks that
the matched rule ID equals the rule just created. This proves the response came
from the configured role-targeting rule rather than an accidental `GLOBAL_ON`
or unrelated configuration.

### Preserve safe fallback behavior for regular users

The regular user must return:

```text
enabled=false
reason=DEFAULT_OFF
matchedRuleId=null
```

This preserves the project guardrail that unmatched evaluations should fail
closed rather than accidentally enabling a feature.

### Preserve control-plane/data-plane separation

The test first uses management endpoints to configure state, then uses
`/v1/evaluate` to read that state through the runtime data-plane API. This
matches the project’s control-plane/data-plane separation guardrail.

### Use synthetic, non-PII targeting values

The contexts use stable demo identifiers such as:

```text
demo-user-beta
demo-user-regular
```

These are appropriate for testing and demos because they are deterministic and
do not expose personal information.

## Commands, files, and artifacts

### Edited file

```text
apps/backend/test/phase-6-vertical-slice.e2e-spec.ts
```

### Focused validation command

```bash
npm run test:e2e --workspace=@ffp/backend -- phase-6-vertical-slice
```

### Expected successful output

```text
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```

### Relevant Phase 6 contract

From `docs/plan/implementation-roadmap.md`:

```text
Phase 6 — Early vertical slice

- Create a demo project.
- Create a feature flag.
- Configure at least one rule.
- Evaluate the flag through /v1/evaluate.
- Display the result in the demo app.
- Verify audit entries are written for setup mutations.
- Use the slice to validate API contracts before expanding UI scope.
```

## Validation checklist

Use this checklist when continuing or reviewing the Phase 6 e2e test:

- [ ] The file imports are at the top of
      `apps/backend/test/phase-6-vertical-slice.e2e-spec.ts`.
- [ ] There are no duplicate constants above imports.
- [ ] `createE2eApp()` is called in `beforeAll`.
- [ ] `app.close()` is called in `afterAll`.
- [ ] Project creation uses `X-Actor`.
- [ ] Feature-flag creation uses `X-Actor`.
- [ ] Flag update uses `X-Actor`.
- [ ] Rule replacement uses `X-Actor`.
- [ ] The flag is set to `status: ENABLED`.
- [ ] The flag remains in `servingMode: TARGETED`.
- [ ] The configured rule is `ROLE_TARGETING` for `beta-tester`.
- [ ] The beta-user evaluation expects `ROLE_MATCH`.
- [ ] The beta-user evaluation checks `matchedRuleId`.
- [ ] The regular-user evaluation expects `DEFAULT_OFF`.
- [ ] The regular-user evaluation expects `matchedRuleId: null`.
- [ ] The focused e2e test passes.

## Risks and caveats

1. **Do not move evaluation requests outside the test block.** They depend on
   `app`, `projectKey`, `flagKey`, and `rulesResponse`.
2. **Do not switch the flag to `GLOBAL_ON` for this Step 4 test.** That would
   bypass role matching and return `reason=GLOBAL_ON`.
3. **Do not omit `status: ENABLED`.** A disabled flag returns a disabled reason
   before rule evaluation can match.
4. **Do not use `user` in the evaluation body.** The current backend DTO expects
   `context`.
5. **Do not use real personal identifiers.** Keep demo contexts synthetic and
   non-PII.
6. **Audit verification is not covered by this Step 4 fix.** That is the next
   planned step.

## Reuse prompts

Use one of these prompts to continue from this reference:

```text
Continue Phase 6 from docs/codex/reference/phase-6-e2e-evaluation-step-fix.md.
Guide me through Step 5: verify audit entries for setup mutations.
```

```text
Review apps/backend/test/phase-6-vertical-slice.e2e-spec.ts against
docs/codex/reference/phase-6-e2e-evaluation-step-fix.md and tell me whether
the Step 4 evaluation assertions are still correct.
```

```text
Use the Phase 6 e2e evaluation reference and help me wire the demo app to call
/v1/evaluate with beta and regular synthetic user contexts.
```
