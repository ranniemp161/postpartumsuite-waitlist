import type { Metadata } from "next";
import { Bodoni_Moda, EB_Garamond, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// opsz is not wght, so it has to be requested explicitly or the h1's
// font-variation-settings:'opsz' 10 has no axis to move. wght comes with the
// variable font and carries the field labels at 700.
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

// The only sans on the page is the button label, which is light rather than the
// semibold the paper design used.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: "400",
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
      className={`${bodoni.variable} ${garamond.variable} ${plexSans.variable} antialiased`}
    >
      <body className="flex min-h-screen flex-col items-center px-[clamp(20px,9vw,40px)] py-[clamp(24px,6vw,72px)]">
        {children}
      </body>
    </html>
  );
}
