import { useState } from 'react';
import { theme } from '../../styles/theme';
import { CLASS_LIST } from '../../data/classes';
import { MAGE_SPECIALIZATIONS, SCHOOL_COLORS } from '../../data/spells';
import ClassPicker from './ClassPicker';
import AugmentationPicker from './AugmentationPicker';
import LoadoutBuilder from './LoadoutBuilder';
import ItemStarter from './ItemStarter';

const CLASS_ARMOR = { warrior: 'heavy', ranger: 'medium', cleric: 'medium', mage: 'light', thief: 'light' };

function augDone(hero) {
  return !!hero.augmentationType && (hero.augmentationType === 'natural' || !!hero.augmentationAdvantageId);
}

function mageDone(hero) {
  return hero.classId !== 'mage' || !!hero.mageSpecializationId;
}

function computeSteps(hero) {
  const aug = augDone(hero);
  const mage = mageDone(hero);
  const steps = [
    { id: 'class', label: 'Class', done: !!hero.classId },
  ];
  if (hero.classId) {
    steps.push({ id: 'augmentation', label: 'Augment.', done: aug });
  }
  if (hero.classId === 'mage' && aug) {
    steps.push({ id: 'mageSpec', label: 'School', done: mage });
  }
  if (hero.classId && aug && mage) {
    steps.push({ id: 'loadout', label: 'Loadout', done: !!hero.primaryWeaponId });
  }
  if (hero.primaryWeaponId) {
    steps.push({ id: 'items', label: 'Items', done: true });
  }
  return steps;
}

function firstIncompleteId(steps) {
  const inc = steps.find((s) => !s.done);
  return inc ? inc.id : steps[steps.length - 1]?.id ?? 'class';
}

function isAccessible(stepId, steps) {
  const idx = steps.findIndex((s) => s.id === stepId);
  if (idx < 0) return false;
  return steps.slice(0, idx).every((s) => s.done);
}

function ProgressBar({ steps, displayStepId, onStepClick }) {
  return (
    <div className="progress-bar">
      {steps.map((step, i) => {
        const isActive = step.id === displayStepId;
        const accessible = isAccessible(step.id, steps);
        const color = isActive
          ? theme.colors.textPrimary
          : step.done
            ? theme.colors.borderGold
            : theme.colors.textMuted;
        return (
          <button
            key={step.id}
            onClick={() => accessible && onStepClick(step.id)}
            className="progress-step-btn"
            style={{
              background: isActive ? theme.colors.borderGold : 'transparent',
              border: `1px solid ${step.done || isActive ? theme.colors.borderGold : theme.colors.borderBrown}`,
              cursor: accessible ? 'pointer' : 'default',
              color: isActive ? theme.colors.bgPage : color,
              fontWeight: isActive ? theme.fontWeights.bold : theme.fontWeights.normal,
            }}
          >
            {i + 1}. {step.label}
          </button>
        );
      })}
    </div>
  );
}

export default function HeroSlot({ hero, heroIndex, onUpdate }) {
  const [viewStepId, setViewStepId] = useState(null);

  const steps = computeSteps(hero);
  const autoStep = firstIncompleteId(steps);
  const displayStepId = (viewStepId && isAccessible(viewStepId, steps)) ? viewStepId : autoStep;

  const cls = CLASS_LIST.find((c) => c.id === hero.classId) ?? null;

  function update(updates) {
    onUpdate(updates);
    setViewStepId(null);
  }

  function handleClassSelect(classId) {
    onUpdate({
      classId,
      augmentationType: null,
      augmentationAdvantageId: null,
      mageSpecializationId: null,
      primaryWeaponId: null,
      armorTier: CLASS_ARMOR[classId] ?? 'light',
      accessoryId: null,
      items: {},
    });
    setViewStepId(null);
  }

  function handleAugSelect({ augmentationType, augmentationAdvantageId }) {
    onUpdate({ augmentationType, augmentationAdvantageId, mageSpecializationId: null });
    setViewStepId(null);
  }

  function handleMageSpecSelect(specId) {
    update({ mageSpecializationId: specId });
  }

  function handleLoadoutUpdate(updates) {
    onUpdate(updates);
    // don't clear viewStepId — user is still browsing loadout
  }

  function handleItemsUpdate(items) {
    onUpdate({ items });
  }

  const headerLabel = cls ? cls.label : `Hero ${heroIndex + 1}`;
  const headerColor = cls ? theme.classColors[cls.colorKey] : theme.colors.textMuted;

  return (
    <div className="hero-slot-panel">
      <div className="hero-slot-header" style={{ color: headerColor }}>
        {cls && (
          <div className="team-dot" style={{ background: headerColor }} />
        )}
        {headerLabel}
      </div>

      <ProgressBar
        steps={steps}
        displayStepId={displayStepId}
        onStepClick={(id) => isAccessible(id, steps) && setViewStepId(id)}
      />

      <div className="hero-slot-scroll">
        {displayStepId === 'class' && (
          <ClassPicker selectedClassId={hero.classId} onSelect={handleClassSelect} />
        )}

        {displayStepId === 'augmentation' && (
          <AugmentationPicker
            classType={cls?.type ?? 'physical'}
            augmentationType={hero.augmentationType}
            augmentationAdvantageId={hero.augmentationAdvantageId}
            onSelect={handleAugSelect}
          />
        )}

        {displayStepId === 'mageSpec' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
            <div className="picker-card-sublabel" style={{ marginBottom: 'var(--sp-xs)' }}>
              Choose your school of magic:
            </div>
            {MAGE_SPECIALIZATIONS.map((spec) => {
              const sel = spec.id === hero.mageSpecializationId;
              return (
                <button
                  key={spec.id}
                  onClick={() => handleMageSpecSelect(spec.id)}
                  className="picker-card-btn"
                  style={{
                    background: sel ? theme.colors.bgPanelDark : theme.colors.bgPanel,
                    border: `${sel ? 2 : 1}px solid ${sel ? theme.colors.borderGold : theme.colors.borderBrown}`,
                  }}
                  onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
                  onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = sel ? theme.colors.bgPanelDark : theme.colors.bgPanel; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)' }}>
                    <div
                      className="team-dot"
                      style={{ background: SCHOOL_COLORS[spec.school] }}
                    />
                    <div className="picker-card-label">{spec.label}</div>
                  </div>
                  <div className="picker-card-sublabel">
                    {spec.description}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {displayStepId === 'loadout' && (
          <LoadoutBuilder
            classId={hero.classId}
            augmentationType={hero.augmentationType}
            primaryWeaponId={hero.primaryWeaponId}
            accessoryId={hero.accessoryId}
            onUpdate={handleLoadoutUpdate}
          />
        )}

        {displayStepId === 'items' && (
          <ItemStarter
            items={hero.items}
            onUpdate={handleItemsUpdate}
          />
        )}
      </div>
    </div>
  );
}
