import assert from 'node:assert/strict';
import test from 'node:test';
import { downloadChoice, findDownloadArchive, findDownloadAsset, mirrorUrl, releaseSummary, RELEASES_URL } from './src/downloads.mjs';
import { canRefineMacTarget, chromiumMacTarget, guessTarget, macTargetFromArchitecture } from './src/download-target.mjs';

const tag = 'v1.2.3';
const asset = name => ({
  name,
  size: 42_000_000,
  browser_download_url: `https://github.com/KnifeLemon/Filee/releases/download/${tag}/${name}`,
});
const windows = asset('Filee-1.2.3-win-Setup.exe');
const linux = asset('Filee-1.2.3-linux-x64.tar.gz');
const linuxArm = asset('Filee-1.2.3-linux-arm64.tar.gz');
const macArm = asset('Filee-1.2.3-osx-arm64.dmg');
const macIntel = asset('Filee-1.2.3-osx-x64.dmg');
const macArmArchive = asset('Filee-1.2.3-osx-arm64.tar.gz');
const macIntelArchive = asset('Filee-1.2.3-osx-x64.tar.gz');
const release = releaseSummary({ tag_name: tag, assets: [macArm, linux, windows, macIntel, linuxArm, macArmArchive, macIntelArchive] });

const mirrored = 'https://dl.filee.sh/1.2.3/Filee-1.2.3-win-Setup.exe';

test('the Windows installer downloads from the mirror, with the GitHub asset as the fallback', () => {
  assert.deepEqual(findDownloadAsset(release, 'win-x64'), {
    name: windows.name, url: mirrored, size: windows.size, github: windows.browser_download_url,
  });
  const choice = downloadChoice(release, 'win-x64');
  assert.equal(choice.url, mirrored);
  assert.equal(choice.github, windows.browser_download_url);
});

for (const [target, expected] of [
  ['linux-x64', linux], ['linux-arm64', linuxArm], ['osx-arm64', macArm], ['osx-x64', macIntel],
]) {
  test(`a mixed release selects the exact ${target} asset on GitHub`, () => {
    assert.deepEqual(findDownloadAsset(release, target), {
      name: expected.name, url: expected.browser_download_url, size: expected.size, github: expected.browser_download_url,
    });
    const choice = downloadChoice(release, target);
    assert.equal(choice.url, expected.browser_download_url);
    assert.equal(choice.github, null);
  });
}

test('mirror URLs exist only for the Windows files of a checked version', () => {
  assert.equal(mirrorUrl('1.2.3', 'Filee-1.2.3-win-Setup.exe'), mirrored);
  assert.equal(mirrorUrl('1.2.3', 'Filee-1.2.3-win-Portable.zip'), 'https://dl.filee.sh/1.2.3/Filee-1.2.3-win-Portable.zip');
  assert.equal(mirrorUrl('2.0.0-beta.1', 'Filee-2.0.0-beta.1-win-Setup.exe'),
    'https://dl.filee.sh/2.0.0-beta.1/Filee-2.0.0-beta.1-win-Setup.exe');
  for (const [version, name] of [
    ['1.2.3', 'Filee-1.2.3-linux-x64.tar.gz'], ['1.2.3', 'Filee-1.2.3-osx-arm64.dmg'],
    ['1.2.3', 'Filee-1.2.3-SHA256SUMS.txt'], ['1.2.3', 'Filee-win-Setup.exe'], ['1.2.3', 'Filee-1.2.2-win-Setup.exe'],
    ['1.2.3', '../Filee-1.2.3-win-Setup.exe'], ['v1.2.3', 'Filee-v1.2.3-win-Setup.exe'],
    ['1.2.3/..', 'Filee-1.2.3/..-win-Setup.exe'], ['1.2.3?x', 'Filee-1.2.3?x-win-Setup.exe'],
    ['1.2.3#x', 'Filee-1.2.3#x-win-Setup.exe'], ['main', 'Filee-main-win-Setup.exe'], [undefined, 'Filee--win-Setup.exe'],
  ]) assert.equal(mirrorUrl(version, name), null, `${version} ${name}`);
});

test('a missing Unix build never falls back to the Windows installer', () => {
  const choice = downloadChoice({ tag_name: tag, assets: [windows] }, 'linux-x64');
  assert.equal(choice.state, 'missing');
  assert.equal(choice.asset, null);
  assert.equal(choice.url, RELEASES_URL);
});

test('an x64 asset cannot satisfy an ARM64 selection', () => {
  assert.equal(findDownloadAsset({ tag_name: tag, assets: [linux, macIntel] }, 'linux-arm64'), null);
  assert.equal(findDownloadAsset({ tag_name: tag, assets: [linux, macIntel] }, 'osx-arm64'), null);
  assert.equal(findDownloadArchive({ tag_name: tag, assets: [macIntelArchive] }, 'osx-arm64'), null);
});

test('macOS offers the matching install.sh package only as a secondary archive', () => {
  for (const [target, expected] of [['osx-arm64', macArmArchive], ['osx-x64', macIntelArchive]]) {
    assert.deepEqual(findDownloadArchive(release, target), {
      name: expected.name, url: expected.browser_download_url, size: expected.size, github: expected.browser_download_url,
    });
    assert.deepEqual(downloadChoice(release, target).archive, findDownloadArchive(release, target));
  }
  assert.equal(findDownloadArchive(release, 'linux-x64'), null);
});

test('a missing macOS disk image does not silently become its archive', () => {
  const onlyArchive = { tag_name: tag, assets: [macArmArchive] };
  const choice = downloadChoice(onlyArchive, 'osx-arm64');
  assert.equal(choice.asset, null);
  assert.equal(choice.url, RELEASES_URL);
  assert.deepEqual(choice.archive, {
    name: macArmArchive.name, url: macArmArchive.browser_download_url, size: macArmArchive.size, github: macArmArchive.browser_download_url,
  });
});

test('macOS builds are previews; Windows and Linux are full releases', () => {
  for (const target of ['osx-x64', 'osx-arm64']) {
    const choice = downloadChoice(release, target);
    assert.equal(choice.state, 'available');
    assert.equal(choice.development, true);
  }
  for (const target of ['win-x64', 'linux-x64', 'linux-arm64']) {
    const choice = downloadChoice(release, target);
    assert.equal(choice.state, 'available');
    assert.equal(choice.development, false);
  }
});

test('the legacy Windows filename is supported without a generic Setup.exe fallback', () => {
  const legacy = asset('Filee-win-Setup.exe');
  assert.equal(findDownloadAsset({ tag_name: tag, assets: [legacy] }, 'win-x64')?.name, legacy.name);
  // Not on the mirror (it predates it): GitHub, and no separate fallback link.
  assert.equal(downloadChoice({ tag_name: tag, assets: [legacy] }, 'win-x64').url, legacy.browser_download_url);
  assert.equal(downloadChoice({ tag_name: tag, assets: [legacy] }, 'win-x64').github, null);
  assert.equal(findDownloadAsset({ tag_name: tag, assets: [legacy] }, 'linux-x64'), null);
  assert.equal(findDownloadAsset({ tag_name: tag, assets: [asset('Setup.exe')] }, 'win-x64'), null);
});

test('asset versions and filenames must match the selected release', () => {
  const assets = [asset('Filee-1.2.2-linux-x64.tar.gz'), asset('Filee-1.2.3-linux-x64-debug.tar.gz')];
  assert.equal(findDownloadAsset({ tag_name: tag, assets }, 'linux-x64'), null);
  assert.equal(findDownloadAsset(release, 'win-arm64'), null);
  assert.equal(findDownloadAsset(release, undefined), null);
  assert.equal(findDownloadArchive(release, undefined), null);
});

test('macOS disk images and archives require their exact trusted GitHub URLs', () => {
  for (const file of [macArm, macArmArchive]) {
    const malformed = { ...file, browser_download_url: file.browser_download_url.replace('/v1.2.3/', '/v1.2.2/') };
    assert.equal(findDownloadAsset({ tag_name: tag, assets: [malformed] }, 'osx-arm64'), null);
    assert.equal(findDownloadArchive({ tag_name: tag, assets: [malformed] }, 'osx-arm64'), null);
  }
});

const badUrls = [
  windows.browser_download_url.replace('https:', 'http:'),
  windows.browser_download_url.replace('github.com', 'github.com.example.test'),
  windows.browser_download_url.replace('github.com', 'user:password@github.com'),
  windows.browser_download_url.replace('/KnifeLemon/Filee/', '/someone/Filee/'),
  windows.browser_download_url.replace('/v1.2.3/', '/v1.2.2/'),
  windows.browser_download_url.replace('win-Setup.exe', 'linux-x64.tar.gz'),
  `${windows.browser_download_url}?redirect=https://example.test`,
  `${windows.browser_download_url}#download`,
  'https://github.com/%zz',
  '/KnifeLemon/Filee/releases/download/v1.2.3/Filee-1.2.3-win-Setup.exe',
];
for (const [index, url] of badUrls.entries()) {
  test(`untrusted release asset URL ${index + 1} is refused`, () => {
    const cached = releaseSummary({ tag_name: tag, assets: [{ ...windows, browser_download_url: url }] });
    assert.equal(findDownloadAsset(cached, 'win-x64'), null);
    assert.equal(downloadChoice(cached, 'win-x64').url, RELEASES_URL);
    assert.equal(downloadChoice(cached, 'win-x64').github, null);
  });
}

test('a mirror URL in the release data is never used as is', () => {
  const planted = { ...windows, browser_download_url: 'https://dl.filee.sh/9.9.9/Filee-9.9.9-win-Setup.exe' };
  assert.equal(findDownloadAsset({ tag_name: tag, assets: [planted] }, 'win-x64'), null);
  const extra = { ...windows, url: 'https://example.test/x.exe', mirror: 'https://example.test/' };
  assert.equal(findDownloadAsset({ tag_name: tag, assets: [extra] }, 'win-x64').url, mirrored);
});

test('the mirror URL follows the tag, not a mismatched asset name', () => {
  const other = asset('Filee-1.2.4-win-Setup.exe');
  assert.equal(findDownloadAsset({ tag_name: tag, assets: [other] }, 'win-x64'), null);
  const pre = 'v2.0.0-beta.1', name = 'Filee-2.0.0-beta.1-win-Setup.exe';
  const beta = { name, size: 1, browser_download_url: `https://github.com/KnifeLemon/Filee/releases/download/${pre}/${name}` };
  assert.equal(findDownloadAsset({ tag_name: pre, assets: [beta] }, 'win-x64').url, `https://dl.filee.sh/2.0.0-beta.1/${name}`);
});

test('an API failure and an unfinished check both retain an honest releases fallback', () => {
  assert.equal(downloadChoice(null, 'osx-arm64').state, 'checking');
  const failed = downloadChoice(null, 'osx-arm64', true);
  assert.equal(failed.state, 'unavailable');
  assert.equal(failed.asset, null);
  assert.equal(failed.url, RELEASES_URL);
});

test('macOS falls back to Apple silicon except for Chromium’s explicit architecture hint', async () => {
  assert.equal(guessTarget({ platform: 'MacIntel', userAgent: 'Mozilla/5.0' }), 'osx-arm64');
  assert.equal(macTargetFromArchitecture('arm'), 'osx-arm64');
  assert.equal(macTargetFromArchitecture('x86'), 'osx-x64');
  for (const value of ['', 'x86_64', 'arm64', 'unknown', null]) assert.equal(macTargetFromArchitecture(value), null);
  assert.equal(await chromiumMacTarget({ getHighEntropyValues: async () => ({ architecture: 'x86' }) }), 'osx-x64');
  assert.equal(await chromiumMacTarget({ getHighEntropyValues: async () => ({ architecture: 'arm' }) }), 'osx-arm64');
  assert.equal(await chromiumMacTarget({ getHighEntropyValues: async () => ({ architecture: 'x86_64' }) }), null);
  assert.equal(await chromiumMacTarget({ getHighEntropyValues: async () => { throw new Error('denied'); } }), null);
  assert.equal(await chromiumMacTarget(null), null);
});

test('a stored or manual selection cannot be replaced by a late architecture hint', () => {
  assert.equal(canRefineMacTarget({ selected: 'osx-arm64', savedTarget: false, manuallySelected: false }), true);
  assert.equal(canRefineMacTarget({ selected: 'osx-arm64', savedTarget: true, manuallySelected: false }), false);
  assert.equal(canRefineMacTarget({ selected: 'osx-arm64', savedTarget: false, manuallySelected: true }), false);
  assert.equal(canRefineMacTarget({ selected: 'osx-x64', savedTarget: false, manuallySelected: false }), false);
});

test('drafts, branch names and stale single-URL cache data are not release metadata', () => {
  for (const value of [null, { tag_name: 'main', assets: [] }, { ...release, draft: true },
    { tag, size: windows.size, url: windows.browser_download_url }])
    assert.throws(() => releaseSummary(value), /Invalid release metadata/);
});

test('pad.xml links the Windows files on the mirror when the build found them there, otherwise on GitHub', async () => {
  const { padXml } = await import('./src/pad.mjs');
  const file = (name, mirrored) => ({ name, size: 1000, mirrored });
  const urls = release => [...padXml(release).matchAll(/<(Primary|Secondary)_Download_URL>(.*?)</g)].map(m => m[2]);
  const base = { version: '1.2.3', date: '2026-11-04' };
  assert.deepEqual(urls({ ...base, setup: file('Filee-1.2.3-win-Setup.exe', true), portable: file('Filee-1.2.3-win-Portable.zip', true) }),
    ['https://dl.filee.sh/1.2.3/Filee-1.2.3-win-Setup.exe', 'https://dl.filee.sh/1.2.3/Filee-1.2.3-win-Portable.zip']);
  assert.deepEqual(urls({ ...base, setup: file('Filee-1.2.3-win-Setup.exe', false), portable: file('Filee-1.2.3-win-Portable.zip', true) }),
    ['https://github.com/KnifeLemon/Filee/releases/download/v1.2.3/Filee-1.2.3-win-Setup.exe',
      'https://dl.filee.sh/1.2.3/Filee-1.2.3-win-Portable.zip']);
  // A name the mirror doesn't carry stays on GitHub even when marked as mirrored.
  assert.deepEqual(urls({ ...base, setup: file('Filee-win-Setup.exe', true), portable: null }),
    ['https://github.com/KnifeLemon/Filee/releases/download/v1.2.3/Filee-win-Setup.exe',
      'https://github.com/KnifeLemon/Filee/releases/latest']);
});
