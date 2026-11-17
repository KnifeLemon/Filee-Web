// Chooses a download target from browser information. macOS stays Apple silicon unless Chromium reports a precise
// architecture: Safari and Firefox intentionally expose the same legacy Mac platform on Intel and Apple silicon.

export function guessTarget({ platform = '', userAgent = '' } = {}) {
  const normalizedPlatform = platform.toLowerCase();
  const normalizedAgent = userAgent.toLowerCase();
  if (normalizedPlatform.includes('mac')) return 'osx-arm64';
  if (normalizedPlatform.includes('linux') && !normalizedAgent.includes('android'))
    return /aarch64|arm64/.test(normalizedPlatform + normalizedAgent) ? 'linux-arm64' : 'linux-x64';
  return 'win-x64';
}

/** Only exact Chromium Client Hint values refine the deliberate macOS Apple-silicon fallback. */
export function macTargetFromArchitecture(architecture) {
  switch (typeof architecture === 'string' ? architecture.toLowerCase() : '') {
    case 'arm': return 'osx-arm64';
    case 'x86': return 'osx-x64';
    default: return null;
  }
}

/** Gets an explicit Chromium macOS architecture when available; callers keep their existing target on null. */
export async function chromiumMacTarget(userAgentData) {
  if (typeof userAgentData?.getHighEntropyValues !== 'function') return null;
  try {
    const { architecture } = await userAgentData.getHighEntropyValues(['architecture']);
    return macTargetFromArchitecture(architecture);
  } catch {
    return null;
  }
}

/** A stored or explicit target always wins over a late browser hint. */
export function canRefineMacTarget({ selected, savedTarget, manuallySelected }) {
  return selected === 'osx-arm64' && !savedTarget && !manuallySelected;
}
