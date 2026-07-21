# Workspace maps and prompts

Every page is a 4×3 grid read left-to-right, top-to-bottom. Skills, Create, Operate, Personal, and Quick Text contain exactly one paste action per tile and never submit automatically.

## Command — round 1

| Row | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- |
| 1 | New Chat | Quick Chat | Side Chat | Switch Chat |
| 2 | Choose Project | Add Files | Add Photos | Choose Model |
| 3 | Voice | Dictate | Plan Mode | Fast Mode |

## Agents — round 2

| Row | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- |
| 1 | Task 1 | Task 2 | Task 3 | Task 4 |
| 2 | Task 5 | Task 6 | Task 7 | Task 8 |
| 3 | Task 9 | Previous Task | Next Task | Switch Chat |

## Skills — round 3

| Tile | Exact pasted prompt |
| --- | --- |
| Plan | Inspect the relevant context and create a decision-complete implementation plan. Do not make changes yet. |
| Build | Implement the requested change end-to-end, keep the scope tight, and verify the result. |
| Debug | Diagnose this from evidence, identify the root cause, implement the smallest safe fix, and verify it. |
| Review | Review the current change for bugs, regressions, security or release risk, and missing tests. Lead with findings. |
| Test | Run the most relevant tests and checks, investigate failures, and report only verified results. |
| Refactor | Refactor the current code for clarity and maintainability without changing behavior, then verify it. |
| Explain | Explain the current code or result in plain language, including its data flow and likely pitfalls. |
| Docs | Update the relevant documentation to match current behavior; keep edits surgical and validate links and examples. |
| Research | Research the current best answer using primary sources, cite claims, and separate facts from inference. |
| UI Polish | Audit and improve this interface for hierarchy, clarity, accessibility, and native macOS-quality polish while preserving behavior. |
| Visuals | Create three distinct visual directions for this request, then stop for my selection before producing final assets. |
| Continue | Continue from the latest verified state, take the next safe in-scope step, and report progress. |

## Create — round 5

| Tile | Exact pasted prompt |
| --- | --- |
| Creative | Use the Creative Production plugin and choose its best-fitting intake or production skill for this task. |
| Documents | Use the Documents plugin and its Documents skill for this task. Preserve existing structure and formatting unless the request requires a change. |
| Sheets | Use the Spreadsheets plugin for this workbook or data task. Preserve formulas, formatting, and workbook structure unless I request changes. |
| PDF | Use the PDF skill for this task. Inspect, create, edit, or validate the PDF as needed and visually verify the final pages. |
| Slides | Use the Presentations skill for this task. Build or refine the deck with clear hierarchy, cohesive visuals, and validated slide output. |
| Templates | Use the Template Creator skill to create or update a reusable template that follows the requested workflow and established conventions. |
| Sites | Use the Sites plugin and its applicable building or hosting skill for this website task. |
| Product Design | Use the Product Design plugin and its best-fitting skill to audit, ideate, or implement this product-design task. |
| Expo | Use the Expo plugin and its most applicable skill for this React Native or Expo task while preserving native platform behavior. |
| Remotion | Use the Remotion skill and its established best practices for this video composition or rendering task. |
| LR HDR | Use the `$lightroom-classic-hdr-import` skill for this SD-card import, auto-stack, or batch HDR task. Preserve the current Lightroom destination and settings. |
| ImageGen | Use the ImageGen skill to create or edit the requested image, matching supplied references and preserving required text and layout constraints. |

## Operate — round 6

| Tile | Exact pasted prompt |
| --- | --- |
| Browser | Use the Browser plugin to inspect or operate the in-app browser for this task. Read the visible state before taking action. |
| Computer | Use the Computer Use plugin to inspect or operate the relevant Mac app for this task, following the applicable safety and confirmation rules. |
| Gmail | Use the Gmail plugin and its applicable skill for this task. Read first and stage consequential actions unless I explicitly authorize them. |
| Mail | Use Computer Use with Apple Mail for this task. Follow the active workspace’s Mail rules, inspect the targeted message first, and do not mutate Mail unless I explicitly authorize it. |
| Lightroom | Use Computer Use with Adobe Lightroom Classic for this task. Inspect the current catalog and app state first and preserve existing import, metadata, file, and destination settings. |
| Numbers | Use Computer Use with Apple Numbers for this task. Preserve formulas, formatting, sheets, and data unless I request changes. |
| Pages | Use Computer Use with Apple Pages for this task. Preserve document structure, styles, and content unless I request changes. |
| GitHub | Use the GitHub plugin and its best-fitting skill for this repository or pull-request task. Inspect the current state before any external mutation. |
| Calendar | Use the Google Calendar plugin for this task. Read current state first and do not create, edit, or delete events unless explicitly authorized. |
| Drive | Use the Google Drive plugin for this task. Preserve ownership and sharing, and do not move or delete content unless explicitly requested. |
| OpenAI Docs | Use the OpenAI Docs skill and official OpenAI sources for this OpenAI product or API task. |
| Canva | Use the Canva plugin and its best-fitting skill for this design task, preserving brand and layout constraints. |

## Personal — round 7

| Tile | Exact pasted prompt |
| --- | --- |
| Inspect First | Before changing anything, read AGENTS.md and the relevant project documentation, inspect the affected files and current behavior, then briefly state the implementation plan. |
| Find Root | Identify the real project root and determine which instruction files apply before editing. Do not assume the currently open folder is the correct root. |
| Lock Scope | Define what is in scope and what must not be touched. Stay inside the assigned task and do not change unrelated logic, UI, data, wording, files, or behavior. |
| Preserve | Preserve all existing functionality and visual behavior unless the requested feature specifically requires changing it. Add around the current system instead of replacing it. |
| Small Fix | Make the smallest practical and safe change that completely solves the problem. Avoid broad rewrites, unnecessary dependencies, or architecture changes. |
| Use Existing | Reuse the project's existing components, patterns, utilities, styles, data flow, and dependencies before creating anything new. |
| Full Files | Apply complete file rewrites for every file you change rather than giving partial snippets. Preserve all unrelated code and content. |
| Source Truth | Treat the existing repository, data files, and established workflow as the source of truth. Do not create a parallel system, duplicate database, competing configuration, or second workflow. |
| No Guessing | Do not invent commands, APIs, file paths, results, or capabilities. Verify them from the project or authoritative sources, and clearly identify anything that remains unknown. |
| Keep Going | Use the context already available, make reasonable decisions, and complete the task without stopping for unnecessary questions. Continue through implementation, verification, and cleanup. |
| Deep Research | Research this thoroughly using the browser. Keep digging through official documentation, GitHub, Reddit, forums, videos, public repositories, and relevant examples. Cite sources and separate verified facts from inference. |
| Audit Only | Audit the project and classify findings as source code, documentation, assets, generated output, local/private content, safe cleanup, or risky/unknown. Do not delete or modify anything. |

## Quick Text — round 8

| Tile | Exact pasted prompt |
| --- | --- |
| Finish It | Continue working autonomously until this is genuinely complete. Fix anything still blocking the result, validate it, and tell me exactly what changed. |
| Status | Inspect the current state and give me a concise status: what is done, what is broken or uncertain, and the best next step. |
| Root Cause | Diagnose the root cause, implement the proper fix, and verify that the issue is actually resolved. |
| Check Rest | Check the rest of this carefully for related issues or missing pieces. Fix what is in scope and report anything that still needs me. |
| Update Docs | Update all relevant documentation and the appropriate worklog so they accurately match the final implementation. |
| Validate All | Run the appropriate tests and validation checks. Fix in-scope failures, then report the exact results honestly. |
| Review Changes | Review the current changes for bugs, regressions, security concerns, release risks, and missing tests. Lead with actionable findings. |
| Make It Nice | Polish this so it feels cohesive, intuitive, and production-ready while preserving the existing functionality. |
| Simplify | Simplify this implementation and remove unnecessary complexity without changing the intended behavior. |
| Best Judgment | Use your best judgment and make reasonable decisions to move this forward without waiting for minor clarifications. Flag only choices that materially change the outcome. |
| Handoff | Give me a clear handoff with what was completed, files changed, validation performed, remaining risks, and the next useful step. |
| Match Visual | Compare the implementation carefully against the provided screenshot or reference, identify visible differences, and fix the in-scope mismatches. |

## Round, square, dial, and wheel map

See the [complete control map](images/codex-control-map.png). Round 4 remains New/Quick Chat, Fn+5 remains empty, Fn+6 remains Fast, Fn+7 remains Approve, and Voice, Dictate, and Plan remain on Command. Right A/B/C/D open Personal/Agents/Quick Text/Skills; Fn+A and Fn+C adjust reasoning. Existing dial behavior is preserved across all seven pages.
