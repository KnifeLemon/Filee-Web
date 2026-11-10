export const DOWNLOAD_TARGETS = ['win-x64', 'linux-x64', 'linux-arm64', 'osx-arm64', 'osx-x64'];
export const RELEASES_URL = 'https://github.com/KnifeLemon/Filee/releases';
/**
 * The download mirror (Cloudflare R2): the signing script (build/sign-release.ps1 in the app's repository, step 5)
 * copies every release's Windows files to <MIRROR>/<version>/ and checks they are served there as is. GitHub's
 * download route is slow for some visitors (Filee#454). Linux and macOS files are on GitHub only.
 */
export const MIRROR = 'https://dl.filee.sh';
/** Targets whose builds are previews (labelled so in the download section). Linux is a full release since 2.0.0. */
export const PREVIEW_TARGETS = ['osx-arm64', 'osx-x64'];

const versionTag = /^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export function releaseSummary(release) {
  if (!release || release.draft || !versionTag.test(release.tag_name ?? '') || !Array.isArray(release.assets))
    throw new Error('Invalid release metadata');
  return {
    tag_name: release.tag_name,
    assets: release.assets.map(asset => ({
      name: asset.name,
      browser_download_url: asset.browser_download_url,
      size: Number.isSafeInteger(asset.size) && asset.size > 0 ? asset.size : 0,
    })),
  };
}

/** The Windows files the signing script copies to the mirror, for a version without the "v". */
const mirroredNames = version => [`Filee-${version}-win-Setup.exe`, `Filee-${version}-win-Portable.zip`];

/**
 * The mirror's address of a release file, or null when the mirror doesn't carry it (the Linux and macOS packages,
 * the legacy unversioned installer). Built only from the checked version and an exact file name, never from a URL.
 */
export function mirrorUrl(version, name) {
  if (!versionTag.test(version ?? '') || version.startsWith('v') || !mirroredNames(version).includes(name)) return null;
  const url = new URL(`${MIRROR}/${version}/${name}`);
  return url.pathname === `/${version}/${name}` && !url.search && !url.hash ? url.href : null;
}

/**
 * Finds a checked release asset by its exact expected name. url is the mirror's address when the mirror carries the
 * file, otherwise the GitHub asset; github is always the GitHub asset (the fallback link).
 */
function findReleaseAsset(release, target, names) {
  if (!DOWNLOAD_TARGETS.includes(target) || release?.draft
      || !versionTag.test(release?.tag_name ?? '') || !Array.isArray(release?.assets)) return null;
  const version = release.tag_name.replace(/^v/, '');
  for (const name of names) {
    for (const asset of release.assets.filter(item => item?.name === name)) {
      try {
        const url = new URL(asset.browser_download_url);
        const path = `/KnifeLemon/Filee/releases/download/${release.tag_name}/${name}`;
        if (url.origin !== 'https://github.com' || url.username || url.password || url.search || url.hash
            || decodeURIComponent(url.pathname) !== path) continue;
        return {
          name,
          url: mirrorUrl(version, name) ?? url.href,
          size: Number.isSafeInteger(asset.size) && asset.size > 0 ? asset.size : 0,
          github: url.href,
        };
      } catch { /* malformed asset URL */ }
    }
  }
  return null;
}

/** The main download: Setup on Windows, tar.gz on Linux and the native disk image on macOS. */
export function findDownloadAsset(release, target) {
  const version = release?.tag_name?.replace(/^v/, '');
  const macTarget = typeof target === 'string' && target.startsWith('osx-');
  const names = target === 'win-x64'
    ? [`Filee-${version}-win-Setup.exe`, 'Filee-win-Setup.exe']
    : macTarget
      ? [`Filee-${version}-${target}.dmg`]
      : [`Filee-${version}-${target}.tar.gz`];
  return findReleaseAsset(release, target, names);
}

/** The macOS package that supplies install.sh and the filee command; never a substitute for the main disk image. */
export function findDownloadArchive(release, target) {
  if (typeof target !== 'string' || !target.startsWith('osx-')) return null;
  const version = release?.tag_name?.replace(/^v/, '');
  return findReleaseAsset(release, target, [`Filee-${version}-${target}.tar.gz`]);
}

export function downloadChoice(release, target, failed = false) {
  const asset = findDownloadAsset(release, target);
  return {
    asset,
    archive: findDownloadArchive(release, target),
    url: asset?.url ?? RELEASES_URL,
    /** The same file on GitHub, offered next to the button when the button downloads from the mirror. */
    github: asset && asset.url !== asset.github ? asset.github : null,
    state: asset ? 'available' : failed ? 'unavailable' : release ? 'missing' : 'checking',
    development: PREVIEW_TARGETS.includes(target),
  };
}
