import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../styles/theme';
import AlertModal from '../components/AlertModal';
import HeroSlot from '../components/selection/HeroSlot';
import TeamSummary from '../components/selection/TeamSummary';
import { startRun } from '../services/api';

function emptyHero() {
  return {
    classId: null,
    augmentationType: null,
    augmentationAdvantageId: null,
    mageSpecializationId: null,
    primaryWeaponId: null,
    secondaryWeaponId: null,
    armorTier: null,
    accessory: false,
    items: {},
  };
}

const pageStyle = {
  minHeight: '100vh',
  background: theme.colors.bgPage,
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing.lg,
  boxSizing: 'border-box',
};

const titleStyle = {
  fontFamily: theme.fonts.header,
  fontSize: theme.fontSizes.xxl,
  fontWeight: theme.fontWeights.bold,
  color: theme.colors.textHeader,
  textAlign: 'center',
  marginBottom: theme.spacing.lg,
};

export default function SelectionPage() {
  const navigate = useNavigate();
  const [heroes, setHeroes] = useState([emptyHero(), emptyHero(), emptyHero()]);
  const [modal, setModal] = useState({ open: false, title: '', message: '', variant: 'info', onConfirm: null, cancelLabel: null });
  const [loading, setLoading] = useState(false);

  function updateHero(index, updates) {
    setHeroes((prev) => prev.map((h, i) => i === index ? { ...h, ...updates } : h));
  }

  function openConfirmStart() {
    setModal({
      open: true,
      title: 'Begin Run?',
      message: 'Once started your team is locked in. Good luck.',
      variant: 'warning',
      confirmLabel: 'Start',
      cancelLabel: 'Cancel',
      onConfirm: handleConfirmStart,
      onCancel: closeModal,
    });
  }

  function closeModal() {
    setModal((m) => ({ ...m, open: false }));
  }

  function showError(title, message) {
    setModal({
      open: true,
      title,
      message,
      variant: 'danger',
      confirmLabel: 'OK',
      cancelLabel: null,
      onConfirm: closeModal,
      onCancel: null,
    });
  }

  async function handleConfirmStart() {
    closeModal();
    setLoading(true);
    try {
      const heroConfigs = heroes.map((hero) => ({
        classId: hero.classId,
        augmentationType: hero.augmentationType ?? null,
        augmentationAdvantageId: hero.augmentationAdvantageId ?? null,
        mageSpecializationId: hero.mageSpecializationId ?? null,
        primaryWeaponId: hero.primaryWeaponId,
        secondaryWeaponId: hero.secondaryWeaponId ?? null,
        armorId: null,
        accessoryId: null,
      }));

      const runState = await startRun(heroConfigs);
      navigate('/battle', { state: { runState } });
    } catch (err) {
      if (err.response?.status === 409) {
        showError('Active Run Exists', 'You already have an active run. Give up or finish it first.');
      } else {
        const msg = err.response?.data?.error ?? err.message ?? 'Failed to start run.';
        showError('Could Not Start Run', msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <h1 style={titleStyle}>Assemble Your Team</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg,
        flex: 1,
      }}>
        {heroes.map((hero, i) => (
          <HeroSlot
            key={i}
            hero={hero}
            heroIndex={i}
            onUpdate={(updates) => updateHero(i, updates)}
          />
        ))}
      </div>

      <TeamSummary
        heroes={heroes}
        onStartRun={loading ? undefined : openConfirmStart}
      />

      <AlertModal
        isOpen={modal.open}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        confirmLabel={modal.confirmLabel}
        cancelLabel={modal.cancelLabel}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
      />
    </div>
  );
}
