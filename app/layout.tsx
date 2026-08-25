import type { Metadata } from "next";
import {
  Bodoni_Moda,
  EB_Garamond,
  IBM_Plex_Sans,
  IM_Fell_English_SC,
} from "next/font/google";
import "./globals.css";

// opsz is not wght, so it has to be requested explicitly or the h1's
// font-variation-settings:'opsz' 10 has no axis to move.
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  axes: ["opsz"],
});

// Italic is used by placeholders and the consent copy, so both styles ship.
const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const imFell = IM_Fell_English_SC({
  variable: "--font-imfell",
  subsets: ["latin"],
  weight: "400",
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: "600",
});

export const metadata: Metadata = {
  title: "The Postpartum Suite",
  description:
    "Join the wait list and we will be in touch as places open in your area.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodoni.variable} ${garamond.variable} ${imFell.variable} ${plexSans.variable} antialiased`}
    >
      <body className="paper flex min-h-screen flex-col items-center px-[clamp(14px,4vw,40px)] py-[clamp(28px,6vw,90px)]">
        {/* kerf: roughens a seam so it stops following the vector outline.
            Consumed by the button's cut in feature 2 via filter:url(#kerf).
            Lives here because a filter needs to exist once per document, and
            width/height 0 keeps it out of layout. */}
        <svg width="0" height="0" aria-hidden="true" focusable="false">
          <defs>
            <filter id="kerf" x="-30%" y="-30%" width="160%" height="160%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="1.1"
                numOctaves="2"
                seed="5"
                result="n"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="n"
                scale="1.3"
                xChannelSelector="R"
                yChannelSelector="G"
                result="disp"
              />
              <feGaussianBlur in="disp" stdDeviation="0.35" />
            </filter>
          </defs>
        </svg>

        {children}
      </body>
    </html>
  );
}
