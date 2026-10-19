// Builds a translation dictionary for catalog.mjs from [English, translation] pairs (template literals, so quotes need
// no escaping). An English text listed twice is an error: the second translation would silently win.

export function dictionary(pairs) {
  const out = {};
  for (const [en, text] of pairs) {
    if (Object.hasOwn(out, en)) throw new Error(`Translated twice: "${en}"`);
    out[en] = text;
  }
  return out;
}
