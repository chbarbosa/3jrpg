import { useState } from 'react';
import { theme } from '../../styles/theme';
import { ITEM_LIST } from '../../data/items';

function ActionCard({ label, sublabel, selected, disabled, onClick }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`picker-card-btn${selected ? ' picker-card-btn--selected' : ''}${disabled ? ' picker-card-btn--disabled' : ''}`}
      style={{
        background: selected ? theme.colors.bgPanelDark : theme.colors.bgPanel,
        border: `${selected ? 2 : 1}px solid ${selected ? theme.colors.borderGold : theme.colors.borderBrown}`,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={(e) => { if (!disabled && !selected) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
      onMouseLeave={(e) => { if (!disabled && !selected) e.currentTarget.style.background = theme.colors.bgPanel; }}
    >
      <div className="picker-card-label">{label}</div>
      {sublabel && <div className="picker-card-sublabel">{sublabel}</div>}
    </button>
  );
}

export default function HeroPrepSlot({ hero, isDone, onPrepAction, allHeroes }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [doneLabel, setDoneLabel] = useState(null);

  const classColor = theme.classColors[hero.className?.toLowerCase()] ?? theme.colors.textMuted;

  const prepItems = (hero.inventory ?? []).filter((invItem) => {
    const itemData = ITEM_LIST.find((i) => i.id === invItem.id);
    return itemData?.usableIn.includes('prep') ?? false;
  });

  const knockedOutAllies = allHeroes.filter((h) => h.isKnockedOut && h.id !== hero.id);
  const canRevive = knockedOutAllies.length > 0;
  const hasItems = prepItems.length > 0;

  async function submit(actionType, itemId = null, targetHeroId = null) {
    setSubmitting(true);
    try {
      await onPrepAction(hero.id, actionType, itemId, targetHeroId);
      const labels = {
        USE_ITEM: `Used ${ITEM_LIST.find(i => i.id === itemId)?.label ?? itemId}`,
        SWAP_GEAR: 'Swapped weapons',
        REVIVE: `Revived ally`,
        PASS: 'Passed',
      };
      setDoneLabel(labels[actionType] ?? actionType);
    } catch (err) {
      // error handled by parent via thrown error
    } finally {
      setSubmitting(false);
    }
  }

  const heroLabel = (
    <div className="prep-slot-hero-label">
      <div className="team-dot" style={{ background: classColor }} />
      <div>
        <div className="prep-slot-hero-name">
          {hero.name}
        </div>
        <div style={{ fontSize: 'var(--fs-xs)', color: classColor }}>{hero.className}</div>
      </div>
    </div>
  );

  const slotBorderColor = isDone ? theme.colors.borderGold : theme.colors.borderBrown;

  // Knocked out — show info, no action picker
  if (hero.isKnockedOut) {
    return (
      <div className="prep-slot prep-slot--ko" style={{ border: `1px solid ${slotBorderColor}`, opacity: 0.55 }}>
        {heroLabel}
        <div className="prep-slot-ko-label">
          Needs Revival
        </div>
      </div>
    );
  }

  // Done
  if (isDone) {
    return (
      <div className="prep-slot" style={{ border: `1px solid ${slotBorderColor}`, opacity: submitting ? 0.7 : 1 }}>
        {heroLabel}
        <div className="prep-slot-done-row">
          <span className="prep-slot-done-label">{doneLabel ?? 'Action taken'}</span>
          <span className="prep-slot-done-check">✓</span>
        </div>
      </div>
    );
  }

  const smallBtn = (label, onClick, variant = 'default') => (
    <button
      onClick={onClick}
      className={`prep-small-btn prep-small-btn--${variant}`}
    >
      {label}
    </button>
  );

  // REVIVE sub-view
  if (selectedAction === 'REVIVE') {
    return (
      <div className="prep-slot" style={{ border: `1px solid ${slotBorderColor}`, opacity: submitting ? 0.7 : 1 }}>
        {heroLabel}
        <div style={{ flex: 1 }}>
          <div className="prep-slot-sub-title">
            Revive who?
          </div>
          <div className="prep-slot-sub-list">
            {knockedOutAllies.map((ally) => (
              <button
                key={ally.id}
                onClick={() => submit('REVIVE', null, ally.id)}
                disabled={submitting}
                className="prep-slot-ally-btn"
              >
                {ally.name} <span className="prep-slot-ally-class">({ally.className})</span>
              </button>
            ))}
          </div>
          <div className="prep-slot-back-row">
            {smallBtn('← Back', () => setSelectedAction(null))}
          </div>
        </div>
      </div>
    );
  }

  // SWAP_GEAR sub-view
  if (selectedAction === 'SWAP_GEAR') {
    return (
      <div className="prep-slot" style={{ border: `1px solid ${slotBorderColor}`, opacity: submitting ? 0.7 : 1 }}>
        {heroLabel}
        <div style={{ flex: 1 }}>
          <div className="prep-slot-swap-desc">
            Swap primary and secondary weapon. Your available skills will change for the next fight.
          </div>
          <div className="prep-slot-swap-btns">
            {smallBtn('← Back', () => setSelectedAction(null))}
            {smallBtn('Confirm Swap', () => submit('SWAP_GEAR'), 'primary')}
          </div>
        </div>
      </div>
    );
  }

  // USE_ITEM: item selected, check if revive scroll needs target
  if (selectedAction === 'USE_ITEM' && selectedItemId) {
    if (selectedItemId === 'reviveScroll') {
      return (
        <div className="prep-slot" style={{ border: `1px solid ${slotBorderColor}`, opacity: submitting ? 0.7 : 1 }}>
          {heroLabel}
          <div style={{ flex: 1 }}>
            <div className="prep-slot-sub-title">
              Revive Scroll — target:
            </div>
            <div className="prep-slot-sub-list">
              {knockedOutAllies.map((ally) => (
                <button
                  key={ally.id}
                  onClick={() => submit('USE_ITEM', 'reviveScroll', ally.id)}
                  disabled={submitting}
                  className="prep-slot-ally-btn"
                >
                  {ally.name}
                </button>
              ))}
              {knockedOutAllies.length === 0 && (
                <div className="prep-slot-no-allies">No allies need revival</div>
              )}
            </div>
            <div className="prep-slot-back-row">
              {smallBtn('← Back', () => { setSelectedItemId(null); })}
            </div>
          </div>
        </div>
      );
    }
    // Non-revive: submit immediately with self as target
    submit('USE_ITEM', selectedItemId, hero.id);
    setSelectedItemId(null);
    return null;
  }

  // USE_ITEM: show item list
  if (selectedAction === 'USE_ITEM') {
    return (
      <div className="prep-slot" style={{ border: `1px solid ${slotBorderColor}`, opacity: submitting ? 0.7 : 1 }}>
        {heroLabel}
        <div style={{ flex: 1 }}>
          <div className="prep-slot-sub-title">
            Use which item?
          </div>
          <div className="prep-slot-sub-list">
            {prepItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className="prep-slot-ally-btn"
                style={{ border: `1px solid ${theme.colors.borderBrown}` }}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className="prep-slot-back-row">
            {smallBtn('← Back', () => setSelectedAction(null))}
          </div>
        </div>
      </div>
    );
  }

  // Default: action picker
  return (
    <div className="prep-slot" style={{ border: `1px solid ${slotBorderColor}`, opacity: submitting ? 0.7 : 1 }}>
      {heroLabel}
      <div className="prep-slot-actions">
        <ActionCard
          label="Use Item"
          sublabel={hasItems ? `${prepItems.length} item${prepItems.length !== 1 ? 's' : ''} available` : 'No prep items'}
          selected={false}
          disabled={!hasItems}
          onClick={() => setSelectedAction('USE_ITEM')}
        />
        <ActionCard
          label="Swap Gear"
          sublabel="Swap primary and secondary weapon"
          selected={false}
          disabled={false}
          onClick={() => setSelectedAction('SWAP_GEAR')}
        />
        <ActionCard
          label="Revive Ally"
          sublabel={canRevive ? `${knockedOutAllies.length} ally knocked out` : 'No allies need revival'}
          selected={false}
          disabled={!canRevive}
          onClick={() => setSelectedAction('REVIVE')}
        />
        <ActionCard
          label="Pass"
          sublabel="Skip this hero's prep turn"
          selected={false}
          disabled={false}
          onClick={() => submit('PASS')}
        />
      </div>
    </div>
  );
}
