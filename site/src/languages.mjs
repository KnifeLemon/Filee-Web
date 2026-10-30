// The site's languages: the one list every other file reads (build, pages, hreflang, sitemap, language menu, language
// redirect and suggestion, check.mjs). English is the x-default at the root; the others live in a sub-folder.
//
// Adding a language (see README.md): an entry here, i18n/<lang>.json with every key of en.json, and
// src/texts/<lang>.mjs with the catalog texts. Its media (video, poster, Open Graph image) fall back to English until
// marketing/ renders its own.

/**
 * lang: language code used in file names (i18n/<lang>.json, src/texts/<lang>.mjs). path: URL prefix.
 * htmlLang: <html lang> and hreflang. dir: 'rtl' for right-to-left scripts (left out: left to right). ogLocale: Open Graph locale. name: the language's own name (menus).
 * englishName: for llms.txt. match: browser language tags that pick this language (a tag matches when it equals one
 * or starts with it plus "-", case-insensitive; the longest match wins, so "zh-tw" beats "zh"). aliases: extra short URLs redirected to the language ("/x/*" keeps
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
    lang: 'zh-TW', path: '/zh-tw/', htmlLang: 'zh-TW', ogLocale: 'zh_TW', name: '繁體中文', englishName: 'Traditional Chinese',
    match: ['zh-tw', 'zh-hant', 'zh-hk', 'zh-mo'], aliases: ['/tw', '/zh-TW', '/zh-TW/*'], font: null, media: 'en',
    snippet: { title: 40, description: 90 },
    list: { sep: '、', last: '和' }, size: '約 {mb} MB', paren: '（{size}）',
    engineFor: '用於{what}的{name}{size}', engineSep: '；', cjkSpacing: true,
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
  {
    lang: 'ja', path: '/ja/', htmlLang: 'ja', ogLocale: 'ja_JP', name: '日本語', englishName: 'Japanese',
    match: ['ja'], aliases: [], font: 'inter-japanese', media: 'en', snippet: { title: 40, description: 100 },
    list: { sep: '、', last: '、' }, size: '約{mb} MB', paren: '（{size}）',
    engineFor: '{what}用の{name}{size}', engineSep: '、',
  },
  {
    lang: 'ru', path: '/ru/', htmlLang: 'ru', ogLocale: 'ru_RU', name: 'Русский', englishName: 'Russian',
    match: ['ru'], aliases: [], font: 'inter', media: 'en', snippet: { title: 70, description: 160 },
    list: { sep: ', ', last: ' и ' }, size: 'около {mb} МБ', paren: ' ({size})',
    engineFor: '{name} — {what}{size}', engineSep: '; ',
  },
  {
    lang: 'ar', path: '/ar/', htmlLang: 'ar', dir: 'rtl', ogLocale: 'ar_AR', name: 'العربية', englishName: 'Arabic',
    match: ['ar'], aliases: [], font: 'inter-arabic', media: 'en', snippet: { title: 70, description: 160 },
    list: { sep: '، ', last: ' و' }, size: 'نحو {mb} ميغابايت', paren: ' ({size})',
    engineFor: '{name} – {what}{size}', engineSep: '؛ ',
  },
  {
    lang: 'pt-BR', path: '/pt-br/', htmlLang: 'pt-BR', ogLocale: 'pt_BR', name: 'Português (Brasil)', englishName: 'Brazilian Portuguese',
    match: ['pt-br'], aliases: ['/pt', '/br', '/pt-BR', '/pt-BR/*'], font: 'inter', media: 'en', snippet: { title: 70, description: 160 },
    list: { sep: ', ', last: ' e ' }, size: 'cerca de {mb} MB', paren: ' ({size})',
    engineFor: '{name} para {what}{size}', engineSep: '; ',
  },
  {
    lang: 'fr', path: '/fr/', htmlLang: 'fr', ogLocale: 'fr_FR', name: 'Français', englishName: 'French',
    match: ['fr'], aliases: [], font: 'inter', media: 'en', snippet: { title: 70, description: 160 },
    list: { sep: ', ', last: ' et ' }, size: 'environ {mb} Mo', paren: ' ({size})',
    engineFor: '{name} pour {what}{size}', engineSep: ' ; ',
  },
  {
    lang: 'ne', path: '/ne/', htmlLang: 'ne', ogLocale: 'ne_NP', name: 'नेपाली', englishName: 'Nepali',
    match: ['ne'], aliases: [], font: 'inter-devanagari', media: 'en', snippet: { title: 70, description: 160 },
    list: { sep: ', ', last: ' र ' }, size: 'करिब {mb} MB', paren: ' ({size})',
    engineFor: '{name} – {what}{size}', engineSep: '; ',
  },
  {
    lang: 'th', path: '/th/', htmlLang: 'th', ogLocale: 'th_TH', name: 'ไทย', englishName: 'Thai',
    match: ['th'], aliases: [], font: 'inter-thai', media: 'en', snippet: { title: 60, description: 140 },
    list: { sep: ', ', last: ' และ ' }, size: 'ประมาณ {mb} MB', paren: ' ({size})',
    engineFor: '{name} สำหรับ {what}{size}', engineSep: '; ',
  },
  {
    lang: 'tr', path: '/tr/', htmlLang: 'tr', ogLocale: 'tr_TR', name: 'Türkçe', englishName: 'Turkish',
    match: ['tr'], aliases: [], font: 'inter', media: 'en', snippet: { title: 70, description: 160 },
    list: { sep: ', ', last: ' ve ' }, size: 'yaklaşık {mb} MB', paren: ' ({size})',
    engineFor: '{name} – {what}{size}', engineSep: '; ',
  },
  {
    // European Portuguese takes a plain "pt" and every other pt-* tag (pt-PT, pt-AO, pt-MZ…); pt-BR keeps "pt-br".
    lang: 'pt-PT', path: '/pt-pt/', htmlLang: 'pt-PT', ogLocale: 'pt_PT', name: 'Português (Portugal)', englishName: 'European Portuguese',
    match: ['pt'], aliases: ['/pt-PT', '/pt-PT/*'], font: 'inter', media: 'en', snippet: { title: 70, description: 160 },
    list: { sep: ', ', last: ' e ' }, size: 'cerca de {mb} MB', paren: ' ({size})',
    engineFor: '{name} para {what}{size}', engineSep: '; ',
  },
  {
    lang: 'de', path: '/de/', htmlLang: 'de', ogLocale: 'de_DE', name: 'Deutsch', englishName: 'German',
    match: ['de'], aliases: [], font: 'inter', media: 'en', snippet: { title: 70, description: 160 },
    list: { sep: ', ', last: ' und ' }, size: 'ca. {mb} MB', paren: ' ({size})',
    engineFor: '{name} für {what}{size}', engineSep: '; ',
  },
  {
    lang: 'it', path: '/it/', htmlLang: 'it', ogLocale: 'it_IT', name: 'Italiano', englishName: 'Italian',
    match: ['it'], aliases: [], font: 'inter', media: 'en', snippet: { title: 70, description: 160 },
    list: { sep: ', ', last: ' e ' }, size: 'circa {mb} MB', paren: ' ({size})',
    engineFor: '{name} per {what}{size}', engineSep: '; ',
  },
  {
    lang: 'id', path: '/id/', htmlLang: 'id', ogLocale: 'id_ID', name: 'Bahasa Indonesia', englishName: 'Indonesian',
    match: ['id'], aliases: [], font: 'inter', media: 'en', snippet: { title: 70, description: 160 },
    list: { sep: ', ', last: ', dan ' }, size: 'sekitar {mb} MB', paren: ' ({size})',
    engineFor: '{name} untuk {what}{size}', engineSep: '; ',
  },
];

/** Language codes in page order. */
export const LANGS = LANGUAGES.map(l => l.lang);

/** { lang: language } */
export const LANGUAGE = Object.fromEntries(LANGUAGES.map(l => [l.lang, l]));
