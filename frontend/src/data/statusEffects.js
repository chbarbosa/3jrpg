export const STATUS_EFFECTS = {
  poison:  { type: 'negative', colorKey: '#27AE60', description: 'Takes INT/4 damage at the start of each turn; lasts 3 turns' },
  burn:    { type: 'negative', colorKey: '#E74C3C', description: 'Takes 2 fire damage at the start of each turn; lasts 3 turns' },
  bleed:   { type: 'negative', colorKey: '#C0392B', description: 'Takes 1 physical damage at the start of each turn; lasts 4 turns' },
  frozen:  { type: 'negative', colorKey: '#87CEEB', description: 'Cannot act for 1 turn; physical attacks remove the effect' },
  stun:    { type: 'negative', colorKey: '#F39C12', description: 'Cannot act for 1 turn' },
  slow:    { type: 'negative', colorKey: '#8E44AD', description: 'SPD halved for 2 turns' },
  silence: { type: 'negative', colorKey: '#7F8C8D', description: 'Cannot cast spells for 2 turns' },
  blind:   { type: 'negative', colorKey: '#2C3E50', description: '50% chance to miss physical attacks for 2 turns' },
  curse:   { type: 'negative', colorKey: '#6C3483', description: 'A random negative status effect is applied at the start of each turn; lasts 2 turns' },
  regen:   { type: 'positive', colorKey: '#2ECC71', description: 'Restores 2 HP at the start of each turn; lasts 3 turns' },
  haste:   { type: 'positive', colorKey: '#1ABC9C', description: 'SPD doubled for 2 turns' },
  shell:   { type: 'positive', colorKey: '#F1C40F', description: 'Reduces all incoming damage by 2 for 2 turns' },
};
