import { Howl } from 'howler';

const sounds = {
  hit: null,
  skill: null,
  statusApply: null,
  enemyDeath: null,
  heroDeath: null,
  victory: null,
  gameOver: null,
  uiClick: null,
  uiNav: null,
  itemUse: null,
  lootDrop: null,
};

export function loadSounds(soundMap) {
  Object.entries(soundMap).forEach(([key, src]) => {
    if (src) sounds[key] = new Howl({ src: [src] });
  });
}

export function playSound(key) {
  const sound = sounds[key];
  if (sound) sound.play();
}
