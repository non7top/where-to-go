import { describe, expect, it } from 'vitest';
import { feltHigh } from '../src/lib/feel';
import { comfortColor } from '../src/lib/color';

describe('feltHigh', () => {
  it('leaves calm or missing wind alone', () => {
    expect(feltHigh(28, 2)).toBe(28);
    expect(feltHigh(28, null)).toBe(28);
    expect(feltHigh(null, 6)).toBeNull();
  });
  it('cools a warm windy day', () => {
    expect(feltHigh(28, 6.2)).toBeCloseTo(28 - 0.7 * 3.2, 5);
  });
  it('never drops a warm day below the comfortable floor and leaves cold days alone', () => {
    expect(feltHigh(24, 12)).toBe(22);
    expect(feltHigh(10, 12)).toBe(10);
  });
});

describe('comfort gradient up to 26', () => {
  const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  it('stays greenish at 26 and turns orange by 30', () => {
    const [r26, g26] = rgb(comfortColor(26));
    const [r30, g30] = rgb(comfortColor(30));
    expect(g26!).toBeGreaterThan(r26!);
    expect(r30!).toBeGreaterThan(g30!);
  });
});
