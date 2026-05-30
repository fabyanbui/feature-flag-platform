> Researching Feature Flags and Building a Safe Feature Release Management System

# Description:

This topic focuses on researching Feature Flags — a common technique in modern software development that separates code deployment from feature release. Instead of redeploying the system whenever a feature needs to be enabled or disabled, the development team can configure feature flags to enable/disable features, gradually roll them out, limit them to specific user groups, or quickly disable them when issues occur.

Within the scope of this mini project, students will build a feature flag management platform for web applications. The system includes an administration dashboard for creating and configuring feature flags, a simple rule engine for evaluating flags based on user/role/percentage, an API endpoint that allows other applications to check flag status, and a demo application that demonstrates enabling/disabling features based on flags.

Main research topics:

* The concept of Feature Flags and their role in release management.
* Rollout strategies: global enable/disable, user-based rollout, role-based rollout, and percentage-based rollout.
* Kill switch and fast rollback when production issues occur.
* Audit logs for configuration changes.
* Designing a simple API for integrating feature flags into applications.
* Important considerations: caching, consistency, default values, and security of flag evaluation endpoints.

# Expected Deliverables:

## REQUIRED LEVEL (MVP)

1. Research Report

* Explain what Feature Flags are and what problems they solve in the software development lifecycle.
* Compare deployment and release.
* Describe common types of flags: release flags, experiment flags, ops/kill-switch flags, and permission flags.
* Present the overall workflow of a feature flag system.

2. Backend API

* Project management API.
* Feature flag CRUD API.
* Rule configuration API for flags:

  * global enable/disable,
  * enable by user ID,
  * enable by role,
  * percentage-based user rollout.
* Evaluation API: client sends user context, the system returns whether a flag is enabled or disabled.
* Audit log API to record changes to flags/rules.

3. Frontend Dashboard

* Project list screen.
* Feature flag list screen.
* Create/edit feature flag screen.
* Rule configuration screen.
* Audit log screen.
* UI that clearly displays feature flag status.

4. Demo Application Integrated with Feature Flags

* A small web application that calls the evaluation API.
* Show/hide a demo feature based on flag status.
* Demonstrate at least 2 scenarios:

  * global feature enable/disable,
  * feature enablement by role or by percentage of users.

5. Minimum Technical Requirements

* A database to store projects, flags, rules, sample user contexts, and audit logs.
* Input validation.
* Basic error handling.
* README with instructions for setup and running the backend, frontend, and demo application.
* Seed data or scripts to generate sample data.
* Short design documentation: architecture, database schema, and API specification.

## RECOMMENDED LEVEL

* Cache flag evaluation results using Redis or an in-memory cache.
* A simple JavaScript SDK to make feature flag integration easier for clients.
* Unit tests for rule evaluation.
* Rule versioning or configuration change history.
* Role-based access control: admin/developer/viewer.
* Statistics dashboard showing the number of evaluations per flag.
* Kill switch to quickly disable a group of flags.
* Docker Compose to run the entire system.

## Evaluation Criteria

* Correct understanding of Feature Flags and real-world use cases.
* Clear and extensible rule evaluation design.
* Clean APIs with documentation and proper error handling.
* An easy-to-use dashboard that reflects the feature flag management workflow.
* A demo application that demonstrates the value of feature flags.
* Well-structured, readable, maintainable, and extensible code.

# References:

* https://martinfowler.com/articles/feature-toggles.html
* https://docs.getunleash.io/topics/feature-flags/feature-flag-best-practices
* https://docs.launchdarkly.com/home/flags
* https://learn.microsoft.com/en-us/devops/develop/how-microsoft-develops-devops
