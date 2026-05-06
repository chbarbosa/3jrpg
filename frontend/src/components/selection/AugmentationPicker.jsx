import { theme } from '../../styles/theme';
import { AUGMENTATION_LIST } from '../../data/augmentations';

function PickerCard({ label, sublabel, tradeoff, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className="picker-card-btn"
      style={{
        background: selected ? theme.colors.bgPanelDark : theme.colors.bgPanel,
        border: `${selected ? 2 : 1}px solid ${selected ? theme.colors.borderGold : theme.colors.borderBrown}`,
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = theme.colors.bgPanel; }}
    >
      <div className="picker-card-label">{label}</div>
      {sublabel && (
        <div className="picker-card-sublabel">
          {sublabel}
        </div>
      )}
      {tradeoff && (
        <div className="picker-card-tradeoff">
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
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
        <div className="picker-card-advantage-header">
          <div className="picker-card-advantage-title">
            Choose your advantage:
          </div>
          <div className="picker-card-advantage-list">
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
