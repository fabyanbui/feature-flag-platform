---
name: demo-rbac
description: Implement or review the recommended admin/developer/viewer demo RBAC model. Use for server-resolved bearer identities, centralized permission matrices, control-plane guards, trusted audit actors, admin identity switching, authorization UI states, and RBAC tests.
---

# Demo RBAC

## Workflow

1. Start only after Gate B passes; read Phase 16 in
   `docs/plan/recommended-enhancements-roadmap.md`.
2. Define one central route/action permission matrix for `ADMIN`, `DEVELOPER`,
   and `VIEWER`.
3. Resolve `Authorization: Bearer <demo-token>` on the backend into actor and
   role before authorization guards run.
4. Keep tokens in server environment/seeded demo configuration. Never infer
   role from `X-Actor-Role` or another client-controlled role header.
5. Use resolved identity for audit actors on successful mutations.
6. Keep the evaluation endpoint available to unprivileged demo clients unless
   the documented contract explicitly changes.
7. Return consistent `UNAUTHORIZED` for missing/invalid identity and
   `FORBIDDEN` for insufficient permission.
8. Add an admin demo identity selector using provisioned demo credentials;
   hide or disable actions according to permissions and explain why.
9. Test every role across reads, mutations, archive/restore, groups, kill
   switches, history, stats, and audit access.

## Scope boundary

- This is presentation-grade demo authorization, not OAuth or a production IdP.
- Do not add passwords, refresh tokens, MFA, password reset, or session
  management.
- Do not commit real privileged tokens or expose them in logs/screenshots.

## Sources

- `docs/plan/recommended-enhancements-roadmap.md`
- `docs/release/security-review.md`
- `docs/research/audit-log-configuration-changes.md`
