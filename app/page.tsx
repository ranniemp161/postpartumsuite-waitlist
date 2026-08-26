import Image from "next/image";

import { SiteFooter } from "@/components/site/SiteFooter";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
import logo from "@/public/logo.png";

export default function Home() {
  return (
    <>
      <main className="flex w-full flex-col items-center">
        <div className="page-column">
          {/* Decorative: the h1 below carries the same words. The mark is drawn
              flat now, so it is an image rather than the masked relief stack. */}
          <Image
            src={logo}
            alt=""
            aria-hidden="true"
            priority
            className="site-logo mx-auto"
          />

          <h1 className="mt-[15px] text-center">The Postpartum Suite</h1>

          <p className="tagline">
            &quot;Because Mum Needs Looking After Too&quot;
          </p>

          {/* Passed in rather than placed here, so it leaves with the form when
            the thank you replaces it. */}
          <WaitlistForm
            intro={
              <>
                <hr className="hairline" />

                <p className="intro-copy">
                  Join the waiting list. We will let you know as soon as we are
                  live, Places are limited and dates are offered in the order
                  people join.
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
