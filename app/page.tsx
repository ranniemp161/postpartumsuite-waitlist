import Image from "next/image";

import { WaitlistForm } from "@/components/waitlist/WaitlistForm";

export default function Home() {
  return (
    <div className="card-raised">
      {/* Decorative: the h1 immediately below carries the same words.
          unoptimized because the asset is already authored at exactly 3x the
          104px render box, so a runtime transform only costs a round trip. */}
      <Image
        src="/logo-mark.webp"
        alt=""
        width={104}
        height={104}
        priority
        unoptimized
        className="logo-mark mx-auto"
      />

      <h1 className="mt-[16px] text-center">Postpartum Suite</h1>

      <p 
        className="mx-auto mt-[8px] max-w-[38ch] text-center italic text-[#6b5e4d] text-[19px]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        &quot;Because Mum Needs Looking After Too&quot;
      </p>

      <hr className="hairline !my-[16px]" />

      <p className="mx-auto max-w-[42ch] text-center">
        Join the waiting list. We will let you know as soon as we are live, Places are limited and dates are offered in the order people join.
      </p>

      <hr className="hairline !my-[24px]" />

      <WaitlistForm />
    </div>
  );
}
