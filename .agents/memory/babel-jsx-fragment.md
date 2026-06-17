---
name: Babel JSX fragment quirk
description: Vite/Babel parse errors on <> fragments as root JSX even when tsc passes — use a plain div instead.
---

In large TSX files (Admin.tsx, ~2800 lines), wrapping a component return in `<>...</>` with sibling modal nodes caused a `BABEL_PARSER_SYNTAX_ERROR: Unexpected token` at the first child after the last real `</div>`, even though `tsc --noEmit` passed clean.

**Why:** Babel's JSX parser sometimes fails to track generic/JSX state correctly in very long files with deeply nested JSX, causing it to exit JSX mode prematurely at the `<>` or `</>` boundary.

**How to apply:** When a component needs to return multiple siblings (e.g. a layout div + floating modals), put everything inside a regular `<div>`. Since modals use `position: fixed`, their DOM nesting doesn't affect visual layout. Prefer `<div className="contents">` if display-contents is acceptable, or just the outer wrapper div used for spacing/layout.
