import { useState } from 'react';
import { theme } from '../../styles/theme';
import { ITEM_LIST } from '../../data/items';

function ActionCard({ label, sublabel, selected, disabled, onClick }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        padding: theme.spacing.sm,
        background: selected ? theme.colors.bgPanelDark : theme.colors.bgPanel,
        border: `${selected ? 2 : 1}px solid ${selected ? theme.colors.borderGold : theme.colors.borderBrown}`,
        borderRadius: theme.radius.sm,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        width: '100%',
        opacity: disabled ? 0.4 : 1,
        transition: `background ${theme.transitions.fast}`,
      }}
      onMouseEnter={(e) => { if (!disabled && !selected) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
      onMouseLeave={(e) => { if (!disabled && !selected) e.currentTarget.style.background = theme.colors.bgPanel; }}
    >
      <div style={{ fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.bold, color: theme.colors.textPrimary }}>{label}</div>
      {sublabel && <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted, marginTop: '2px' }}>{sublabel}</div>}
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

  const slotStyle = {
    padding: theme.spacing.md,
    background: theme.colors.bgPanel,
    border: `1px solid ${isDone ? theme.colors.borderGold : theme.colors.borderBrown}`,
    borderRadius: theme.radius.md,
    display: 'flex',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
    opacity: submitting ? 0.7 : 1,
    transition: `border-color ${theme.transitions.fast}`,
  };

  const heroLabel = (
    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, flexShrink: 0, minWidth: '90px' }}>
      <div style={{
        width: '10px', height: '10px',
        borderRadius: theme.radius.pill,
        background: classColor,
        flexShrink: 0,
      }} />
      <div>
        <div style={{ fontFamily: theme.fonts.header, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.bold, color: theme.colors.textPrimary }}>
          {hero.name}
        </div>
        <div style={{ fontSize: theme.fontSizes.xs, color: classColor }}>{hero.className}</div>
      </div>
    </div>
  );

  // Knocked out — show info, no action picker
  if (hero.isKnockedOut) {
    return (
      <div style={{ ...slotStyle, opacity: 0.55 }}>
        {heroLabel}
        <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.statusBleed, fontStyle: 'italic', paddingTop: '4px' }}>
          Needs Revival
        </div>
      </div>
    );
  }

  // Done
  if (isDone) {
    return (
      <div style={slotStyle}>
        {heroLabel}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <span style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted }}>{doneLabel ?? 'Action taken'}</span>
          <span style={{ color: theme.colors.statusPositive, fontWeight: theme.fontWeights.bold }}>✓</span>
        </div>
      </div>
    );
  }

  const smallBtn = (label, onClick, variant = 'default') => (
    <button
      onClick={onClick}
      style={{
        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
        background: variant === 'primary' ? theme.colors.borderGold : 'transparent',
        color: variant === 'primary' ? theme.colors.bgPage : theme.colors.textMuted,
        border: `1px solid ${variant === 'primary' ? theme.colors.borderGold : theme.colors.borderBrown}`,
        borderRadius: theme.radius.sm,
        cursor: 'pointer',
        fontSize: theme.fontSizes.xs,
        fontFamily: theme.fonts.body,
        fontWeight: variant === 'primary' ? theme.fontWeights.bold : theme.fontWeights.normal,
      }}
    >
      {label}
    </button>
  );

  // REVIVE sub-view
  if (selectedAction === 'REVIVE') {
    return (
      <div style={slotStyle}>
        {heroLabel}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.bold, color: theme.colors.textHeader, marginBottom: theme.spacing.xs }}>
            Revive who?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
            {knockedOutAllies.map((ally) => (
              <button
                key={ally.id}
                onClick={() => submit('REVIVE', null, ally.id)}
                disabled={submitting}
                style={{
                  padding: theme.spacing.xs,
                  background: theme.colors.bgPanel,
                  border: `1px solid ${theme.colors.borderGold}`,
                  borderRadius: theme.radius.sm,
                  cursor: 'pointer',
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.textPrimary,
                  textAlign: 'left',
                  fontFamily: theme.fonts.body,
                  fontWeight: theme.fontWeights.bold,
                }}
              >
                {ally.name} <span style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted }}>({ally.className})</span>
              </button>
            ))}
          </div>
          <div style={{ marginTop: theme.spacing.xs }}>
            {smallBtn('← Back', () => setSelectedAction(null))}
          </div>
        </div>
      </div>
    );
  }

  // SWAP_GEAR sub-view
  if (selectedAction === 'SWAP_GEAR') {
    return (
      <div style={slotStyle}>
        {heroLabel}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted, marginBottom: theme.spacing.sm }}>
            Swap primary and secondary weapon. Your available skills will change for the next fight.
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
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
        <div style={slotStyle}>
          {heroLabel}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.bold, color: theme.colors.textHeader, marginBottom: theme.spacing.xs }}>
              Revive Scroll — target:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
              {knockedOutAllies.map((ally) => (
                <button
                  key={ally.id}
                  onClick={() => submit('USE_ITEM', 'reviveScroll', ally.id)}
                  disabled={submitting}
                  style={{
                    padding: theme.spacing.xs,
                    background: theme.colors.bgPanel,
                    border: `1px solid ${theme.colors.borderGold}`,
                    borderRadius: theme.radius.sm,
                    cursor: 'pointer',
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.textPrimary,
                    textAlign: 'left',
                    fontFamily: theme.fonts.body,
                    fontWeight: theme.fontWeights.bold,
                  }}
                >
                  {ally.name}
                </button>
              ))}
              {knockedOutAllies.length === 0 && (
                <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted }}>No allies need revival</div>
              )}
            </div>
            <div style={{ marginTop: theme.spacing.xs }}>
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
      <div style={slotStyle}>
        {heroLabel}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.bold, color: theme.colors.textHeader, marginBottom: theme.spacing.xs }}>
            Use which item?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
            {prepItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                style={{
                  padding: theme.spacing.xs,
                  background: theme.colors.bgPanel,
                  border: `1px solid ${theme.colors.borderBrown}`,
                  borderRadius: theme.radius.sm,
                  cursor: 'pointer',
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.textPrimary,
                  textAlign: 'left',
                  fontFamily: theme.fonts.body,
                  fontWeight: theme.fontWeights.bold,
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div style={{ marginTop: theme.spacing.xs }}>
            {smallBtn('← Back', () => setSelectedAction(null))}
          </div>
        </div>
      </div>
    );
  }

  // Default: action picker
  return (
    <div style={slotStyle}>
      {heroLabel}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
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
