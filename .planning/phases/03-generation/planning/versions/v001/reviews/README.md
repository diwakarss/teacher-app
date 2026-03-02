# Reviews

Each round must include all reviewers:
- `claude.md`
- `gemini.md`
- `codex.md`
- `resolution-claude.md`
- `resolution-gemini.md`
- `resolution-codex.md`

Expected verdict tokens in each file:
- PASS / APPROVE (accepted)
- NEEDS_WORK / FAIL / REJECT (blocking)

Resolution files are produced by Claude revision pass after each reviewer.
If reviewer verdict is blocking, review gate can pass only when corresponding
`resolution-<reviewer>.md` verdict is PASS/RESOLVED.
