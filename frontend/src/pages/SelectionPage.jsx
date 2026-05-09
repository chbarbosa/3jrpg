import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertModal from '../components/AlertModal';
import HeroSlot from '../components/selection/HeroSlot';
import TeamSummary from '../components/selection/TeamSummary';
import { startRun, getActiveRun, giveUp } from '../services/api';

function emptyHero() {
  return {
    classId: null,
    augmentationType: null,
    augmentationAdvantageId: null,
    mageSpecializationId: null,
    primaryWeaponId: null,
    secondaryWeaponId: null,
    armorTier: null,
    accessoryId: null,
    items: {},
  };
}

const MODAL_CLOSED = { open: false, title: '', message: '', variant: 'info', confirmLabel: 'OK', cancelLabel: null, onConfirm: null, onCancel: null };

export default function SelectionPage() {
  const navigate = useNavigate();
  const [heroes, setHeroes] = useState([emptyHero(), emptyHero(), emptyHero()]);
  const [modal, setModal] = useState(MODAL_CLOSED);
  const [loading, setLoading] = useState(false);

  function updateHero(index, updates) {
    setHeroes((prev) => prev.map((h, i) => i === index ? { ...h, ...updates } : h));
  }

  function closeModal() {
    setModal(MODAL_CLOSED);
  }

  function buildHeroConfigs() {
    return heroes.map((hero) => ({
      classId: hero.classId,
      augmentationType: hero.augmentationType ?? null,
      augmentationAdvantageId: hero.augmentationAdvantageId ?? null,
      mageSpecializationId: hero.mageSpecializationId ?? null,
      primaryWeaponId: hero.primaryWeaponId,
      secondaryWeaponId: hero.secondaryWeaponId ?? null,
      armorId: null,
      accessoryId: hero.accessoryId ?? null,
      items: Object.keys(hero.items ?? {}).length > 0 ? hero.items : null,
    }));
  }

  async function doStartRun(heroConfigs) {
    const runState = await startRun(heroConfigs);
    navigate('/battle', { state: { runState, heroConfigs } });
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

  async function handleConfirmStart() {
    closeModal();
    setLoading(true);
    try {
      await doStartRun(buildHeroConfigs());
    } catch (err) {
      if (err.response?.status === 409) {
        showActiveRunModal(buildHeroConfigs());
      } else {
        const msg = err.response?.data?.error ?? err.message ?? 'Failed to start run.';
        setModal({
          open: true, title: 'Could Not Start Run', message: msg, variant: 'danger',
          confirmLabel: 'OK', cancelLabel: null, onConfirm: closeModal, onCancel: null,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  function showActiveRunModal(heroConfigs) {
    setModal({
      open: true,
      title: 'Active Run Exists',
      message: 'You already have an unfinished run in progress.',
      variant: 'warning',
      confirmLabel: 'Return to Run',
      cancelLabel: 'Give Up Current Run',
      onConfirm: async () => {
        closeModal();
        try {
          const activeRun = await getActiveRun();
          if (activeRun) navigate('/battle', { state: { runState: activeRun } });
        } catch {
          setModal({ open: true, title: 'Error', message: 'Could not load active run.', variant: 'danger', confirmLabel: 'OK', cancelLabel: null, onConfirm: closeModal, onCancel: null });
        }
      },
      onCancel: () => showGiveUpConfirm(heroConfigs),
    });
  }

  function showGiveUpConfirm(heroConfigs) {
    setModal({
      open: true,
      title: 'Give Up Run?',
      message: 'This will permanently end your current run and count as a defeat.',
      variant: 'danger',
      confirmLabel: 'Give Up',
      cancelLabel: 'Back',
      onConfirm: async () => {
        closeModal();
        setLoading(true);
        try {
          const activeRun = await getActiveRun();
          if (activeRun?.runUuid) await giveUp(activeRun.runUuid);
          await doStartRun(heroConfigs);
        } catch (err) {
          const msg = err.response?.data?.error ?? err.message ?? 'Failed to start run.';
          setModal({ open: true, title: 'Error', message: msg, variant: 'danger', confirmLabel: 'OK', cancelLabel: null, onConfirm: closeModal, onCancel: null });
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => showActiveRunModal(heroConfigs),
    });
  }

  return (
    <div className="selection-page">
      <h1 className="selection-title">Assemble Your Team</h1>

      <div className="selection-hero-grid">
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
