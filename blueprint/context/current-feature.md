# Allow eval in the production CSP so Bot Protection can run

**Type:** Fix

## The problem

Production reports a CSP violation in the browser console:

> Content Security Policy of your site blocks the use of 'eval' in JavaScript
> Source location `357vnktv4m2ai.js:1`, directive `script-src`, status blocked

That script is not ours. It does not appear in the repo or in `.next/`, and
neither `eval(` nor `new Function(` occurs anywhere in `app/`, `lib/`,
`components/` or `actions/`. It is served from our own origin under a randomised
path, which is how Vercel's Bot Protection injects its client script; the names
are randomised so they cannot be blocklisted.

`next.config.ts` puts `'unsafe-eval'` in `script-src` only when
`NODE_ENV === "development"`, for Turbopack's dev client. Production therefore
gets the tighter policy, and blocks the injected script's `eval`.

**Effect.** The site renders and the form submits, so this is not an outage. The
exposure is that Bot Protection cannot run its eval-based checks, so detection
degrades and visitors who should pass may be re-challenged. A mother who hits a
repeated security interstitial simply leaves.

## The fix

Move `'unsafe-eval'` out of the dev-only branch so it applies in both
environments, and record why it is there.

### Why this costs almost nothing

`script-src` already carries `'unsafe-inline'`, because the App Router injects
inline bootstrap scripts and this project has no middleware to thread a nonce
through. A `script-src` that allows arbitrary inline script provides essentially
no XSS protection already: an injected inline script runs regardless. Adding
`'unsafe-eval'` does not meaningfully lower a bar that is already on the floor.

The directives actually doing work are untouched: `frame-ancestors 'none'`
against clickjacking, which is the one that matters for a form collecting health
data, plus `object-src 'none'`, `base-uri 'self'` and `form-action 'self'`.

### The alternative, and why not

Dropping Bot Protection to Log would remove the injected script entirely and
also stop the 429 challenge responses. Not doing that: Bot Protection is
deliberate spam defence, and the honeypot only catches bots naive enough to fill
a hidden field. Weakening a directive that is already ineffective is the smaller
loss.

### What it must not break

The other CSP directives, the security headers beside them, and the region pin
in `vercel.json`.

## Build steps

Progress (survives a context clear):

- [x] Step 1 - allow eval in both environments and explain why

### Step 1 - allow eval in both environments and explain why

In `next.config.ts`, make `'unsafe-eval'` unconditional in `script-src`. Keep
`ws:` on `connect-src` dev-only; that one really is just Turbopack's HMR socket
and production has no use for it.

Rewrite the comment above the policy so the reason survives. It must say that
`'unsafe-eval'` is required by Vercel's injected Bot Protection script, not by
application code, and that removing it silently degrades bot detection rather
than breaking anything visibly. That failure mode is invisible in a build and in
a smoke test, so the comment is the only thing standing between a future tidy-up
and a repeat of this bug.

**Done when:** a production build serves a `script-src` containing both
`'unsafe-inline'` and `'unsafe-eval'`, `connect-src` still has no `ws:` in
production, the other four headers are unchanged, and `npm run build` passes.

## Verify

1. `npm run build`, then `npm run start`, and confirm the response headers show
   `script-src 'self' 'unsafe-inline' 'unsafe-eval'` with `connect-src 'self'`
2. Confirm `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`,
   `form-action 'self'` and the four non-CSP headers are unchanged
3. After deploy, reload production with the console open and confirm the eval
   violation is gone
4. Confirm the page still renders and the form still submits
