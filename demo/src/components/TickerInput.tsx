// TickerInput — Ant-Design Select-tags-style multi-value input.
//
// Behavior parity with https://ant.design/components/select#components-select-demo-tags:
//   - Click / focus the field → dropdown opens immediately, listing all
//     registered tickers from BRAND_REGISTRY (filtered to "not yet added").
//   - Type to filter; suggestions narrow live.
//   - Type a value not in BRAND_REGISTRY → a "Press Enter to add" pseudo-row
//     appears at the top of the dropdown (Ant calls this the "tags mode").
//   - Click a suggestion (or press Enter on the highlighted one) → adds chip,
//     clears the input, KEEPS dropdown open and focus in the input so you
//     can keep adding without re-clicking.
//   - Backspace on empty input → removes the last chip.
//   - Escape → closes dropdown without adding.
//   - ↑/↓ → navigate suggestions.

import { useEffect, useMemo, useRef, useState } from 'react';
import { BRAND_REGISTRY } from '@skill/brand-registry';

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

const ALL_REGISTERED = Object.keys(BRAND_REGISTRY).sort();

export function TickerInput({ value, onChange, placeholder }: Props) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const draftUpper = draft.trim().toUpperCase();

  const filtered = useMemo(() => {
    const available = ALL_REGISTERED.filter((t) => !value.includes(t));
    if (!draftUpper) return available.slice(0, 50); // show all on focus, capped to keep DOM small
    return available.filter((t) => t.includes(draftUpper)).slice(0, 50);
  }, [draftUpper, value]);

  const showAddCustom = draftUpper.length > 0 && !ALL_REGISTERED.includes(draftUpper) && !value.includes(draftUpper);

  // The total list of selectable rows: optional "add custom" + filtered registry.
  type Row = { kind: 'custom' | 'registered'; ticker: string };
  const rows: Row[] = useMemo(() => {
    const r: Row[] = [];
    if (showAddCustom) r.push({ kind: 'custom', ticker: draftUpper });
    for (const t of filtered) r.push({ kind: 'registered', ticker: t });
    return r;
  }, [showAddCustom, draftUpper, filtered]);

  // Reset highlight when rows change.
  useEffect(() => {
    setActiveIdx(0);
  }, [draftUpper, value.length]);

  const addTicker = (raw: string) => {
    const t = raw.trim().toUpperCase();
    if (!t || value.includes(t)) {
      setDraft('');
      return;
    }
    onChange([...value, t]);
    setDraft('');
    // Keep dropdown open + focus — Ant pattern.
    inputRef.current?.focus();
  };

  const removeTicker = (t: string) => {
    onChange(value.filter((x) => x !== t));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      if (open && rows[activeIdx]) {
        e.preventDefault();
        addTicker(rows[activeIdx]!.ticker);
      } else if (draft.trim()) {
        e.preventDefault();
        addTicker(draft);
      }
    } else if (e.key === 'Backspace' && !draft && value.length) {
      removeTicker(value[value.length - 1]!);
    } else if (e.key === 'ArrowDown' && open && rows.length) {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === 'ArrowUp' && open && rows.length) {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="ticker-input" ref={containerRef}>
      <div
        className={`tag-row ${open ? 'is-open' : ''}`}
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        {value.map((t) => (
          <span key={t} className="tag">
            <span className="tag-label">{t}</span>
            <button
              type="button"
              className="tag-close"
              aria-label={`Remove ${t}`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeTicker(t);
              }}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                <path d="M1 1 L7 7 M7 1 L1 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={value.length ? '' : placeholder ?? 'Type to search or add'}
          autoComplete="off"
          spellCheck={false}
        />
        <span className={`select-chevron ${open ? 'is-open' : ''}`} aria-hidden="true">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M2 4 L5 7 L8 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>

      {open && rows.length > 0 && (
        <ul className="ticker-suggestions" role="listbox">
          {rows.map((row, i) => (
            <li
              key={`${row.kind}-${row.ticker}`}
              role="option"
              aria-selected={i === activeIdx}
              className={`suggestion ${row.kind} ${i === activeIdx ? 'is-active' : ''}`}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                addTicker(row.ticker);
              }}
            >
              {row.kind === 'custom' ? (
                <>
                  <span className="suggestion-prefix">+</span>
                  <span className="suggestion-ticker">{row.ticker}</span>
                  <span className="suggestion-hint">press Enter to add custom</span>
                </>
              ) : (
                <>
                  <span className="suggestion-ticker">{highlight(row.ticker, draftUpper)}</span>
                  <span className="suggestion-hint">brand registered</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {open && rows.length === 0 && (
        <ul className="ticker-suggestions" role="listbox">
          <li className="suggestion empty">No matching tickers</li>
        </ul>
      )}
    </div>
  );
}

// Highlight the matching substring within a ticker name.
function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.indexOf(query);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}
