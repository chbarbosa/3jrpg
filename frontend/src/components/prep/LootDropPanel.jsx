import { useEffect, useState } from 'react';
import { theme } from '../../styles/theme';
import { QUALITY_LABELS, QUALITY_COLORS } from '../../data/gameConstants';
import { playSound } from '../../services/sound';

export default function LootDropPanel({ lootItem, heroes, onAssignLoot, lootAssigned, lootRecipientHeroId }) {
  const [glowing, setGlowing] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setGlowing(false), 1800);
    return () => clearTimeout(t);
  }, []);

  async function handleHeroClick(heroId) {
    if (lootAssigned || assigning) return;
    setAssigning(true);
    setError(null);
    try {
      await onAssignLoot(heroId);
      playSound('lootDrop');
    } catch (err) {
      setError(err.message ?? 'Failed to assign loot.');
    } finally {
      setAssigning(false);
    }
  }

  const qualityColor = QUALITY_COLORS[lootItem.quality?.toLowerCase()] ?? theme.colors.textMuted;
  const qualityLabel = QUALITY_LABELS[lootItem.quality?.toLowerCase()] ?? lootItem.quality ?? '';

  return (
    <div style={{
      background: theme.colors.bgPanel,
      border: `1px solid ${theme.colors.borderGold}`,
      borderRadius: theme.radius.md,
      boxShadow: glowing ? theme.shadows.highlight : theme.shadows.panel,
      padding: theme.spacing.lg,
      transition: `box-shadow ${theme.transitions.slow}`,
    }}>
      <div style={{
        fontFamily: theme.fonts.header,
        fontSize: theme.fontSizes.lg,
        fontWeight: theme.fontWeights.bold,
        color: theme.colors.textHeader,
        marginBottom: theme.spacing.md,
      }}>
        Loot Drop
      </div>

      {/* Item details */}
      <div style={{
        padding: theme.spacing.md,
        background: theme.colors.bgPanelDark,
        borderRadius: theme.radius.sm,
        border: `1px solid ${theme.colors.borderBrown}`,
        marginBottom: theme.spacing.md,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
          <div style={{
            fontFamily: theme.fonts.header,
            fontSize: theme.fontSizes.lg,
            fontWeight: theme.fontWeights.bold,
            color: theme.colors.textHeader,
          }}>
            {lootItem.name}
          </div>
          <div style={{
            fontSize: theme.fontSizes.xs,
            fontWeight: theme.fontWeights.bold,
            color: qualityColor,
            border: `1px solid ${qualityColor}`,
            borderRadius: theme.radius.pill,
            padding: '1px 8px',
          }}>
            {qualityLabel}
          </div>
        </div>

        {lootItem.description && (
          <div style={{
            fontSize: theme.fontSizes.sm,
            color: theme.colors.textPrimary,
            marginBottom: theme.spacing.xs,
          }}>
            {lootItem.description}
          </div>
        )}

        {lootItem.modifiers?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {lootItem.modifiers.map((mod, i) => (
              <div key={i} style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted }}>
                + {mod}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignment */}
      {lootAssigned ? (
        <div style={{
          fontSize: theme.fontSizes.sm,
          color: theme.colors.statusPositive,
          fontWeight: theme.fontWeights.bold,
        }}>
          ✓ Assigned to {heroes.find(h => h.id === lootRecipientHeroId)?.name ?? 'hero'}
        </div>
      ) : (
        <>
          <div style={{
            fontSize: theme.fontSizes.sm,
            fontWeight: theme.fontWeights.bold,
            color: theme.colors.textPrimary,
            marginBottom: theme.spacing.sm,
          }}>
            Assign to:
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
            {heroes.map((hero) => {
              const classColor = theme.classColors[hero.className?.toLowerCase()] ?? theme.colors.textMuted;
              const disabled = hero.isKnockedOut || assigning;
              return (
                <button
                  key={hero.id}
                  onClick={() => !disabled && handleHeroClick(hero.id)}
                  disabled={disabled}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.xs,
                    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                    background: theme.colors.bgPanel,
                    border: `1px solid ${theme.colors.borderGold}`,
                    borderRadius: theme.radius.md,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.4 : 1,
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.sm,
                    fontWeight: theme.fontWeights.bold,
                    color: theme.colors.textPrimary,
                    transition: `background ${theme.transitions.fast}`,
                  }}
                  onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
                  onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = theme.colors.bgPanel; }}
                >
                  <div style={{
                    width: '10px', height: '10px',
                    borderRadius: theme.radius.pill,
                    background: classColor,
                    flexShrink: 0,
                  }} />
                  {hero.name}
                  {hero.isKnockedOut && <span style={{ fontSize: theme.fontSizes.xs, color: theme.colors.statusBleed }}> (KO)</span>}
                </button>
              );
            })}
          </div>
          {error && (
            <div style={{ marginTop: theme.spacing.sm, fontSize: theme.fontSizes.xs, color: theme.colors.statusBleed }}>
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
}
