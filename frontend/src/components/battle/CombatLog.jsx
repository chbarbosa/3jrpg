import { useEffect, useRef } from 'react';
import { theme } from '../../styles/theme';

export default function CombatLog({ entries }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div style={{
      height: '100px',
      overflowY: 'auto',
      background: theme.colors.bgPanel,
      border: `1px solid ${theme.colors.borderBrown}`,
      borderRadius: theme.radius.sm,
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      fontFamily: theme.fonts.mono,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.textMuted,
      scrollbarWidth: 'thin',
    }}>
      {entries.map((entry, i) => (
        <div
          key={i}
          style={{
            paddingBottom: '2px',
            color: i === entries.length - 1 ? theme.colors.textPrimary : theme.colors.textMuted,
            transition: `color ${theme.transitions.fast}`,
          }}
        >
          {entry}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
