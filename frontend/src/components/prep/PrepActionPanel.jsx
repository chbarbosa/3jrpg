import { theme } from '../../styles/theme';
import HeroPrepSlot from './HeroPrepSlot';

export default function PrepActionPanel({ heroes, heroActions, onPrepAction }) {
  return (
    <div style={{
      background: theme.colors.bgPanel,
      border: `1px solid ${theme.colors.borderGold}`,
      borderRadius: theme.radius.md,
      boxShadow: theme.shadows.panel,
      padding: theme.spacing.lg,
    }}>
      <div style={{
        fontFamily: theme.fonts.header,
        fontSize: theme.fontSizes.lg,
        fontWeight: theme.fontWeights.bold,
        color: theme.colors.textHeader,
        marginBottom: theme.spacing.md,
      }}>
        Preparation
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
        {heroes.map((hero) => (
          <HeroPrepSlot
            key={hero.id}
            hero={hero}
            isDone={heroActions[hero.id] ?? false}
            onPrepAction={onPrepAction}
            allHeroes={heroes}
          />
        ))}
      </div>
    </div>
  );
}
