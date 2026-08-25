import { SiteFooter } from "@/components/site/SiteFooter";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";

export default function Home() {
  return (
    <>
      <div className="card-raised">
        {/* Section 19's blind deboss: three masked copies of the mark, not an
            <img>, so the relief is real rather than baked into the asset.
            Decorative, because the h1 below carries the same words. */}
        <div className="logo-deboss mx-auto" aria-hidden="true">
          <span className="ld-shadow" />
          <span className="ld-light" />
          <span className="ld-main" />
        </div>

        <h1 className="mt-[16px] text-center">The Postpartum Suite</h1>

        <p className="tagline">
          &quot;Because Mum Needs Looking After Too&quot;
        </p>

        {/* Passed in rather than placed here, so it leaves with the form when
            the thank you replaces it. */}
        <WaitlistForm
          intro={
            <>
              <p className="mx-auto mt-[26px] max-w-[42ch] text-center">
                Join the waiting list. We will let you know as soon as we are
                live, Places are limited and dates are offered in the order
                people join.
              </p>

              <hr className="hairline !my-[24px]" />
            </>
          }
        />
      </div>

      <SiteFooter />
    </>
  );
}
