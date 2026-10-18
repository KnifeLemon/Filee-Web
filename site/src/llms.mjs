// llms.txt and llms-full.txt (llmstxt.org): plain, quotable facts for AI assistants and answer engines (GEO).
// Everything is generated from catalog.mjs, so the facts match the pages.

import {
  BUILT_IN_ENGINES, CATEGORIES, ENGINES, FAQ, FORMATS, OPTIONS, PAIRS, VERSION, L, countFormats, engineDetails, fill, joinList, pairSlug,
  routeFor, sizeText, stats, vars,
} from './catalog.mjs';
import { DOWNLOAD, REPO, SITE, paths } from './layout.mjs';
import { pairMeta } from './convert-page.mjs';

const EN = 'en';
/** Source lists show every extension group (PPM/PGM/PBM); targets are the format actually written (PPM). */
const labels = ids => ids.map(id => FORMATS[id].display ?? FORMATS[id].label);
const targetLabels = ids => ids.map(id => FORMATS[id].label);

function facts(en) {
  const s = stats();
  const v = vars(EN);
  return [
    `Filee is a free, open-source (MIT) file converter for Windows 10 and Windows 11 (64-bit), with preview builds for macOS 14+ and Linux (x64 and ARM64). It converts files offline on the user's own computer; files are never uploaded.`,
    `Windows x64 is the stable release. macOS (Apple silicon and Intel) and Linux (x64 and ARM64) packages are previews: the macOS app is not notarized yet, and on Linux the drag gesture needs an X11 session. The format counts, examples and screenshots describe Windows.`,
    `Filee converts ${s.formatTotal} file formats in ${s.categoryCount} categories: ${v.categoryList}.`,
    `${s.builtinTotal} of those formats work right after installation. The others use optional engines, picked in the installer or downloaded inside the app when needed: ${engineDetails(EN)}.`,
    `Filee needs no Microsoft Office, Hancom Office or LibreOffice for Word (DOCX), Excel (XLSX, XLS, CSV), PowerPoint (PPTX) and Korean HWP/HWPX files. It never uses Microsoft Office or Hancom Office. Optional engines (FFmpeg, calibre, Pandoc, Ghostscript, LibreOffice) already on the PC (PATH or Program Files) are used instead of a download; the user can also pick a specific copy.`,
    `How it works: hold a modifier key (Ctrl by default, configurable) and drag files; a donut-shaped menu of formats opens at the cursor; drop the files on a format and the converted files are saved next to the originals.`,
    `Other ways to convert: "Convert with Filee" in the Windows 11 top-level right-click menu, Send To, a keyboard shortcut on selected files, and the drop zone in the main window.`,
    `Batch conversion: any number of files are converted in parallel; one failure doesn't stop the rest; presets can merge files into one PDF or pack them into one ZIP.`,
    `Command line: Setup can add the "filee" command to PATH. "filee convert <files, wildcards or folders> --to <format>" (or "--preset <preset>") converts with the app's engines and presets; "--json" prints the result for scripts; exit codes are 0 (nothing failed), 1 (some files failed), 2 (wrong arguments or a missing input) and 3 (nothing to convert). "filee watch <folder> --to <format>" converts files that land in a folder. Guide: ${SITE}/cli/`,
    `Watch folders: files that land in a chosen folder are converted automatically once they are complete, set up in the app or with "filee watch"; the originals can stay or move to an "originals" folder.`,
    `Presets per file type: quality, resizing, rotate and flip, DPI, grayscale, metadata, background removal, Trace to SVG (raster images to vector SVG, built in), TIFF compression, ICO sizes, PDF merge, split, page ranges and compression (Compress PDF: pictures at 72, 150 or 300 dpi, built in), 720p, HEVC and AV1 video, hardware video encoding (H.264 and HEVC on NVENC, Quick Sync, AMF, VideoToolbox or VA-API), every frame of a video saved as PNG or JPG pictures, MP3 bitrate, output folder and file names. A donut slice can hold a group of presets.`,
    `Filee is free: no ads, no watermarks, no account and no file-size or file-count limits of its own. The app is available in English, Korean and Simplified Chinese.`,
    `Current version: ${VERSION}. The installer (Filee-<version>-win-Setup.exe) asks for administrator rights once, installs Filee for all users and lets the user choose the File Explorer menu entry, starting at sign-in and optional engines; a portable ZIP (Filee-<version>-win-Portable.zip) needs no installation. When a new version is out on GitHub Releases, the installed app downloads it, checks its SHA-256 and installs it after one click, keeping settings and engines; the portable ZIP is replaced by hand.`,
    en ? `Website: ${SITE}/ (English), ${SITE}/ko/ (Korean), ${SITE}/zh-cn/ (Simplified Chinese).` : '',
  ].filter(Boolean);
}

const describeRoute = r => {
  const from = r.fromText ? L(r.fromText, EN) : `${r.label ? `${L(r.label, EN)}: ` : ''}${labels(r.from).join(', ')}`;
  const to = r.to.length ? targetLabels(r.to).join(', ') : 'merge, split, page ranges and compression';
  const engine = r.engine === 'builtin' ? `built in${r.via ? `, ${r.via}` : ''}` : `optional ${ENGINES[r.engine].name}`;
  const extras = r.extras?.length ? `; options: ${r.extras.map(k => L(OPTIONS[k].short, EN)).join(', ')}` : '';
  const note = r.note ? ` (${L(r.note, EN)})` : '';
  return `${from} → ${to} [${engine}${extras}]${note}`;
};

const en = languages => languages.find(l => l.lang === EN);

export function llmsTxt(languages) {
  const t = en(languages);
  return `# Filee

> Filee is a free, open-source (MIT) file converter for Windows 10 and 11. It converts images, PDF, Word, Excel and PowerPoint files, Korean HWP/HWPX, e-books, video, audio, subtitles, data files, 3D models, archives, CAD drawings and fonts offline on your PC: hold a key, drag files and drop them on a format.

${facts(true).map(line => `- ${line}`).join('\n')}

## Formats

${CATEGORIES.map(c => `- ${L(c.name, EN)} (${countFormats(c.formats)}): ${L(c.intro, EN)}`).join('\n')}

Full list with every format, extension, target and engine: [format catalog](${SITE}/formats/) and [llms-full.txt](${SITE}/llms-full.txt).

## Conversion guides

${PAIRS.map(p => `- [${pairMeta(t, p).h1}](${SITE}${paths.convert(t, pairSlug(p))})`).join('\n')}

## Download

- [Windows installer, latest release](${DOWNLOAD}) (free; Windows 10/11, x64)
- [Choose an operating system and processor](${SITE}/#download) (macOS and Linux are previews)
- [All releases and release notes](${REPO}/releases)

## Website

${languages.map(l => `- [${l.name}](${SITE}${l.path}), [format catalog](${SITE}${paths.formats(l)}), [command line guide](${SITE}${paths.cli(l)})`).join('\n')}

## Source code and documentation

- [GitHub repository](${REPO})
- [Conversion engines](${REPO}/blob/main/docs/ENGINES.md)
- [Architecture](${REPO}/blob/main/docs/ARCHITECTURE.md)
`;
}

export function llmsFullTxt(languages) {
  const t = en(languages);
  const s = stats();
  const v = vars(EN);
  return `# Filee: full format catalog, engines and FAQ

> Filee is a free, open-source (MIT) file converter for Windows 10 and 11 that converts ${s.formatTotal} file formats offline on the user's own PC. This file lists every format Filee ${VERSION} reads, what each converts to, which engine does the work, the conversion guides and the FAQ. Short version: ${SITE}/llms.txt

## Facts

${facts(true).map(line => `- ${line}`).join('\n')}

## Engines

- Built in (in the installer): ${BUILT_IN_ENGINES.join(', ')} and more. ${s.builtinTotal} formats need nothing else.
${Object.values(ENGINES).map(e => `- ${e.name} (optional download${e.sizeMB ? `, ${sizeText(e.sizeMB, EN)}` : ''}): ${L(e.for, EN)}. ${e.url}`).join('\n')}
- Optional engines are downloaded inside Filee (Settings → Engines, or when first needed) into Filee's own folder and can be removed at any time. The app shows each engine's version, download speed and time left.

## Format catalog

${CATEGORIES.map(c => `### ${L(c.name, EN)} (${countFormats(c.formats)} formats)

${L(c.intro, EN)}

Formats: ${c.formats.map(f => `${f.display ?? f.label} (${f.ext.map(e => `.${e}`).join(' ')}${f.brand ? `; ${f.brand}` : ''})`).join(', ')}.

Conversions:
${c.routes.map(r => `- ${describeRoute(r)}`).join('\n')}

Details: ${SITE}/formats/#${c.id}
`).join('\n')}
## Conversion guides

${PAIRS.map(p => {
    const meta = pairMeta(t, p);
    const route = routeFor(p.from, p.to);
    const engine = route.engine === 'builtin' ? 'Built in' : `Needs the optional ${ENGINES[route.engine].name} engine`;
    return `### ${meta.h1}

${SITE}${paths.convert(t, pairSlug(p))}

${meta.lead} ${engine}. ${L(p.tip, EN)}${p.options.length ? ` Options: ${p.options.map(k => L(OPTIONS[k].long, EN)).join(' ')}` : ''}
`;
  }).join('\n')}
## FAQ

${FAQ.map(item => `### ${L(item.q, EN)}

${fill(L(item.a, EN), v)}
`).join('\n')}
## Links

- Download (latest release): ${DOWNLOAD}
- Source code: ${REPO}
- Website: ${languages.map(l => `${SITE}${l.path}`).join(', ')}
- Other languages of the format catalog: ${languages.filter(l => l.lang !== EN).map(l => `${SITE}${paths.formats(l)}`).join(', ')}
- Categories: ${joinList(CATEGORIES.map(c => L(c.plain, EN)), EN)}
`;
}
