# Imagegen-skill consistency plan — keeping the image-cover path
# visually identical to the parametric skill

Status: 2026-05-09 — adopted after the team chose `alva-playbook-cover-imagegen`
(PR #375) over the parametric `alva-cover-generation` path. The parametric
skill stays in-tree as the **specification source of truth**; the imagegen
skill is the **shipping renderer**. Both must produce visually equivalent
covers under one shared set of design tokens.

---

## TL;DR

Three things to ship into `users/lhx/skills/alva-playbook-cover-imagegen/`:

1. **Canonical 16:9 size** — 1536×864 source, 320×180 thumbnail. Lock it
   in `references/design/playbook-cover-visual.md` and re-map every
   y-coordinate from the 140-tall spec to 180.
2. **One token source of truth** — copy `cover-design-tokens.json` (a flat
   key-value snapshot of `src/dimensions.ts` + the locale-independent
   parts of `src/i18n.ts`) into both skills. The prompt builder
   substitutes those exact values into every recipe at render time.
3. **A text-fidelity gate** — AI image generators corrupt small text.
   Mandatory post-gen OCR verification + parametric fallback when OCR
   fails, so a wrong ticker symbol can never reach production.

Everything below is the detail behind those three.

---

## A. Canonical size — 16:9 wins

| Dimension                | Value         | Notes                          |
| ------------------------ | ------------- | ------------------------------ |
| Source render            | **1536 × 864** | What the image API returns    |
| Display thumbnail        | **320 × 180**  | What the Explore card shows   |
| Aspect ratio             | **16:9 (1.778)** | Matches staging               |
| Scale factor (source ÷ display) | **4.8×**   | Used for prompt y-coords      |

**Why 16:9 and not the original 320×140 (2.29:1):**
- Staging already renders 320×180 — adopting it preserves the platform
  team's work.
- 16:9 gives +40 vertical pixels at display scale, which the parametric
  spec consistently complained was tight (chips often crowded the bottom
  edge at 140px).
- 16:9 is the standard for OG-image / social-share thumbnails — same
  asset doubles as marketing surface.

**Cropping note for the imagegen API** — the current pipeline returns
1536×1024 and center-crops to 1536×864. Confirm with the model provider
that bottom-cropping (not center) is acceptable; otherwise `bottom-crop
1024 → 864` keeps text-bearing top region intact.

---

## B. Safe-zone remap — 320×140 → 320×180

**Policy (2026-05-09, third revision — final):** safe zone grows from
264×100 to **264×120**, vertically centered. Top and bottom each get a
30-px margin. Element y-coords are proportionally rescaled:

```
y_new = 30 + (y_old − 20) × 1.2
```

Multi-line text blocks keep their internal line-height fixed (e.g.
thesis delta lh=22 unchanged). Only the block's anchor y is rescaled.

**Iteration history of this turn:**

1. First try — keep `SAFE_H=100`, push all 40 px to bottom (`SAFE_BOTTOM`
   120 → 160). Rejected: forced re-tuning every layout cluster.
2. Second try — keep `SAFE_H=100`, vertically center it (`SAFE_TOP=40` /
   `SAFE_BOTTOM=140`). Element y-coords get a flat +20 shift.
   Rejected on review: content felt cramped in the middle, with 40 px
   of dead space at both top and bottom.
3. Final — `SAFE_H=120` centered (`SAFE_TOP=30` / `SAFE_BOTTOM=150`),
   proportional rescale of element y-coords. Top label moves up
   (closer to canvas top), bottom element moves down, internal gaps
   stretch by 1.2×, line-heights stay fixed.

| Token            | Old (320×140) | New (320×180) | Source-px (×4.8) |
| ---------------- | ------------- | ------------- | ---------------- |
| `SAFE_LEFT`      | 28            | 28            | 134              |
| `SAFE_RIGHT`     | 292           | 292           | 1402             |
| `SAFE_TOP`       | 20            | **30** (+10)  | 144              |
| `SAFE_BOTTOM`    | 120           | **150** (+30) | 720              |
| `SAFE_W`         | 264           | 264           | 1267             |
| `SAFE_H`         | 100           | **120** (+20) | 576              |
| `BARS_LEFT`      | 184           | 184           | 883              |
| `BARS_RIGHT`     | 292           | 292           | 1402             |
| `BARS_W`         | 108           | 108           | 518              |
| Default icon     | (192, 22, 100) | **(172, 30, 120)** | (826, 144, 576) |
| What-if icon     | (240, 12, 64)  | **(240, 22, 64)**  | (1152, 106, 307) |

Default-icon scale rationale: the original 100×100 frame was tuned for
a 320×140 cover; on the 320×180 cover the same icon felt
under-weighted relative to the larger hero text. Scaled to 120×120
(+20 %) — frame right edge stays pinned to SAFE_RIGHT=292 (icon grows
leftward), frame fills the safe zone vertically (y=30 to y=150) and
ghost-touches both safe-zone edges. Inner vector at the canonical 80 %
inset is now 96×96 at (184, 42), preserving a 12-px buffer to safe
zone — main mass still inside.

Brand opacity calibration table updated for the 120-frame:

| Frame size | Inner vector       | Brand opacity |
| ---------- | ------------------ | ------------- |
| 120×120    | 96×96 at (12, 12)  | **0.40**      |
| 64×64      | 51×51 at (6.4, 6.4)| 0.50          |

**Cover image itself is square-cornered (no rx/ry).** Rounded corners
are clipped by the outer card container at render time, NOT baked into
the cover image. This keeps the cover asset reusable across containers
with different corner radii (Explore card, hero detail, share preview).

---

## C. Per-template y-coordinate remap

**Universal rule:** apply `y_new = 30 + (y_old − 20) × 1.2` to every
block-anchor y. Multi-line text blocks (thesis delta) keep their
internal line-height fixed — only the first-line anchor is rescaled.

**Hero text grows with the canvas.** The 16:9 cover has 28 % more
height than the original 2.29:1; large display text scales
proportionally so it doesn't look undersized in the new aspect:

| Hero element                | Old base | New base | Ratio  |
| --------------------------- | -------- | -------- | ------ |
| Screener ticker hero        | 34 px    | **42 px** | 1.235 |
| Thesis delta body           | 18 px    | **22 px** (lh 22 → **26**) | 1.22 |
| What-if hero %              | 40 px    | **50 px** | 1.25  |
| General pulse               | 28 px    | **34 px** | 1.21  |

Small text (caps labels 9 px, category 11 px, chips 9 px, series 10 px)
stays at original size — these are functional / metadata-tier and
don't compete for visual weight at the larger canvas.

**Below-midline content shifts toward safe-zone bottom.** Earlier
proportional-rescale put the main content cluster mid-canvas; on
review this read as top-heavy (more empty space below than above).
Final positions anchor the lowest content element ~2 px above
SAFE_BOTTOM (y=148–150) and work back up.

### C1. Screener

| Element        | y (was 320×140 → new 320×180) | Style                                |
| -------------- | ----------------------------- | ------------------------------------ |
| Caps label     | 24 → **35**   | Semi Bold 9 px, tracked 0.16 em                       |
| Ticker hero    | 48 → **70**   | Semi Bold **42 px**, hero-role                        |
| Peer-chips row | 100 → **128** | Chip h=20, bottom edge anchored to SAFE_BOTTOM−2 (y=148) |

### C2. Thesis

| Element            | y (was 320×140 → new 320×180) | Style                            |
| ------------------ | ----------------------------- | -------------------------------- |
| Caps label         | 24 → **35**   | Semi Bold 9 px tracked                                |
| Category badge dot | 60 → **82**   | 6 px circle in `CATEGORY_COLORS[category]`             |
| Category label     | 60 → **82**   | Semi Bold 11 px, same color                            |
| Delta body line 1  | 72 → **100**  | Semi Bold **22 px**, line-height **26**                |
| Delta body line 2  | 94 → **126**  | line 1 + lh=26 (lh fixed, NOT rescaled)                |

### C3. What-if

| Element        | y (was 320×140 → new 320×180) | Style                                |
| -------------- | ----------------------------- | ------------------------------------ |
| Caps label     | 20 → **30**   | Semi Bold 9 px tracked                                |
| Verb           | 64 → **83**   | Semi Bold 9 px caps tracked, support-role             |
| Hero pct text  | 80 → **100**  | Semi Bold **50 px**, hero-role (cap-top y=100, bottom y=150 = SAFE_BOTTOM) |
| Bars zone      | y∈[30,120] → **y∈[42,148]** | x∈[184,292], opacity 0.55, +/-color split |

### C4. General

| Element     | y (was 320×140 → new 320×180) | Style                                |
| ----------- | ----------------------------- | ------------------------------------ |
| Kind label  | 24 → **35**   | Semi Bold 9 px tracked                                |
| Pulse text  | 66 → **94**   | Semi Bold **34 px**, hero-role                        |
| Series name | 106 → **140** | Semi Bold 10 px caps, support-role                    |

### C5. Portrait (overlays template C1–C4)

Layer 0 fill: full-bleed image at **opacity 0.18**, `xMidYMin slice`
crop, exact filter values from `references/image-pipeline.md` (filters
unchanged — this is the bug-prone bit and any drift here is a defect):

```
saturation:  -0.55
exposure:    +0.22
contrast:    +0.05
temperature: 0     ← MUST be 0
tint:        0
highlights:  +0.10
shadows:     +0.15
```

For imagegen path: the model is asked to *paint* an editorial high-key
washed portrait directly into the bg layer, but text is forbidden in
that region (see §E). The portrait registry in `src/person-registry.ts`
remains the authoritative list of allowed subjects.

---

## D. Shared token contract

Create `skills/alva-cover-generation/dist/cover-design-tokens.json` —
a flat machine-readable snapshot the parametric build emits and the
imagegen skill imports. (Keep `src/dimensions.ts` as source; emit via
a tiny `pnpm build:tokens` step.)

Schema:

```json
{
  "version": "2026-05-09",
  "canvas": {
    "displayW": 320, "displayH": 180,
    "sourceW": 1536, "sourceH": 864,
    "scale": 4.8,
    "aspectRatio": "16:9"
  },
  "safeZone": {
    "left": 28, "right": 292, "top": 20, "bottom": 160,
    "w": 264, "h": 140
  },
  "icon": {
    "default": { "x": 192, "y": 22, "size": 100 },
    "whatIf":  { "x": 240, "y": 12, "size": 64 }
  },
  "bars": { "left": 184, "right": 292, "w": 108, "gap": 3 },
  "typography": {
    "coverFamily":    "\"Delight\", -apple-system, system-ui, \"Segoe UI\", Helvetica, Arial, sans-serif",
    "metadataFamily": "\"Inter\", -apple-system, system-ui, \"Segoe UI\", Helvetica, Arial, sans-serif",
    "weights": { "regular": 400, "medium": 500, "semiBold": 600, "bold": 700 },
    "trackedCaps": 0.16,
    "floors": { "hero": 32, "verb": 14, "pulse": 22, "delta": 14, "label": 9 }
  },
  "categoryColors": {
    "RISK":      "#DC2626",
    "CATALYST":  "#16A34A",
    "AMBIGUOUS": "#D97706"
  },
  "paletteBands": {
    "screener": { "baseH": 170, "range": 25, "S": 0.24, "L": 0.94 },
    "thesis":   { "baseH":  40, "range": 30, "S": 0.26, "L": 0.95 },
    "whatIf":   { "baseH": 220, "range": 35, "S": 0.22, "L": 0.95 },
    "general":  { "baseH": 280, "range": 40, "S": 0.20, "L": 0.96 }
  },
  "textPalette": {
    "heroAlpha":    0.92,
    "supportAlpha": 0.70,
    "labelAlpha":   0.55
  },
  "portraitFilters": {
    "saturation": -0.55, "exposure": 0.22, "contrast": 0.05,
    "temperature": 0, "tint": 0, "highlights": 0.10, "shadows": 0.15
  }
}
```

**Rule:** the imagegen prompt template never narrates these values
("warm cream", "deep brown") — it substitutes them as literal hex /
numeric strings. Drift between code and prose is the failure mode that
killed the previous iteration; literal substitution removes the
opportunity.

---

## E. Prompt-recipe rewrite

Replace the prose-style cores in `references/design/playbook-cover-visual.md`
with parameterized templates. The runtime substitutes from the input +
shared tokens before calling the image API.

### E1. Hard universal constraints (every prompt prepends these)

```
Render exactly what is specified. Do not add extra elements.
Canvas: 1536 × 864 px, 16:9 aspect ratio, premium fintech UI illustration style.
Color palette: keep within ΔE76 < 8 of the listed hex values.
Typography: typeset all text in {{coverFamily}}, weight {{semiBold}} (600), letter-spacing 0 unless tracked-caps noted.
Tracked caps: letter-spacing 0.16 em, fully UPPERCASE.
DO NOT alter, abbreviate, translate, or invent any text string. Render the literal characters supplied.
DO NOT add lorem ipsum, placeholder labels, "Tab1", "No Data", or filler text.
DO NOT include logos, watermarks, signatures, frames, drop shadows on text, or sparkles.
Background: smooth vertical gradient from {{bgTopHex}} (top) to {{bgBotHex}} (bottom). No noise, no pattern.
```

### E2. Template body — screener

```
Foreground content (in 1536×864 source coordinates):
- At (134, 115): UPPERCASE caps label "{{label}}", Semi Bold 43 px, tracked
  0.16 em, color {{labelColorHex}}.
- At (134, 278): ticker hero "{{ticker}}", Semi Bold 182 px, color
  {{heroColorHex}}, sentence-case but actual ticker is upper.
- At (134, 595)–(1402, 685): horizontal row of {{N}} peer chips,
  each chip "{{peerTicker}}" rendered as a pill: 86 px tall, fill
  {{baseColorHex}} at α 0.10, text Semi Bold 43 px in {{baseColorHex}}
  at α 0.72, horizontal padding 38 px, gap 19 px between chips.
- Icon: at (922, 106), 480×480, brand logo of {{brandLogoSlug}} OR Material
  Symbol "{{fallbackSymbol}}", color {{iconColorHex}}, opacity 0.40.
```

### E3. Template body — thesis

```
Foreground content (in 1536×864 source coordinates):
- At (134, 115): UPPERCASE caps label "{{label}}", Semi Bold 43 px, tracked.
- Category cluster centered at y=336:
    - 29 px filled circle at x=134, color {{categoryHex}}.
    - "{{categoryLabel}}" immediately right of dot, Semi Bold 53 px,
      tracked 0.16 em, color {{categoryHex}}.
- Delta body, Semi Bold 86 px, 1.25 line-height, color {{heroColorHex}}:
    - Line 1 at (134, 442): "{{deltaLine1}}"
    - Line 2 at (134, 557): "{{deltaLine2}}"
  Lines are pre-split at semantic breaks — render exactly as supplied.
- Icon: at (922, 106), 480×480 — same as screener.
```

### E4. Template body — what-if

```
Foreground content (in 1536×864 source coordinates):
- At (134, 96): UPPERCASE caps label "{{label}}", Semi Bold 43 px, tracked.
- At (134, 403): verb "{{verb}}", Semi Bold 67 px, color {{supportColorHex}}.
- At (134, 528): hero percent "{{heroPct}}", Semi Bold 192 px, color
  {{heroColorHex}}.
- Distribution bars at x∈[883, 1402], y∈[192, 720]:
    {{N}} vertical bars, gap 14.4 px, opacity 0.55.
    Positive bars in {{positiveHex}}, negative in {{negativeHex}}.
    Zero line at y={{zeroLineSourceY}}, 1 px, {{baseColorHex}} at α 0.15.
- Icon: at (1152, 58), 307×307 — smaller, top-right.
```

### E5. Template body — general

```
Foreground content (in 1536×864 source coordinates):
- At (134, 115): UPPERCASE caps label "{{kindLabel}}", Semi Bold 43 px, tracked.
- At (134, 413): pulse text "{{pulseText}}", Semi Bold 134 px, color
  {{heroColorHex}}.
- At (134, 662): series name "{{seriesText}}", Medium 53 px, color
  {{supportColorHex}}.
- Icon: at (922, 106), 480×480 — same as screener.
```

### E6. Portrait overlay (additive)

Prepend before the foreground rules:

```
Background style: editorial high-key wash of {{subjectName}}, full-bleed,
top-anchored crop (subject's eyes near top third). Apply: saturation -55%,
exposure +22%, contrast +5%, temperature 0 (NEUTRAL — no warm cast),
highlights +10%, shadows +15%. Final image opacity 18%. Composition:
"big background, small subject" — face occupies right ~40% of canvas;
left ~60% is reserved for foreground text.
```

---

## F. Text-fidelity safeguards

This is the highest-risk area: AI image generators are known to corrupt
or invent text in small UI labels, and a wrong ticker symbol on a
production card is a ship-blocker.

### F1. Pre-flight — input cleanup

- Reject inputs whose `title` / `ticker` / `delta` strings contain
  unicode look-alikes (Cyrillic А for Latin A, etc.) — known prompt
  poisoning vector.
- Reject inputs where rendered text would exceed the safe zone width
  before the image API even runs. The parametric path does this; the
  imagegen path must mirror it.

### F2. Post-gen OCR verification (mandatory gate)

Every returned image runs through OCR (`tesseract` is sufficient for
this scale) and the recognized strings are compared against the input
spec:

```
verify(input, generatedImage) =>
  let detected = ocr(generatedImage)
  // For each text element in the spec:
  for el in [label, ticker, deltaLine1, deltaLine2, categoryLabel, ...]:
     if el.text ∉ detected: FAIL
     if levenshtein(el.text, nearestMatch(detected, el.text)) > 1: FAIL
  return PASS
```

Tolerance: Levenshtein 1 (one OCR confusion of a similar glyph is OK).
Levenshtein 2+ on a ticker symbol is a fail — re-prompt or fall back.

### F3. Failure-handling ladder

1. OCR fails → re-prompt up to 2 more times with stronger negative
   constraints ("Do NOT modify or replace the ticker symbol AAPL").
2. Still failing → fall back to **parametric SVG render** via the
   `alva-cover-generation` skill. This is why the parametric path stays
   in-tree as a kept-warm fallback, not a deleted artifact.
3. Log the failure to a metrics channel so the team can spot regressions
   in the image model over time.

### F4. Color verification (lightweight)

After OCR passes, sample the bg gradient at 3 fixed y-positions and
verify each sample lands within ΔE76 < 8 of the spec'd `{{bgTopHex}}` /
`{{bgBotHex}}`. Failures here are visual-drift bugs that OCR misses.

---

## G. Two-version consistency contract

To keep parametric and imagegen visually equivalent forever, four
discipline rules:

1. **One token source.** `cover-design-tokens.json` is generated from
   the parametric `src/dimensions.ts`. The imagegen skill imports it as a
   build-time artifact, not a re-typed copy. Drift = build error.

2. **One input shape.** Both skills accept the same `CoverInput`
   (`src/types.ts`). The imagegen prompt builder is a *function from
   `CoverInput` to prompt text*; it does not invent fields, it does not
   accept extra fields.

3. **Cross-validation in CI.** A test script renders 8 fixed
   representative inputs through both paths and produces a side-by-side
   image strip. PRs that change either skill must attach the strip; a
   reviewer eyeballs the diff. (Automated SSIM threshold is unreliable
   for AI-generated images — humans verify.)

4. **Three-way sync still applies.** When a rule changes (e.g. tracked
   caps go from 0.16 to 0.14 em), update:
   - `src/dimensions.ts` (token source) → regenerates JSON
   - The imagegen skill consumes the new JSON automatically
   - Update the on-Figma example cards (Direction-D demo)
   - Update the `D · 设计规范` panel
   - Append a row to `skills-updates/alva-cover-generation/SUMMARY.md`

---

## H. Cost mitigation

Image generation at $0.04–0.10 per image becomes meaningful at scale.
Mitigations, in order of value:

1. **Hash-keyed cache, not UUID-keyed.** Cache key:
   `sha256(template + title + tickers.join("|") + domain + locale + tokenVersion)`.
   Identical inputs across two playbooks share one image; staging's
   current `screenshot-{uuid}.png` URLs throw away that reuse.
2. **Lazy generation on first card-impression**, not pre-generation on
   playbook publish. Most playbooks are accessed by a small head; tail
   playbooks should not pre-pay for an image the user will never see.
3. **Single locale by default** — render English; render localized
   variants only when a non-English user actually loads the playbook.
   Check the Accept-Language header, fall back to English image.
4. **Long-lived CDN cache** — these images are deterministic from
   input. `Cache-Control: public, max-age=31536000, immutable` with a
   token-version segment in the URL path so a token bump invalidates
   cleanly.

Order-of-magnitude estimate (rough, not authoritative): with cache reuse
+ lazy gen + English-only default, image API spend should drop ~70%
relative to upfront-batch-per-playbook-per-locale.

---

## I. Acceptance criteria — when imagegen is "ready"

The PR is ready to merge when, by inspection:

- `playbook-cover-visual.md` references `cover-design-tokens.json` and
  no design value appears in prose form (no "warm cream", "deep brown",
  "small light text" — only `{{labelColorHex}}` etc.).
- All five template recipes contain literal source-coordinates and
  literal token slots, not English descriptions of "where things go".
- The OCR gate runs in the request pipeline (not as a manual QA pass).
- The parametric fallback path is wired into the same endpoint, with
  metrics for fallback rate.
- A test fixture renders one playbook of each template through both
  parametric and imagegen and the dual strip is attached to the PR.

---

## J. Migration sequence (suggested)

| Step | Owner | Description |
| ---- | ----- | ----------- |
| 1 | parametric maintainer | Emit `cover-design-tokens.json` from `src/dimensions.ts` (`pnpm build:tokens`) |
| 2 | imagegen skill author  | Replace prose recipes in `playbook-cover-visual.md` with parameterized §E versions |
| 3 | imagegen skill author  | Add OCR + ΔE76 gate to the request pipeline |
| 4 | imagegen skill author  | Wire parametric SVG fallback for OCR failures |
| 5 | platform | Switch CDN cache key from UUID to hash; keep UUID redirect for 30 days |
| 6 | both | Generate dual-strip CI fixture, attach to PR, eyeball-review |
| 7 | both | Merge, monitor fallback rate for 7 days, then close this plan |

---

*Authored 2026-05-09. Pin this doc next to MIGRATION-V2.md as the
authoritative spec for the imagegen pivot. Any divergence between this
spec and the shipped imagegen skill is a bug in the skill, not in the
spec — open an issue, don't fork the spec.*
