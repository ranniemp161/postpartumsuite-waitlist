import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Fonts are self-hosted through next/font/google and the logo is a local file,
// so no external origin needs allowing and every directive can stay on 'self'.
//
// script-src carries 'unsafe-inline' because the App Router injects inline
// bootstrap and flight-payload scripts. Removing it means generating a nonce
// per request and threading it through middleware, which this project does not
// have. frame-ancestors is the directive actually doing the security work here
// and is unaffected by that compromise.
//
// 'unsafe-eval' is required in production too, and not by anything in this
// repo: Vercel's Bot Protection injects a client script under a randomised
// path that evals. Take it out and nothing visibly breaks. The build passes,
// the page renders, the form submits, and Bot Protection quietly stops running
// its checks, so real visitors get re-challenged and a tidy-up looks like a
// win. It costs almost nothing to keep, because a script-src that already
// allows arbitrary inline script gives essentially no XSS protection to lose.
//
// The HMR websocket on connect-src really is dev-only.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // Belt and braces with frame-ancestors, for anything that predates CSP.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
