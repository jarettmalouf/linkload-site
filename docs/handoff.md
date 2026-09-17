Absolutely. Here’s the handoff I’d give Claude/Cursor so it understands **what LinkLoad is, what we built, the existing domain/email infrastructure, the design direction, and what needs to be recreated.**

You can paste essentially this whole thing into Claude.

---

# LinkLoad Website — Rebuild Context

I am rebuilding the LinkLoad website from scratch in code, likely using **Cursor + Claude**, rather than continuing with Webflow. The existing Webflow site should primarily be treated as a **visual/content reference**, not as architecture that needs to be preserved.

## 1. Company / product

**LinkLoad** is a premium home-appliance startup developing an automated laundry system.

The core product is a **single, vertically stacked washer/dryer appliance** with two independent full-capacity drums:

**Top → bottom:**

`Queue Drawer → Washer → Control Panel → Dryer → Done Drawer`

The washer and dryer remain independently optimized rather than using a conventional single-drum washer/dryer combo. LinkLoad mechanically transfers clothes from the washer into the dryer after washing is complete.

The design goal is essentially:

> **The performance of separate premium machines, with the convenience of fully automated laundry.**

The target positioning is **premium home technology**, not a gadget or cheap smart appliance.

---

# 2. Domain + email infrastructure

### Primary domain

**linkload.co**

This domain was purchased through **GoDaddy**.

The desired public site is:

**linkload.co**

and ideally:

**[www.linkload.co](http://www.linkload.co) → linkload.co**
(or vice versa; just choose one canonical URL and redirect the other).

### `.com`

We are also attempting to acquire **linkload.com**.

It is currently owned by someone else and registered through hosting.kr. I have:

* emailed hosting.kr
* opened an online support case
* been told they can forward a purchase offer to the registrant

This is completely separate from the current site. **Do not depend on linkload.com.**

### Business email

Email is already operational through GoDaddy/Microsoft infrastructure. I can currently send and receive business email successfully.

**DO NOT modify/delete the email DNS records when changing website hosting.**

Existing DNS included Microsoft/GoDaddy records such as:

* MX → `linkload-co.mail.protection.outlook.com`
* `autodiscover` → `autodiscover.outlook.com`
* `email` → `email.secureserver.net`
* `lyncdiscover`
* `msoid`
* `sip`
* SPF TXT
* DMARC TXT
* Microsoft verification TXT
* SRV records

These should remain untouched.

---

# 3. Existing Webflow infrastructure

The current site was built/published through **Webflow**, but I want to replace it with the coded version.

Webflow had a domain-verification TXT record:

`_webflow → one-time-verification=e860840a-d7fa-454c-a2fb-f622c86b3562`

There have also been Webflow-related A/CNAME records during setup.

**Once the new site is deployed, Webflow website DNS records can be replaced, but email DNS records must remain.**

The earlier GoDaddy placeholder used:

`A @ → 198.202.211.1`

That is/was GoDaddy's Coming Soon/parking destination and should **not** be restored.

---

# 4. Recommended new architecture

I'd like this rebuild to be simple.

Recommended:

**Next.js → GitHub → Vercel → GoDaddy DNS**

Architecture:

```text
Cursor / Claude
      ↓
Next.js project
      ↓
GitHub repository
      ↓
Vercel deployment
      ↓
linkload.co
```

Vercel should handle:

* deployment
* CDN
* HTTPS / SSL
* production builds
* deploy previews
* automatic deployment after pushes to `main`

Do **not** change GoDaddy DNS until the Vercel preview deployment looks correct.

Once ready, add `linkload.co` and `www.linkload.co` under Vercel Domains and then use **the DNS records Vercel currently provides in its dashboard**, rather than assuming hard-coded IPs from an old tutorial.

---

# 5. Website objective

This is deliberately **not a huge corporate website**.

It should feel like a beautiful, mysterious, premium:

### **“LinkLoad is coming.”**

landing page.

The visual references are closer to:

* premium industrial design
* luxury appliances
* Apple-style restraint
* dark product photography
* architectural / automotive presentation

Avoid:

* generic SaaS aesthetics
* excessive gradients
* colorful startup graphics
* excessive rounded cards
* obvious AI-generated visual language
* too much copy

---

# 6. Visual language

### Palette

Primarily:

* black
* charcoal
* graphite
* silver
* subtle whites

Think **machined metal + shadow**, rather than blue/purple “tech.”

### Typography

Elegant, substantial typography with careful weight and spacing.

Large headings should **scale fluidly with viewport width** rather than remain fixed and wrap into 3–4 lines.

Use responsive CSS such as:

```css
font-size: clamp(...);
```

rather than relying exclusively on breakpoint jumps.

### Responsiveness

This was one of the main reasons for leaving Webflow.

Everything should scale gracefully as the viewport narrows:

* product imagery scales proportionally
* no image distortion
* headings shrink rather than suddenly wrapping into four lines
* spacing scales
* buttons scale modestly
* desktop side-by-side compositions can stack when genuinely necessary

The site should feel intentionally designed at **every intermediate browser width**, not just desktop/tablet/mobile presets.

---

# 7. Product hero render

We have been developing a photorealistic industrial-design concept render.

The final geometry should be:

```text
┌─────────────────────┐
│     QUEUE DRAWER    │
├─────────────────────┤
│                     │
│       WASHER        │
│        ◯            │
│                     │
│   ─ CONTROL ─       │
│                     │
│       DRYER         │
│        ◯            │
│                     │
├─────────────────────┤
│      DONE DRAWER    │
└─────────────────────┘
```

Critical visual requirements:

* **ONE continuous housing**
* NOT two machines stacked together
* two vertically aligned circular drums
* washer above dryer
* **one and only one control panel**
* control panel sits **between the drums**
* no controls at the top
* Queue Drawer above washer
* Done Drawer below dryer
* drawer seams clearly visible
* otherwise **no horizontal seam through the middle**
* side housing should also be continuous, with no break implying two stacked appliances
* compact vertical spacing
* dark graphite / black
* premium materials
* studio shadows
* subtle brushed-metal details
* slight three-quarter angle
* product should face slightly toward the **viewer's left**

The hero image should retain its native aspect ratio (`height: auto`, appropriate `object-fit`) rather than being stretched to match adjacent text.

---

# 8. Core value proposition cards

We developed six core value propositions.

### No Manual Transfer Required

LinkLoad automatically moves clothes from the washer to the dryer through its transfer architecture, eliminating the manual handoff between cycles.

### No Performance Compromise

LinkLoad uses two full-capacity, independently optimized units in a compact stacked footprint, delivering faster cycles, better drying, and none of the compromises of 2-in-1s. You still get the parallelization and specialized performance of traditional separate machines—just in a unified design.

### Two Loads, One Touch

Users can place the first load in the washer and a second in the **Queue Drawer** above. The second automatically follows the first through the system, while the completed first load finishes in the **Done Drawer** below the dryer.

### Effortless Smart Home Sync

Users can check machine/cycle status through the LinkLoad mobile experience rather than remaining physically tethered to the appliance.

### Extremely Simple Mechanics

Mechanical simplicity is central to LinkLoad's architecture. Rather than complex robotics, hydraulics, or pneumatics, the system relies primarily on a retractable drum architecture and gravity-assisted vertical transfer.

### Untether Yourself From Laundry

The emotional/lifestyle proposition: start laundry and leave. Users don't need to stay home, remember when washing finishes, or return specifically to transfer clothes.

---

# 9. FAQ content

The website should include a concise FAQ.

### How does automated transfer work?

LinkLoad uses a retractable drum architecture and vertical chute to move clothes directly from the washer into the dryer without manual handling.

### How many loads can I start at once?

Two. Put the first load in the washer and the second in the **Queue Drawer** above. The second follows the first through the cycles, while the first ultimately finishes in the **Done Drawer** below the dryer.

### What if I have clothes to hang-dry?

The washer and dryer can operate independently when automatic transfer isn't desired. A dedicated hang-dry mesh system allows selected garments to be separated from the automated transfer/drying workflow.

### How is this different from 2-in-1s?

LinkLoad uses two full-capacity, independently optimized units in a compact stacked footprint, delivering faster cycles, better drying, and none of the compromises of 2-in-1s. It retains the parallelization and specialized functions of traditional independent washers and dryers.

### How do you make sure clothes don't get stuck?

Mention three engineering features:

* **full-diameter transfer chute**
* **dislodgement / load-balancing mechanisms**
* **ingress guards**

The explanation should remain consumer-friendly rather than sounding like an engineering whitepaper.

---

# 10. Header / hero content structure

The previous Webflow hero had roughly:

```text
Hero
├── Product image
└── Header
    ├── LinkLoad logo
    ├── H1
    ├── Subheading
    └── Button group
        ├── Primary button
        └── Secondary button
```

The image and Header were side-by-side on larger displays.

The header contents should be centered and scale as a **cohesive visual composition** as available width decreases.

In particular:

* logo maintains aspect ratio
* H1 fluidly decreases in size
* H1 is intentionally **two lines**
* subheading is intentionally approximately **two lines**
* buttons remain centered
* the whole composition should get proportionally smaller rather than merely narrowing and causing text to wrap vertically

Use explicit line breaks in marketing headlines where necessary rather than depending entirely on accidental browser wrapping.

---

# 11. Footer

There is a footer logo treatment consisting roughly of:

```text
logo-link
├── nav-logo-icon
│   └── image
└── paragraph_xlarge
```

Important responsive behavior:

**The logo icon should NOT horizontally compress when the viewport shrinks.**

Use something equivalent to:

```css
flex-shrink: 0;
height: auto;
```

and preserve its aspect ratio.

The adjacent text can scale down modestly using `clamp()` and/or responsive styles.

---

# 12. SEO / social sharing

We want proper metadata so texting **linkload.co** generates a polished preview.

Recommended title direction:

**LinkLoad — Laundry That Takes Care of Itself**

Possible description:

**A one-touch washer-dryer system with automatic transfer, queue-ready loading, and full appliance-grade performance. Start two loads at once and come back when everything's done.**

Implement:

```html
<title>
<meta name="description">

<meta property="og:title">
<meta property="og:description">
<meta property="og:image">
<meta property="og:url">
<meta property="og:type">

<meta name="twitter:card">
```

OG image should ideally be approximately **1200 × 630**, featuring the product render and/or LinkLoad branding.

Also include the LinkLoad favicon.

---

# 13. Current assets

I have an existing **LinkLoad logo** that should be used rather than recreating the brand from scratch.

I also have/generated industrial-design product renders that can serve as references or temporary hero assets.

Ask me for the actual files when needed rather than inventing substitutes.

---

# 14. Deployment rule

**Do not touch production DNS until the new site is fully working on its Vercel preview URL.**

Once I approve it:

1. Add `linkload.co` to Vercel.
2. Add `www.linkload.co`.
3. Choose a canonical domain.
4. Vercel provides the current DNS configuration.
5. In GoDaddy, remove only the obsolete Webflow website records.
6. Add Vercel's website records.
7. **Leave all Microsoft/GoDaddy email records untouched.**
8. Wait for DNS verification.
9. Verify SSL.
10. Test:

* `https://linkload.co`
* `https://www.linkload.co`
* email send/receive
* mobile
* desktop
* OG/social preview.

---

## One thing I'd change from our earlier plan

When you get to deployment, **don't have Claude blindly use the Vercel DNS values we discussed earlier**. Vercel can change its recommended records/configuration, so use whatever **Vercel's Domains screen actually gives you at deployment time**. I'll walk you through that part once the coded site is ready.

For Claude, I'd end the prompt with:

> **First, build the site locally. Do not configure deployment or DNS yet. Prioritize visual fidelity, clean reusable React components, fluid responsiveness, and a simple architecture. Ask me for the LinkLoad logo, product render, and any exact copy/assets you need rather than generating replacements.**

That should give you a much cleaner restart.

