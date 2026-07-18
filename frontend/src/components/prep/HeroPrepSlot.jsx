import { useState, useEffect, useRef } from 'react';
import { theme } from '../../styles/theme';
import { ITEM_LIST } from '../../data/items';
import { WEAPON_LIST } from '../../data/weapons';
import { SPELL_LIST } from '../../data/spells';
import { ARMOR_TIER_LABELS, QUALITY_LABELS, QUALITY_COLORS } from '../../data/gameConstants';

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

function QualityBadge({ quality }) {
  if (!quality) return null;
  const key = quality.toLowerCase();
  const color = QUALITY_COLORS[key] ?? theme.colors.textMuted;
  const label = QUALITY_LABELS[key] ?? quality;
  return (
    <span
      className="loot-quality-badge"
      style={{ color, border: `1px solid ${color}`, fontSize: 'var(--fs-xs)', padding: '0 4px' }}
    >
      {label}
    </span>
  );
}

function LootItemRow({ item, slotLabel, isEquipped, onEquip, equipSlot, equipOptions = null }) {
  const options = equipOptions ?? (equipSlot ? [{ slot: equipSlot, label: 'Equip' }] : []);

  return (
    <div
      className="prep-loot-item-row"
      style={{
        border: `1px solid ${isEquipped ? theme.colors.borderGold : theme.colors.borderBrown}`,
        background: isEquipped ? theme.colors.bgPanelDark : theme.colors.bgPanel,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: theme.fontWeights.bold, fontSize: 'var(--fs-sm)' }}>{item.name}</span>
          <QualityBadge quality={item.quality} />
        </div>
        {item.modifiers?.length > 0 && (
          <div style={{ fontSize: 'var(--fs-xs)', color: theme.colors.textMuted, marginTop: 2 }}>
            {item.modifiers.map((m, i) => <span key={i}>+{m}{i < item.modifiers.length - 1 ? ', ' : ''}</span>)}
          </div>
        )}
        {slotLabel && (
          <div style={{ fontSize: 'var(--fs-xs)', color: theme.colors.textMuted }}>Slot: {slotLabel}</div>
        )}
      </div>
      {isEquipped ? (
        <span style={{ fontSize: 'var(--fs-xs)', color: theme.colors.borderGold, fontWeight: theme.fontWeights.bold }}>Equipped</span>
      ) : (
        <div style={{ display: 'flex', gap: 'var(--sp-xs)', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {options.map((option) => (
            <button
              key={option.slot}
              onClick={() => onEquip(item.uuid, option.slot)}
              className="prep-small-btn prep-small-btn--primary"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const SLOT_LABEL = {
  WEAPON_PRIMARY:   'Primary Weapon',
  WEAPON_SECONDARY: 'Secondary Weapon',
  ARMOR:            'Armor',
  ACCESSORY:        'Accessory',
};

function getItemSlotType(itemType) {
  if (itemType === 'weapon') return ['WEAPON_PRIMARY', 'WEAPON_SECONDARY'];
  if (itemType === 'armor')  return ['ARMOR'];
  if (itemType === 'accessory') return ['ACCESSORY'];
  return [];
}

function CurrentLoadout({ hero }) {
  const primaryWeapon = WEAPON_LIST.find((w) => w.id === hero.equippedWeaponId);
  const secondaryWeapon = hero.secondaryWeaponId ? WEAPON_LIST.find((w) => w.id === hero.secondaryWeaponId) : null;
  const armorLabel = hero.equippedArmorId ? (ARMOR_TIER_LABELS[hero.equippedArmorId] ?? hero.equippedArmorId) : 'None';

  const lootByUuid = {};
  (hero.inventory ?? []).filter((i) => i.uuid).forEach((i) => { lootByUuid[i.uuid] = i; });

  const equippedWeaponLoot    = hero.equippedLootWeaponUuid    ? lootByUuid[hero.equippedLootWeaponUuid]    : null;
  const equippedSecondaryLoot = hero.equippedLootSecondaryUuid ? lootByUuid[hero.equippedLootSecondaryUuid] : null;
  const equippedArmorLoot     = hero.equippedLootArmorUuid     ? lootByUuid[hero.equippedLootArmorUuid]     : null;
  const equippedAccessoryLoot = hero.equippedLootAccessoryUuid ? lootByUuid[hero.equippedLootAccessoryUuid] : null;

  const row = (label, value, lootItem) => (
    <div className="prep-loadout-row" key={label}>
      <span className="prep-loadout-label">{label}</span>
      <span className="prep-loadout-value">
        {lootItem ? (
          <>
            {lootItem.name} <QualityBadge quality={lootItem.quality} />
          </>
        ) : (
          value
        )}
      </span>
    </div>
  );

  return (
    <div className="prep-loadout-panel">
      <div className="prep-slot-sub-title">Current Loadout</div>
      {row('Primary', primaryWeapon?.label ?? hero.equippedWeaponId ?? '—', equippedWeaponLoot)}
      {row('Secondary', secondaryWeapon?.label ?? 'None', equippedSecondaryLoot)}
      {row('Armor', armorLabel, equippedArmorLoot)}
      {row('Accessory', equippedAccessoryLoot ? null : '—', equippedAccessoryLoot)}
    </div>
  );
}

function SpellCard({ spell, casterEn, onSelect }) {
  const disabled = casterEn < spell.enCost;
  return (
    <button
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      style={{
        flex: 1,
        background: theme.colors.bgPanel,
        border: `1px solid ${theme.colors.borderGold}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        textAlign: 'left',
        transition: theme.transitions.fast,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = theme.colors.bgPanelDark;
          e.currentTarget.style.borderColor = theme.colors.actionHover;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = theme.colors.bgPanel;
          e.currentTarget.style.borderColor = theme.colors.borderGold;
        }
      }}
    >
      <div style={{ color: theme.colors.textHeader, fontFamily: theme.fonts.header, fontWeight: theme.fontWeights.bold, fontSize: theme.fontSizes.sm }}>
        {spell.label}
      </div>
      <div style={{ marginTop: theme.spacing.xs }}>
        <span style={{ background: theme.colors.barEN, color: theme.colors.bgPage, borderRadius: theme.radius.pill, fontSize: theme.fontSizes.xs, padding: '2px 6px' }}>
          {spell.enCost} EN
        </span>
      </div>
      <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSizes.xs, marginTop: theme.spacing.xs }}>
        {spell.id === 'massHeal' ? 'Restore 5 HP to all living heroes.' : 'Restore HP to one ally.'}
      </div>
      {disabled && (
        <div style={{ color: theme.colors.barHP, fontSize: theme.fontSizes.xs, marginTop: '2px' }}>Not enough EN</div>
      )}
    </button>
  );
}

export default function HeroPrepSlot({ hero, isDone, onPrepAction, allHeroes }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [spellPickerStage, setSpellPickerStage] = useState(null); // 'spell' | 'mend-target' | null
  const [submitting, setSubmitting] = useState(false);
  const [doneLabel, setDoneLabel] = useState(null);
  const [equipMsg, setEquipMsg] = useState(null);
  const [floatingHeals, setFloatingHeals] = useState([]);
  const prevHpRef = useRef(hero.hp);
  const isMountedRef = useRef(false);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      prevHpRef.current = hero.hp;
      return;
    }
    const delta = hero.hp - prevHpRef.current;
    if (delta > 0) {
      const id = Date.now() + Math.random();
      setFloatingHeals((prev) => [...prev, { id, amount: delta }]);
      setTimeout(() => setFloatingHeals((prev) => prev.filter((f) => f.id !== id)), 700);
    }
    prevHpRef.current = hero.hp;
  }, [hero.hp]);

  const classColor = theme.classColors[hero.className?.toLowerCase()] ?? theme.colors.textMuted;
  const isCleric = hero.className?.toLowerCase() === 'cleric';
  const clericPrepSpells = isCleric ? SPELL_LIST.filter((s) => ['mend', 'massHeal'].includes(s.id)) : [];

  const prepItems = (hero.inventory ?? []).filter((invItem) => {
    if (invItem.uuid) return false;
    const itemData = ITEM_LIST.find((i) => i.id === invItem.id);
    return itemData?.usableIn.includes('prep') ?? false;
  });

  const lootItems = Array.from(
    new Map(
      (hero.inventory ?? [])
        .filter((i) => !!i.uuid && ['weapon', 'armor', 'accessory'].includes(i.itemType?.toLowerCase()))
        .map((i) => [i.uuid, i])
    ).values()
  );

  const knockedOutAllies = allHeroes.filter((h) => h.isKnockedOut && h.id !== hero.id);
  const canRevive = knockedOutAllies.length > 0;
  const hasItems = prepItems.length > 0;

  async function submit(actionType, itemId = null, targetHeroId = null, equipSlot = null, itemUuid = null, spellId = null) {
    setSubmitting(true);
    try {
      await onPrepAction(hero.id, actionType, itemId, targetHeroId, equipSlot, itemUuid, spellId);
      const labels = {
        USE_ITEM: `Used ${ITEM_LIST.find(i => i.id === itemId)?.label ?? itemId}`,
        SWAP_GEAR: equipSlot ? `Equipped to ${SLOT_LABEL[equipSlot] ?? equipSlot}` : 'Swapped weapons',
        REVIVE: `Revived ally`,
        PASS: 'Passed',
        CAST_SPELL: spellId === 'massHeal' ? 'Cast Mass Heal' : 'Cast Mend',
      };
      setDoneLabel(labels[actionType] ?? actionType);
    } catch {
      // error handled by parent
    } finally {
      setSubmitting(false);
    }
  }

  async function submitSpell(spellId, targetHeroId = null) {
    setSubmitting(true);
    try {
      await onPrepAction(hero.id, 'CAST_SPELL', null, targetHeroId, null, null, spellId);
      setDoneLabel(spellId === 'massHeal' ? 'Cast Mass Heal' : 'Cast Mend');
    } catch {
      // error handled by parent
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEquip(itemUuid, equipSlot) {
    const item = lootItems.find((i) => i.uuid === itemUuid);
    setSubmitting(true);
    setEquipMsg(null);
    try {
      await onPrepAction(hero.id, 'SWAP_GEAR', null, null, equipSlot, itemUuid);
      const itemName = item?.name ?? 'item';
      setEquipMsg(`${hero.name} equipped ${itemName}.`);
      setTimeout(() => setEquipMsg(null), 2000);
      setDoneLabel(`Equipped to ${SLOT_LABEL[equipSlot] ?? equipSlot}`);
    } catch {
      // error handled by parent
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

  const smallBtn = (label, onClick, variant = 'default') => (
    <button onClick={onClick} className={`prep-small-btn prep-small-btn--${variant}`}>
      {label}
    </button>
  );

  const floatElements = floatingHeals.map((f) => (
    <span key={f.id} className="float-damage" style={{ color: theme.colors.statusPositive }}>
      +{f.amount}
    </span>
  ));

  // Knocked out — no action picker
  if (hero.isKnockedOut) {
    return (
      <div className="prep-slot prep-slot--ko" style={{ border: `1px solid ${slotBorderColor}`, opacity: 0.55 }}>
        {heroLabel}
        <div className="prep-slot-ko-label">Needs Revival</div>
      </div>
    );
  }

  // Done
  if (isDone) {
    return (
      <div className="prep-slot" style={{ border: `1px solid ${slotBorderColor}`, opacity: submitting ? 0.7 : 1, position: 'relative' }}>
        {heroLabel}
        {floatElements}
        <div className="prep-slot-done-row">
          <span className="prep-slot-done-label">{doneLabel ?? 'Action taken'}</span>
          <span className="prep-slot-done-check">✓</span>
        </div>
      </div>
    );
  }

  // CAST_SPELL: mend target picker
  if (selectedAction === 'CAST_SPELL' && spellPickerStage === 'mend-target') {
    const aliveHeroes = allHeroes.filter((h) => !h.isKnockedOut);
    return (
      <div className="prep-slot" style={{ border: `1px solid ${slotBorderColor}`, opacity: submitting ? 0.7 : 1, position: 'relative' }}>
        {heroLabel}
        {floatElements}
        <div style={{ flex: 1 }}>
          <div className="prep-slot-sub-title">Mend — target ally:</div>
          <div className="prep-slot-sub-list">
            {aliveHeroes.map((ally) => (
              <button
                key={ally.id}
                onClick={() => submitSpell('mend', ally.id)}
                disabled={submitting}
                className="prep-slot-ally-btn"
              >
                {ally.name} <span className="prep-slot-ally-class">({ally.className})</span>
              </button>
            ))}
          </div>
          <div className="prep-slot-back-row">
            {smallBtn('← Back', () => setSpellPickerStage('spell'))}
          </div>
        </div>
      </div>
    );
  }

  // CAST_SPELL: spell picker
  if (selectedAction === 'CAST_SPELL' && spellPickerStage === 'spell') {
    return (
      <div className="prep-slot" style={{ border: `1px solid ${slotBorderColor}`, opacity: submitting ? 0.7 : 1, position: 'relative' }}>
        {heroLabel}
        {floatElements}
        <div style={{ flex: 1 }}>
          <div className="prep-slot-sub-title">Cast Healing Spell</div>
          <div style={{ display: 'flex', gap: theme.spacing.md, marginTop: theme.spacing.sm }}>
            {clericPrepSpells.map((spell) => (
              <SpellCard
                key={spell.id}
                spell={spell}
                casterEn={hero.en}
                onSelect={() => {
                  if (spell.id === 'massHeal') {
                    submitSpell('massHeal', null);
                  } else {
                    setSpellPickerStage('mend-target');
                  }
                }}
              />
            ))}
          </div>
          <div className="prep-slot-back-row" style={{ marginTop: theme.spacing.sm }}>
            {smallBtn('← Back', () => { setSelectedAction(null); setSpellPickerStage(null); })}
          </div>
        </div>
      </div>
    );
  }

  // REVIVE sub-view
  if (selectedAction === 'REVIVE') {
    return (
      <div className="prep-slot" style={{ border: `1px solid ${slotBorderColor}`, opacity: submitting ? 0.7 : 1, position: 'relative' }}>
        {heroLabel}
        {floatElements}
        <div style={{ flex: 1 }}>
          <div className="prep-slot-sub-title">Revive who?</div>
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

  // SWAP_GEAR sub-view — loadout + equippable loot
  if (selectedAction === 'SWAP_GEAR') {
    const equippedUuids = new Set([
      hero.equippedLootWeaponUuid,
      hero.equippedLootSecondaryUuid,
      hero.equippedLootArmorUuid,
      hero.equippedLootAccessoryUuid,
    ].filter(Boolean));

    return (
      <div className="prep-slot prep-slot--wide" style={{ border: `1px solid ${slotBorderColor}`, opacity: submitting ? 0.7 : 1, position: 'relative' }}>
        {heroLabel}
        {floatElements}
        {equipMsg && (
          <div className="prep-equip-msg">{equipMsg}</div>
        )}
        <div className="prep-swap-layout">
          <CurrentLoadout hero={hero} />
          <div className="prep-inventory-panel">
            <div className="prep-slot-sub-title">Equipment in Inventory</div>
            {lootItems.length === 0 ? (
              <div className="prep-slot-swap-desc">No equipment items in inventory.</div>
            ) : (
              lootItems.map((item) => {
                const slots = getItemSlotType(item.itemType);
                const isEquipped = equippedUuids.has(item.uuid);
                const equippedSlot = isEquipped
                  ? (item.uuid === hero.equippedLootWeaponUuid ? 'WEAPON_PRIMARY'
                    : item.uuid === hero.equippedLootSecondaryUuid ? 'WEAPON_SECONDARY'
                    : item.uuid === hero.equippedLootArmorUuid ? 'ARMOR'
                    : 'ACCESSORY')
                  : null;

                if (isEquipped) {
                  return (
                    <LootItemRow
                      key={item.uuid}
                      item={item}
                      slotLabel={SLOT_LABEL[equippedSlot]}
                      isEquipped
                      onEquip={handleEquip}
                      equipSlot={equippedSlot}
                    />
                  );
                }

                if (slots.length > 1) {
                  return (
                    <LootItemRow
                      key={item.uuid}
                      item={item}
                      slotLabel="Primary or Secondary Weapon"
                      isEquipped={false}
                      onEquip={handleEquip}
                      equipOptions={slots.map((slot) => ({
                        slot,
                        label: slot === 'WEAPON_PRIMARY' ? 'Primary' : 'Secondary',
                      }))}
                    />
                  );
                }

                return slots.map((slot) => (
                  <LootItemRow
                    key={`${item.uuid}-${slot}`}
                    item={item}
                    slotLabel={SLOT_LABEL[slot]}
                    isEquipped={false}
                    onEquip={handleEquip}
                    equipSlot={slot}
                  />
                ));
              })
            )}
          </div>
        </div>
        <div className="prep-slot-back-row" style={{ marginTop: 'var(--sp-sm)' }}>
          {smallBtn('← Back', () => setSelectedAction(null))}
          {smallBtn('Done', () => submit('PASS'), 'primary')}
        </div>
      </div>
    );
  }

  // USE_ITEM: item selected, check if revive scroll needs target
  if (selectedAction === 'USE_ITEM' && selectedItemId) {
    if (selectedItemId === 'reviveScroll') {
      return (
        <div className="prep-slot" style={{ border: `1px solid ${slotBorderColor}`, opacity: submitting ? 0.7 : 1, position: 'relative' }}>
          {heroLabel}
          {floatElements}
          <div style={{ flex: 1 }}>
            <div className="prep-slot-sub-title">Revive Scroll — target:</div>
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
    submit('USE_ITEM', selectedItemId, hero.id);
    setSelectedItemId(null);
    return null;
  }

  // USE_ITEM: show item list
  if (selectedAction === 'USE_ITEM') {
    return (
      <div className="prep-slot" style={{ border: `1px solid ${slotBorderColor}`, opacity: submitting ? 0.7 : 1, position: 'relative' }}>
        {heroLabel}
        {floatElements}
        <div style={{ flex: 1 }}>
          <div className="prep-slot-sub-title">Use which item?</div>
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
    <div className="prep-slot" style={{ border: `1px solid ${slotBorderColor}`, opacity: submitting ? 0.7 : 1, position: 'relative' }}>
      {heroLabel}
      {floatElements}
      <div className="prep-slot-actions">
        <ActionCard
          label="Use Item"
          sublabel={hasItems ? `${prepItems.length} item${prepItems.length !== 1 ? 's' : ''} available` : 'No prep items'}
          selected={false}
          disabled={!hasItems}
          onClick={() => setSelectedAction('USE_ITEM')}
        />
        <ActionCard
          label="Equip Gear"
          sublabel={lootItems.length > 0 ? `${lootItems.length} equipment item${lootItems.length !== 1 ? 's' : ''} available` : 'No equipment to equip'}
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
        {isCleric && (
          <ActionCard
            label="Cast Healing Spell"
            sublabel="Use Mend or Mass Heal to restore HP."
            selected={false}
            disabled={false}
            onClick={() => { setSelectedAction('CAST_SPELL'); setSpellPickerStage('spell'); }}
          />
        )}
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
