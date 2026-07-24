export const CLASS_LIST = [
  {
    id: 'warrior',
    label: 'Warrior',
    type: 'physical',
    description: 'Frontline tank. Bonus damage vs humanoids.',
    colorKey: 'warrior',
  },
  {
    id: 'ranger',
    label: 'Ranger',
    type: 'physical',
    description: 'Swift hunter. Bonus damage vs beasts.',
    colorKey: 'ranger',
  },
  {
    id: 'mage',
    label: 'Mage',
    type: 'magic',
    description: 'Magic burst specialist. Choose a school.',
    colorKey: 'mage',
  },
  {
    id: 'cleric',
    label: 'Cleric',
    type: 'magic',
    description: 'Healer and support. Light magic and holy power.',
    colorKey: 'cleric',
    equippableWeapons: ['mace', 'hammer', 'scythe'],
  },
  {
    id: 'thief',
    label: 'Thief',
    type: 'physical',
    description: 'Fast opportunist. Bonus damage vs humanoids.',
    colorKey: 'thief',
  },
];
