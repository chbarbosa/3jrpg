import { theme } from '../../styles/theme';
import { CLASS_LIST } from '../../data/classes';

export default function ClassPicker({ selectedClassId, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      {CLASS_LIST.map((cls) => {
        const sel = cls.id === selectedClassId;
        return (
          <button
            key={cls.id}
            onClick={() => onSelect(cls.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              background: sel ? theme.colors.bgPanelDark : theme.colors.bgPanel,
              border: `${sel ? 2 : 1}px solid ${sel ? theme.colors.borderGold : theme.colors.borderBrown}`,
              borderRadius: theme.radius.md,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: `background ${theme.transitions.fast}`,
            }}
            onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
            onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = sel ? theme.colors.bgPanelDark : theme.colors.bgPanel; }}
          >
            <div style={{
              width: '12px', height: '12px',
              borderRadius: theme.radius.pill,
              background: theme.classColors[cls.colorKey],
              flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: theme.fonts.header,
                fontSize: theme.fontSizes.md,
                fontWeight: theme.fontWeights.bold,
                color: theme.colors.textPrimary,
              }}>
                {cls.label}
              </div>
              <div style={{
                fontSize: theme.fontSizes.xs,
                color: theme.colors.textMuted,
                marginTop: '2px',
              }}>
                {cls.type === 'physical' ? 'Physical' : 'Magic'} · {cls.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
