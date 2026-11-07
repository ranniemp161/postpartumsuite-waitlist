// No mockup exists for this panel, so it is built from the card's own type
// scale rather than invented: the display face of the heading above it, one
// step down, over the same body copy the subheading uses.
// Only the first letter is raised, so "DeShawn" stays as typed. Display only:
// the stored name is untouched.
function capitaliseFirst(name: string): string {
  const [first = "", ...rest] = Array.from(name);
  return first.toLocaleUpperCase() + rest.join("");
}

export function ConfirmationPanel({ firstName }: { firstName: string }) {
  return (
    // The form it replaced is gone from the page, so nothing else would tell a
    // screen reader that the submit worked.
    <div className="confirm-panel" role="status">
      <h2 className="confirm-title">Thank you, {capitaliseFirst(firstName)}</h2>

      <p>You&apos;re on the waitlist. Our programme details are on their way.</p>

      <p className="confirm-strong">Please check your inbox.</p>

      <p>
        <strong>Can&apos;t see it?</strong> Please check your{" "}
        <strong>junk folder.</strong>
      </p>
    </div>
  );
}
