import { useState } from 'react';
import { theme } from '../../styles/theme';
import { SPELL_LIST } from '../../data/spells';

const ALLY_TARGET_ITEMS = new Set(['reviveScroll']);
const ALL_ITEMS_SELF = true; // non-revive items target self

function MenuButton({ label, sublabel, disabled, onClick, highlight }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        background: highlight ? theme.colors.borderGold : theme.colors.bgPanel,
        color: highlight ? theme.colors.bgPage : disabled ? theme.colors.textMuted : theme.colors.textPrimary,
        border: `1px solid ${disabled ? theme.colors.borderBrown : theme.colors.borderGold}`,
        borderRadius: theme.radius.md,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSizes.sm,
        fontWeight: theme.fontWeights.bold,
        opacity: disabled ? 0.5 : 1,
        transition: `background ${theme.transitions.fast}`,
      }}
      onMouseEnter={(e) => { if (!disabled && !highlight) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
      onMouseLeave={(e) => { if (!disabled && !highlight) e.currentTarget.style.background = theme.colors.bgPanel; }}
    >
      <div>{label}</div>
      {sublabel && (
        <div style={{ fontSize: theme.fontSizes.xs, color: highlight ? theme.colors.bgPage : theme.colors.textMuted, fontWeight: theme.fontWeights.normal }}>
          {sublabel}
        </div>
      )}
    </button>
  );
}

function SubMenuItem({ label, cost, school, disabled, onClick }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
        background: theme.colors.bgPanel,
        border: `1px solid ${disabled ? theme.colors.borderBrown : theme.colors.borderGold}`,
        borderRadius: theme.radius.sm,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: disabled ? 0.45 : 1,
        fontFamily: theme.fonts.body,
        transition: `background ${theme.transitions.fast}`,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = theme.colors.bgPanel; }}
    >
      <span style={{ fontSize: theme.fontSizes.sm, color: theme.colors.textPrimary, fontWeight: theme.fontWeights.bold }}>
        {label}
      </span>
      <span style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted, whiteSpace: 'nowrap', marginLeft: theme.spacing.sm }}>
        {school ? `[${school}] ` : ''}{cost > 0 ? `${cost} EN` : ''}
      </span>
    </button>
  );
}

export default function ActionMenu({ hero, targeting, onBeginTarget, onAction, onChangeWeapon, onCancelTarget, isLoading }) {
  const [submenu, setSubmenu] = useState(null); // null | 'skill' | 'item'

  const actorId = hero.id;
  const hasSecondary = false; // will be inferred from hero state if available

  function handleAttack() {
    onBeginTarget({ mode: 'enemy', actionType: 'ATTACK', actorId });
    setSubmenu(null);
  }

  function handleSkillSelect(skill) {
    onBeginTarget({ mode: 'enemy', actionType: 'SKILL', actorId, skillId: skill.id });
    setSubmenu(null);
  }

  function handleSpellSelect(spell) {
    const spellData = SPELL_LIST.find((s) => s.id === spell.id);
    const targetType = spellData?.targetType ?? 'single';
    if (targetType === 'all') {
      onAction({ actionType: 'MAGIC', actorId, spellId: spell.id });
      setSubmenu(null);
    } else if (targetType === 'ally') {
      onBeginTarget({ mode: 'ally', actionType: 'MAGIC', actorId, spellId: spell.id });
      setSubmenu(null);
    } else {
      onBeginTarget({ mode: 'enemy', actionType: 'MAGIC', actorId, spellId: spell.id });
      setSubmenu(null);
    }
  }

  function handleItemSelect(item) {
    if (ALLY_TARGET_ITEMS.has(item.id)) {
      onBeginTarget({ mode: 'ally-ko', actionType: 'ITEM', actorId, itemId: item.id });
    } else {
      onAction({ actionType: 'ITEM', actorId, targetId: actorId, itemId: item.id });
    }
    setSubmenu(null);
  }

  const hasSkills = hero.availableSkills?.length > 0 || hero.availableSpells?.length > 0;
  const hasItems = hero.inventory?.length > 0;

  // Targeting mode — show cancel only
  if (targeting) {
    const modeLabel = targeting.mode === 'enemy' ? 'Select an enemy target' : 'Select an ally target';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{
          fontSize: theme.fontSizes.sm,
          color: theme.colors.textHeader,
          fontFamily: theme.fonts.header,
          fontWeight: theme.fontWeights.bold,
          textAlign: 'center',
        }}>
          {modeLabel}
        </div>
        <button
          onClick={() => { onCancelTarget(); setSubmenu(null); }}
          style={{
            padding: `${theme.spacing.xs} ${theme.spacing.lg}`,
            background: 'transparent',
            border: `1px solid ${theme.colors.borderBrown}`,
            borderRadius: theme.radius.md,
            cursor: 'pointer',
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes.sm,
            color: theme.colors.textPrimary,
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  const menuStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
    height: '100%',
    position: 'relative',
  };

  const loadingOverlay = isLoading ? (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(237,224,196,0.75)',
      borderRadius: theme.radius.md,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    }}>
      <div style={{
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSizes.sm,
        color: theme.colors.textMuted,
      }}>
        Processing...
      </div>
    </div>
  ) : null;

  // Skill submenu
  if (submenu === 'skill') {
    const skills = hero.availableSkills ?? [];
    const spells = hero.availableSpells ?? [];
    return (
      <div style={menuStyle}>
        {loadingOverlay}
        <div style={{
          fontFamily: theme.fonts.header,
          fontSize: theme.fontSizes.sm,
          fontWeight: theme.fontWeights.bold,
          color: theme.colors.textHeader,
          marginBottom: theme.spacing.xs,
        }}>
          Skills &amp; Magic
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          {skills.map((sk) => (
            <SubMenuItem
              key={sk.id}
              label={sk.name}
              cost={sk.enCost}
              school={null}
              disabled={hero.en < sk.enCost}
              onClick={() => handleSkillSelect(sk)}
            />
          ))}
          {spells.map((sp) => (
            <SubMenuItem
              key={sp.id}
              label={sp.name}
              cost={sp.enCost}
              school={sp.school}
              disabled={hero.en < sp.enCost}
              onClick={() => handleSpellSelect(sp)}
            />
          ))}
          {skills.length === 0 && spells.length === 0 && (
            <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted }}>No skills available</div>
          )}
        </div>
        <button
          onClick={() => setSubmenu(null)}
          style={{
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            background: 'transparent',
            border: `1px solid ${theme.colors.borderBrown}`,
            borderRadius: theme.radius.sm,
            cursor: 'pointer',
            fontSize: theme.fontSizes.xs,
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.body,
          }}
        >
          ← Back
        </button>
      </div>
    );
  }

  // Item submenu
  if (submenu === 'item') {
    const items = hero.inventory ?? [];
    return (
      <div style={menuStyle}>
        {loadingOverlay}
        <div style={{
          fontFamily: theme.fonts.header,
          fontSize: theme.fontSizes.sm,
          fontWeight: theme.fontWeights.bold,
          color: theme.colors.textHeader,
          marginBottom: theme.spacing.xs,
        }}>
          Items
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          {items.map((item) => (
            <SubMenuItem
              key={item.id}
              label={item.name}
              cost={0}
              school={null}
              disabled={false}
              onClick={() => handleItemSelect(item)}
            />
          ))}
          {items.length === 0 && (
            <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted }}>No items</div>
          )}
        </div>
        <button
          onClick={() => setSubmenu(null)}
          style={{
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            background: 'transparent',
            border: `1px solid ${theme.colors.borderBrown}`,
            borderRadius: theme.radius.sm,
            cursor: 'pointer',
            fontSize: theme.fontSizes.xs,
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.body,
          }}
        >
          ← Back
        </button>
      </div>
    );
  }

  // Default action buttons
  return (
    <div style={menuStyle}>
      {loadingOverlay}
      <MenuButton label="⚔ Attack" onClick={handleAttack} />
      <MenuButton
        label="✦ Skills / Magic"
        sublabel={hasSkills ? `${(hero.availableSkills?.length ?? 0) + (hero.availableSpells?.length ?? 0)} available` : 'None'}
        onClick={() => setSubmenu('skill')}
        disabled={!hasSkills}
      />
      <MenuButton
        label="🧪 Item"
        sublabel={hero.inventory?.length > 0 ? `${hero.inventory.length} in bag` : 'Empty'}
        onClick={() => setSubmenu('item')}
      />
      {hero.secondaryWeaponId && (
        <MenuButton
          label="🔄 Change Weapon"
          sublabel={`Swap — costs your turn`}
          onClick={onChangeWeapon}
        />
      )}
    </div>
  );
}
