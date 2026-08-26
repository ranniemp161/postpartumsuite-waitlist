// Pure. The sheet column is E.164, so a number typed any of the ways a UK
// visitor types one has to land on a single canonical string.

// Ofcom's numbering plan, reduced to what a contact number can be. The national
// significant number is what survives stripping the trunk 0 or the +44: ten
// digits for mobiles and for almost every geographic and non-geographic range,
// with nine allowed only in the handful of 01 areas that never grew a tenth.
// 0 is the trunk prefix, and 4, 5 and 6 are not allocated to subscribers, so a
// number leading with any of them is a typo rather than a number we cannot
// reach.
export function isValidUkNsn(nsn: string): boolean {
  if (!/^[123789]\d+$/.test(nsn)) return false;
  if (nsn.startsWith("1")) return nsn.length === 9 || nsn.length === 10;
  return nsn.length === 10;
}

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
