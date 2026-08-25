# Feature: Design foundation

**From build-plan:** feature 1
**Status:** built, all steps verified; ready for /complete

## Goal

Transcribe the CSS specification into real code so every later feature is built on
a surface that is already correct: `@theme` tokens, four self-hosted fonts, the
`#kerf` SVG filter, generated paper and felt texture tiles, the logo mark, and the
site icon.

Ends with a blank paper page - ground, raised card, logo, heading, subcopy,
hairline rule - and nothing else. No form, no inputs, no button. The design is the
requirement the rest of the project is judged against, so it lands first and is
proved against the mockup before any behaviour is layered on.

## Design reference

**Authority: the two images in `UI-design/`.** Both plans name these as the source
of truth, and `coding-standards.md` designates `UI-design/` as the reference
folder, so they are linked here rather than copied into `blueprint/reference/`
(they total 13MB).

- [UI-design/design-token.png](UI-design/design-token.png) - the full CSS
  specification, 1920x7612, nine numbered sections. **This is the spec, not a
  mood board.** Sections 01-04 and 08 are in scope for this feature; 05-07 and 09
  belong to features 2-4.
- [UI-design/Homepage.png](UI-design/Homepage.png) - the rendered page. This
  feature builds the region from the top of the card down to the hairline rule.
- `UI-design/TSB FAVACON.png` - 800x800 RGBA, cream disc `#FBF7F2`, source for
  both the in-page mark and the site icon.

The exact values from the sections in scope are transcribed in **Appendix A**
below, so implementation reads text rather than re-reading a screenshot. Where the
appendix and the image disagree, the image wins.

## In scope

- Design tokens in `app/globals.css` (`@theme` plus `:root`), replacing the
  scaffold's palette and removing its `prefers-color-scheme` dark override
- Four Google fonts self-hosted through `next/font/google` at the exact axes and
  weights the spec pins
- The two texture tiles, generated and committed as WebP, plus the texture recipe
  that keeps them off content surfaces
- The `.paper` page ground and the `.card-raised` shadow ladder
- The logo mark at 104px and the site icon replacing the Next.js default
- The `#kerf` SVG filter, placed once in the document
- Heading, subcopy, and hairline rule - the type proof
- Deleting the scaffold's demo page, SVGs, and favicon

## Out of scope

- Any form field, label, well, pill, checkbox, or button (feature 2)
- The calendar popover and its tokens, spec section 06 (feature 3)
- The button inlay that *consumes* `#kerf`, spec section 07 (feature 2). This
  feature only places the filter and proves it renders.
- Validation, submit, confirmation panel (feature 4)
- `prefers-reduced-motion`, focus rings, aria wiring (features 2 and 7). Nothing
  in this feature is interactive.
- Responsive breakpoint work beyond the `clamp()` values the spec already supplies
  (feature 7)

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Strip the scaffold, lay the tokens.** Delete the demo `page.tsx`
  body, `public/{file,globe,next,vercel,window}.svg`, and the scaffold's `:root` /
  dark-mode block in `globals.css`. Write the full token set: colours and fonts in
  `@theme`, the composites (`--t-emb`, `--tile-paper`, `--tile-felt`) in `:root`.
  Set real `metadata` title and description in `layout.tsx`, and reconcile the
  scaffold's `h-full` / `min-h-full` classes with the spec's `min-height:100vh`
  page rule.
  *Done when:* `/` is a flat `#E2D7C6` page with no card and no scaffold content;
  no `prefers-color-scheme` rule survives anywhere; the browser tab title is no
  longer "Create Next App"; `npm run build` passes.

- [x] **Step 2 - Self-host the four fonts.** Load Bodoni Moda, EB Garamond, IM
  Fell English SC, and IBM Plex Sans 600 through `next/font/google` with the exact
  axes in Appendix A, expose them as CSS variables, and wire them into the
  `@theme` `--font-*` namespace. Set the `body` and `h1` base type rules.
  *Done when:* rendered `h1` computes to Bodoni Moda and `body` to EB Garamond;
  DevTools Network shows font files served from `/_next/static/media/` and **zero
  requests to `fonts.googleapis.com` or `fonts.gstatic.com`** (self-hosting is a
  privacy requirement here, not a performance one); `npm run build` passes.

- [x] **Step 3 - Generate and commit the texture tiles.** Add
  `scripts/generate-textures.mjs`, which rasterises an `feTurbulence` SVG to
  `public/textures/paper-tile.webp` and `public/textures/felt-tile.webp` at
  512x512, and declare `sharp` as a devDependency (it is currently only a
  transitive dependency of Next, so importing it directly without declaring it is
  not safe). Point `--tile-paper` and `--tile-felt` at the output. Add the
  `.paper` texture recipe from spec section 02.
  *Done when:* both WebP files exist and are under roughly 120KB each; the page
  ground shows visible paper grain; **tiling seams are invisible** when the page
  is scrolled at full width; the texture sits on `::before` at `z-index:0` under
  `z-index:1` content, so heading text is untouched by `soft-light`.

- [x] **Step 4 - The raised card.** Build `.card-raised`: 620px max-width, 5px
  radius, the `clamp()` padding triple, the seven-layer shadow ladder, and the
  felt tile at 512px / soft-light / 0.85. Render an empty card on the page.
  *Done when:* a screenshot of `/` next to `Homepage.png` shows the same card
  width, corner radius, and edge treatment - the top edge reads as a cut edge with
  a lit lip, not as a border; no `border` property appears anywhere in the card
  rule.

- [x] **Step 5 - Logo mark and site icon.** Copy `UI-design/TSB FAVACON.png` into
  the app under a space-free name (`public/logo-mark.webp`), render it at 104px
  with `mix-blend-mode:multiply` and `opacity:0.88`, and replace `app/favicon.ico`
  with an `app/icon.png` generated from the same source.
  *Done when:* the mark sits centred at the top of the card and the paper texture
  reads *through* the cream disc (the disc is not a visible flat circle); the
  browser tab shows the tps monogram, not the Next.js default; `app/favicon.ico`
  is gone.

- [x] **Step 6 - Heading, subcopy, hairline rule.** "The Postpartum Suite" at the
  spec's Bodoni values with the emboss text-shadow; the subcopy paragraph at
  17.5px/1.7 constrained to 38ch and centred; the hairline rule with its gradient
  and lit lip.
  *Done when:* heading, subcopy, and rule match `Homepage.png` in size, colour,
  and spacing at 1920px wide; the rule fades out at both ends rather than running
  edge to edge.

- [x] **Step 7 - Place the `#kerf` filter.** Add the zero-size `<svg>` holding
  `filter#kerf` once in `app/layout.tsx`, with attributes as JSX camelCase (see
  the trap in Notes).
  *Done when:* `document.querySelector('#kerf')` resolves; a temporary probe
  element with `filter:url(#kerf)` visibly roughens its edge (proving the filter
  is live, not merely present in the DOM), then the probe is removed;
  `npm run build` passes and the SVG adds no layout box.

## Files / areas

| Path | Change |
| --- | --- |
| `app/globals.css` | rewritten - tokens, `.paper`, `.card-raised`, type rules |
| `app/layout.tsx` | fonts, metadata, `#kerf` svg, page shell classes |
| `app/page.tsx` | scaffold demo replaced with card, logo, heading, subcopy, rule |
| `app/icon.png` | new - site icon |
| `app/favicon.ico` | deleted |
| `public/textures/paper-tile.webp` | new - generated |
| `public/textures/felt-tile.webp` | new - generated |
| `public/logo-mark.webp` | new - from `UI-design/TSB FAVACON.png` |
| `public/{file,globe,next,vercel,window}.svg` | deleted - scaffold leftovers |
| `scripts/generate-textures.mjs` | new - one-off asset generator |
| `package.json` | `sharp` added to devDependencies |

`scripts/` is a new top-level folder not listed in `coding-standards.md`. It holds
build-time tooling, not app code, so it sits outside the App Router tree rather
than under it.

## Data / contracts

No data model. The **CSS token names are the load-bearing contract** - features 2
through 7 reference them directly, so they are fixed here and renaming later is a
breaking change.

**In `@theme`** (Tailwind v4 generates utilities from these):

`--color-sheet` `--color-card` `--color-well` `--color-calendar`
`--color-btn-face` `--color-ink` `--color-ink-soft` `--color-head`
`--color-accent` `--color-label-white` `--color-placeholder`
`--font-display` `--font-body` `--font-label` `--font-ui` `--radius-card`

**In `:root`** (no Tailwind namespace fits these):

`--t-emb` (emboss text-shadow pair) `--tile-paper` `--tile-felt`

**Approved deviation, do not "fix" back to the mockup:** `--color-btn-face` is
`#4A6E92`, not the `#93A7B8` in `Homepage.png` and spec section 01. Section 09
supplies `#4A6E92` itself as its own AA fix (2.31:1 to roughly 4.6:1). The token
is defined in this feature; the button that uses it is feature 2.

**Styling convention this feature establishes.** Raw scale values (colour, font,
radius) go in `@theme` and are used as Tailwind utilities. Multi-declaration
material recipes that need pseudo-elements, blend modes, or a seven-layer shadow
ladder (`.paper`, `.card-raised`, the hairline rule) are component classes in
`@layer components` in `globals.css`, because they cannot be expressed as
utilities. Features 2 to 4 follow the same split for wells, pills, and the button.

## Testing

No test runner is configured, so the Blueprint test gate is off (see the Testing
section of `coding-standards.md`). This feature is pure presentation and would be
exempt regardless: there is no parser, validator, or formatter in it.

Evidence per step is the done-when above. The two that need more than a glance:

- **Step 2, self-hosting:** a Network tab filtered to `fonts.g` showing no
  requests. That is the privacy claim in the plan, so the empty filter is the
  evidence, not "the fonts look right".
- **Steps 4 and 6, fidelity:** a screenshot of `/` at 1920px placed beside the
  matching crop of `Homepage.png`. Prose cannot settle whether a shadow ladder is
  right.

`npm run build` is the automated gate at every step. There is no `Verify` command
and no `typecheck` script; `npm run build` type-checks as part of the build.

## Notes for the AI

- **Server components throughout.** Nothing here is interactive, so no
  `'use client'` should appear in this feature at all. If a step seems to need it,
  the step is wrong.
- **JSX attribute trap.** The filter attributes in the handoff image render as
  `sc-camel-base-frequency` and similar - an artifact of how the spec page
  displays them. The real SVG attributes are `baseFrequency`, `numOctaves`,
  `stitchTiles`, `xChannelSelector`, `yChannelSelector`, `stdDeviation`, and in
  JSX they are written in exactly that camelCase form.
- **`max-width:38ch` is body copy, not `<body>`.** Spec section 04 writes it on
  `body`, but the card is 620px wide and a 38ch `<body>` would break the layout.
  Apply it to the subcopy paragraph.
- **Depth is never a border.** If a `border` or `outline` shorthand appears on a
  surface in this feature, it is wrong. Every edge in this design is a shadow.
- **Light theme only.** The scaffold's `prefers-color-scheme` block is deleted,
  not overridden. No dark variant is specified anywhere.
- **Read the Next 16 font docs before step 2:**
  `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md`.
  Non-`wght` axes must be listed explicitly in `axes`, and italic must be
  requested through `style`, or it silently falls back.
- **The feTurbulence route failed and the fallback was taken.** sharp does
  rasterise `feTurbulence`, but librsvg **silently ignores `stitchTiles`**:
  measured seam ratios were identical with and without the attribute at every
  frequency (8.75 at the mottle frequency this design needs). `scripts/generate-textures.mjs`
  therefore generates periodic fractal value noise in Node, which wraps by
  construction. Encoding is per-tile: paper lossless because lossy webp
  reintroduced a seam the generator did not have, felt at q95 because grain that
  fine leaves nothing to smear.
- **The tiles are generated substitutes.** `paper-tile.webp` and `felt-tile.webp`
  were never delivered with the design, so the surface will be close to, not
  identical to, the original render. That is a known and accepted gap, recorded in
  the overview's open questions - do not treat a small mismatch as a bug.
- No em dashes in any generated content, per `coding-standards.md`.

---

## Appendix A - transcribed spec values

From `UI-design/design-token.png`, sections in scope. Verbatim, including the
values this project deliberately overrides.

### 01 - Tokens

```css
:root{
  /* paper stock - elevation ladder, light to dark by height */
  --sheet:       #E2D7C6;  /* page ground */
  --card:        #E8DFD1;  /* raised card */
  --well:        #CBBEA8;  /* pressed input well */
  --calendar:    #F6F0E6;  /* floating calendar popover */
  --btn-face:    #93A7B8;  /* RCW2F blue inlay */   <- built as #4A6E92

  /* ink */
  --ink:         #3B3227;  /* body copy */
  --ink-soft:    #6B5E4D;  /* secondary copy, placeholders #8A7D6C */
  --head:        #4A3F31;  /* headings + field labels */
  --accent:      #7A2E2E;  /* oxblood: focus ring, eyebrow */
  --label-white: #F3F7FB;  /* button label */

  /* emboss - one light source, upper left */
  --t-emb: 1px 1px 0 rgba(255,251,242,0.85),
           -1px -1px 1px rgba(70,50,34,0.35);

  /* texture tiles (repeating WebP, soft-light) */
  --tile-paper: url("assets/paper-tile.webp"); /* base sheet, mottled cartridge */
  --tile-felt:  url("assets/felt-tile.webp");  /* felt-marked stock: card, wells, button */
}
```

### 02 - Texture rule

The tile never goes on `background-image` of a surface that also holds content. It
goes on a full-bleed pseudo-element under the content, so blending cannot touch
the type. Parent gets `position:relative;isolation:isolate`; content gets
`position:relative;z-index:1`.

```css
.paper{ position:relative; isolation:isolate; background-color:var(--sheet); }
.paper::before{
  content:""; position:absolute; inset:0; z-index:0;
  background-image:var(--tile-paper);
  background-size:512px 512px;
  background-repeat:repeat;
  mix-blend-mode:soft-light;
  opacity:0.85;
  pointer-events:none;
}
.paper > *{ position:relative; z-index:1; }
```

| Surface | Tile | Scale | Blend | Strength |
| --- | --- | --- | --- | --- |
| page ground | tile-paper | 512px | soft-light | opacity .85 |
| card | tile-felt | 512px | soft-light | opacity .85 |
| button | tile-felt | 280px | soft-light | opacity .55 |
| input well | tile-felt | 280px | `background-blend-mode:soft-light` on the input itself | - |

### 03 - Layout and card

```css
/* page */
min-height:100vh; display:flex; align-items:flex-start; justify-content:center;
padding:clamp(28px,6vw,90px) clamp(14px,4vw,40px);
background-color:var(--sheet);

/* raised card (.card-raised ladder) */
box-sizing:border-box;
width:100%; max-width:620px;
border-radius:5px;
padding:clamp(34px,4.6vw,56px) clamp(24px,3.4vw,48px) clamp(36px,4.4vw,52px);
background-color:var(--card);
box-shadow:
  0 0 0 1px rgba(120,98,74,0.06),      /* silhouette ring, top edge never vanishes */
  0 1px 0   rgba(184,166,140,0.75),    /* cut edge, line 1 */
  0 2px 1px rgba(164,146,120,0.55),    /* cut edge, line 2 */
  0 4px 6px rgba(84,62,44,0.11),       /* contact shadow */
  0 9px 16px rgba(84,62,44,0.08),      /* cast shadow */
  inset 0 1px 0 rgba(250,243,229,0.50),/* lit top inner */
  -1px -1px 3px rgba(248,240,225,0.40);/* warm bounce, upper left */

/* internal rhythm */
form{ display:flex; flex-direction:column; gap:22px; }
label{ display:flex; flex-direction:column; gap:9px; }
hairline rule{ height:1px; margin:clamp(26px,3.4vw,38px) 0;
  background:linear-gradient(90deg,rgba(74,56,40,0) 0%,rgba(74,56,40,.22) 50%,rgba(74,56,40,0) 100%);
  box-shadow:0 1px 0 rgba(255,255,255,0.9); }
logo mark{ width:104px; height:104px; mix-blend-mode:multiply; opacity:0.88; }
```

### 04 - Type

Families: Bodoni Moda (display), EB Garamond (body), IM Fell English SC (labels),
IBM Plex Sans 600 (button label only).

```css
h1  font-family:'Bodoni Moda',Didot,Georgia,serif;
    font-optical-sizing:none; font-variation-settings:'opsz' 10;
    font-weight:520; font-size:clamp(30px,4.4vw,42px);
    line-height:1.1; letter-spacing:0.005em;
    color:var(--head); text-shadow:var(--t-emb);

body  font-family:'EB Garamond',Georgia,serif;
      font-size:17.5px; line-height:1.7; color:var(--ink-soft); max-width:38ch;

field label  font-family:'IM Fell English SC',Georgia,serif;
             font-size:12px; letter-spacing:0.16em; text-transform:uppercase;
             color:var(--head); text-shadow:var(--t-emb);

placeholder  color:#8A7D6C; font-style:italic; opacity:1;

consent copy font-size:16.5px; font-style:italic; line-height:1.55; color:var(--ink-soft);
```

Loader mapping for `next/font/google`:

| Family | Variable? | What to pass |
| --- | --- | --- |
| Bodoni Moda | yes | `axes: ['opsz']` - `opsz` is not `wght`, so it must be requested explicitly |
| EB Garamond | yes | `style: ['normal','italic']` - italic is used by placeholders and consent copy |
| IM Fell English SC | no | `weight: '400'` is required |
| IBM Plex Sans | **yes** (Next's font data lists `wght 100..700` plus a `wdth` axis; the appendix originally said no) | `weight: '600'` anyway, since one static face is a smaller payload for a single button label |

The spec's own Google Fonts URL, for cross-checking the axes:

```text
https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..600
  &family=IBM+Plex+Sans:wght@600&family=IM+Fell+English+SC&family=EB+Garamond:ital,wght@0,400..600&display=swap
```

### 08 - SVG filter and assets

Place once per document, anywhere; referenced by `filter:url(#kerf)`.

```html
<svg width="0" height="0" aria-hidden="true"><defs>
  <filter id="kerf" x="-30%" y="-30%" width="160%" height="160%">
    <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="5" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="1.3"
                       xChannelSelector="R" yChannelSelector="G" result="disp"/>
    <feGaussianBlur in="disp" stdDeviation="0.35"/>
  </filter>
</defs></svg>
```

Assets the spec expects:

- `paper-tile.webp` - 512px tile, base sheet, mottled cartridge. **Not delivered, generate.**
- `felt-tile.webp` - 512px tile, felt-marked stock. **Not delivered, generate.**
- `logo-mark.webp` - tps monogram, multiply at 0.88. Source is `UI-design/TSB FAVACON.png`.
