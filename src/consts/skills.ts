import type { SkillName } from "../types";

export type StatName =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma";

export type Skill = {
  name: SkillName;
  stat: StatName;
};

export const SKILLS: Skill[] = [
  { name: "acrobatics", stat: "dexterity" },
  { name: "animalHandling", stat: "wisdom" },
  { name: "arcana", stat: "intelligence" },
  { name: "athletics", stat: "strength" },
  { name: "deception", stat: "charisma" },
  { name: "history", stat: "intelligence" },
  { name: "insight", stat: "wisdom" },
  { name: "intimidation", stat: "charisma" },
  { name: "investigation", stat: "intelligence" },
  { name: "medicine", stat: "wisdom" },
  { name: "nature", stat: "intelligence" },
  { name: "perception", stat: "wisdom" },
  { name: "performance", stat: "charisma" },
  { name: "persuasion", stat: "charisma" },
  { name: "religion", stat: "intelligence" },
  { name: "sleightOfHand", stat: "dexterity" },
  { name: "stealth", stat: "dexterity" },
  { name: "survival", stat: "wisdom" },
];
