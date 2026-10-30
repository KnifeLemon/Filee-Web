// The command line guide (/cli/, /ko/cli/, /zh-cn/cli/): setting up the "filee" command, quick start, every
// command and option, watch folders, JSON output and exit codes, using it from an AI agent. Texts come from
// i18n/<lang>.json (t.cli).

import { VERSION, fill, vars } from './catalog.mjs';
import { SITE, alternatesOf, breadcrumbs, downloadCard, escape, icon, paths, renderDocument } from './layout.mjs';

/** Escaped text with `code` and **bold** spans (the guide's texts name commands, options and Setup labels) and
 * [text](https://…) links. */
export const md = text => escape(text)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>');

/** A terminal window: lines starting with "> " are typed commands (the prompt is drawn), the rest is output. */
export function terminal(lines, label, prompt = '>') {
  const body = lines.map(line => {
    if (line.startsWith('> ')) return `<span class="t-prompt">${escape(prompt)}</span> <span class="t-cmd">${escape(line.slice(2))}</span>`;
    const [, status, rest] = /^(ok|fail|skip)(\s+.*)$/.exec(line) ?? [];
    return status ? `<span class="t-${status}">${status}</span>${escape(rest)}` : `<span class="t-out">${escape(line)}</span>`;
  }).join('\n');
  return `<figure class="terminal" aria-label="${escape(label)}">
      <div class="terminal-bar" aria-hidden="true"><i></i><i></i><i></i></div>
      <pre><code>${body}</code></pre>
    </figure>`;
}

const codeBlock = code => `<pre class="code"><code>${escape(code)}</code></pre>`;

/** What `filee convert … --json` prints (shortened from a real run). */
const JSON_SAMPLE = `{
  "preset": "WEBP",
  "target": "webp",
  "converted": 2,
  "skipped": 0,
  "failed": 1,
  "files": [
    {
      "source": "D:\\\\Exports\\\\cover.png",
      "state": "done",
      "outputs": [ "D:\\\\Exports\\\\cover.webp" ]
    },
    {
      "source": "D:\\\\Exports\\\\broken.png",
      "state": "failed",
      "outputs": [],
      "error": "The engine reported an error (improper image header)"
    }
  ]
}`;

const POWERSHELL_SAMPLE = `$result = filee convert D:\\Exports\\*.png --to webp --json | Out-String | ConvertFrom-Json
if ($LASTEXITCODE -eq 1) {
  $result.files | Where-Object state -eq 'failed' | ForEach-Object { "$($_.source): $($_.error)" }
}`;

const HERO_SESSION = [
  '> filee convert *.heic --to jpg',
  'ok    IMG_0412.heic -> IMG_0412.jpg',
  'ok    IMG_0413.heic -> IMG_0413.jpg',
  'ok    IMG_0414.heic -> IMG_0414.jpg',
  'Converted 3 of 3 file(s).',
];

function commandCard(t, c) {
  const options = c.options.length
    ? `<h4>${escape(t.cli.optionsLabel)}</h4>
        <table class="engine-table cli-table">
          <tbody>${c.options.map(([flag, text]) => `<tr><th scope="row"><code>${escape(flag)}</code></th><td>${md(text)}</td></tr>`).join('')}</tbody>
        </table>`
    : '';
  return `<article class="cli-command" id="cmd-${c.name}" data-reveal>
        <h3><code>filee ${escape(c.name)}</code></h3>
        ${codeBlock(c.usage)}
        <p>${md(c.text)}</p>
        ${options}
      </article>`;
}

export function renderCliPage(t, languages, assets) {
  const v = vars(t.lang);
  const f = text => fill(text, v);
  const c = t.cli;
  const alternates = alternatesOf(languages, paths.cli);
  const url = SITE + alternates[t.lang];
  const crumbs = breadcrumbs(t, [
    { name: t.common.home, path: paths.home(t) },
    { name: c.crumb, path: alternates[t.lang] },
  ]);

  const main = `
  <section class="page-hero page-hero-cli">
    <div class="page-hero-copy">
      ${crumbs.html}
      <p class="tags">${c.tags.map(tag => `<span class="tag">${escape(tag)}</span>`).join('')}</p>
      <h1>${escape(c.h1)}</h1>
      <p class="lead">${escape(c.lead)}</p>
      <div class="cta">
        <a class="btn btn-primary btn-large" href="#download">${icon('windows')}<span>${escape(t.hero.download)}</span></a>
        <a class="btn btn-ghost btn-large" href="#commands">${icon('code')}<span>${escape(c.commandsButton)}</span></a>
      </div>
    </div>
    ${terminal(HERO_SESSION, c.terminalLabel, 'D:\\Photos>')}
  </section>

  <section class="section section-tight" id="setup">
    <header class="section-head" data-reveal><h2>${escape(c.setupTitle)}</h2></header>
    <ol class="steps">
      ${c.setup.map((s, i) => `<li class="step" data-reveal style="--i:${i}"><span class="step-number">${i + 1}</span><h3>${escape(s.title)}</h3><p>${md(s.text)}</p></li>`).join('')}
    </ol>
  </section>

  <section class="section section-tight" id="quick-start">
    <header class="section-head" data-reveal><h2>${escape(c.quickTitle)}</h2><p>${md(c.quickLead)}</p></header>
    <ul class="cli-recipes">
      ${c.quick.map((q, i) => `<li data-reveal style="--i:${i % 2}"><h3>${escape(q.title)}</h3>${codeBlock(q.code)}</li>`).join('')}
    </ul>
  </section>

  <section class="section section-tight" id="commands">
    <header class="section-head" data-reveal><h2>${escape(c.commandsTitle)}</h2></header>
    <nav class="cat-index" aria-label="${escape(c.commandsTitle)}">
      ${c.commands.map(cmd => `<a class="pill" href="#cmd-${cmd.name}"><code>filee ${escape(cmd.name)}</code></a>`).join('')}
    </nav>
    <div class="cli-commands">
      ${c.commands.map(cmd => commandCard(t, cmd)).join('\n      ')}
    </div>
  </section>

  <section class="section section-tight" id="watch">
    <div class="details-grid">
      <div class="details-copy" data-reveal>
        <h2>${escape(c.watchTitle)}</h2>
        <p class="tip">${md(c.watchLead)}</p>
        <ul class="checks">${c.watchPoints.map(p => `<li>${icon('check')}<span>${md(p)}</span></li>`).join('')}</ul>
      </div>
      <div class="details-side" data-reveal>
        <h3>${escape(c.watchAppTitle)}</h3>
        <p class="muted">${md(c.watchAppText)}</p>
        ${terminal(['> filee watch . --to pdf --move-originals', 'Watching D:\\Inbox → PDF, saving to D:\\Inbox\\converted. Press Ctrl+C to stop.', 'ok    scan-0412.jpg -> converted\\scan-0412.pdf'], c.watchTitle, 'D:\\Inbox>')}
      </div>
    </div>
  </section>

  <section class="section section-tight" id="scripts">
    <header class="section-head" data-reveal><h2>${escape(c.scriptsTitle)}</h2><p>${md(c.scriptsLead)}</p></header>
    <div class="cli-scripts">
      <div class="details-copy" data-reveal>
        <h3><code>--json</code></h3>
        ${codeBlock(JSON_SAMPLE)}
      </div>
      <div class="cli-scripts-side">
        <div class="details-copy" data-reveal>
          <h3>${escape(c.exitTitle)}</h3>
          <table class="engine-table cli-table cli-exit">
            <tbody>${c.exitCodes.map(([code, text]) => `<tr><th scope="row"><code>${escape(code)}</code></th><td>${md(text)}</td></tr>`).join('')}</tbody>
          </table>
        </div>
        <div class="details-copy" data-reveal>
          <h3>${escape(c.psTitle)}</h3>
          ${codeBlock(POWERSHELL_SAMPLE)}
        </div>
      </div>
    </div>
  </section>

  <section class="section section-tight" id="ai-agents">
    <div class="details-copy" data-reveal>
      <h2>${escape(c.agentTitle)}</h2>
      ${c.agentText.map(p => `<p>${md(p)}</p>`).join('')}
    </div>
  </section>

  <section class="section section-tight" id="notes">
    <div class="details-copy" data-reveal>
      <h2>${escape(c.notesTitle)}</h2>
      <ul class="checks">${c.notes.map(p => `<li>${icon('check')}<span>${md(p)}</span></li>`).join('')}</ul>
    </div>
  </section>

  ${downloadCard(t, { title: c.ctaTitle, text: f(c.ctaText), button: t.download.button })}`;

  const article = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: c.h1,
    name: c.title,
    description: c.description,
    url,
    inLanguage: t.htmlLang,
    about: { '@id': `${SITE}/#app` },
    proficiencyLevel: 'Beginner',
    dependencies: `Filee ${VERSION} for Windows 10/11`,
    author: { '@type': 'Person', name: 'KnifeLemon', url: 'https://github.com/KnifeLemon' },
  };

  return renderDocument({
    t, languages, assets, alternates, nav: 'cli',
    title: c.title, description: c.description,
    jsonLd: [article, crumbs.ld],
    main,
  });
}
