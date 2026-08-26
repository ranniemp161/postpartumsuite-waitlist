import Image from "next/image";

import { SiteFooter } from "@/components/site/SiteFooter";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
import mark from "@/public/logo-mark.webp";
import wordmark from "@/public/logo-text.webp";

export default function Home() {
  return (
    <>
      <main className="flex w-full flex-col items-center">
        <div className="page-column">
          {/* Two files rather than the combined artwork, so the mark can be
              resized without dragging the wordmark with it. The wordmark's alt
              text is load-bearing: it is the only thing carrying the page's one
              level-one heading to a screen reader or a search engine, which is
              why the mark beside it is marked decorative instead. */}
          <h1 className="site-lockup">
            <Image
              src={mark}
              alt=""
              aria-hidden="true"
              priority
              className="site-mark"
            />
            <Image
              src={wordmark}
              alt="The Postpartum Suite"
              priority
              className="site-wordmark"
            />
          </h1>

          <p className="tagline">
            &quot;Because Mum&apos;s Need Looking After Too&quot;
          </p>

          {/* Passed in rather than placed here, so it leaves with the form when
            the thank you replaces it. */}
          <WaitlistForm
            intro={
              <>
                <hr className="hairline" />

                <p className="intro-copy">
                  <strong>Join the waiting list.</strong>
                  <br />
                  Places are limited and offered in the order the waiting list
                  is received.
                </p>
              </>
            }
          />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
