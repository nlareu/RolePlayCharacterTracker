/**
 * D&D 5e Proficiency Bonus by Character Level
 * PB increases at levels 5, 9, 13, and 17
 */
export const levelToProficiencyBonus: Record<number, number> = {
  1: 2,
  2: 2,
  3: 2,
  4: 2,
  5: 3,
  6: 3,
  7: 3,
  8: 3,
  9: 4,
  10: 4,
  11: 4,
  12: 4,
  13: 5,
  14: 5,
  15: 5,
  16: 5,
  17: 6,
  18: 6,
  19: 6,
  20: 6,
  21: 7,
  22: 7,
  23: 7,
  24: 7,
  25: 8,
  26: 8,
  27: 8,
  28: 8,
  29: 9,
  30: 9,
};

/**
 * Calculate proficiency bonus from character level
 * @param level - The character level (1-20)
 * @returns The proficiency bonus value
 */
export function calculateProficiencyBonus(level: number): number {
  if (level < 1 || level > 20) {
    console.warn(`Level ${level} is out of valid range (1-20)`);
    return 2; // Default to level 1 PB
  }
  return levelToProficiencyBonus[level] ?? 2;
}
