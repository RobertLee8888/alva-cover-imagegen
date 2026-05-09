---
name: alva-cover-generation
description: Generate deterministic, brand-coherent playbook cover designs for Alva's Explore grid. Use when asked to design, create, update, or audit a playbook cover, cover image, Explore card, thesis card, screener card, what-if card, or general card — or when asked to implement the cover-generation pipeline. Covers the 4-template taxonomy (screener / thesis / what-if / general), FNV-1a hash-derived backgrounds, brand/portrait overrides, icon placement, safe-zone discipline, no-truncation text rules, and Figma Plugin API integration.
---

# Alva Cover Generation

Produces the cover image for a Playbook/Card displayed in the Alva Explore grid.

A cover's first job is **findability** — help a user pick one playbook out of a grid of 100. It is NOT self-explanation; title and subtitle live in the metadata frame below the cover. Every element on the cover must carry information the metadata does not.

This skill is self-contained. Pure runtime in `src/`, supporting docs in `references/`. The longitudinal changelog lives at `skills-updates/alva-cover-generation/SUMMARY.md`.

---

## When to use

- Creating a new playbook cover ("design a cover for this screener", etc.)
- Updating an existing cover ("the bg looks wrong", "fix the icon position")
- Auditing covers against the rules
- Implementing or wiring the cover-generation pipeline
- Adding a new template, brand, or domain

Do NOT trigger for: generic design work, Alva chart work, avatar generation.

---

## Quick start

```ts
import { generateCover } from "./src/cover-gen";

const cover = generateCover({
  template: "what-if",
  title:    "SPY & Oil After Hormuz Blockade",
  author:   "terrezzaeynon897",
  tickers:  ["SPY", "USO"],
  domain:   "fed",
});
// cover = { bg, icon, text, content, meta, debug? }
```

The full output shape is in `src/types.ts`. **Production renderers consume every rule from this output** — never hardcode. See §Render layer architecture for the contract.

---

## The 4-template taxonomy

| Template | Archetype | Hero element |
| --- | --- | --- |
| screener | List | Lead ticker + peer chips |
| thesis   | Narrative | Category badge + delta body |
| what-if  | Verdict | Verb + signed % + distribution bars |
| general  | Title | Pulse status (time / count / score) + supporting |

Template alignment is the caller's responsibility. `general` is the fallback.

---

## Geometry

**Card** (design baseline): `328 × 302`, 12px radius, white bg, 6% border, soft shadow. Production-rendered card width is responsive within `260 ≤ cardW ≤ 340`.

**Cover** (4px inset inside card): canonical `320 × 140`, 8px radius. Production cover width = `cardW − 8`, range 252–332. Internal layout responds via the type-scale rule (Layer A).

**Safe zone**: `x ∈ [28, 292]`, `y ∈ [20, 120]` (28 px L/R padding = 8.75% of cover width). Foreground text right edge ≤ 292. Background elements may ghost-touch but main mass stays inside.

**Responsive grid formula** — two variants, same wrap logic, different `(min, max)` cardWidth:

```
N      = max(1, ⌊(W + 12) ÷ (minCardWidth + 12)⌋)
cardW  = min(maxCardWidth, (W − 12·(N − 1)) ÷ N)
```

| Variant | min / max | gap | Use | CSS |
| --- | --- | --- | --- | --- |
| Small (default) | 260 / 340 | 12 | Explore grid | `repeat(auto-fill, minmax(260px, 1fr))` + `max-width: 340px` |
| Large | 328 / 400 | 12 | Hero / detail surfaces | `repeat(auto-fill, minmax(328px, 1fr))` + `max-width: 400px` |

Large-card grid never renders narrower than 328 (the canonical baseline). Cover internals scale via type-scale rule (Layer A) using `k = coverWidth / 320`.

---

## The 3-layer visual fingerprint

Every cover is exactly 3 layers:

1. **Background color** — 2-stop vertical gradient, hue derived from `title + tickers` (or brand / portrait override).
2. **Identity icon** — Material Symbol (default) or brand logo or full-cover portrait fill.
3. **Archetype content** — 3–5 elements specific to template (labels, hero numbers, bars, chips).

---

## Color system

### Per-template HSL bands (paper weight: L ≥ 0.92, S ≤ 0.28)

| Template | baseH | range | S | L | Family |
| --- | --- | --- | --- | --- | --- |
| screener | 170° | ±35° | 0.24 | 0.94 | cool teal → slate |
| thesis   | 40°  | ±30° | 0.26 | 0.95 | warm earth |
| what-if  | 218° | ±25° | 0.22 | 0.94 | cool slate-blue |
| general  | 0°   | ±180° | 0.06 | 0.96 | near-neutral |

Full data: `src/palette.ts`.

### Bg hue selection (default path)

```
key  = `${title}|${tickers.join(",")}`
slot = fnv1a(key) % 12
H    = band.baseH + (slot/11 − 0.5) × band.range × 2
top  = hslToRgb(H, band.S, band.L)
bot  = hslToRgb(H, min(S × 1.25, 0.28), max(L − 0.04, 0.92))
```

Template is NOT in the hash input — it already defines the H range.

### Brand override (Layer 1b)

Single ticker registered in `brand-registry.ts` → bg uses alpha-on-white:

```
bgTop = brand × 0.18 + white × 0.82
bgBot = brand × 0.38 + white × 0.62
```

Mono brands (`mono: true`) skip Layer 1b but still replace the icon.

### Portrait override (Layer 1c + 2c)

For person-centric playbooks: bg and textBase derive from `portraitH`, not the hash:

```
bg       = hslToRgb(portraitH, 0.06, 0.96)
textBase = hslToRgb(portraitH, 0.40, 0.22)   // bumped saturation — text reads through 0.18 wash
```

The portrait composites at opacity 0.18 over the gradient. **Crop is top-anchored** (heads sit in the upper portion of typical portraits; centered crops slice them off).

**Scope — specific named real persons ONLY.** Generic personas ("Whale Trader", "The Quant") use a non-portrait template with a domain icon. **Source orientation — landscape ≥ 3:2 only.** Vertical sources auto-rejected.

Both rules enforced at intake by `validatePortrait(input)` — throws on:
- `imageAspectRatio < 1.5`
- `subjectName` matches generic-persona keywords (`GENERIC_PERSONA_KEYWORDS`)
- `subjectName` empty / `license === "unknown"` / `portraitH` out of [0, 360]

**Renderer hints encoded in output** — production reads `bg.portraitRender`:

```ts
output.bg.portraitRender = {
  href: string,                          // resolved via PERSON_REGISTRY when subjectName matches
  fallbacks?: string[],                  // alternate URLs for fetcher retry
  opacity: 0.18,
  crop: {
    svgPreserveAspectRatio: "xMidYMin slice",
    figmaImageTransform:    [[1,0,0],[0,0.62,0.13]],
    cssBackgroundPosition:  "center top",
    cssBackgroundSize:      "cover",
  },
  filters: { saturation: -0.55, exposure: 0.22, contrast: 0.05,
             temperature: 0, tint: 0, highlights: 0.10, shadows: 0.15 },
};
```

`temperature` MUST be 0 — warm shifts read as 遗照. Filter values in `references/image-pipeline.md`.

### Text color — always hue-derived

```
textS    = min(bgS + 0.20, 0.45)
textL    = max(bgL − 0.70, 0.18)
textBase = hslToRgb(bgH, textS, textL)
```

| Element | Color | Opacity |
| --- | --- | --- |
| Hero (ticker / % / anchor) | textBase | 0.92 |
| Headline (thesis)          | textBase | 0.92 |
| Support / sub-value        | textBase | 0.70 |
| Cadence / small-caps label | textBase | 0.55 |
| Chip text (peer tickers)   | textBase | 0.72 on `textBase @ 0.10` bg |
| Category indicator         | category | 1.0 |

**Cascade rule:** every bg change must re-derive textBase + iconColor + barColor in the same pass.

### Distribution bars (what-if only)

```
semH     = isPos ? 145 : 5
mixedH   = blendHue(semH, bgH, 0.20)    // CIRCULAR shortest-arc, NOT linear
barColor = hslToRgb(mixedH, 0.38, 0.55)
fill     = { color: barColor, opacity: 0.55 }
```

Linear blending fails for far-apart hues (red 5° + 30% toward blue 211° = 66° = yellow); circular preserves identity. Position: `x ∈ [184, 292]`, width 108, `bar_w = (108 − 3·(N−1)) / N`. Per-card zero-line: `zeroLineY = 120 − maxNegH`. Bar heights ~10–28. Positive grow upward, negative downward.

### Icon color

Non-brand:

```
iconColor = hslToRgb(bgH, bgS, max(bgL − 0.08, 0.80))
opacity   = 0.7   // bg-derived watermark; brand logos use calibrated 0.40/0.50
```

Brand: brand color, **inner vector at 80% of frame** (10% inset each side) to match Material-Symbol padding. Opacity per size:

| Frame | Inner vector | Brand opacity |
| --- | --- | --- |
| 120×120 | 96×96 at (12,12)   | 0.40 |
| 64×64   | 51×51 at (6.4,6.4) | 0.50 |

---

## Icon placement

**Default** (screener / thesis / general): `(172, 30)`, size `120×120`. Right edge at safe-zone right (292) — icon grew leftward from the prior 100×100 spec to match the 320×180 canvas. Frame fills the safe zone vertically (ghost-touches both edges); inner vector at canonical 80 % inset = 96×96 at (184, 42), 12 px buffer to safe-zone bounds.

**What-if override**: `(240, 12)`, size `64×64`. Frame intentionally floats past safe-zone top-right; visible glyph in production SVG renders at ~(297, 12) — decisively corner-anchored.

**Portrait**: full-cover IMAGE fill, no icon frame.

### Domain → Material Symbol

Full table in `src/icon-mapping.ts`. Highlights: `tech → memory`, `dividend → paid`, `ai → bolt`, `defense → security`, `macro → public`, `rates → percent`, `fx → currency_exchange`, `trend_up → trending_up`, `event_study → event`, `weekly → calendar_today`, `leaderboard → leaderboard`. Fetch: `https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsrounded/{name}/fill1/48px.svg`.

---

## Per-archetype content skeletons

Coordinates are **visual cap-top** y-values (see §Render layer / Layer A.1 anchoring). All x-values relative to safe-zone left at x=28.

### screener (List, 3 elements)

| y | size | element | content example |
| --- | --- | --- | --- |
| 24  | 9px caps        | label  | `"SCORED · S&P LARGE CAP · 6H"` |
| 48  | 34px Semi Bold  | ticker | `"PG"` |
| 100 | chips row       | peer chips | `chipHeight 20, chipPaddingX 8, gap 4`, bottom-anchored at y=120 |

### thesis (Narrative, 3 elements)

| y | size | element |
| --- | --- | --- |
| 24  | 9px caps                | label `"TODAY'S DELTA · APR 23"` |
| 60  | 10px caps + dot         | category `"AMBIGUOUS" / "RISK" / "CATALYST"` |
| 72  | 18px Semi Bold (lh 22)  | delta body — single text node, `\n` from splitDelta, ends at safe-zone bottom (y=120) |

`delta.text` already contains `\n` — renderer must split into per-line `<tspan>` (use `tspanLines()` from `src/svg-helpers.ts`). **Semantic break priority** in splitDelta:

1. `" vs "` — most common for delta comparisons
2. `" · "` — middle dot / interpunct
3. `" — "` — em-dash
4. `":"` — colon (break AFTER)
5. `" −" / " +"` — sign boundary
6. **fallback** — for >25-char strings with no priority hit, split at whitespace closest to the middle

Example splits: `"Late long-term debt cycle · risk-off bias"` → `"Late long-term debt cycle\nrisk-off bias"`; `"Basket −2.1% vs SMH +0.6% YTD"` → `"Basket −2.1%\nvs SMH +0.6% YTD"`.

### what-if (Verdict, 4 elements, 2 text styles)

| y | size | element |
| --- | --- | --- |
| 20 | 9px caps              | label `"30D AFTER HORMUZ · 5×"` |
| 64 | 9px caps (same style) | verb `"HISTORICALLY DROPS"` (authored uppercase) |
| 80 | 40px Semi Bold        | hero % `"−2.4%"` — bg-tinted signed semantic color |
|    | bars                  | x ∈ [184, 292], zero-line per card, bottom y=120 |

Hero color (signed, bg-tinted via 15% circular blend):

```
positive: hslToRgb(blendHue(145°, bgH, 0.15), 0.50, 0.30)
negative: hslToRgb(blendHue(  5°, bgH, 0.15), 0.60, 0.38)
```

Icon at frame `(240, 12)` size 64 — see §Icon placement what-if override.

### general (Title, 3 elements, bottom-grouped hero)

| y | size | element |
| --- | --- | --- |
| 24  | 9px caps                | kind `"CONTEXT FEED · daily" / "WATCHLIST · 2026" / "HIGH SCORE"` |
| 66  | 26–28px Semi Bold       | pulse `"2h ago" / "38 holdings" / "38,420"` |
| 106 | 10px caps               | series `"47 PIECES · 12.8K VIEWS"` |

`pulse` complements the title (e.g. "2h ago" not "Citrini" if title is "Citrini Context"). General covers show **no template chip** in metadata.

---

## Render layer architecture

**Covers MUST be parametric components, not pre-generated images.** Cost analysis confirmed CSR (~$1.50/month at 10K playbooks) vs static (~$770/month). The component has two render layers:

### Layer A — foreground content (auto-layout + scaling type)

Foreground container per cover:

```
Foreground          VERTICAL auto-layout, primaryAxisAlignItems = SPACE_BETWEEN
                    counterAxisAlignItems = MIN
                    x=28, y=20, size 264×100
                    constraints { horizontal: STRETCH, vertical: MIN }
├── Header           label / kind / context label (single text)
└── BodyCluster      VERTICAL nested — hero + supporting per template
```

**Type scales with cover width** (k = coverWidth / 320), with role-specific floors:

```
heroSize    = max(40 × k, 32)
verbSize    = max(18 × k, 14)
labelSize   = max( 9 × k,  9)        // never below base
pulseSize   = max(28 × k, 22)
deltaSize   = max(18 × k, 14)

heroLH      = heroSize × 1.0          // line-height as ratio, not absolute
labelLH     = labelSize × 1.33

bodyClusterGap = round(4 × k)
fgPadding      = round(20 × k)
```

Today every cover is 320 wide → k=1, all floors inactive, sizes resolve to base spec.

### Layer A.1 — text anchoring (renderer calibration)

**SKILL `y` values represent the visual cap-top** of rendered text. Each renderer maps to its native anchor:

| Renderer | How `y` maps | Adjustment |
| --- | --- | --- |
| SVG `<text dominantBaseline="hanging">` | hanging baseline = visual cap-top | use SKILL `y` directly |
| SVG `<text>` (default `alphabetic`) | y = baseline | `y_attr = SKILL_y + capHeight` (≈ 0.7 × fontSize) |
| Figma plugin TEXT | y = frame top with lh-padding | `figma_y = SKILL_y − (lh − capHeight) ÷ 2` |
| HTML `<div>` | top = line-box top | same as Figma (subtract lh-padding) |
| Canvas `textBaseline="top"` | y = em-box top | use SKILL `y` directly |

**For SVG always use `dominant-baseline="hanging"`** so SKILL `y` maps without offset math.

### Layer B — background elements (absolute + SCALE)

Watermark icon, brand logo, distribution bars, zero-line, portrait fill — absolutely positioned within the cover, scale proportionally as cover resizes.

- Figma: `constraints: { horizontal: 'SCALE', vertical: 'SCALE' }`
- CSS: `position: absolute` with percentage-based geometry, or `transform: scale()` driven by container query

At 400-wide cover, an icon at (237, 15) size 64 becomes (296.25, 18.75) size 80×80 — same relative position, proportional size.

### Why this split

Text scales by **legibility floor**, not pure container; readers expect text size to stay roughly constant across breakpoints. Decoration scales by **container** — composition-relative, must double when cover doubles.

---

## Safe zone & text rules

**Hard rule #1**: every cover text element's right edge ≤ 292. Background elements may ghost-touch but main mass inside.

**Hard rule #2 — no ellipsis on cover**: text either renders fully within safe zone or is dropped. Never truncated.

```ts
text.textAutoResize = "WIDTH_AND_HEIGHT";
text.textTruncation = "DISABLED";
text.maxLines       = null;
assert(text.x + text.width <= 292);
```

If overflow: shorten content, drop a font size notch, or remove. Never `…`.

### Metadata frame (below cover)

Different rule — title and subtitle wrap then ellipsis. **Production reads `output.meta.*.style` and spreads** (see Render layer architecture):

```jsx
<h3 style={{ ...output.meta.title.style }}>{title}</h3>
<p  style={{ ...output.meta.subtitle.style }}>{subtitle}</p>
```

| Role | maxLines | fontSize / lh | Notes |
| --- | --- | --- | --- |
| title    | 2 | 16/22 Inter SemiBold | wrap then `…` |
| subtitle | 2 | 13/18 Inter Regular  | locked height 40 px so grid rows align |
| chip     | 1 | 9 caps Semi Bold tracked | no wrap |
| author   | 1 | 12/16 Inter Medium | nowrap, ellipsis |

Source of truth: `src/metadata-layout.ts` (also exposed on `output.meta`).

### Typography family

**Cover**: Delight (display face) — every TEXT inside the Cover frame.
**Metadata**: Inter (Alva product default).

Until Delight is uploaded to Figma org, cover TEXT falls back to Inter with a `[PENDING-DELIGHT]` layer-name marker.

### Font size floor

| Role | min size |
| --- | --- |
| Caps small-label (tracked 0.16) | 9 |
| Supporting | 10 |
| Aux | 12 |
| Chip | 14 |
| Subtitle | 15 |
| Hero number | 26 |

9px at 320-wide cover remains legible — small-caps tracked, Semi Bold weight gives ink. Below 9 forbidden.

---

## Anti-patterns

Full treatment in `references/anti-patterns.md`. ID quick-ref: A1 title-restate · A2 semi-transparent icon · A3 fabricated icon path · A4 cover ellipsis · A5 portrait-as-rectangle · A6 sepia/warm portrait · A7 semantic red/green on family bg · A8 bg element past safe zone · A9 HSL clamp for brand bg · A10 template chip on general · A11 bg change without cascade · A12 unlocked subtitle height · A13 equidistant spacing · A14 linear hue blend.

---

## Implementation

`src/` holds the pure runtime; `references/` holds rule treatments. Source-of-truth files:

- `types.ts` — `CoverInput`, `CoverOutput`, `ContentElement` (canonical shapes)
- `color.ts` — FNV-1a, HSL↔RGB, textBase, blendHue, alphaOnWhite
- `palette.ts` — per-template HSL bands
- `brand-registry.ts` / `person-registry.ts` / `icon-mapping.ts` — curated tables
- `metadata-layout.ts` — title/subtitle/chip/author constants
- `image-fetcher.ts` — `fetchWithRetry`, `fetchWithFallback`, `fetchBrandLogo`, `fetchPersonPortrait`
- `svg-helpers.ts` — `tspanLines`, `rgbCss`
- `cover-gen.ts` — `generateCover`, `splitDelta`, `validatePortrait`
- `figma-apply.ts` — Figma Plugin API applicator

References: `anti-patterns.md`, `palette.md`, `brand-registry.md`, `icon-mapping.md`, `image-pipeline.md` (portrait pipeline + 5 hard image-source rules), `iteration-log.md` (changelog).

Main entry `generateCover(input) → CoverOutput` is pure and deterministic. Output shape is whatever `types.ts` defines — read it there, don't duplicate. Production renderers spread `output.meta.*.style`, read `output.bg.portraitRender` for portraits, and never hardcode anything that lives in the output.

### Figma plugin integration

`figma-apply.ts` applies a CoverOutput to an existing card frame structured as:

```
Card (auto-layout, FIXED width, HUG height, padding 4)
├── Cover (FILL × 140)
│    ├── fills: [gradient + optional IMAGE portrait]
│    ├── Icon Frame (VECTOR child)
│    └── Per-archetype content frames + text/bar nodes
└── Frame (metadata, FILL, padding 12)
     ├── TagRow (HORIZONTAL)
     ├── TextBlock (VERTICAL): title, subtitle (height-locked 40)
     └── CreatorRow (HORIZONTAL): ellipse, name, stats
```

### Portrait image pipeline (Figma plugin)

Figma has neither `fetch()` nor URL-based `createImageAsync()`. Pipeline:

1. **Fetch via Chrome/host** — `<Image crossOrigin="anonymous">` → canvas → JPEG blob (300×225 @ q=0.5 enough at opacity 0.18).
2. **Hex transport** — encode bytes, embed in `document.body.innerHTML` as `<article>` with 80-char `<p>` lines, retrieve via `get_page_text`.
3. **Decode in Figma** — single `use_figma` call (50K char limit), hex → `Uint8Array` → `figma.createImage(bytes).hash`.
4. **Apply** — set as second IMAGE fill on cover with CROP + filters.

Full walkthrough: `references/image-pipeline.md`.

---

## Multi-language support (i18n)

`CoverInput.locale` is optional (defaults to `"en"`). Supported:
`en` / `zh-CN` / `zh-TW` / `ja-JP` / `ko-KR`. Adding a new locale = append entries to the four tables in `src/i18n.ts`.

**What the skill localizes:**

| Layer | Behavior |
| --- | --- |
| Default labels (when input.series / kind missing) | Translated per `DEFAULT_LABELS[locale]` — e.g. `"TODAY'S DELTA"` → `"今日变化"` |
| Category labels | Canonical keys (`RISK / CATALYST / AMBIGUOUS`) accepted on input; output renders the locale's display string via `localizeCategory()` |
| `caps: true` flag | Auto-disabled for CJK locales (no uppercase in CJK; the small-caps tracking style doesn't apply) |
| `splitDelta` separators | CJK locales add `，、：；` to the priority list after the universal `vs / · / — / : / sign-boundary`. Threshold scales by char width — Latin ~25 chars, CJK ~14 chars before overflow risk |
| Font stack | Output `fonts.cover` and `fonts.metadata` carry primary face + locale-specific fallback chain (e.g. `["Delight", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", …]`) |
| Output metadata | `output.locale` + `output.direction` (`ltr` / future `rtl`) so renderers can apply correct styling without re-detecting |

**What the skill does NOT localize:**

- User-supplied content (`title`, `subtitle`, `author`, `tickers`, `kind`, `anchor`, `series`) — caller passes already-localized text. The skill renders what's given.
- Brand logos and ticker symbols — these are language-neutral.
- Anti-pattern rules and validation messages — stay in English (dev-facing).

**Renderer wiring:**

```jsx
const cover = generateCover({ ...playbook, locale: "zh-CN" });

// Apply font stack — single CSS string covers Latin + CJK fallback
<style>{`
  .cover-text { font-family: ${fontStackToCss(cover.fonts.cover)}; }
  .meta-text  { font-family: ${fontStackToCss(cover.fonts.metadata)}; }
`}</style>

<div lang={cover.locale} dir={cover.direction}>
  <CoverSvg output={cover} />
  <h3 style={{ ...cover.meta.title.style }}>{playbook.title}</h3>
</div>
```

`fontStackToCss(stack)` is exported from `src/i18n.ts`.

---

## Three-way sync discipline

Every rule change must land in ALL of:

1. **SKILL** — this file + `references/*.md` (authoritative rule text); append entry to `skills-updates/.../SUMMARY.md` for changelog.
2. **Figma 示例卡** — re-apply rule to the 12 Direction D cards (proof the rule renders).
3. **右侧说明面板** — in-canvas spec panel (what designers see during review).

Updating two of three creates silent drift. Cascade-aware: bg → text + icon + bar; portraitH → bg + textBase; card width → cover internals (type-scale). Always walk the cascade.

---

## Domain inference

If `input.domain` not provided:

1. Chip-row keyword exact match (`"Defense"` → `defense`).
2. Ticker roll-up — ≥ 60% of tickers in one GICS sector / crypto category.
3. Title keyword match (`src/icon-mapping.ts`).
4. Fallback — `general` template uses `guide`; other templates fail loudly.

---

## Versioning

`SKILL.md` and source files carry the rule version. `references/iteration-log.md` and `skills-updates/.../SUMMARY.md` date-stamp each rule change with rationale.

**Current**: 1.0.0 — 2026-04-28

---

## Glossary

- **Playbook** — a saved analytical workflow in Alva.
- **Cover** — the visual identity image at the top of the playbook's card.
- **Card** — full UI element: cover + metadata frame.
- **Template** — one of screener / thesis / what-if / general.
- **Domain** — content-category tag picking the default Material Symbol.
- **Ticker** — stock/crypto/ETF symbol.
- **textBase** — derived ink color for a card, dark-tinted variant of bg hue.
- **portraitH** — dominant hue of a portrait photo.
