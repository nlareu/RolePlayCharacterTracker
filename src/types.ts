export type SpellSlot = {
  level: number;
  total: number;
  used: number;
};

export type Ability = {
  id: string;
  name: string;
  description?: string;
  total: number;
  used: number;
  resetOn: 'short' | 'long';
};

export type HitDice = {
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
};

export type PreparedSpell = {
  id: string;
  name: string;
  used: boolean;
};

export type CharacterState = {
  name: string;
  hp: {
    current: number;
    max: number;
    temp: number;
  };
  inspiration: boolean;
  spellSlots: SpellSlot[];
  hitDice: HitDice[];
  abilities: Ability[];
  buffs: Buff[];
  preparedSpells: PreparedSpell[];
};
