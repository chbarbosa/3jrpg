import { theme } from '../../styles/theme';
import { AUGMENTATION_LIST } from '../../data/augmentations';

function PickerCard({ label, sublabel, tradeoff, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: theme.spacing.sm,
        background: selected ? theme.colors.bgPanelDark : theme.colors.bgPanel,
        border: `${selected ? 2 : 1}px solid ${selected ? theme.colors.borderGold : theme.colors.borderBrown}`,
        borderRadius: theme.radius.md,
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: `background ${theme.transitions.fast}`,
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = theme.colors.bgPanel; }}
    >
      <div style={{
        fontFamily: theme.fonts.header,
        fontSize: theme.fontSizes.sm,
        fontWeight: theme.fontWeights.bold,
        color: theme.colors.textPrimary,
      }}>{label}</div>
      {sublabel && (
        <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted, marginTop: '2px' }}>
          {sublabel}
        </div>
      )}
      {tradeoff && (
        <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.statusBleed, marginTop: '4px' }}>
          ⚠ {tradeoff}
        </div>
      )}
    </button>
  );
}

export default function AugmentationPicker({ classType, augmentationType, augmentationAdvantageId, onSelect }) {
  const available = AUGMENTATION_LIST.filter(
    (a) => a.availableTo === 'all' || (a.availableTo === 'physical' && classType === 'physical')
  );

  const selectedAug = available.find((a) => a.id === augmentationType) ?? null;

  function handleAugClick(augId) {
    onSelect({ augmentationType: augId, augmentationAdvantageId: null });
  }

  function handleAdvClick(advId) {
    onSelect({ augmentationType, augmentationAdvantageId: advId });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      {available.map((aug) => (
        <PickerCard
          key={aug.id}
          label={aug.label}
          sublabel={aug.description}
          tradeoff={aug.tradeoff}
          selected={aug.id === augmentationType}
          onClick={() => handleAugClick(aug.id)}
        />
      ))}

      {selectedAug && selectedAug.advantages.length > 0 && (
        <div style={{
          borderTop: `1px solid ${theme.colors.borderBrown}`,
          paddingTop: theme.spacing.sm,
          marginTop: theme.spacing.xs,
        }}>
          <div style={{
            fontSize: theme.fontSizes.sm,
            fontWeight: theme.fontWeights.bold,
            color: theme.colors.textHeader,
            fontFamily: theme.fonts.header,
            marginBottom: theme.spacing.xs,
          }}>
            Choose your advantage:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
            {selectedAug.advantages.map((adv) => (
              <PickerCard
                key={adv.id}
                label={adv.label}
                sublabel={adv.description}
                tradeoff={null}
                selected={adv.id === augmentationAdvantageId}
                onClick={() => handleAdvClick(adv.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
