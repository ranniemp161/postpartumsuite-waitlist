import Image from "next/image";

import { SiteFooter } from "@/components/site/SiteFooter";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
import logo from "@/public/logo.webp";

export default function Home() {
  return (
    <>
      <main className="flex w-full flex-col items-center">
        <div className="page-column">
          {/* The wordmark lives inside the artwork now, so the h1 is a frame for
              it rather than type. The alt text is load-bearing: it is the only
              thing left carrying the page's one level-one heading to a screen
              reader or a search engine. */}
          <h1 className="site-lockup">
            <Image src={logo} alt="The Postpartum Suite" priority />
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
