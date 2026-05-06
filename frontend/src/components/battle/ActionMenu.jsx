import { useState } from 'react';
import { theme } from '../../styles/theme';
import { SPELL_LIST } from '../../data/spells';
import { ITEM_LIST } from '../../data/items';
import { playSound } from '../../services/sound';

const ALLY_TARGET_ITEMS = new Set(['reviveScroll']);

function MenuButton({ label, sublabel, disabled, onClick, highlight }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`menu-btn${highlight ? ' menu-btn--highlight' : ''}${disabled ? ' menu-btn--disabled' : ''}`}
      onMouseEnter={(e) => { if (!disabled) playSound('uiNav'); if (!disabled && !highlight) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
      onMouseLeave={(e) => { if (!disabled && !highlight) e.currentTarget.style.background = theme.colors.bgPanel; }}
    >
      <div>{label}</div>
      {sublabel && (
        <div
          className="menu-btn-sublabel"
          style={{ color: highlight ? theme.colors.bgPage : theme.colors.textMuted }}
        >
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
      className={`submenu-btn${disabled ? ' submenu-btn--disabled' : ''}`}
      style={{ border: `1px solid ${disabled ? theme.colors.borderBrown : theme.colors.borderGold}` }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = theme.colors.bgPanel; }}
    >
      <span className="submenu-btn-label">
        {label}
      </span>
      <span className="submenu-btn-cost">
        {school ? `[${school}] ` : ''}{cost > 0 ? `${cost} EN` : ''}
      </span>
    </button>
  );
}

export default function ActionMenu({ hero, targeting, onBeginTarget, onAction, onChangeWeapon, onCancelTarget, isLoading }) {
  const [submenu, setSubmenu] = useState(null); // null | 'skill' | 'item'

  const actorId = hero.id;

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

  // Filter inventory to items usable in battle
  const battleItems = (hero.inventory ?? []).filter((item) => {
    const def = ITEM_LIST.find((i) => i.id === item.id);
    return def?.usableIn?.includes('battle') ?? false;
  });
  if ((hero.inventory?.length ?? 0) > 0 && battleItems.length === 0) {
    console.error('[ActionMenu] Hero has items but none are usable in battle:', hero.inventory);
  }
  const hasItems = battleItems.length > 0;

  // Targeting mode — show cancel only
  if (targeting) {
    const modeLabel = targeting.mode === 'enemy' ? 'Select an enemy target' : 'Select an ally target';
    return (
      <div className="action-menu-targeting">
        <div className="action-menu-target-label">
          {modeLabel}
        </div>
        <button
          onClick={() => { onCancelTarget(); setSubmenu(null); }}
          className="btn-secondary-sm"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.colors.bgPanelDark;
            e.currentTarget.style.borderColor = theme.colors.borderGold;
            e.currentTarget.style.color = theme.colors.textHeader;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = theme.colors.borderBrown;
            e.currentTarget.style.color = theme.colors.textMuted;
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  const loadingOverlay = isLoading ? (
    <div className="action-menu-loading-overlay">
      <div className="action-menu-loading-text">
        Processing...
      </div>
    </div>
  ) : null;

  // Skill submenu
  if (submenu === 'skill') {
    const skills = hero.availableSkills ?? [];
    const spells = hero.availableSpells ?? [];
    return (
      <div className="action-menu">
        {loadingOverlay}
        <div className="action-menu-section-title">
          Skills &amp; Magic
        </div>
        <div className="action-menu-scroll-list">
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
            <div className="action-menu-empty">No skills available</div>
          )}
        </div>
        <button
          onClick={() => setSubmenu(null)}
          className="btn-secondary-sm"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.colors.bgPanelDark;
            e.currentTarget.style.borderColor = theme.colors.borderGold;
            e.currentTarget.style.color = theme.colors.textHeader;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = theme.colors.borderBrown;
            e.currentTarget.style.color = theme.colors.textMuted;
          }}
        >
          ← Back
        </button>
      </div>
    );
  }

  // Item submenu
  if (submenu === 'item') {
    return (
      <div className="action-menu">
        {loadingOverlay}
        <div className="action-menu-section-title">
          Items
        </div>
        <div className="action-menu-scroll-list">
          {battleItems.map((item) => (
            <SubMenuItem
              key={item.id + item.name}
              label={item.name}
              cost={0}
              school={null}
              disabled={false}
              onClick={() => handleItemSelect(item)}
            />
          ))}
          {battleItems.length === 0 && (
            <div className="action-menu-empty">No items usable in battle</div>
          )}
        </div>
        <button
          onClick={() => setSubmenu(null)}
          className="btn-secondary-sm"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.colors.bgPanelDark;
            e.currentTarget.style.borderColor = theme.colors.borderGold;
            e.currentTarget.style.color = theme.colors.textHeader;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = theme.colors.borderBrown;
            e.currentTarget.style.color = theme.colors.textMuted;
          }}
        >
          ← Back
        </button>
      </div>
    );
  }

  // Default action buttons
  return (
    <div className="action-menu">
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
        sublabel={hasItems ? `${battleItems.length} in bag` : 'Empty'}
        onClick={() => setSubmenu('item')}
        disabled={!hasItems}
      />
      {hero.secondaryWeaponId && (
        <MenuButton
          label="🔄 Change Weapon"
          sublabel="Swap — costs your turn"
          onClick={onChangeWeapon}
        />
      )}
    </div>
  );
}
