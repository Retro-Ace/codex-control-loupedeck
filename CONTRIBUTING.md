# Contributing

Thanks for helping improve Codex Control.

## Ground rules

- Keep macOS and Loupedeck CT behavior explicit; do not claim untested device or platform support.
- Preserve the seven-workspace order and exact released prompt bodies unless the change proposes a clear versioned migration.
- Prompt macros must remain paste-only: one `TypeText` action, no Return, no automatic submission.
- Keep external mutations and approval actions deliberate. Do not add one-touch sending, posting, deletion, or account changes.
- Do not commit local paths, personal names, email addresses, tokens, screenshots containing account data, SDK binaries, PDB files, build output, or application backups.
- Original code and artwork only. Do not copy another controller project's code, text, or artwork.

## Development workflow

1. Create a focused branch.
2. Run `npm run artwork` after changing icons or reference generators.
3. Run `npm run release` after changing profiles, prompts, controls, packaging, or the wheel plugin.
4. Inspect every changed PNG and SVG.
5. Exercise the relevant physical controls and state what was and was not tested.
6. Keep commits focused and use an email address you are comfortable publishing in Git history.

## Pull requests

Describe the user-visible behavior, files changed, validation performed, hardware checks performed, and any remaining manual checks. Include before/after images for artwork or layout changes. Do not include private Loupedeck exports or Codex configuration files.
