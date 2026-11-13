# Architecture-specific macOS DMG downloads

## Goal

Keep Filee's separate native macOS builds and make the site download the matching disk image:

| Selected target | Primary download | Secondary download |
| --- | --- | --- |
| Apple Silicon (`osx-arm64`) | `Filee-<version>-osx-arm64.dmg` | `Filee-<version>-osx-arm64.tar.gz` |
| Intel (`osx-x64`) | `Filee-<version>-osx-x64.dmg` | `Filee-<version>-osx-x64.tar.gz` |

The archive remains the package for people who need `install.sh` to install the `filee` command. It never replaces a
missing primary disk image.

## Behaviour

- macOS 13+ remains the supported floor and macOS remains a preview.
- A Mac starts on Apple Silicon. Chromium may refine that selection only when its high-entropy `architecture` value is
  exactly `x86` or `arm`; Safari, Firefox, unavailable, denied, malformed and unknown values keep Apple Silicon.
- A target restored from session storage or selected by the visitor always wins over a late Client Hint result.
- The download card keeps the non-notarized guidance beside macOS downloads, including **Open Anyway** in System
  Settings > Privacy & Security.
- New download text is translated in every `site/i18n/*.json` file.

## Validation

1. Unit-test exact DMG and archive names, trusted release URLs, missing-DMG fallback and architecture-refinement rules.
2. Run `npm run check` for unit tests, the generated multilingual site and static-site validation.
3. Verify in a local browser that each manual Mac choice changes the main download and archive link together.
4. Verify Apple-silicon Chromium, Intel Chromium, and Client-Hints-unavailable browser cases when those environments are
   available; record unavailable hardware explicitly rather than claiming it was tested.
