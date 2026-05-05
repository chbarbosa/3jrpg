import { useState, useEffect } from 'react';
import { theme } from '../../styles/theme';
import { AVATAR_LIST } from '../../data/avatars';
import { getAvatars } from '../../services/api';

const AVATAR_BG = {
  warrior: theme.classColors.warrior,
  ranger: theme.classColors.ranger,
  mage: theme.classColors.mage,
  priest: theme.classColors.priest,
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
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: theme.spacing.sm,
    }}>
      {avatars.map((av) => {
        const selected = av.id === selectedAvatarId;
        return (
          <button
            key={av.id}
            onClick={() => onSelect(av.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: theme.spacing.xs,
              background: selected ? theme.colors.bgPanelDark : theme.colors.bgPanel,
              border: `2px solid ${selected ? theme.colors.borderGold : theme.colors.borderBrown}`,
              borderRadius: theme.radius.md,
              cursor: 'pointer',
              transition: `background ${theme.transitions.fast}, border-color ${theme.transitions.fast}`,
            }}
            onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = theme.colors.actionHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = selected ? theme.colors.bgPanelDark : theme.colors.bgPanel; }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: theme.radius.pill,
              background: avatarBg(av.id),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.bgPage,
              fontFamily: theme.fonts.header,
              fontWeight: theme.fontWeights.bold,
              fontSize: theme.fontSizes.sm,
              flexShrink: 0,
            }}>
              {av.id[0].toUpperCase()}
            </div>
            <span style={{
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSizes.xs,
              color: theme.colors.textPrimary,
              whiteSpace: 'nowrap',
            }}>
              {av.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
