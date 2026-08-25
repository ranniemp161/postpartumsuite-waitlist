// No mockup exists for this panel, so it is built from the card's own type
// scale rather than invented: the display face of the heading above it, one
// step down, over the same body copy the subheading uses.
export function ConfirmationPanel({ firstName }: { firstName: string }) {
  return (
    // The form it replaced is gone from the page, so nothing else would tell a
    // screen reader that the submit worked.
    <div className="confirm-panel" role="status">
      <h2 className="confirm-title">Thank you, {firstName}</h2>

      <p>
        You are on the waitlist. We will be in touch with you as soon as we go
        live.
      </p>
    </div>
  );
}
