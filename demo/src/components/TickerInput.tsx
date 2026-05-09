// TickerInput — Ant-Design-style tag input.
//
// User types a ticker, presses Enter / comma / Tab → it becomes a removable chip.
// Backspace on empty input removes the last chip. Autocomplete suggestions
// pull from BRAND_REGISTRY (so users discover supported tickers).

import { useMemo, useRef, useState } from 'react';
import { BRAND_REGISTRY } from '@skill/brand-registry';

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

const ALL_REGISTERED = Object.keys(BRAND_REGISTRY);

export function TickerInput({ value, onChange, placeholder }: Props) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const suggestions = useMemo(() => {
    if (!draft.trim()) return [];
    const upper = draft.trim().toUpperCase();
    return ALL_REGISTERED.filter(
      (t) => t.startsWith(upper) && !value.includes(t),
    ).slice(0, 8);
  }, [draft, value]);

  const addTicker = (raw: string) => {
    const t = raw.trim().toUpperCase();
    if (!t) return;
    if (value.includes(t)) {
      setDraft('');
      return;
    }
    onChange([...value, t]);
    setDraft('');
    setActiveIdx(0);
  };

  const removeTicker = (t: string) => {
    onChange(value.filter((x) => x !== t));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      if (open && suggestions[activeIdx]) {
        e.preventDefault();
        addTicker(suggestions[activeIdx]!);
      } else if (draft.trim()) {
        e.preventDefault();
        addTicker(draft);
      }
    } else if (e.key === 'Backspace' && !draft && value.length) {
      removeTicker(value[value.length - 1]!);
    } else if (e.key === 'ArrowDown' && open && suggestions.length) {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp' && open && suggestions.length) {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="ticker-input">
      <div
        className="tag-row"
        onClick={() => inputRef.current?.focus()}
        role="textbox"
      >
        {value.map((t) => (
          <span key={t} className="tag">
            {t}
            <button
              type="button"
              aria-label={`Remove ${t}`}
              onClick={(e) => {
                e.stopPropagation();
                removeTicker(t);
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
            setActiveIdx(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder={value.length ? '' : placeholder ?? 'BTC, TSLA, AAPL…'}
        />
      </div>
      {open && suggestions.length > 0 && (
        <ul className="ticker-suggestions" role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={s}
              role="option"
              aria-selected={i === activeIdx}
              className={i === activeIdx ? 'is-active' : ''}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                addTicker(s);
              }}
            >
              <span className="suggestion-ticker">{s}</span>
              <span className="suggestion-hint">brand registered</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
