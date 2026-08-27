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
// Turbopack's dev client evaluates generated code and talks to an HMR
// websocket, neither of which a production build does.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
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
