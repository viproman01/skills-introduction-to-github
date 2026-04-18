# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is a fork of GitHub's [`skills/introduction-to-github`](https://github.com/skills/introduction-to-github) course template — an interactive, self-paced tutorial that teaches branches, commits, pull requests, and merges. It is **not** an application codebase: there is no `package.json`, no build, no tests, no lint. All "logic" lives in GitHub Actions workflows that react to learner activity.

## How the course engine works

The course is a small state machine driven by one file and five workflows.

- **State**: `.github/steps/-step.txt` holds a single integer (the current step number). The visible state is `README.md`, which is rewritten on each transition.
- **Transitions**: each `.github/workflows/{N}-*.yml` listens for one learner event (push to `main`, branch create, push to `my-first-branch`, PR opened, PR merged). The workflow runs only when:
  1. `!github.event.repository.is_template` (skip the upstream template),
  2. `-step.txt` equals the workflow's expected step,
  3. an event-specific predicate matches (e.g. `github.ref_name == 'my-first-branch'` or `github.head_ref == 'my-first-branch'`).
- **Effect**: the workflow calls `skills/action-update-step@v2`, which both increments `-step.txt` and swaps the matching `.github/steps/{N}-*.md` into `README.md` (between the `<header>`/`<footer>` markers).
- **Terminal state**: after step 4, the action transitions to step `X` (`X-finish.md`).

Step flow: `0-welcome → 1-create-a-branch → 2-commit-a-file → 3-open-a-pull-request → 4-merge-your-pull-request → X-finish`.

## Conventions and gotchas

- **Never edit `README.md` directly** to change course content — your edit will be overwritten on the next learner action. Edit the corresponding `.github/steps/N-*.md` instead. The `<header>` and `<footer>` blocks in `README.md` are preserved across transitions; everything between them is replaced.
- **The branch name `my-first-branch` is hardcoded** in workflows 1, 2, 3 and in the step instructions. Changing it requires updating all of: `1-create-a-branch.yml` (`github.ref_name`), `2-commit-a-file.yml` (`on.push.branches`), `3-open-a-pull-request.yml` (`github.head_ref` and the `checkout.ref`), the `branch_name` input on every `skills/action-update-step` call, and the learner-facing prose in the step markdown.
- **Workflow 3 must check out `ref: my-first-branch`** explicitly. `pull_request` events default to the merge ref, but `action-update-step` needs to read `-step.txt` from the feature branch.
- **Adding or reordering a step** requires three coordinated changes: new `N-*.md` content, new `N-*.yml` workflow, and bump the prior workflow's `to_step` input. Keep filenames numerically ordered.
- **Image references** in step markdown use root-absolute paths (`/images/foo.png`) so they resolve when the markdown is embedded in `README.md`.
- **Do not enable workflows on the template itself** — the `is_template` guard exists for this reason; preserve it on any new workflow.

## Common tasks

- **Reset a learner's progress**: edit `.github/steps/-step.txt` to the desired step number and restore the matching content into `README.md` between the `<header>`/`<footer>` markers (or trigger the previous workflow via `workflow_dispatch`).
- **Edit step instructions**: modify `.github/steps/N-*.md`. The change takes effect for the learner on the next transition into that step (it does not retroactively rewrite `README.md`).
- **Update the action-update-step version**: bump `skills/action-update-step@v2` in all workflows together; Dependabot is configured (`.github/dependabot.yml`) to PR GitHub Actions updates monthly.
