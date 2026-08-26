// The option lists the form renders. Feature 4's schema and feature 5's sheet
// writer read the same constants, so a code added here stays accepted end to end.

// The integer is the record; the label is display only and never reaches the
// sheet. 3 is the open end of the scale, "third or more", so a fourth or later
// baby is also recorded as 3.
export const PARITY_OPTIONS = [
  { value: 1, label: "First" },
  { value: 2, label: "Second" },
  { value: 3, label: "Third or more" },
] as const;

// One country. The form renders this as a fixed prefix rather than a menu,
// because a select holding a single option is a control that cannot do
// anything. Adding a second country means restoring that select too.
export const UK_DIAL_CODE = "+44";

// The recorded value, narrowed. Feature 4's schema and feature 5's sheet writer
// both depend on this staying 1 to 3.
export type Parity = (typeof PARITY_OPTIONS)[number]["value"];
