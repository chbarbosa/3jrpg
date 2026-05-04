export const MAX_HEROES = 3;
export const MAX_ENEMIES = 6;

export const END_REASONS = {
  DEFEATED:  'Defeated',
  GAVE_UP:   'Gave Up',
  TIMEOUT:   'Timed Out',
  RESTARTED: 'Restarted',
};

export const CYCLE_POSITIONS = {
  A: 'weakened',
  B: 'normal',
  C: 'strengthened',
};

export const QUALITY_LABELS = {
  plain: 'Plain',
  magic: 'Magic',
  rare:  'Rare',
};

export const QUALITY_COLORS = {
  plain: '#8B7355',
  magic: '#2980B9',
  rare:  '#8E44AD',
};

export const ARMOR_TIER_LABELS = {
  clothes:      'Clothes',
  magicClothes: 'Magic Clothes',
  light:        'Light Armor',
  medium:       'Medium Armor',
  heavy:        'Heavy Armor',
};

export const LOOT_TIER_RANGES = [
  { min: 10, max: 25, pool: ['plain'] },
  { min: 25, max: 35, pool: ['plain', 'magic'] },
  { min: 35, max: 55, pool: ['plain', 'magic', 'rare'] },
  { min: 55, max: Infinity, pool: ['magic', 'rare'] },
];
