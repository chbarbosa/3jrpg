import { theme } from '../../styles/theme';
import { WEAPON_LIST, SKILL_LABELS } from '../../data/weapons';
import { ARMOR_TIER_LABELS } from '../../data/gameConstants';
import { COMMON_ACCESSORIES } from '../../data/accessories';

const CLASS_ARMOR = { warrior: 'heavy', ranger: 'medium', cleric: 'medium', mage: 'light' };

function SectionLabel({ children }) {
  return (
    <div className="loadout-section-label">
      {children}
    </div>
  );
}

function WeaponCard({ weapon, selected, disabled, onClick }) {
  return (
    <button
      onClick={() => !disabled && onClick(weapon.id)}
      disabled={disabled}
      className="weapon-card-btn"
      style={{
        background: selected ? theme.colors.bgPanelDark : theme.colors.bgPanel,
        border: `${selected ? 2 : 1}px solid ${selected ? theme.colors.borderGold : theme.colors.borderBrown}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
      }}
      onMouseEnter={(e) => { if (!disabled && !selected) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
      onMouseLeave={(e) => { if (!disabled && !selected) e.currentTarget.style.background = theme.colors.bgPanel; }}
    >
      <div className="weapon-card-label">
        {weapon.label}
      </div>
      <div className="weapon-card-skills">
        {weapon.skills.map((s) => SKILL_LABELS[s] ?? s).join(' · ')}
      </div>
      {weapon.passiveEffect && (
        <div className="weapon-card-passive">
          {weapon.passiveEffect}
        </div>
      )}
    </button>
  );
}

function AccessoryCard({ acc, selected, onClick }) {
  return (
    <button
      onClick={() => onClick(acc.id)}
      className="weapon-card-btn"
      style={{
        background: selected ? theme.colors.bgPanelDark : theme.colors.bgPanel,
        border: `${selected ? 2 : 1}px solid ${selected ? theme.colors.borderGold : theme.colors.borderBrown}`,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = theme.colors.bgPanel; }}
    >
      <div className="weapon-card-label">{acc.label}</div>
      <div
        className="weapon-card-skills"
        style={{ color: theme.colors.textHeader, fontSize: theme.fontSizes.xs }}
      >
        {acc.bonus}
      </div>
      <div className="weapon-card-passive">{acc.description}</div>
    </button>
  );
}

export default function LoadoutBuilder({ classId, augmentationType, primaryWeaponId, secondaryWeaponId, accessoryId, onUpdate }) {
  const weapons = WEAPON_LIST.filter((w) => w.equippableBy.includes(classId));
  const armorTier = CLASS_ARMOR[classId] ?? 'light';

  function handlePrimary(weaponId) {
    const updates = { primaryWeaponId: weaponId };
    if (secondaryWeaponId === weaponId) updates.secondaryWeaponId = null;
    onUpdate(updates);
  }

  function handleSecondary(weaponId) {
    onUpdate({ secondaryWeaponId: secondaryWeaponId === weaponId ? null : weaponId });
  }

  return (
    <div>
      <SectionLabel>Primary Weapon</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }}>
        {weapons.map((w) => (
          <WeaponCard
            key={w.id}
            weapon={w}
            selected={w.id === primaryWeaponId}
            disabled={false}
            onClick={handlePrimary}
          />
        ))}
      </div>

      <SectionLabel>Secondary Weapon (optional)</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }}>
        <button
          onClick={() => onUpdate({ secondaryWeaponId: null })}
          className="weapon-card-btn"
          style={{
            background: secondaryWeaponId == null ? theme.colors.bgPanelDark : theme.colors.bgPanel,
            border: `${secondaryWeaponId == null ? 2 : 1}px solid ${secondaryWeaponId == null ? theme.colors.borderGold : theme.colors.borderBrown}`,
          }}
          onMouseEnter={(e) => { if (secondaryWeaponId != null) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
          onMouseLeave={(e) => { if (secondaryWeaponId != null) e.currentTarget.style.background = theme.colors.bgPanel; }}
        >
          <div className="weapon-card-skills">
            None
          </div>
        </button>
        {weapons.map((w) => (
          <WeaponCard
            key={w.id}
            weapon={w}
            selected={w.id === secondaryWeaponId}
            disabled={w.id === primaryWeaponId}
            onClick={handleSecondary}
          />
        ))}
      </div>

      {augmentationType === 'cyber' && (
        <>
          <SectionLabel>Cyber Weapon</SectionLabel>
          <div className="cyber-weapon-placeholder">
            Cyber weapon slot — equipped from loot
          </div>
        </>
      )}

      <SectionLabel>Armor</SectionLabel>
      <div className="armor-display">
        {ARMOR_TIER_LABELS[armorTier]} · Plain — assigned automatically
      </div>

      <SectionLabel>Accessory (Starting)</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }}>
        <button
          onClick={() => onUpdate({ accessoryId: null })}
          className="weapon-card-btn"
          style={{
            background: accessoryId == null ? theme.colors.bgPanelDark : theme.colors.bgPanel,
            border: `${accessoryId == null ? 2 : 1}px solid ${accessoryId == null ? theme.colors.borderGold : theme.colors.borderBrown}`,
          }}
          onMouseEnter={(e) => { if (accessoryId != null) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
          onMouseLeave={(e) => { if (accessoryId != null) e.currentTarget.style.background = theme.colors.bgPanel; }}
        >
          <div className="weapon-card-skills">None — find accessories during run</div>
        </button>
        {COMMON_ACCESSORIES.map((acc) => (
          <AccessoryCard
            key={acc.id}
            acc={acc}
            selected={acc.id === accessoryId}
            onClick={(id) => onUpdate({ accessoryId: id })}
          />
        ))}
      </div>
    </div>
  );
}
