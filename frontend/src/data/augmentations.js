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
      { id: 'precision',     label: 'Precision',     description: 'extra physical damage per hit.' },
      { id: 'reflexBooster', label: 'Reflex Booster', description: 'increasing SPD.' },
      { id: 'armorSkin',     label: 'Armor Skin',     description: 'Reduces each incoming physical hit.' },
    ],
  },
  {
    id: 'enhanced',
    label: 'Enhanced',
    availableTo: 'all',
    description: 'Unnatural physical augmentation. Stronger but unstable.',
    tradeoff: 'Random elemental weakness assigned for the entire run.',
    advantages: [
      { id: 'bonusHp',  label: 'Bonus HP',  description: 'increase HP.' },
      { id: 'bonusEn',  label: 'Bonus EN',  description: 'increase EN.' },
      { id: 'recover',  label: 'Recover',   description: 'restore HP or EN.' },
    ],
  },
];
