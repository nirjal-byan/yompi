import { estimateDifficulty } from './difficulty.js';

describe('estimateDifficulty', () => {
  it('rates a short, low trek as 1 star', () => {
    const result = estimateDifficulty({ highestPointM: 3000, maxDays: 4, highPassCount: 0 });
    expect(result?.points).toBe(1);
    expect(result?.stars).toBe(1);
  });

  it('rates a long trek over a high pass as 5 stars', () => {
    const result = estimateDifficulty({ highestPointM: 5400, maxDays: 18, highPassCount: 1 });
    expect(result?.points).toBe(8);
    expect(result?.stars).toBe(5);
  });

  it('gives a mid-range trek a mid-range rating', () => {
    // altitude 3 (4,600 m) + duration 1 (9 days) + no pass = 4 points
    const result = estimateDifficulty({ highestPointM: 4600, maxDays: 9, highPassCount: 0 });
    expect(result?.points).toBe(4);
    expect(result?.stars).toBe(3);
  });

  it('switches altitude bands exactly at 2,500 / 3,500 / 4,500 / 5,300 m', () => {
    const points = (m: number) => estimateDifficulty({ highestPointM: m, maxDays: 1, highPassCount: 0 })!.factors[0].points;
    expect([2499, 2500, 3499, 3500, 4499, 4500, 5299, 5300].map(points)).toEqual([0, 1, 1, 2, 2, 3, 3, 4]);
  });

  it('switches duration bands exactly at 4 / 9 / 15 days', () => {
    const points = (d: number) => estimateDifficulty({ highestPointM: 100, maxDays: d, highPassCount: 0 })!.factors[1].points;
    expect([4, 5, 9, 10, 15, 16].map(points)).toEqual([0, 1, 1, 2, 2, 3]);
  });

  it('counts any number of high passes as a single point', () => {
    const one = estimateDifficulty({ highestPointM: 100, maxDays: 1, highPassCount: 1 })!;
    const three = estimateDifficulty({ highestPointM: 100, maxDays: 1, highPassCount: 3 })!;
    expect(one.factors[2].points).toBe(1);
    expect(three.factors[2].points).toBe(1);
    expect(three.factors[2].detail).toContain('3 passes');
  });

  it('shows its working: factor points add up to the total', () => {
    const result = estimateDifficulty({ highestPointM: 5100, maxDays: 12, highPassCount: 1 })!;
    expect(result.factors.reduce((sum, f) => sum + f.points, 0)).toBe(result.points);
    expect(result.maxPoints).toBe(8);
    expect(result.caveat).toMatch(/estimate/i);
  });

  it('makes no estimate when the highest point is unknown', () => {
    expect(estimateDifficulty({ highestPointM: null, maxDays: 10, highPassCount: 0 })).toBeNull();
  });
});
