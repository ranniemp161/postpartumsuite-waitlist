# The Postpartum Suite — Design System Spec

Portable extract of `design-elements.html`. Paste this whole file into Claude Design (or hand to a developer) to rebuild the confirmed system without the 4.8MB of embedded texture images.

Style name: **paper neumorphism**. Everything sits on a sheet of paper. Some things are pressed into it, some are raised off it, some are cut flush into it. Nothing floats.

---

## 1. The three governing rules

1. **Only headlines and buttons take an impression.** Body copy is ink sitting on the surface. No shadow, no filter.
2. **Texture and blend modes never touch a photograph's pixels.** Treatments apply to the mount, border, or frame only. The `img` is always plain.
3. **Light comes from the upper left**, azimuth 225, elevation 48. Every shadow, rim, and specular in the system agrees with that one source.

---

## 2. Colour tokens

```
--ink:       #1E1A16   body text, primary
--ink-soft:  #5C5247   micro copy, secondary
--ink-head:  #16110C   headlines only, one step darker than body
--paper:     #F2EBDF   page sheet, the lightest stock
--sheet:     #E2D7C6   base textured sheet, the working surface
--card:      #E8DFD1   raised card, one step up the elevation ladder
--well:      #D6CAB6   sunk form fields
--outer:     #DDD2C2   the ground behind the sheet
--accent:    #7A2E2E   eyebrow labels, links, emphasis
--emphasis:  #6E2020   italic <em> inside headlines
--foil:      #87652F   outline button borders, foil stamp
```

Elevation ladder: outer `#DDD2C2` to sheet `#E2D7C6` to card `#E8DFD1` to button face `#EDE4D8`. Grain pattern and scale change between levels, not just the colour, so surfaces read as different stock rather than the same paper repeated.

---

## 3. Typography

Four faces, all Google Fonts, all free for commercial use.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..600&family=EB+Garamond:ital,wght@0,400..600;1,400..500&family=IM+Fell+English+SC&display=swap" rel="stylesheet">
```

| Role | Face | Notes |
|---|---|---|
| Headlines | Bodoni Moda | optical size pinned to 10, weight 520 |
| Body | EB Garamond | 18.5px, line height 1.8 |
| Sub heads, labels | IM Fell English SC | small caps, regular only, no bold exists |
| Button label | IBM Plex Sans | 600 weight, uppercase |
| Wordmark | Bodoni Moda | low optical size, wide tracked caps, three stacked lines |

### Headline

```css
.head{
  margin:0; text-align:center;
  font-family:'Bodoni Moda',Didot,Georgia,serif;
  font-optical-sizing:none;
  font-variation-settings:'opsz' 10;
  font-weight:520;
  text-wrap:balance;
  color:#16110C;
  line-height:1.04;
  letter-spacing:-0.005em;
  text-shadow:1px 1px 0 rgba(252,246,233,0.90),
             -1px -1px 1px rgba(70,50,34,0.40);
  filter:url(#letterpress);
}
.head em{font-style:italic; color:#6E2020}
.head.lg{font-size:clamp(40px,6vw,82px); max-width:17ch}
.head.sm{font-size:clamp(30px,3.6vw,46px); max-width:22ch; line-height:1.08}
```

### Body, sub head, eyebrow, micro copy

```css
/* body — flat ink, no impression */
.body{margin:0; max-width:34em; font-family:'EB Garamond',Georgia,serif;
  font-size:18.5px; line-height:1.8; color:#1E1A16}
.body + .body{margin-top:18px}

/* sub heading */
.subhead{margin:0; font-family:'IM Fell English SC',Georgia,serif;
  font-weight:400; font-size:21px; letter-spacing:0.06em; color:#1E1A16;
  text-shadow:1px 1px 0 rgba(255,255,255,0.9),
             -1px -1px 1px rgba(84,62,44,0.22)}

/* eyebrow label — no impression at all */
.eyebrow{margin:0; font-family:'IM Fell English SC',Georgia,serif;
  font-size:13px; letter-spacing:0.14em; color:#7A2E2E}

/* micro copy — under every CTA, in the footer, under fields */
.micro{margin:0; font-family:'EB Garamond',Georgia,serif;
  font-size:16px; font-style:italic; color:#5C5247}
```

---

## 4. SVG filters (required)

Drop this once, inline, near the top of `body`. Nothing that presses into the paper works without it.

```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>

<!-- letterpress: glyph scale -->
<filter id="letterpress" x="-25%" y="-25%" width="150%" height="150%"
        color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="9" result="fibre"/>
  <feDisplacementMap in="SourceGraphic" in2="fibre" scale="0.9"
                     xChannelSelector="R" yChannelSelector="G" result="rough"/>
  <feGaussianBlur in="rough" stdDeviation="0.8" result="height"/>
  <feSpecularLighting in="height" surfaceScale="-5" specularConstant="0.72"
                      specularExponent="20" lighting-color="#FFF6E6" result="spec">
    <feDistantLight azimuth="225" elevation="48"/>
  </feSpecularLighting>
  <feComposite in="spec" in2="rough" operator="in" result="specClip"/>
  <feComposite in="rough" in2="specClip" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
</filter>

<!-- letterpress-lg: artwork at 200px and above, coarser fibre, deeper press -->
<filter id="letterpress-lg" x="-25%" y="-25%" width="150%" height="150%"
        color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.25" numOctaves="3" seed="9" result="fibre"/>
  <feDisplacementMap in="SourceGraphic" in2="fibre" scale="3"
                     xChannelSelector="R" yChannelSelector="G" result="rough"/>
  <feGaussianBlur in="rough" stdDeviation="2.2" result="height"/>
  <feSpecularLighting in="height" surfaceScale="-11" specularConstant="0.8"
                      specularExponent="14" lighting-color="#FFF6E6" result="spec">
    <feDistantLight azimuth="225" elevation="48"/>
  </feSpecularLighting>
  <feComposite in="spec" in2="rough" operator="in" result="specClip"/>
  <feComposite in="rough" in2="specClip" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
</filter>

<!-- kerf: roughens the inlay button's cut seam so it is not a vector perfect line -->
<filter id="kerf" x="-30%" y="-30%" width="160%" height="160%">
  <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="5" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="1.3"
                     xChannelSelector="R" yChannelSelector="G" result="disp"/>
  <feGaussianBlur in="disp" stdDeviation="0.35"/>
</filter>

</defs></svg>
```

---

## 5. Paper texture

`design-elements.html` uses scanned paper photographs as base64 webp tiles. That is the entire reason the file is 4.8MB and it is not portable. The original canvas files generated equivalent grain from SVG turbulence at near zero weight. Use the turbulence approach, and keep the scans only for final production if the difference is visible enough to matter.

```css
/* base sheet — apply to any full width surface */
.sheet{
  --c:#E2D7C6; --s:512px; --o:0.85;
  --tile:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='ns'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='4'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23ns)' opacity='0.42'/%3E%3C/svg%3E");
  background-color:var(--c);
  position:relative; isolation:isolate;
}
.sheet::after{
  content:""; position:absolute; inset:0; z-index:0;
  background-image:var(--tile);
  background-size:var(--s) var(--s);
  background-repeat:repeat;
  mix-blend-mode:soft-light;
  opacity:var(--o);
  pointer-events:none;
}
.sheet > *{position:relative; z-index:1}
```

Tile scales in use: sheet 512px, raised card 512px, felt marked card 320px, button inlay 280px.

---

## 6. Cards

```css
/* raised */
.card-raised{
  position:relative; border-radius:5px; isolation:isolate;
  padding:clamp(42px,3.8vw,56px) clamp(30px,3vw,44px) clamp(38px,3.5vw,52px);
  background-color:#E8DFD1;
  box-shadow:
    0 0 0 1px rgba(120,98,74,0.06),
    0 1px 0   rgba(184,166,140,0.75),
    0 2px 1px rgba(164,146,120,0.55),
    0 4px 6px  rgba(84,62,44,0.11),
    0 9px 16px rgba(84,62,44,0.08),
    inset 0 1px 0 rgba(250,243,229,0.50),
    -1px -1px 3px rgba(248,240,225,0.40);
}
.card-raised::before{
  content:""; position:absolute; inset:0; z-index:0; border-radius:5px;
  background-image:var(--tile); background-size:512px 512px;
  mix-blend-mode:soft-light; opacity:0.85; pointer-events:none;
}

/* sunk — a well cut into the sheet */
.card-sunk{
  position:relative; border-radius:5px; isolation:isolate;
  padding:clamp(32px,3vw,44px) clamp(26px,2.6vw,38px) clamp(30px,2.8vw,40px);
  box-shadow:
    inset 0 1px 0 rgba(250,243,229,0.38),       /* lip */
    inset 2px 2px 3px  rgba(52,38,26,0.30),     /* near wall, in shadow */
    inset 5px 5px 11px rgba(52,38,26,0.17),
    inset -2px -2px 4px rgba(248,240,224,0.30), /* far wall, bounced light */
    inset 0 0 14px rgba(46,34,23,0.10);         /* centre darker than rim */
}
```

---

## 7. THE CONFIRMED BUTTON — RCW2F

**This is the only approved button.** Flush inlay construction. Felt marked paper at reduced texture strength, sans serif label, soft press shadow.

Do not use any other button variant from `design-elements.html` (BLU, GRN, RED, WPS, WPG, SLA, SLB, SLC, RCS, RCW, RCB, RCW2, RCW2R). Those are earlier steps in the process, not options to pick from.

The construction idea: a flush inlay, not a recess. No elevation difference at all between the button and the sheet, so no directional shading. A groove implies a wall catching light from one side, and a wall only exists if one surface sits above or below the other. Here they are coplanar. The only cue is the material change plus one thin uniform seam marking the cut, the same colour on every side.

```css
.btn{
  --tile:url("<felt marked tile>");
  --face:#EDE4D8;
  --seam:rgba(52,38,26,0.34);
  --seamL:rgba(248,240,224,0.32);
  --seamR:rgba(52,38,26,0.20);
  position:relative; isolation:isolate; display:inline-block;
  padding:18px 40px;
  border-radius:1px;
  background-color:var(--face);
  cursor:pointer;
  transition:transform 120ms ease, box-shadow 120ms ease;
}
/* the cut seam */
.btn::after{
  content:""; position:absolute; inset:0; z-index:2; border-radius:1px;
  box-shadow:0 0 0 0.75px var(--seam);
  filter:url(#kerf);
  pointer-events:none;
}
/* the felt grain, cut to 0.4 for this button only */
.btn::before{
  content:""; position:absolute; inset:0; z-index:0; border-radius:1px;
  background-image:var(--tile); background-size:280px 280px;
  mix-blend-mode:soft-light; opacity:0.4; pointer-events:none;
}
/* label */
.btn-label{
  position:relative; z-index:1;
  font-family:'IBM Plex Sans',system-ui,sans-serif;
  font-weight:600;
  font-size:17px;
  letter-spacing:0.05em;
  text-transform:uppercase;
  color:#F3F7FB;
  text-shadow:-1px -1px 0.5px rgba(8,20,34,0.20);
}
/* pressed: the one moment the two surfaces are not coplanar */
.btn:active{
  transform:translateY(1px);
  box-shadow:
    inset 1.5px 1.5px 2px   var(--seam),
    inset -1px  -1px  1.5px var(--seamL),
    0 0 0 0.75px var(--seamR);
}
```

Face colour variants, if a coloured button is ever needed: blue `#93A7B8`, green `#9FAE8C`, deep blue `#4A6E92`, deep green `#56724F`, terracotta `#B98A7E`. Each needs its own seam tones re-derived for the hue, never borrowed from another colour.

---

## 8. THE CONFIRMED WAITLIST CARD — Element 20

Base sheet behind, raised card on top, re-papered with the felt marked tile at 320px so the two surfaces read as genuinely different stock. Fields use the sunk language scaled down to a shallow groove: one lip highlight, one near wall shadow, one bounced far wall light.

```css
.card-raised-felt::before{ background-size:320px 320px; }

.field{display:flex; flex-direction:column; gap:6px;
  text-align:left; width:100%; box-sizing:border-box}

.field-label{
  font-family:"IBM Plex Mono",monospace; font-size:10px; letter-spacing:.12em;
  text-transform:uppercase; color:rgba(30,26,22,0.5);
}

.field-input{
  font-family:'EB Garamond',Georgia,serif; font-size:16px; color:#1E1A16;
  background:#D6CAB6; border:none; border-radius:3px; padding:10px 14px;
  outline:none; width:100%; box-sizing:border-box;
  box-shadow:
    inset 0 1px 0 rgba(250,243,229,0.30),
    inset 1px 1px 2px rgba(52,38,26,0.28),
    inset 2px 2px 5px rgba(52,38,26,0.14),
    inset -1px -1px 2px rgba(248,240,224,0.25);
}
.field-input::placeholder{color:rgba(30,26,22,0.38); font-style:italic}

/* GDPR row — the one element that stays left aligned, since a checkbox
   plus a run of body copy reads as broken on a centre axis */
.field-check{display:flex; align-items:flex-start; gap:10px;
  text-align:left; width:100%; box-sizing:border-box; cursor:pointer}
.field-check-box{
  flex:0 0 16px; width:16px; height:16px; margin-top:2px;
  background:#D6CAB6; border-radius:2px;
  box-shadow:
    inset 0 1px 0 rgba(250,243,229,0.30),
    inset 1px 1px 2px rgba(52,38,26,0.30),
    inset -1px -1px 1px rgba(248,240,224,0.25);
}
.field-check-label{
  font-family:'EB Garamond',Georgia,serif; font-size:14px; font-style:italic;
  color:#5C5247; line-height:1.4;
}
```

Element 21 used the RCW2R raised button and was the client's rejected alternative. Do not build it.

---

## 9. Rejected, for the record

Do not reintroduce any of these:

- Every button variant other than RCW2F.
- Element 21, the RCW2R waitlist card.
- Texture explorers 09 through 15 (mulberry, smooth warm, hammered, smooth cool, laid and ribbed, felt marked, mottled cartridge). These were the exploration that produced the two tiles now in use: mottled cartridge for the base sheet, felt marked for buttons and the waitlist card. The rest were not selected.

---

## 10. Assets

Logo files live alongside this spec: `the-postpartum-suite-logo-mark.webp`, `the-postpartum-suite-logo-text.webp`, `the-postpartum-suite-logo.webp`, `TSB FAVACON.png`.

Wordmark typeface is Bodoni Moda at low optical size, OFL licensed, free for commercial use.
