import { useState, useEffect } from 'react';
import { theme } from '../../styles/theme';
import { AVATAR_LIST } from '../../data/avatars';
import { getAvatars } from '../../services/api';

const AVATAR_BG = {
  warrior: theme.classColors.warrior,
  ranger: theme.classColors.ranger,
  mage: theme.classColors.mage,
  cleric: theme.classColors.cleric,
};

function avatarBg(id) {
  return AVATAR_BG[id] ?? theme.colors.bgPanelDark;
}

export default function AvatarPicker({ selectedAvatarId, onSelect }) {
  const [avatars, setAvatars] = useState(AVATAR_LIST);

  useEffect(() => {
    getAvatars()
      .then((list) => { if (Array.isArray(list) && list.length > 0) setAvatars(list); })
      .catch(() => {});
  }, []);

  return (
    <div className="avatar-picker-grid">
      {avatars.map((av) => {
        const selected = av.id === selectedAvatarId;
        return (
          <button
            key={av.id}
            onClick={() => onSelect(av.id)}
            className="avatar-picker-btn"
            style={{
              background: selected ? theme.colors.bgPanelDark : theme.colors.bgPanel,
              border: `2px solid ${selected ? theme.colors.borderGold : theme.colors.borderBrown}`,
            }}
            onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = theme.colors.actionHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = selected ? theme.colors.bgPanelDark : theme.colors.bgPanel; }}
          >
            <div
              className="avatar-circle"
              style={{ background: avatarBg(av.id) }}
            >
              {av.id[0].toUpperCase()}
            </div>
            <span className="avatar-label">
              {av.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
