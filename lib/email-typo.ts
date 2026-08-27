// Pure. Catches the class of mistake a format check cannot see: an address that
// is perfectly well-formed but was typed slightly wrong, so it belongs to
// nobody. A signup we cannot reach is a signup we did not get, and the visitor
// has no way to discover the mistake once the confirmation panel has thanked her.

// Endings that no registry has ever issued, every one a slip from an adjacent
// key on .com, .net or .org. Rejecting these is safe in a way that guessing at
// a domain never is: there is no address behind them to turn away.
const IMPOSSIBLE_TLDS = new Set([
  "con",
  "cim",
  "cin",
  "cmo",
  "cpm",
  "coom",
  "comm",
  "ocm",
  "vom",
  "xom",
  "ner",
  "nte",
  "nrt",
  "ogr",
  "orh",
  "ort",
]);

// UK-skewed on purpose: this list only has to cover the providers our visitors
// actually use, and a domain that is not on it is simply never second-guessed.
const COMMON_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "live.com",
  "live.co.uk",
  "msn.com",
  "yahoo.com",
  "yahoo.co.uk",
  "ymail.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "btinternet.com",
  "sky.com",
  "virginmedia.com",
  "ntlworld.com",
  "blueyonder.co.uk",
  "talktalk.net",
  "gmx.com",
  "mail.com",
  "protonmail.com",
  "proton.me",
];

function splitEmail(email: string): { local: string; domain: string } | null {
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) return null;
  return { local: email.slice(0, at), domain: email.slice(at + 1) };
}

function distance(a: string, b: string): number {
  // Row-at-a-time Levenshtein. The strings are domain names, so the quadratic
  // cost is a few hundred operations at worst.
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const substitution = previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, substitution);
    }
    previous = current;
  }
  return previous[b.length];
}

// One edit for a short domain, two for a longer one. A fixed threshold of two
// would offer "sky.com" to anyone at "ski.com" or "sly.com", which are real.
function threshold(domain: string): number {
  return domain.length <= 8 ? 1 : 2;
}

// Returns the whole corrected address rather than the domain, because that is
// what both the message and the accept button need.
export function suggestEmail(email: string): string | null {
  const parts = splitEmail(email.trim().toLowerCase());
  if (!parts) return null;

  const { local, domain } = parts;
  if (COMMON_DOMAINS.includes(domain)) return null;

  let best: { domain: string; distance: number } | null = null;

  for (const candidate of COMMON_DOMAINS) {
    const gap = distance(domain, candidate);
    if (gap > threshold(candidate)) continue;
    if (!best || gap < best.distance) best = { domain: candidate, distance: gap };
  }

  return best ? `${local}@${best.domain}` : null;
}

// Separate from the suggestion because the two carry different weight: an
// impossible ending is grounds to refuse the address, a near-miss on a known
// provider is only grounds to ask.
export function impossibleTld(email: string): string | null {
  const parts = splitEmail(email.trim().toLowerCase());
  if (!parts) return null;

  const tld = parts.domain.slice(parts.domain.lastIndexOf(".") + 1);
  return IMPOSSIBLE_TLDS.has(tld) ? tld : null;
}
