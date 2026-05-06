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
    <div className="panel--lg">
      {/* Fights survived */}
      <div className="run-summary-center">
        <div className="run-summary-fights-count">
          {fightsSurvived}
        </div>
        <div className="run-summary-fights-label">
          Fights Survived
        </div>
        {label && (
          <div style={{
            marginTop: 'var(--sp-sm)',
            fontSize: 'var(--fs-sm)',
            color: label.color,
            fontStyle: label.italic ? 'italic' : 'normal',
            fontWeight: label.bold ? 'var(--fw-bold)' : 'var(--fw-normal)',
          }}>
            {label.text}
          </div>
        )}
      </div>

      {/* Team */}
      {teamRows.length > 0 && (
        <>
          <div className="run-summary-team-header">
            Your Team
          </div>
          <div className="run-summary-team-list">
            {teamRows.map((row, i) => (
              <div key={i} className="run-summary-team-row">
                <div
                  className="team-dot"
                  style={{ background: theme.classColors[row.colorKey] ?? theme.colors.textMuted }}
                />
                <span className="run-summary-hero-class">
                  {row.className}
                </span>
                <span className="run-summary-hero-aug">
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
