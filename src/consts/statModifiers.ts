/**
 * Mapping of ability score points to ability modifiers (D&D 5e)
 * Points range from 1 to 30
 */
export const pointsToModifier: Record<number, number> = {
  1: -5,
  2: -4,
  3: -4,
  4: -3,
  5: -3,
  6: -2,
  7: -2,
  8: -1,
  9: -1,
  10: 0,
  11: 0,
  12: 1,
  13: 1,
  14: 2,
  15: 2,
  16: 3,
  17: 3,
  18: 4,
  19: 4,
  20: 5,
  21: 5,
  22: 6,
  23: 6,
  24: 7,
  25: 7,
  26: 8,
  27: 8,
  28: 9,
  29: 9,
  30: 10,
};

/**
 * Calculate modifier from ability score points
 * @param points - The ability score points (1-30)
 * @returns The modifier value
 */
export function calculateModifier(points: number): number {
  if (points < 1 || points > 30) {
    console.warn(`Points value ${points} is out of valid range (1-30)`);
    return 0;
  }
  return pointsToModifier[points] ?? 0;
}
