# LinkLoad Website — Project Context

## What LinkLoad Is

LinkLoad is a premium home-appliance startup developing an automated laundry system. The core product is a **single, vertically stacked washer/dryer appliance** with two independent full-capacity drums:

```
┌─────────────────────┐
│     QUEUE DRAWER    │  ← Load 2 waits here
├─────────────────────┤
│       WASHER        │
│        ◯            │
│   ─ CONTROL ─       │  ← One panel between drums
│       DRYER         │
│        ◯            │
├─────────────────────┤
│      DONE DRAWER    │  ← Load 1 finishes here
└─────────────────────┘
```

The washer and dryer are independently optimized (not a 2-in-1 combo). LinkLoad mechanically transfers clothes from washer to dryer after washing completes.

**Positioning:** Premium home technology, not a gadget.

---

## Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS + CSS variables for tokens
- **Fonts:** Geist Sans + Geist Mono (built for Next.js)
- **Animation:** Framer Motion (future)
- **Hosting:** Vercel (deploys from GitHub `main`)
- **Database:** Supabase Postgres (future)
- **Email:** Resend (future)

---

## Design Tokens

| Token          | Value              | Use                              |
|----------------|--------------------|---------------------------------|
| `--void`       | `#070708`          | Page background                  |
| `--graphite`   | `#131316`          | Raised surfaces, cards           |
| `--charcoal`   | `#1E1F23`          | Borders, dividers                |
| `--steel`      | `#8E929A`          | Secondary text, annotations      |
| `--silver`     | `#C9CCD2`          | Body text                        |
| `--paper`      | `#F3F2EF`          | Headlines, primary buttons       |
| `--signal`     | `#8C7BFF`          | The one accent (purple)          |
| `--signal-glow`| `#8C7BFF` at 35%   | Indicator glow, hotspot pulse    |

---

## Design Principles

1. **One object, lit.** Every screen has a single focal point. No card grids fighting the product.
2. **Show, then say.** Motion explains; copy confirms in one line.
3. **Purple means alive.** The accent marks active controls, focus rings. Nowhere decorative.
4. **Fluid, not breakpointed.** Type, spacing and imagery scale continuously with `clamp()`; layouts only restack when genuinely needed.
5. **Weighted motion.** Slow ease-in-out camera moves, no bounce. Respect `prefers-reduced-motion`.
6. **Short copy.** Headlines two lines, subheads two lines, cards two sentences.

---

## Typography

- Display & body: Geist Sans
- Mono/annotations: Geist Mono
- Headlines: `clamp(2.5rem, 6vw, 6rem)` with explicit line breaks
- Body: responsive scaling with clamp

---

## Key Decisions

- **Canonical URL:** `linkload.co` (www redirects to it)
- **Current film:** YouTube ID `BeLTB3nu2bY`
- **Page title:** "LinkLoad – The Washer-Dryer That Transfers Clothes for You"
- **All copy:** Present tense, as though LinkLoad already exists
- **Pricing (Product page):** $3,999 MSRP (single config value)
- **Gate mode:** Manual approval with invite links (v2)
- **Font:** Geist Sans + Geist Mono (free)

---

## Rules

### NEVER Do

1. **Never invent assets.** Use only files in `/assets/` or `/public/`. Ask for missing assets.
2. **Never touch DNS.** Do not configure deployment or DNS until approved.
3. **Never modify email DNS records.** MX, autodiscover, SPF, DMARC, SRV stay untouched.
4. **Never use placeholder images.** If an asset is missing, ask for it.
5. **Never use excessive gradients, colorful startup graphics, or obvious AI visual language.**

### Always Do

1. **Use real assets** from `/assets/` folder (logo.svg, logo.png, video-stills/)
2. **Maintain fluid responsiveness** — everything scales gracefully at every width
3. **Keep the product image aspect ratio** — never stretch or distort
4. **Use CSS variables for all colors** — single source of truth
5. **Build components, not pages** — `<Hero>`, `<ValueProps>`, `<FAQ>`, etc.
6. **Test at multiple widths** — 360px to 2560px

---

## Assets Available

```
/assets/
├── logo.png           # LinkLoad logo
├── logo.svg           # LinkLoad logo (vector)
└── video-stills/      # 28 stills from demo video
    ├── Still...1.1.1.jpg through Still...1.1.28.jpg
```

---

## Site Structure (Day 1 - v1)

Home page sections in order:
1. **Hero** — Video/image hero with headline, subhead, buttons
2. **Value Props** — Six cards (static stills for now, no loops)
3. **Comparison** — LinkLoad vs 2-in-1 combo vs separate pair
4. **Film** — Lite YouTube embed of BeLTB3nu2bY
5. **FAQ** — Five questions, accordion style
6. **Waitlist** — Form UI (not wired up yet)

---

## Copy Reference

### Hero
- **Headline:** "Laundry, automated. / Life, uninterrupted."
- **Subhead:** "The only washer-dryer that moves your clothes for you. / Start two loads, walk away."
- **Buttons:** "Watch the film" (primary), "Join the waitlist" (secondary)

### Six Value Props
1. No Manual Transfer Required
2. No Performance Compromise
3. Two Loads, One Touch
4. Effortless Smart Home Sync
5. Extremely Simple Mechanics
6. Untether Yourself From Laundry

### Five FAQs
1. How does automated transfer work?
2. How many loads can I start at once?
3. What if I have clothes to hang-dry?
4. How is this different from 2-in-1s?
5. How do you make sure clothes don't get stuck?

---

## Contact

- Keep "Let's talk socks" as the heading (nice voice cue)
- Email: jarett@linkload.co
