import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/site/SiteFooter";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy policy - ${SITE_NAME}`,
  description:
    "How The Postpartum Suite handles the details you give us when you join the waitlist.",
};

// TODO: this is a factual account of what the code actually does, written so
// the page is not empty at launch. It has not been reviewed by anyone
// qualified, and the retention period below is still undecided.
export default function PrivacyPolicy() {
  return (
    <>
      <main className="flex w-full flex-col items-center">
        <div className="card-raised policy">
          <h1 className="text-center">Privacy policy</h1>

          <p className="policy-lead">
            This page covers one thing: the waitlist form on this site. There
            are no accounts, no bookings and no payments here.
          </p>

          <hr className="hairline" />

          <h2>Who we are</h2>
          <p>
            {SITE_NAME} is the data controller for the details you give us on
            this site. You can reach us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>

          <h2>What we collect</h2>
          <p>Only what the form asks for:</p>
          <ul>
            <li>your first and last name</li>
            <li>your email address</li>
            <li>your phone number</li>
            <li>the month your baby is due</li>
            <li>whether this is your first, second, or third or later baby</li>
            <li>that you ticked the consent box, and when you ticked it</li>
          </ul>
          <p>
            We do not use analytics or advertising cookies, and the fonts on
            this site are served from our own domain, so visiting this page does
            not hand your details to anyone else.
          </p>

          <h2>Why we can hold it</h2>
          <p>
            Your due month and how many children you have are information about
            your pregnancy, which UK GDPR treats as health data and gives extra
            protection. We rely on your explicit consent for all of it. The box
            on the form is never pre-ticked, and we record the moment you tick
            it.
          </p>

          <h2>What we use it for</h2>
          <p>
            To contact you about postpartum care becoming available in your
            area, and to work out where demand is concentrated so we can decide
            where to open next. We do not sell it, and we do not use it to
            advertise to you.
          </p>

          <h2>Where it is kept</h2>
          <p>
            Your details are written to a private Google Sheet that only our
            team can open. Nobody outside the team is given access to it.
          </p>

          <h2>How long we keep it</h2>
          <p>
            Until we have opened in your area and been in touch, or until you
            ask us to remove you, whichever comes first. If you ask, we delete
            your row.
          </p>

          <h2>Your rights</h2>
          <p>
            You can ask us for a copy of what we hold, ask us to correct it, ask
            us to delete it, or withdraw your consent at any time. Withdrawing
            consent means we take you off the waitlist and stop contacting you.
            Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we
            will act on it.
          </p>
          <p>
            If you think we have handled your information badly, you can
            complain to the Information Commissioner&apos;s Office at
            ico.org.uk.
          </p>

          <hr className="hairline" />

          <p className="text-center">
            <Link href="/">Back to the waitlist</Link>
          </p>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
