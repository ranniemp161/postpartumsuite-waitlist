import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <nav className="site-footer-row">
        <a href="/privacy">Privacy policy</a>
        <span aria-hidden="true">&middot;</span>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </nav>

      <p className="site-footer-copy">
        &copy; {new Date().getFullYear()} {SITE_NAME}
      </p>
    </footer>
  );
}
