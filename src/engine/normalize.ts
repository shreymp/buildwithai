// Builds a normalized copy of a message for matching, plus a map from every normalized
// character back to its original index, so highlights land on exactly what was pasted.

/** Look-alike letters from other scripts that scammers swap in to dodge filters. */
const CONFUSABLES: Record<string, string> = {
  // Cyrillic lowercase
  а: 'a', в: 'b', е: 'e', ё: 'e', к: 'k', м: 'm', н: 'h', о: 'o', р: 'p', с: 'c', т: 't', у: 'y', х: 'x', ѕ: 's', і: 'i', ї: 'i', ј: 'j', ԁ: 'd', ӏ: 'l', ɡ: 'g', ԛ: 'q', ԝ: 'w',
  // Cyrillic uppercase
  А: 'a', В: 'b', Е: 'e', Ё: 'e', К: 'k', М: 'm', Н: 'h', О: 'o', Р: 'p', С: 'c', Т: 't', У: 'y', Х: 'x', Ѕ: 's', І: 'i', Ї: 'i', Ј: 'j', Ԁ: 'd', Ӏ: 'l', Ԛ: 'q', Ԝ: 'w',
  // Greek
  α: 'a', ο: 'o', ρ: 'p', ν: 'v', τ: 't', ι: 'i', κ: 'k', χ: 'x', Α: 'a', Β: 'b', Ε: 'e', Ζ: 'z', Η: 'h', Ι: 'i', Κ: 'k', Μ: 'm', Ν: 'n', Ο: 'o', Ρ: 'p', Τ: 't', Υ: 'y', Χ: 'x',
};

/** One-character replacements that keep string length (so they never disturb offsets). */
const SAME_LENGTH: Record<string, string> = {
  '‘': "'", '’': "'", '‚': "'", '‛': "'", '′': "'",
  '“': '"', '”': '"', '„': '"', '″': '"',
  ' ': ' ', ' ': ' ', ' ': ' ', ' ': ' ', ' ': ' ', '　': ' ',
  '\n': ' ', '\r': ' ', '\t': ' ',
  '–': '-', '—': '-', '−': '-',
  '＄': '$',
};

const INVISIBLE = /[​-‏⁠﻿‪-‮⁦-⁩­]/;

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i', '|': 'l' };

export interface Normalized {
  norm: string;
  /** map[i] = index in the original string of normalized char i. Length = norm.length + 1 (end sentinel). */
  map: number[];
  original?: string;
}

/** Applies a regex replacement to `s` while keeping the offset map in sync. */
function rewrite(s: string, map: number[], re: RegExp, fn: (m: string) => string): { s: string; map: number[] } {
  let out = '';
  const outMap: number[] = [];
  let last = 0;
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m[0].length === 0) { re.lastIndex++; continue; }
    for (let i = last; i < m.index; i++) { out += s[i]; outMap.push(map[i]); }
    const rep = fn(m[0]);
    if (rep.length === m[0].length) {
      for (let k = 0; k < rep.length; k++) { out += rep[k]; outMap.push(map[m.index + k]); }
    } else {
      // Spread the replacement over the original span: every output char points at the
      // start of the matched span except the last, which points at the span's last char.
      for (let k = 0; k < rep.length; k++) {
        out += rep[k];
        outMap.push(k === rep.length - 1 ? map[m.index + m[0].length - 1] : map[m.index + Math.min(k, m[0].length - 1)]);
      }
    }
    last = m.index + m[0].length;
  }
  for (let i = last; i < s.length; i++) { out += s[i]; outMap.push(map[i]); }
  outMap.push(map[s.length]);
  return { s: out, map: outMap };
}

export function normalize(original: string): Normalized {
  // Pass 1: per-character cleanup, one code point at a time (same length or deletion).
  let s = '';
  let map: number[] = [];
  for (let i = 0; i < original.length; ) {
    const cp = original.codePointAt(i)!;
    const unit = cp > 0xffff ? 2 : 1;
    let c = original.slice(i, i + unit);
    if (INVISIBLE.test(c)) { i += unit; continue; }
    c = SAME_LENGTH[c] ?? CONFUSABLES[c] ?? c;
    if (cp > 0x7f && c.length === unit) {
      // Compatibility forms: full-width "ｗｈａｔｓａｐｐ", math bold "𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽", circled letters,
      // ligatures. Folded only when the result is plain ASCII, so accented letters stay put.
      const k = c.normalize('NFKC');
      if (k !== c && k.length <= 3 && /^[\x20-\x7e]+$/.test(k)) c = k;
    }
    // Push one map entry per UTF-16 unit added, so an emoji (two units) keeps the map aligned.
    for (const ch of c) {
      const out = ch.toLowerCase().length === ch.length ? ch.toLowerCase() : ch;
      s += out;
      for (let k = 0; k < out.length; k++) map.push(i + (out.length === unit ? k : 0));
    }
    i += unit;
  }
  map.push(original.length);

  // Pass 2: collapse spaced or dotted single letters: "t e l e g r a m", "w.h.a.t.s.a.p.p".
  ({ s, map } = rewrite(s, map, /\b(?:[a-z][ .\-_*]{1,2}){3,40}[a-z]\b/g, (m) => m.replace(/[ .\-_*]/g, '')));

  // Pass 3: leetspeak inside words that contain at least one letter and don't look like money or times.
  // Only symbols with a letter on both sides are swapped ("tra1ning", "t3legram", "pa$$word"),
  // so prices ("$45"), times ("10am"), handles ("maria1990") and punctuation ("hi!") stay intact.
  // An "@" followed by a domain is an email address, not a leet "a", so it ends the word.
  ({ s, map } = rewrite(s, map, /(?:[a-z0-9$!|]|@(?![a-z0-9-]{1,63}\.[a-z]))(?:[a-z0-9$!|]|@(?![a-z0-9-]{1,63}\.[a-z])){2,39}/g, (w) => {
    if (!/[a-z]/.test(w) || !/[0-9@$!|]/.test(w)) return w;
    const chars = [...w];
    const isLetter = (c: string | undefined) => !!c && /[a-z]/.test(c);
    for (let i = 1; i < chars.length - 1; i++) {
      if (!LEET[chars[i]]) continue;
      // look past runs of leet chars ("pa$$word") to the nearest non-leet neighbours
      let l = i - 1; while (l >= 0 && LEET[chars[l]] && !isLetter(chars[l])) l--;
      let r = i + 1; while (r < chars.length && LEET[chars[r]] && !isLetter(chars[r])) r++;
      if (isLetter(chars[l]) && isLetter(chars[r])) chars[i] = LEET[chars[i]];
    }
    return chars.join('');
  }));

  // Pass 4: common split brand words.
  ({ s, map } = rewrite(s, map, /\bwhats ?-?app\b|\btele ?-?gram\b|\bsig ?-?nal app\b/g, (m) => m.replace(/[ -]/g, '')));

  return { norm: s, map, original };
}

/** Maps a [start, end) range in normalized text back to the original string. */
export function toOriginal(n: Normalized, start: number, end: number): [number, number] {
  const a = n.map[start];
  const lastChar = n.map[Math.max(start, end - 1)];
  // A folded "𝗽" is two UTF-16 units in the original; never end between them.
  return [a, n.original && isHighSurrogate(n.original.charCodeAt(lastChar)) ? lastChar + 2 : lastChar + 1];
}

function isHighSurrogate(code: number): boolean {
  return code >= 0xd800 && code <= 0xdbff;
}
