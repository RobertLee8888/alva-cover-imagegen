# alva-cover-imagegen

### 👉 [**Open the live demo →**](https://robertlee8888.github.io/alva-cover-imagegen/)

Type a title, pick a template, paste tickers — the cover regenerates live, square-cornered, self-contained, downloadable as SVG or 4× PNG. Successor to [`alva-cover-generation`](https://github.com/RobertLee8888/alva-cover-generation), retuned for the 16:9 production thumbnail pipeline.

---

Pure-function skill for generating every Playbook cover in Alva's Explore grid. Same input / output shape as the sister repo — just sized for the 320 × 180 (16:9) canvas the production thumbnail service serves.

```ts
import { generateCover } from "./src/cover-gen";

const cover = generateCover({
  template: "thesis",
  title:    "Rates Regime Cockpit",
  author:   "zet",
  tickers:  [],
  domain:   "rates",
  category: "AMBIGUOUS",
  kind:     "TODAY'S DELTA · MAY 9",
  anchor:   "2s10s flat at +12 bp · Fed funds 4.50%",
});
// → bg gradient + icon spec + text palette + archetype content + metadata layout
```

One sync call. Every rendering rule on the output. No prompt composition, no AI image generation, no run-to-run drift. The same `CoverOutput` consumes cleanly across SVG / Figma plugin / CSS / Canvas / native renderers.

---

## Why a second repo?

`alva-cover-generation` shipped at the original 320 × 140 spec for the Direction-D Figma demos. Production landed at 320 × 180 (16:9) to match the screenshot service viewport, and along the way: hero text scaled up, the safe-zone redistributed, watermark icons grew to 120 × 120, the cover became square-cornered (corners clipped at the card container, not baked into the asset), and the SVG output became the deliverable rather than a stepping-stone to PNG generation.

The full diff is in [`IMAGEGEN-CONSISTENCY-PLAN.md`](./IMAGEGEN-CONSISTENCY-PLAN.md). Both repos coexist — the 320 × 140 baseline stays for the Figma research artifacts, the 16:9 canvas drives the production pipeline.

---

## What's in the box

| Path | What |
| --- | --- |
| `SKILL.md` | The complete spec — 4-template taxonomy, hash-derived bg, brand/portrait overrides, safe-zone discipline, no-truncation rules, anti-pattern catalog. |
| `IMAGEGEN-CONSISTENCY-PLAN.md` | The 320 × 140 → 320 × 180 spec diff with iteration history. |
| `src/` | The pure runtime. Thirteen TypeScript modules — types, generator, color, palette, brand registry, person registry, icon mapping, i18n, image fetcher, dimensions, metadata layout, SVG helpers, Figma plugin applicator. |
| `demo/` | A Vite + React app: input form (title, ticker, template, domain, category, delta body, etc.) → live SVG preview → download SVG / download 4× PNG. The page you'll get from `npm run dev` is the same page deployed to GitHub Pages. |
| `scripts/validate-brand-registry.ts` | CI guard that fails the build if any brand-registry entry has a stale `logoSlug` or wrong `hasCdnLogo`. |
| `.github/workflows/` | Pages deploy on every push to `main`; brand-registry validator on every PR. |

---

## Why this approach (vs AI image gen)

| | parametric SVG (this repo) | AI image generation |
| --- | --- | --- |
| Text fidelity | 100 % — renderer outputs literal input strings | Tickers / delta values / category labels frequently corrupted |
| Color consistency | Deterministic from input hash; same playbook → same gradient forever | Drifts run-to-run, even with identical prompt |
| File size | ~3 KB SVG | ~150 KB PNG (53× larger) |
| Generation time | < 1 ms (pure function) | 5 – 10 s (API roundtrip) |
| Cost per cover | $0 | $0.04 – 0.10 |
| Multi-locale | Change `input.locale`, regenerate; output is determined | Re-run generation for each locale |
| Container reuse | Square-cornered output works in any card radius | Pre-baked corner radius forces re-generation per surface |

Plus: the SVG output is **self-contained**. Brand logos (simpleicons CDN) and Material Symbols (`fonts.gstatic.com`) are fetched once at render time and inlined as `<path>` data — clients downloading the cover never hit upstream icon CDNs.

---

## Demo features

The interactive demo lives in `demo/` and ships at GitHub Pages:

- **Form-driven generation.** Pick a template (screener / thesis / what-if / general) and the form switches to the fields that matter for that template. Every input change re-renders the cover live (< 1 ms re-render, no debounce needed).
- **Inline text editing.** Cover text comes directly from form fields — edit `Caps label`, `Delta body`, `Hero %`, `Pulse`, etc. and the cover updates instantly. No "regenerate" button.
- **Presets.** Five preset playbooks (Thesis · Rates, Thesis · TSLA, General · BTC, What-If · SPY, Screener · Q-V) so you can see the system end-to-end without hand-typing.
- **Download SVG.** Clean self-contained SVG (3-5 KB), brand paths inlined, no external resources.
- **Download PNG.** 4× rasterized PNG (1280 × 720) via Canvas. Useful for slide decks, social previews.
- **Resolved CoverInput.** A collapsible panel shows the exact input object you'd pass to `generateCover()` if you were calling the library directly.

---

## Local development

```bash
git clone https://github.com/RobertLee8888/alva-cover-imagegen.git
cd alva-cover-imagegen
npm install
npm run dev          # starts Vite dev server, hot-reload on every src/ + demo/ change
npm run typecheck    # strict TypeScript across src/ + demo/
npm run validate:brands  # CI guard — verifies every BRAND_REGISTRY entry resolves on simpleicons CDN
npm run build        # production build into demo/dist
npm run preview      # serve the production build locally
```

The skill source lives at `src/`; demo imports it via the `@skill` alias defined in `demo/vite.config.ts`. Edit any file under `src/` and the demo hot-reloads.

---

## Production integration

The production thumbnail pipeline lives in `mono-meta` (PR #375). It calls `generateCover()` from this skill, renders the SVG via the same approach the demo uses, uploads to CDN with hash-keyed cache control, and writes the URL back to the playbook record.

Key deltas vs the original `alva-cover-generation`:

- Cover canvas: **320 × 180** (was 320 × 140)
- Safe zone: **264 × 120 centered** (was 264 × 100, top-pinned)
- Hero text bumped 1.22 – 1.25× to match the taller canvas (screener ticker 34 → 42, thesis delta 18 → 22 with lh 26, what-if hero 40 → 50, general pulse 28 → 34)
- Default watermark icon: **120 × 120** at (172, 30) — frame right edge stays at SAFE_RIGHT, grew leftward
- **Square-cornered output** — rounded corners clipped by outer card container (Explore card 12px, hero detail 20px), not baked into the SVG
- All brand logos / Material Symbols fetched + inlined at render time (no runtime CDN dependency for end users)

Every value above is derived from `src/dimensions.ts`. To change cover behavior: edit the SKILL.

---

## License

Internal Alva use. See `package.json` for `UNLICENSED` declaration. Third-party assets:

- **simpleicons.org** — brand logos under MIT, used per nominative-fair-use.
- **Material Symbols** — Apache 2.0.
- **Wikimedia Commons / public-domain government photos** — used for portrait covers per `BrandEntry.fallbacks` / `PersonEntry` license fields. See `src/person-registry.ts` for per-source licensing.

If a company requests removal of their logo, contact `legal@alva.xyz`.
