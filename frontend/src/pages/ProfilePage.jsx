import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../styles/theme';
import { getProfile, updateProfile, getActiveRun } from '../services/api';
import AlertModal from '../components/AlertModal';
import EditProfileForm from '../components/profile/EditProfileForm';
import ProfileStats from '../components/profile/ProfileStats';

const AVATAR_BG = {
  warrior: theme.classColors.warrior,
  ranger: theme.classColors.ranger,
  mage: theme.classColors.mage,
  cleric: theme.classColors.cleric,
  thief: theme.classColors.thief,
};

function avatarBg(id) {
  return AVATAR_BG[id] ?? theme.colors.bgPanelDark;
}

const MODAL_CLOSED = { open: false, title: '', message: '', variant: 'info', onConfirm: null };

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [modal, setModal] = useState(MODAL_CLOSED);
  const [pulse, setPulse] = useState(false);
  const [activeRun, setActiveRun] = useState(null);

  // Pulsing for loading placeholders
  useEffect(() => {
    if (!isLoading) return;
    const id = setInterval(() => setPulse((p) => !p), 600);
    return () => clearInterval(id);
  }, [isLoading]);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getProfile();
      setProfile(data);
      setModal(MODAL_CLOSED);
    } catch {
      setModal({
        open: true,
        title: 'Error',
        message: 'Could not load profile.',
        variant: 'danger',
        onConfirm: loadProfile,
      });
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadProfile(); }, [loadProfile]);

  useEffect(() => {
    getActiveRun().then((run) => { if (run) setActiveRun(run); }).catch(() => {});
  }, []);

  async function handleSave({ nickname, avatarId }) {
    setIsSaving(true);
    try {
      const updated = await updateProfile({ nickname, avatarId });
      setProfile(updated);
      setIsEditing(false);
      setSuccessMsg('Profile updated');
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (err) {
      setModal({
        open: true,
        title: 'Error',
        message: err.response?.data?.error ?? 'Failed to save profile.',
        variant: 'danger',
        onConfirm: () => setModal(MODAL_CLOSED),
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setIsEditing(false);
  }

  const pulseOpacity = pulse ? 0.4 : 0.85;

  return (
    <div className="page-centered">
      <div className="page-content-medium">
        {/* Active run banner */}
        {activeRun && (
          <div className="active-run-banner">
            <div className="active-run-banner-msg">
              You have an active run in progress!
            </div>
            <button
              className="btn-return-to-battle"
              onClick={() => navigate('/battle', { state: { runState: activeRun } })}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.actionHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = theme.colors.borderGold; }}
            >
              Return to Battle
            </button>
          </div>
        )}

        {/* Page title */}
        <h1 className="profile-page-title">Profile</h1>

        {/* Avatar + nickname header */}
        <div className="profile-avatar-section">
          {/* Avatar circle */}
          {isLoading ? (
            <div
              className="profile-avatar-circle profile-avatar-placeholder"
              style={{ opacity: pulseOpacity, transition: `opacity ${theme.transitions.normal}` }}
            />
          ) : (
            <div
              className="profile-avatar-circle"
              style={{ background: avatarBg(profile?.avatarId) }}
            >
              {(profile?.avatarId?.[0] ?? '?').toUpperCase()}
            </div>
          )}

          {/* Nickname */}
          {isLoading ? (
            <div
              className="profile-nickname-placeholder"
              style={{ opacity: pulseOpacity, transition: `opacity ${theme.transitions.normal}` }}
            />
          ) : (
            <div className="profile-nickname">
              {profile?.nickname}
            </div>
          )}

          {/* Email */}
          {!isLoading && profile?.email && (
            <div className="profile-email">
              {profile.email}
            </div>
          )}

          {/* Success message */}
          {successMsg && (
            <div className="profile-success-msg">
              {successMsg}
            </div>
          )}

          {/* Edit button */}
          {!isLoading && !isEditing && (
            <button
              className="btn-edit-profile"
              onClick={() => setIsEditing(true)}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.bgPanel; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Edit form */}
        {isEditing && (
          <EditProfileForm
            profile={profile}
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={isSaving}
          />
        )}

        {/* Stats */}
        {isLoading ? (
          <div
            className="profile-stats-placeholder"
            style={{ opacity: pulseOpacity, transition: `opacity ${theme.transitions.normal}` }}
          />
        ) : (
          <ProfileStats profile={profile} />
        )}
      </div>

      <AlertModal
        isOpen={modal.open}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        confirmLabel={modal.variant === 'danger' && modal.onConfirm === loadProfile ? 'Retry' : 'OK'}
        onConfirm={modal.onConfirm}
      />
    </div>
  );
}
