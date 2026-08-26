// Pure. Only the outward code is collected: the `SW7` of `SW7 2AZ`. A full UK
// postcode narrows to roughly fifteen addresses, effectively a household, while
// an outward code covers a district of roughly eight thousand. Storing only the
// outward half is what makes the location field proportionate to its purpose,
// which is deciding which areas to open in.

// The six shapes an outward code takes: A9, A99, A9A, AA9, AA99, AA9A. Real
// examples in the client's own target area include E4, E17, E1W and EC1A, so a
// pattern that assumes the code ends in a digit would reject genuine signups.
// Deliberately not checked against the list of real postcode areas: wrongly
// turning a visitor away costs far more than one odd row in the sheet.
const OUTWARD_PATTERN = /^[A-Z]{1,2}\d[A-Z\d]?$/;

// A full postcode is an outward code followed by the inward code, which is
// always a digit and two letters.
const FULL_PATTERN = /^([A-Z]{1,2}\d[A-Z\d]?)\d[A-Z]{2}$/;

// Index 0 is always a letter, so it is left alone and IG, IP and IV survive.
// Everywhere after it, a letter that should have been a digit is the one
// real-world typo worth repairing.
function swapLookalikes(value: string): string {
  return (
    value.slice(0, 1) + value.slice(1).replace(/O/g, "0").replace(/I/g, "1")
  );
}

// Returns the outward code, or null when the value is not a UK postcode at all.
// A full postcode is accepted and silently trimmed to its outward half: plenty
// of visitors will type the whole thing whatever the label says, and discarding
// the inward code here means the sensitive half never reaches the sheet.
export function normalisePostcodeOutward(input: string): string | null {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, "");

  for (const candidate of [cleaned, swapLookalikes(cleaned)]) {
    const full = FULL_PATTERN.exec(candidate);
    if (full) return full[1];
    if (OUTWARD_PATTERN.test(candidate)) return candidate;
  }
  return null;
}
