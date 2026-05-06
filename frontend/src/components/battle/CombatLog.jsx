import { useEffect, useRef } from 'react';
import { theme } from '../../styles/theme';

export default function CombatLog({ entries, entryTypes }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div className="combat-log">
      {entries.map((entry, i) => {
        const isEnemy = entryTypes?.[i] === 'enemy';
        const isLast = i === entries.length - 1;
        return (
          <div
            key={i}
            className="combat-log-entry"
            style={{
              color: isEnemy
                ? theme.colors.statusBleed
                : (isLast ? theme.colors.textPrimary : theme.colors.textMuted),
            }}
          >
            {entry}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
