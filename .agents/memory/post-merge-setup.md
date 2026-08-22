---
name: Post-merge setup
description: The repository uses a configured npm-based post-merge hook for dependency, schema, and build setup.
---

The post-merge hook must be explicitly configured with a repository-relative script path; without it, task merges fail before setup begins.

**Why:** The project previously had no `[postMerge]` path configured, causing a `HOOK_NOT_FOUND` failure after a task merge.

**How to apply:** Keep the hook idempotent and non-interactive. For this npm workspace, install dependencies, run the database schema push in force mode, then run the root build.