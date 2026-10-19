// The site's languages: the one list every other file reads (build, pages, hreflang, sitemap, language menu, language
// redirect and suggestion, check.mjs). English is the x-default at the root; the others live in a sub-folder.
//
// Adding a language (see README.md): an entry here, i18n/<lang>.json with every key of en.json, and
// src/texts/<lang>.mjs with the catalog texts. Its media (video, poster, Open Graph image) fall back to English until
// marketing/ renders its own.

/**
 * lang: language code used in file names (i18n/<lang>.json, src/texts/<lang>.mjs). path: URL prefix.
 * htmlLang: <html lang> and hreflang. ogLocale: Open Graph locale. name: the language's own name (menus).
 * englishName: for llms.txt. match: browser language tags that pick this language (a tag matches when it equals one
 * or starts with it plus "-", case-insensitive). aliases: extra short URLs redirected to the language ("/x/*" keeps
 * the rest of the path). font: web font (see FONTS in layout.mjs; null = system fonts). media: language of the
 * promo video, poster and Open Graph image in public/media. snippet: soft length limits for titles and descriptions
 * (check.mjs warns above them).
 *
 * How catalog values read in running text: list (separator, last separator; lastBeforeI replaces it before a word
 * that starts with an "i" sound, Spanish "y" → "e"), size ({mb}), paren (a size in brackets after a name),
 * engineFor (an optional engine with what it is for), engineSep (between engines), cjkSpacing (a space between Han
 * characters and Latin letters or digits).
 */
export const LANGUAGES = [
  {
    lang: 'en', path: '/', htmlLang: 'en', ogLocale: 'en_US', name: 'English', englishName: 'English',
    match: ['en'], aliases: [], font: 'inter', media: 'en', snippet: { title: 70, description: 160 },
    list: { sep: ', ', last: ' and ' }, size: 'about {mb} MB', paren: ' ({size})',
    engineFor: '{name} for {what}{size}', engineSep: '; ',
  },
  {
    lang: 'ko', path: '/ko/', htmlLang: 'ko', ogLocale: 'ko_KR', name: '한국어', englishName: 'Korean',
    match: ['ko'], aliases: ['/kr', '/kr/*'], font: 'pretendard', media: 'ko', snippet: { title: 45, description: 100 },
    list: { sep: ', ', last: ', ' }, size: '약 {mb}MB', paren: '({size})',
    engineFor: '{what}용 {name}{size}', engineSep: ', ',
  },
  {
    lang: 'zh-CN', path: '/zh-cn/', htmlLang: 'zh-CN', ogLocale: 'zh_CN', name: '简体中文', englishName: 'Simplified Chinese',
    match: ['zh', 'zh-cn', 'zh-hans', 'zh-sg'], aliases: ['/zh', '/cn', '/zh-CN', '/zh-CN/*'], font: null, media: 'zh-CN',
    snippet: { title: 40, description: 90 },
    list: { sep: '、', last: '和' }, size: '约 {mb} MB', paren: '（{size}）',
    engineFor: '用于{what}的{name}{size}', engineSep: '；', cjkSpacing: true,
  },
  {
    lang: 'pl', path: '/pl/', htmlLang: 'pl', ogLocale: 'pl_PL', name: 'Polski', englishName: 'Polish',
    match: ['pl'], aliases: [], font: 'inter', media: 'en', snippet: { title: 70, description: 160 },
    list: { sep: ', ', last: ' i ' }, size: 'ok. {mb} MB', paren: ' ({size})',
    engineFor: '{name} – {what}{size}', engineSep: '; ',
  },
  {
    lang: 'es', path: '/es/', htmlLang: 'es', ogLocale: 'es_ES', name: 'Español', englishName: 'Spanish',
    match: ['es'], aliases: [], font: 'inter', media: 'en', snippet: { title: 70, description: 160 },
    list: { sep: ', ', last: ' y ', lastBeforeI: ' e ' }, size: 'unos {mb} MB', paren: ' ({size})',
    engineFor: '{name} para {what}{size}', engineSep: '; ',
  },
  {
    lang: 'hi', path: '/hi/', htmlLang: 'hi', ogLocale: 'hi_IN', name: 'हिन्दी', englishName: 'Hindi',
    match: ['hi'], aliases: [], font: 'inter-devanagari', media: 'en', snippet: { title: 70, description: 160 },
    list: { sep: ', ', last: ' और ' }, size: 'लगभग {mb} MB', paren: ' ({size})',
    engineFor: '{name} – {what}{size}', engineSep: '; ',
  },
];

/** Language codes in page order. */
export const LANGS = LANGUAGES.map(l => l.lang);

/** { lang: language } */
export const LANGUAGE = Object.fromEntries(LANGUAGES.map(l => [l.lang, l]));
