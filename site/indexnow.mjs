// Tells search engines that take IndexNow (Bing, which also feeds ChatGPT search and Copilot, Naver, Yandex, Seznam)
// about every page in dist/sitemap.xml right after a deploy, instead of waiting for their next crawl.
// Run by "npm run deploy" after wrangler; the key file public/<key>.txt proves the site is ours.
// Usage: node indexnow.mjs

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const KEY = '6f34f822f66888d37ba3dafc497100ab';
const HOST = 'filee.sh';

const sitemap = await readFile(join(import.meta.dirname, 'dist', 'sitemap.xml'), 'utf8');
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]).filter(url => new URL(url).host === HOST);

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
});
// 200 and 202 mean accepted; anything else is reported but does not fail the deploy.
console.log(`IndexNow: ${urlList.length} URLs → ${response.status} ${response.statusText}`);
