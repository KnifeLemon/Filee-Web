import assert from 'node:assert/strict';
import test from 'node:test';
import { downloadChoice, findDownloadAsset, releaseSummary, RELEASES_URL } from './src/downloads.mjs';

const tag = 'v1.2.3';
const asset = name => ({
  name,
  size: 42_000_000,
  browser_download_url: `https://github.com/KnifeLemon/Filee/releases/download/${tag}/${name}`,
});
const windows = asset('Filee-1.2.3-win-Setup.exe');
const linux = asset('Filee-1.2.3-linux-x64.tar.gz');
const linuxArm = asset('Filee-1.2.3-linux-arm64.tar.gz');
const macArm = asset('Filee-1.2.3-osx-arm64.tar.gz');
const macIntel = asset('Filee-1.2.3-osx-x64.tar.gz');
const release = releaseSummary({ tag_name: tag, assets: [macArm, linux, windows, macIntel, linuxArm] });

for (const [target, expected] of [
  ['win-x64', windows], ['linux-x64', linux], ['linux-arm64', linuxArm],
  ['osx-arm64', macArm], ['osx-x64', macIntel],
]) {
  test(`a mixed release selects the exact ${target} asset`, () => {
    assert.deepEqual(findDownloadAsset(release, target), {
      name: expected.name, url: expected.browser_download_url, size: expected.size,
    });
  });
}

test('a missing Unix build never falls back to the Windows installer', () => {
  const choice = downloadChoice({ tag_name: tag, assets: [windows] }, 'linux-x64');
  assert.equal(choice.state, 'missing');
  assert.equal(choice.asset, null);
  assert.equal(choice.url, RELEASES_URL);
});

test('an x64 asset cannot satisfy an ARM64 selection', () => {
  assert.equal(findDownloadAsset({ tag_name: tag, assets: [linux, macIntel] }, 'linux-arm64'), null);
  assert.equal(findDownloadAsset({ tag_name: tag, assets: [linux, macIntel] }, 'osx-arm64'), null);
});

test('published Unix assets remain development builds', () => {
  for (const target of ['linux-x64', 'linux-arm64', 'osx-x64', 'osx-arm64']) {
    const choice = downloadChoice(release, target);
    assert.equal(choice.state, 'available');
    assert.equal(choice.development, true);
  }
  assert.equal(downloadChoice(release, 'win-x64').development, false);
});

test('the legacy Windows filename is supported without a generic Setup.exe fallback', () => {
  const legacy = asset('Filee-win-Setup.exe');
  assert.equal(findDownloadAsset({ tag_name: tag, assets: [legacy] }, 'win-x64')?.name, legacy.name);
  assert.equal(findDownloadAsset({ tag_name: tag, assets: [legacy] }, 'linux-x64'), null);
  assert.equal(findDownloadAsset({ tag_name: tag, assets: [asset('Setup.exe')] }, 'win-x64'), null);
});

test('asset versions and filenames must match the selected release', () => {
  const assets = [asset('Filee-1.2.2-linux-x64.tar.gz'), asset('Filee-1.2.3-linux-x64-debug.tar.gz')];
  assert.equal(findDownloadAsset({ tag_name: tag, assets }, 'linux-x64'), null);
  assert.equal(findDownloadAsset(release, 'win-arm64'), null);
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
  });
}

test('an API failure and an unfinished check both retain an honest releases fallback', () => {
  assert.equal(downloadChoice(null, 'osx-arm64').state, 'checking');
  const failed = downloadChoice(null, 'osx-arm64', true);
  assert.equal(failed.state, 'unavailable');
  assert.equal(failed.asset, null);
  assert.equal(failed.url, RELEASES_URL);
});

test('drafts, branch names and stale single-URL cache data are not release metadata', () => {
  for (const value of [null, { tag_name: 'main', assets: [] }, { ...release, draft: true },
    { tag, size: windows.size, url: windows.browser_download_url }])
    assert.throws(() => releaseSummary(value), /Invalid release metadata/);
});
