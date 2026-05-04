export const AUGMENTATION_LIST = [
  {
    id: 'natural',
    label: 'Natural',
    availableTo: 'all',
    description: 'No augmentation. Full class potential.',
    tradeoff: null,
    advantages: [],
  },
  {
    id: 'cyber',
    label: 'Cyber',
    availableTo: 'physical',
    description: 'Cybernetic implants. Tech skills and cyber gear.',
    tradeoff: 'Loses magic access. Takes extra damage from Electric.',
    advantages: [
      { id: 'weaponImplant', label: 'Weapon Implant', description: 'Built-in weapon, passive ATK bonus.' },
      { id: 'reflexBooster', label: 'Reflex Booster', description: 'Significant DEX increase.' },
      { id: 'armorPlating', label: 'Armor Plating', description: 'Significant DEF increase.' },
      { id: 'enCell', label: 'EN Cell', description: 'Increased EN pool.' },
    ],
  },
  {
    id: 'enhanced',
    label: 'Enhanced',
    availableTo: 'all',
    description: 'Unnatural physical augmentation. Stronger but unstable.',
    tradeoff: 'Random elemental weakness assigned for the entire run.',
    advantages: [
      { id: 'bonusHp', label: 'Bonus HP', description: 'Maximum HP significantly increased.' },
      { id: 'bonusEn', label: 'Bonus EN', description: 'Maximum EN significantly increased.' },
      { id: 'extraMove', label: 'Extra Move', description: 'Powerful bonus action every 3 rounds.' },
      { id: 'regen', label: 'Regen', description: 'Additional HP or EN regen between fights.' },
    ],
  },
];
