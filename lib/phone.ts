// Pure. The sheet column is E.164, so a number typed any of the ways a UK
// visitor types one has to land on a single canonical string.

export const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

// The trunk prefix is the point: "07700 900123" and "+44 7700 900123" are the
// same number, and only one of them can reach the sheet.
export function nationalDigits(national: string, countryCode = ""): string {
  let digits = national.replace(/\D/g, "").replace(/^00/, "");
  if (countryCode && digits.startsWith(countryCode)) {
    digits = digits.slice(countryCode.length);
  }
  return digits.replace(/^0+/, "");
}

export function toE164(dialCode: string, national: string): string {
  const country = dialCode.replace(/\D/g, "");
  return `+${country}${nationalDigits(national, country)}`;
}
