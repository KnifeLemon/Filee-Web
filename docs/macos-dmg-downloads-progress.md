# Architecture-specific macOS DMG downloads — progress log

Record every implementation or validation attempt here so future work can distinguish a verified result from an
assumption.

## 2026-11-10 — Baseline

- Confirmed that Filee release 2.4.0 publishes both architecture-specific macOS DMGs and both `.tar.gz` archives.
- Confirmed the existing site picker maps Apple Silicon and Intel to separate release targets, but its main macOS
  downloads were the archives.
- Ran `npm run check` before changes: 26 tests passed; 1,914 generated pages passed static validation.

## 2026-11-10 — Implementation and validation

- Changed the primary macOS assets to the architecture-specific DMGs. The matching `.tar.gz` remains a separately
  validated secondary link for `install.sh` and the `filee` command; a missing DMG still sends the primary control to
  the releases page instead of substituting the archive.
- Kept the Apple-silicon fallback. Only explicit Chromium `architecture` values (`arm` and `x86`) can refine it;
  unknown, denied and unavailable values leave it unchanged. Saved and manual selections cannot be overwritten.
- Added the archive and non-notarized/Open Anyway guidance to all 22 locale files, plus the implementation plan.
- `npm run check`: **passed** — 31 unit tests and static validation of 1,914 generated pages. `git diff --check` also
  passed. Generated-page inspection found both macOS controls on 1,915 HTML files (the 1,914 pages plus `404.html`).
- **Hardware/browser limitation:** this environment terminates the local preview listener, so no physical Intel Mac or
  Safari/Firefox session was claimed as tested. The detection matrix is covered by isolated unit tests; verify the
  live PR preview on those devices before release.
- Pending: PR creation, maintainer review and live-preview device verification.

## 2026-11-10 — Security review

- Reviewed the committed macOS-download diff for hard-coded credentials, unsafe URL assignment, DOM injection and
  Client-Hints selection bypasses. No credential, token, private key or new external endpoint was added.
- The primary and secondary asset links are still accepted only when they match the exact expected filename and the
  canonical `https://github.com/KnifeLemon/Filee/releases/download/<tag>/<name>` URL. Malformed, credential-bearing,
  redirected-looking and wrong-version URLs are refused by unit tests.
- Browser-provided architecture is reduced to the two exact accepted values before it can affect the selected target;
  it cannot change a saved or manually selected target.
- Remaining release-distribution trust is unchanged: visitors still trust the Filee GitHub release assets. The existing
  non-notarization warning remains visible beside macOS downloads; notarizing/signing the release artifacts is outside
  this website-only change.

## 2026-11-10 — Local preview failure

- **Command/environment:** Local preview at `http://localhost:4174/#download` in Safari.
- **Observed result or error:** The site header rendered, but all page content below it remained blank, including the
  download section.
- **Root cause:** The generated main module imports `./download-target.mjs`, but `build.mjs` hashes and writes only
  `downloads.mjs` into `dist/assets`. The browser therefore cannot load the new module, and the reveal script never
  runs; content carrying `data-reveal` stays hidden.
- **Fix:** Extended the build asset step to hash, write and rewrite the `download-target.mjs` import alongside
  `downloads.mjs`. The static checker now verifies every relative import in generated JavaScript assets exists.
- **Retest result:** `npm run check` passed: 31 unit tests, 1,914 generated pages and the static checker all completed
  without errors. The generated main module now imports the emitted `download-target.<hash>.js` file. A browser
  check remains pending because this environment does not retain the local preview listener between commands.

## Result format for later attempts

- **Command/environment:**
- **Observed result or error:**
- **Root cause:**
- **Fix:**
- **Retest result:**
