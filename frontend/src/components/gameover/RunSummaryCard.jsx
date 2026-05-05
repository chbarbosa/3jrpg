import { theme } from '../../styles/theme';
import { CLASS_LIST } from '../../data/classes';
import { AUGMENTATION_LIST } from '../../data/augmentations';

function motivationalLabel(fightsSurvived) {
  if (fightsSurvived === 0) {
    return { text: 'Every legend starts somewhere.', color: theme.colors.textMuted, italic: true };
  }
  if (fightsSurvived >= 20) {
    return { text: 'Legendary run!', color: theme.colors.textHeader, italic: false, bold: true };
  }
  if (fightsSurvived >= 10) {
    return { text: 'Impressive run!', color: theme.colors.statusPositive, italic: false };
  }
  return null;
}

export default function RunSummaryCard({ fightsSurvived, heroConfigs }) {
  const label = motivationalLabel(fightsSurvived);

  const teamRows = (heroConfigs ?? []).map((h) => {
    const cls = CLASS_LIST.find((c) => c.id === h.classId);
    const aug = AUGMENTATION_LIST.find((a) => a.id === h.augmentationType);
    return {
      classId: h.classId,
      className: cls?.label ?? h.classId ?? '—',
      augmentationLabel: aug?.label ?? h.augmentationType ?? '—',
      colorKey: cls?.colorKey ?? h.classId,
    };
  });

  return (
    <div style={{
      background: theme.colors.bgPanel,
      border: `1px solid ${theme.colors.borderGold}`,
      borderRadius: theme.radius.lg,
      boxShadow: theme.shadows.panel,
      padding: theme.spacing.lg,
    }}>
      {/* Fights survived */}
      <div style={{ textAlign: 'center', marginBottom: theme.spacing.lg }}>
        <div style={{
          fontFamily: theme.fonts.header,
          fontSize: theme.fontSizes.xxl,
          fontWeight: theme.fontWeights.black,
          color: theme.colors.textHeader,
          lineHeight: 1,
        }}>
          {fightsSurvived}
        </div>
        <div style={{
          fontFamily: theme.fonts.body,
          fontSize: theme.fontSizes.sm,
          color: theme.colors.textMuted,
          marginTop: theme.spacing.xs,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Fights Survived
        </div>
        {label && (
          <div style={{
            marginTop: theme.spacing.sm,
            fontSize: theme.fontSizes.sm,
            color: label.color,
            fontStyle: label.italic ? 'italic' : 'normal',
            fontWeight: label.bold ? theme.fontWeights.bold : theme.fontWeights.normal,
          }}>
            {label.text}
          </div>
        )}
      </div>

      {/* Team */}
      {teamRows.length > 0 && (
        <>
          <div style={{
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes.xs,
            color: theme.colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: theme.spacing.sm,
          }}>
            Your Team
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
            {teamRows.map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <div style={{
                  width: '10px', height: '10px',
                  borderRadius: theme.radius.pill,
                  background: theme.classColors[row.colorKey] ?? theme.colors.textMuted,
                  flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSizes.sm,
                  fontWeight: theme.fontWeights.bold,
                  color: theme.colors.textPrimary,
                }}>
                  {row.className}
                </span>
                <span style={{
                  fontSize: theme.fontSizes.xs,
                  color: theme.colors.textMuted,
                }}>
                  {row.augmentationLabel}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
