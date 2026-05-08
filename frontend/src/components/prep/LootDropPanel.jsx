import { useEffect, useState } from 'react';
import { theme } from '../../styles/theme';
import { QUALITY_LABELS, QUALITY_COLORS, ARMOR_TIER_LABELS } from '../../data/gameConstants';
import { WEAPON_LIST, SKILL_LABELS } from '../../data/weapons';
import { ITEM_LIST } from '../../data/items';
import { playSound } from '../../services/sound';

function ItemCategoryDetail({ lootItem }) {
  const category = (lootItem.itemCategory ?? lootItem.itemType ?? '').toUpperCase();

  if (category === 'WEAPON') {
    const weaponData = WEAPON_LIST.find((w) => w.id === lootItem.weaponTypeId);
    return (
      <div className="loot-item-category-detail">
        <div className="loot-item-category-label" style={{ color: theme.colors.textMuted }}>
          Weapon{weaponData ? ` — ${weaponData.label}` : ''}
        </div>
        {weaponData?.skills?.length > 0 && (
          <div className="loot-item-skills">
            {weaponData.skills.map((s) => (
              <span key={s} className="loot-skill-tag">{SKILL_LABELS[s] ?? s}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (category === 'ARMOR') {
    const tierLabel = ARMOR_TIER_LABELS[lootItem.armorTierId] ?? lootItem.armorTierId ?? 'Armor';
    return (
      <div className="loot-item-category-detail">
        <div className="loot-item-category-label" style={{ color: theme.colors.textMuted }}>
          Armor — {tierLabel}
        </div>
      </div>
    );
  }

  if (category === 'ACCESSORY') {
    const typeLabel = lootItem.accessoryType
      ? lootItem.accessoryType.charAt(0).toUpperCase() + lootItem.accessoryType.slice(1)
      : 'Accessory';
    return (
      <div className="loot-item-category-detail">
        <div className="loot-item-category-label" style={{ color: theme.colors.textMuted }}>
          Accessory — {typeLabel}
        </div>
      </div>
    );
  }

  if (category === 'CONSUMABLE') {
    const itemData = ITEM_LIST.find((i) => i.id === lootItem.itemId);
    const label = itemData?.label ?? lootItem.name;
    return (
      <div className="loot-item-category-detail">
        <div className="loot-item-category-label" style={{ color: theme.colors.textMuted }}>
          Consumable — {label}
        </div>
        {itemData?.description && (
          <div className="loot-item-desc" style={{ fontSize: 'var(--fs-xs)' }}>
            {itemData.description}
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default function LootDropPanel({ lootItem, heroes, onAssignLoot, lootAssigned, lootRecipientHeroId }) {
  const [glowing, setGlowing] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setGlowing(false), 1800);
    return () => clearTimeout(t);
  }, []);

  async function handleHeroClick(heroId) {
    if (lootAssigned || assigning) return;
    setAssigning(true);
    setError(null);
    try {
      await onAssignLoot(heroId);
      playSound('lootDrop');
    } catch (err) {
      setError(err.message ?? 'Failed to assign loot.');
    } finally {
      setAssigning(false);
    }
  }

  const qualityColor = QUALITY_COLORS[lootItem.quality?.toLowerCase()] ?? theme.colors.textMuted;
  const qualityLabel = QUALITY_LABELS[lootItem.quality?.toLowerCase()] ?? lootItem.quality ?? '';

  return (
    <div
      className="panel"
      style={{ boxShadow: glowing ? theme.shadows.highlight : theme.shadows.panel, transition: `box-shadow var(--t-slow)` }}
    >
      <div className="panel-title">
        Loot Drop
      </div>

      {/* Item details */}
      <div className="loot-item-box">
        <div className="loot-item-name-row">
          <div className="loot-item-name">
            {lootItem.name}
          </div>
          <div
            className="loot-quality-badge"
            style={{ color: qualityColor, border: `1px solid ${qualityColor}` }}
          >
            {qualityLabel}
          </div>
        </div>

        <ItemCategoryDetail lootItem={lootItem} />

        {lootItem.description && (
          <div className="loot-item-desc">
            {lootItem.description}
          </div>
        )}

        {lootItem.modifiers?.length > 0 && (
          <div className="loot-item-modifiers">
            {lootItem.modifiers.map((mod, i) => (
              <div key={i} className="loot-item-modifier">
                + {mod}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignment */}
      {lootAssigned ? (
        <div className="loot-assigned-msg">
          ✓ Assigned to {heroes.find(h => h.id === lootRecipientHeroId)?.name ?? 'hero'}
        </div>
      ) : (
        <>
          <div className="loot-assign-label">
            Assign to:
          </div>
          <div className="loot-hero-btns">
            {heroes.map((hero) => {
              const classColor = theme.classColors[hero.className?.toLowerCase()] ?? theme.colors.textMuted;
              const disabled = hero.isKnockedOut || assigning;
              return (
                <button
                  key={hero.id}
                  onClick={() => !disabled && handleHeroClick(hero.id)}
                  disabled={disabled}
                  className={`loot-hero-btn${disabled ? ' loot-hero-btn--disabled' : ''}`}
                >
                  <div className="team-dot" style={{ background: classColor }} />
                  {hero.name}
                  {hero.isKnockedOut && <span className="loot-ko-label"> (KO)</span>}
                </button>
              );
            })}
          </div>
          {error && (
            <div className="loot-error">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
}
