import { theme } from '../../styles/theme';
import { WEAPON_LIST, SKILL_LABELS } from '../../data/weapons';
import { ARMOR_TIER_LABELS } from '../../data/gameConstants';

const CLASS_ARMOR = { warrior: 'heavy', ranger: 'medium', priest: 'medium', mage: 'light' };

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: theme.fonts.header,
      fontSize: theme.fontSizes.sm,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.textHeader,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.xs,
    }}>
      {children}
    </div>
  );
}

function WeaponCard({ weapon, selected, disabled, onClick }) {
  return (
    <button
      onClick={() => !disabled && onClick(weapon.id)}
      disabled={disabled}
      style={{
        padding: theme.spacing.xs,
        background: selected ? theme.colors.bgPanelDark : theme.colors.bgPanel,
        border: `${selected ? 2 : 1}px solid ${selected ? theme.colors.borderGold : theme.colors.borderBrown}`,
        borderRadius: theme.radius.sm,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        width: '100%',
        opacity: disabled ? 0.45 : 1,
        transition: `background ${theme.transitions.fast}`,
      }}
      onMouseEnter={(e) => { if (!disabled && !selected) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
      onMouseLeave={(e) => { if (!disabled && !selected) e.currentTarget.style.background = theme.colors.bgPanel; }}
    >
      <div style={{
        fontSize: theme.fontSizes.sm,
        fontWeight: theme.fontWeights.bold,
        color: theme.colors.textPrimary,
      }}>
        {weapon.label}
      </div>
      <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted }}>
        {weapon.skills.map((s) => SKILL_LABELS[s] ?? s).join(' · ')}
      </div>
      {weapon.passiveEffect && (
        <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textHeader, marginTop: '2px' }}>
          {weapon.passiveEffect}
        </div>
      )}
    </button>
  );
}

export default function LoadoutBuilder({ classId, augmentationType, primaryWeaponId, secondaryWeaponId, onUpdate }) {
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
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
          <div style={{
            padding: theme.spacing.sm,
            border: `1px dashed ${theme.colors.borderGold}`,
            borderRadius: theme.radius.sm,
            fontSize: theme.fontSizes.xs,
            color: theme.colors.textMuted,
          }}>
            Cyber weapon slot — equipped from loot
          </div>
        </>
      )}

      <SectionLabel>Armor</SectionLabel>
      <div style={{
        padding: theme.spacing.sm,
        background: theme.colors.bgPanelDark,
        border: `1px solid ${theme.colors.borderBrown}`,
        borderRadius: theme.radius.sm,
        fontSize: theme.fontSizes.sm,
        color: theme.colors.textPrimary,
      }}>
        {ARMOR_TIER_LABELS[armorTier]} · Plain — assigned automatically
      </div>

      <SectionLabel>Accessory</SectionLabel>
      <div style={{
        padding: theme.spacing.sm,
        border: `1px dashed ${theme.colors.borderBrown}`,
        borderRadius: theme.radius.sm,
        fontSize: theme.fontSizes.xs,
        color: theme.colors.textMuted,
      }}>
        Accessory slot — filled from loot during run
      </div>
    </div>
  );
}
