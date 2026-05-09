import { useMemo, useRef, useState } from 'react';
import type { CoverInput, Template, DomainKey, Locale } from '@skill/types';
import { CoverRenderer } from './components/CoverRenderer';
import { COVER_W, COVER_H } from '@skill/dimensions';

// Form field shape — flat, all-strings for easy form binding. We translate to
// CoverInput at the boundary, where each template uses input.kind / .anchor /
// .series with DIFFERENT semantics:
//
//   screener: series → caps label row (top); ticker hero comes from tickers[0]
//   thesis:   kind   → delta body (multi-line, split on · / vs / —)
//             anchor → caps label suffix (appended to "TODAY'S DELTA · ")
//             category → badge
//   what-if:  series → caps label row (top)
//             kind   → verb
//             anchor → hero %
//             whatIfBars → distribution bars on the right
//   general:  kind   → caps label kind (top)
//             anchor → pulse hero text
//             series → series caps (bottom)
type FormState = {
  template: Template;
  title: string;
  author: string;
  tickers: string;
  domain: DomainKey | '';
  capsTop: string;        // shows at TOP as small caps. Maps to series (screener/what-if), kind (general). For thesis, this becomes the suffix appended to "TODAY'S DELTA · ".
  hero: string;           // shows as the BIG element. Maps to anchor (what-if hero %, general pulse) or kind (thesis delta body).
  support: string;        // shows in the bottom support row. Maps to series (general). thesis/screener/what-if don't use this row.
  verb: string;           // what-if only — small caps row above hero. Maps to kind (what-if).
  category: '' | 'RISK' | 'CATALYST' | 'AMBIGUOUS';
  whatIfBars: string;
  locale: Locale;
};

const TEMPLATES: { value: Template; label: string }[] = [
  { value: 'screener', label: 'Screener · ranked list' },
  { value: 'thesis',   label: 'Thesis · narrative delta' },
  { value: 'what-if',  label: 'What-If · scenario verdict' },
  { value: 'general',  label: 'General · feed / dashboard' },
];

const DOMAINS: DomainKey[] = [
  'tech', 'software', 'ai', 'crypto',
  'dividend', 'value', 'growth', 'momentum',
  'defense', 'energy', 'renewables', 'biotech', 'healthcare',
  'retail', 'consumer_staples', 'real_estate', 'banks',
  'fed', 'macro', 'rates', 'fx', 'commodities',
  'trend_up', 'trend_down', 'trend_flat', 'event_study', 'earnings',
  'guide', 'weekly', 'review', 'watchlist', 'alerts', 'leaderboard',
];

const LOCALES: Locale[] = ['en', 'zh-CN', 'zh-TW', 'ja-JP', 'ko-KR'];

// Each preset uses the FormState semantic fields; we translate to CoverInput
// in buildInput(). capsTop / hero / support / verb are conceptual UI labels;
// the mapping to input.kind/anchor/series is template-aware.
const PRESETS: Record<string, FormState> = {
  thesisRates: {
    template: 'thesis',
    title: 'Rates Regime Cockpit',
    author: 'zet',
    tickers: '',
    domain: 'rates',
    capsTop: 'MAY 9',
    hero: '2s10s flat at +12 bp · Fed funds 4.50%',
    support: '',
    verb: '',
    category: 'AMBIGUOUS',
    whatIfBars: '',
    locale: 'en',
  },
  thesisTSLA: {
    template: 'thesis',
    title: 'TSLA Dip-Buy Reality Check',
    author: 'zet',
    tickers: 'TSLA',
    domain: '',
    capsTop: 'MAY 9',
    hero: 'Sentiment +18 pp · vs returns flat 3M',
    support: '',
    verb: '',
    category: 'AMBIGUOUS',
    whatIfBars: '',
    locale: 'en',
  },
  generalBTC: {
    template: 'general',
    title: 'BTC 周期诊断仪表盘',
    author: 'zet40',
    tickers: 'BTC',
    domain: 'momentum',
    capsTop: '周期信号 · 每 4 小时',
    hero: '62 / 100',
    support: '8 项指标 · 分阶段判读',
    verb: '',
    category: '',
    whatIfBars: '',
    locale: 'zh-CN',
  },
  whatIfSPY: {
    template: 'what-if',
    title: 'SPY After Hormuz Blockade',
    author: 'terrezzaeynon897',
    tickers: 'SPY,USO',
    domain: 'event_study',
    capsTop: '30D AFTER HORMUZ · 5×',
    hero: '−2.4%',
    support: '',
    verb: 'HISTORICALLY DROPS',
    category: '',
    whatIfBars: '-2.4,-1.8,-0.6,0.4,1.1,-1.5,-2.1,0.8',
    locale: 'en',
  },
  screenerQuality: {
    template: 'screener',
    title: 'Quality-Value Screener',
    author: 'ivan',
    tickers: 'PG,JNJ,KO,MSFT,AAPL,GOOGL',
    domain: 'value',
    capsTop: 'SCORED · S&P LARGE CAP · 6H',
    hero: '',  // screener hero comes from tickers[0]
    support: '',
    verb: '',
    category: '',
    whatIfBars: '',
    locale: 'en',
  },
  empty: {
    template: 'thesis',
    title: '',
    author: '',
    tickers: '',
    domain: '',
    capsTop: '',
    hero: '',
    support: '',
    verb: '',
    category: '',
    whatIfBars: '',
    locale: 'en',
  },
};

const DEFAULT: FormState = PRESETS.thesisRates;

export function App() {
  const [form, setForm] = useState<FormState>(DEFAULT);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const input: CoverInput = useMemo(() => buildInput(form), [form]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const applyPreset = (name: keyof typeof PRESETS) => {
    setForm(PRESETS[name]);
  };

  const downloadSvg = () => {
    if (!svgRef.current) return;
    const xml = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${xml}`], {
      type: 'image/svg+xml',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-${form.template}-${slugify(form.title) || 'untitled'}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadPng = async () => {
    if (!svgRef.current) return;
    const xml = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([xml], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = svgUrl;
    await new Promise((r) => (img.onload = r));

    const scale = 4;
    const canvas = document.createElement('canvas');
    canvas.width = COVER_W * scale;
    canvas.height = COVER_H * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cover-${form.template}-${slugify(form.title) || 'untitled'}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      URL.revokeObjectURL(svgUrl);
    }, 'image/png');
  };

  const t = form.template;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Alva Playbook Cover Generator</h1>
        <p>
          Fill the inputs on the left and the cover regenerates live on the right. Pure
          parametric — no AI image generation, no prompt engineering. The SVG output is
          self-contained (brand logos and Material Symbols inlined at render time).
        </p>
        <div className="meta">
          <a href="https://github.com/RobertLee8888/alva-cover-imagegen" target="_blank" rel="noreferrer">↗ Source</a>
          <a href="https://github.com/RobertLee8888/alva-cover-imagegen/blob/main/SKILL.md" target="_blank" rel="noreferrer">↗ SKILL</a>
          <a href="https://github.com/RobertLee8888/alva-cover-generation" target="_blank" rel="noreferrer">↗ Sister repo (320×140 baseline)</a>
        </div>
      </header>

      <div className="layout">
        <section className="form-panel" aria-label="Cover inputs">
          <div className="presets">
            <span className="muted">Presets:</span>
            <button onClick={() => applyPreset('thesisRates')}>Thesis · Rates</button>
            <button onClick={() => applyPreset('thesisTSLA')}>Thesis · TSLA</button>
            <button onClick={() => applyPreset('generalBTC')}>General · BTC</button>
            <button onClick={() => applyPreset('whatIfSPY')}>What-If · SPY</button>
            <button onClick={() => applyPreset('screenerQuality')}>Screener · Q-V</button>
            <button onClick={() => applyPreset('empty')}>Clear</button>
          </div>

          <Field label="Template">
            <select value={form.template} onChange={(e) => update('template', e.target.value as Template)}>
              {TEMPLATES.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </Field>

          <Field label="Title" hint="Drives the bg hue hash. Not rendered on the cover.">
            <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Rates Regime Cockpit" />
          </Field>

          <Field label="Tickers" hint={t === 'screener' ? 'Comma-separated. First becomes the hero, rest become peer chips.' : 'Comma-separated. Single ticker triggers brand-color override.'}>
            <input type="text" value={form.tickers} onChange={(e) => update('tickers', e.target.value)} placeholder={t === 'screener' ? 'PG, JNJ, KO, MSFT' : 'BTC  ·  or  ·  TSLA'} />
          </Field>

          <Field label="Domain" hint="Optional. Selects the Material Symbol when no brand logo applies.">
            <select value={form.domain} onChange={(e) => update('domain', e.target.value as DomainKey | '')}>
              <option value="">(infer from title)</option>
              {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>

          {/* ----- TEMPLATE-SPECIFIC FIELDS ----- */}

          {t === 'thesis' && (
            <>
              <Field label="Caps label suffix" hint={`Appended to "TODAY'S DELTA · ", uppercased automatically. e.g. "MAY 9".`}>
                <input type="text" value={form.capsTop} onChange={(e) => update('capsTop', e.target.value)} placeholder="MAY 9" />
              </Field>
              <Field label="Category badge" hint="Drives the colored dot + label above the delta body.">
                <select value={form.category} onChange={(e) => update('category', e.target.value as FormState['category'])}>
                  <option value="">(none)</option>
                  <option value="RISK">RISK</option>
                  <option value="CATALYST">CATALYST</option>
                  <option value="AMBIGUOUS">AMBIGUOUS</option>
                </select>
              </Field>
              <Field label="Delta body" hint='Hero text. Auto-split into 2 lines on " · ", " vs ", " — ", or whitespace.'>
                <textarea rows={2} value={form.hero} onChange={(e) => update('hero', e.target.value)} placeholder="2s10s flat at +12 bp · Fed funds 4.50%" />
              </Field>
            </>
          )}

          {t === 'screener' && (
            <Field label="Caps label" hint='Top row, e.g. "SCORED · S&P LARGE CAP · 6H". The hero ticker comes from the first item in the Tickers list above.'>
              <input type="text" value={form.capsTop} onChange={(e) => update('capsTop', e.target.value)} placeholder="SCORED · S&P LARGE CAP · 6H" />
            </Field>
          )}

          {t === 'what-if' && (
            <>
              <Field label="Caps label" hint='Top row, e.g. "30D AFTER HORMUZ · 5×".'>
                <input type="text" value={form.capsTop} onChange={(e) => update('capsTop', e.target.value)} placeholder="30D AFTER HORMUZ · 5×" />
              </Field>
              <Field label="Verb" hint='Small caps above the hero. e.g. "HISTORICALLY DROPS".'>
                <input type="text" value={form.verb} onChange={(e) => update('verb', e.target.value)} placeholder="HISTORICALLY DROPS" />
              </Field>
              <Field label="Hero %" hint='Signed percentage, e.g. "−2.4%".'>
                <input type="text" value={form.hero} onChange={(e) => update('hero', e.target.value)} placeholder="−2.4%" />
              </Field>
              <Field label="Distribution bars" hint="Comma-separated signed % values, e.g. -2.4, 1.1, -0.8">
                <input type="text" value={form.whatIfBars} onChange={(e) => update('whatIfBars', e.target.value)} placeholder="-2.4, -1.8, -0.6, 0.4, 1.1" />
              </Field>
            </>
          )}

          {t === 'general' && (
            <>
              <Field label="Kind label" hint='Top caps row, e.g. "CONTEXT FEED · daily" or "周期信号 · 每 4 小时".'>
                <input type="text" value={form.capsTop} onChange={(e) => update('capsTop', e.target.value)} placeholder="CONTEXT FEED · daily" />
              </Field>
              <Field label="Pulse text" hint='Hero, e.g. "62 / 100", "2h ago", "38 holdings".'>
                <input type="text" value={form.hero} onChange={(e) => update('hero', e.target.value)} placeholder="62 / 100" />
              </Field>
              <Field label="Series caps" hint="Bottom support row.">
                <input type="text" value={form.support} onChange={(e) => update('support', e.target.value)} placeholder="8 项指标 · 分阶段判读" />
              </Field>
            </>
          )}

          <Field label="Author" hint="Shows below the cover in production. Not rendered on the cover SVG.">
            <input type="text" value={form.author} onChange={(e) => update('author', e.target.value)} placeholder="zet" />
          </Field>

          <Field label="Locale">
            <select value={form.locale} onChange={(e) => update('locale', e.target.value as Locale)}>
              {LOCALES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>
        </section>

        <section className="preview-panel" aria-label="Live cover preview">
          <div className="preview-card">
            <div className="cover-frame">
              <CoverRenderer input={input} ref={svgRef} />
            </div>
            <div className="preview-meta">
              <div className="meta-title">{form.title || <span className="muted">(no title)</span>}</div>
              <div className="meta-author">{form.author || <span className="muted">(no author)</span>}</div>
            </div>
          </div>

          <div className="actions">
            <button className="primary" onClick={downloadSvg}>Download SVG</button>
            <button onClick={downloadPng}>Download PNG (1280×720)</button>
          </div>

          <details className="json-debug">
            <summary>Resolved CoverInput (what gets passed to generateCover)</summary>
            <pre>{JSON.stringify(input, null, 2)}</pre>
          </details>
        </section>
      </div>

      <footer className="footer">
        <p>
          Render: pure synchronous <code>generateCover()</code> + SVG layout. Brand logos
          fetched from <code>cdn.simpleicons.org</code>; Material Symbols from <code>fonts.gstatic.com</code>;
          both inlined into the saved SVG so the asset is self-contained.
        </p>
      </footer>
    </div>
  );
}

// ---------- helpers ----------

// Translate the FormState (semantic UI fields) to a CoverInput. Each template
// uses input.kind / .anchor / .series with different meanings; we route the
// form's semantic capsTop / hero / support / verb to the correct field per
// template.
function buildInput(f: FormState): CoverInput {
  const tickers = f.tickers
    .split(',')
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  const whatIfBars =
    f.template === 'what-if' && f.whatIfBars
      ? f.whatIfBars
          .split(',')
          .map((s) => parseFloat(s.trim()))
          .filter((n) => !Number.isNaN(n))
      : undefined;

  const out: CoverInput = {
    template: f.template,
    title: f.title || ' ',
    author: f.author || ' ',
    tickers,
  };
  if (f.domain) out.domain = f.domain;
  if (f.locale) out.locale = f.locale;

  switch (f.template) {
    case 'screener':
      // capsTop → series ; hero/support unused (hero ticker comes from tickers[0])
      if (f.capsTop) out.series = f.capsTop;
      break;

    case 'thesis':
      // capsTop → anchor (suffix appended to "TODAY'S DELTA · ")
      // hero    → kind   (delta body, multi-line via splitDelta)
      if (f.capsTop) out.anchor = f.capsTop;
      if (f.hero)    out.kind   = f.hero;
      if (f.category) out.category = f.category as 'RISK' | 'CATALYST' | 'AMBIGUOUS';
      break;

    case 'what-if':
      // capsTop → series ; verb → kind ; hero → anchor
      if (f.capsTop) out.series = f.capsTop;
      if (f.verb)    out.kind   = f.verb;
      if (f.hero)    out.anchor = f.hero;
      if (whatIfBars && whatIfBars.length) out.whatIfBars = whatIfBars;
      break;

    case 'general':
      // capsTop → kind ; hero → anchor ; support → series
      if (f.capsTop) out.kind   = f.capsTop;
      if (f.hero)    out.anchor = f.hero;
      if (f.support) out.series = f.support;
      break;
  }

  return out;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <div className="field-label">
        <span>{label}</span>
        {hint && <span className="field-hint">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
