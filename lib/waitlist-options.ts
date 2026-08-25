// The option lists the form renders. Feature 4's schema and feature 5's sheet
// writer read the same constants, so a code added here stays accepted end to end.

// The integer is the record; the label is display only and never reaches the
// sheet. 5 means "fifth or more".
export const PARITY_OPTIONS = [
  { value: 1, label: "First" },
  { value: 2, label: "Second" },
  { value: 3, label: "Third" },
  { value: 4, label: "Fourth or more" },
] as const;

export const DIAL_CODES = [
  { code: "+44", label: "UK +44" },
  { code: "+353", label: "IE +353" },
] as const;

export const DEFAULT_DIAL_CODE = "+44";

// The recorded value, narrowed. Feature 4's schema and feature 5's sheet writer
// both depend on this staying 1 to 5.
export type Parity = (typeof PARITY_OPTIONS)[number]["value"];
