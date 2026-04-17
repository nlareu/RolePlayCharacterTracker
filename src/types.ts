export type Spell = {
  id: string;
  title: string;
  description?: string;
};

export type SpellSlot = {
  level: number;
  total: number;
  used: number;
  spells?: Spell[];
};

export type Ability = {
  id: string;
  name: string;
  description?: string;
  total: number;
  used: number;
  resetOn: "short" | "long";
};

export type HitDice = {
  id: string;
  dieType: string;
  total: number;
  used: number;
};

export type Buff = {
  id: string;
  name: string;
  description: string;
  duration?: string;
  active: boolean;
  total: number;
  used: number;
};

export type PreparedSpell = {
  id: string;
  name: string;
  description?: string;
  used: boolean;
};

export type InventoryItem = {
  id: string;
  title: string;
  description: string;
  count: number;
};

export type DeathSaves = {
  successes: number;
  failures: number;
};

export type Stat = {
  name:
    | "strength"
    | "dexterity"
    | "constitution"
    | "intelligence"
    | "wisdom"
    | "charisma";
  points: number;
};

export type SkillProficiency = "none" | "competence" | "expertise";

export type SkillName =
  | "acrobatics"
  | "animalHandling"
  | "arcana"
  | "athletics"
  | "deception"
  | "history"
  | "insight"
  | "intimidation"
  | "investigation"
  | "medicine"
  | "nature"
  | "perception"
  | "performance"
  | "persuasion"
  | "religion"
  | "sleightOfHand"
  | "stealth"
  | "survival";

export type CharacterState = {
  id: string;
  name: string;
  level: number;
  hp: {
    current: number;
    max: number;
    temp: number;
  };
  deathSaves: DeathSaves;
  stats: Stat[];
  spellSlots: SpellSlot[];
  hitDice: HitDice[];
  abilities: Ability[];
  buffs: Buff[];
  preparedSpells: PreparedSpell[];
  inventory: InventoryItem[];
  skillProficiencies: Record<SkillName, SkillProficiency>;
};
