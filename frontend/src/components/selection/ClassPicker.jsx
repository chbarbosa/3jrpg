import { theme } from '../../styles/theme';
import { CLASS_LIST } from '../../data/classes';

export default function ClassPicker({ selectedClassId, onSelect }) {
  return (
    <div className="class-picker-list">
      {CLASS_LIST.map((cls) => {
        const sel = cls.id === selectedClassId;
        return (
          <button
            key={cls.id}
            onClick={() => onSelect(cls.id)}
            className="class-picker-btn"
            style={{
              background: sel ? theme.colors.bgPanelDark : theme.colors.bgPanel,
              border: `${sel ? 2 : 1}px solid ${sel ? theme.colors.borderGold : theme.colors.borderBrown}`,
            }}
            onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
            onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = sel ? theme.colors.bgPanelDark : theme.colors.bgPanel; }}
          >
            <div
              className="class-picker-dot"
              style={{ background: theme.classColors[cls.colorKey] }}
            />
            <div style={{ flex: 1 }}>
              <div className="class-picker-label">
                {cls.label}
              </div>
              <div className="class-picker-desc">
                {cls.type === 'physical' ? 'Physical' : 'Magic'} · {cls.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
