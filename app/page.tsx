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

      {/* The gaps below the mark are not in the CSS spec's rhythm section; they
          are measured off Homepage.png. */}
      <h1 className="mt-[20px] text-center">The Postpartum Suite</h1>

      <p className="mx-auto mt-[20px] max-w-[38ch] text-center">
        Join the wait list and we will be in touch.
      </p>

      <hr className="hairline" />

      <WaitlistForm />
    </div>
  );
}
