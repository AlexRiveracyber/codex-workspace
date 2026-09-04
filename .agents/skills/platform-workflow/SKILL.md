---
name: platform-workflow
description: Apply repository workflow conventions whenever modifying code, configuration, documentation, or assets in the Platform project.
---

# Platform Workflow

## Rules

1. After completing each user-requested modification, create one focused Git commit and push the current branch to the configured GitHub remote before reporting completion.
   - Run validation appropriate to the change before committing.
   - Stage only files that belong to the current modification; preserve unrelated working-tree changes.
   - Use a concise commit message that describes the completed change.
   - Never force-push or rewrite history. If authentication, branch protection, conflicts, or remote availability prevent the push, stop and report the exact blocker.
