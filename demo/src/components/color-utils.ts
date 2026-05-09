// Tiny CSS color helper. Real color math lives in @skill/color.

import type { RGB } from '@skill/types';

export function rgbToCss({ r, g, b }: RGB, alpha = 1): string {
  const to = (x: number) => Math.round(x * 255);
  return alpha === 1
    ? `rgb(${to(r)}, ${to(g)}, ${to(b)})`
    : `rgba(${to(r)}, ${to(g)}, ${to(b)}, ${alpha})`;
}
