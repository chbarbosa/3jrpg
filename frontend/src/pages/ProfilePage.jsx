import { useState, useEffect, useCallback } from 'react';
import { theme } from '../styles/theme';
import { getProfile, updateProfile } from '../services/api';
import AlertModal from '../components/AlertModal';
import EditProfileForm from '../components/profile/EditProfileForm';
import ProfileStats from '../components/profile/ProfileStats';

const AVATAR_BG = {
  warrior: theme.classColors.warrior,
  ranger: theme.classColors.ranger,
  mage: theme.classColors.mage,
  priest: theme.classColors.priest,
};

function avatarBg(id) {
  return AVATAR_BG[id] ?? theme.colors.bgPanelDark;
}

const MODAL_CLOSED = { open: false, title: '', message: '', variant: 'info', onConfirm: null };

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [modal, setModal] = useState(MODAL_CLOSED);
  const [pulse, setPulse] = useState(false);

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

  const pageStyle = {
    minHeight: '100vh',
    background: theme.colors.bgPage,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: `${theme.spacing.xl} ${theme.spacing.lg}`,
    boxSizing: 'border-box',
  };

  const contentStyle = {
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.lg,
  };

  const pulseOpacity = pulse ? 0.4 : 0.85;

  return (
    <div style={pageStyle}>
      <div style={contentStyle}>
        {/* Page title */}
        <h1 style={{
          fontFamily: theme.fonts.header,
          fontSize: theme.fontSizes.xxl,
          fontWeight: theme.fontWeights.black,
          color: theme.colors.textHeader,
          margin: 0,
        }}>
          Profile
        </h1>

        {/* Avatar + nickname header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: theme.spacing.sm }}>
          {/* Avatar circle */}
          {isLoading ? (
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: theme.radius.pill,
              background: theme.colors.bgPanelDark,
              border: `3px solid ${theme.colors.borderGold}`,
              opacity: pulseOpacity,
              transition: `opacity ${theme.transitions.normal}`,
            }} />
          ) : (
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: theme.radius.pill,
              background: avatarBg(profile?.avatarId),
              border: `3px solid ${theme.colors.borderGold}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.bgPage,
              fontFamily: theme.fonts.header,
              fontWeight: theme.fontWeights.black,
              fontSize: theme.fontSizes.xl,
              flexShrink: 0,
            }}>
              {(profile?.avatarId?.[0] ?? '?').toUpperCase()}
            </div>
          )}

          {/* Nickname */}
          {isLoading ? (
            <div style={{
              width: '120px',
              height: '28px',
              borderRadius: theme.radius.sm,
              background: theme.colors.bgPanelDark,
              opacity: pulseOpacity,
              transition: `opacity ${theme.transitions.normal}`,
            }} />
          ) : (
            <div style={{
              fontFamily: theme.fonts.header,
              fontSize: theme.fontSizes.xl,
              fontWeight: theme.fontWeights.bold,
              color: theme.colors.textHeader,
            }}>
              {profile?.nickname}
            </div>
          )}

          {/* Email */}
          {!isLoading && profile?.email && (
            <div style={{
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSizes.sm,
              color: theme.colors.textMuted,
            }}>
              {profile.email}
            </div>
          )}

          {/* Success message */}
          {successMsg && (
            <div style={{
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSizes.sm,
              fontWeight: theme.fontWeights.bold,
              color: theme.colors.statusPositive,
            }}>
              {successMsg}
            </div>
          )}

          {/* Edit button */}
          {!isLoading && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                background: 'transparent',
                border: `1px solid ${theme.colors.borderGold}`,
                borderRadius: theme.radius.sm,
                color: theme.colors.textHeader,
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSizes.sm,
                fontWeight: theme.fontWeights.bold,
                cursor: 'pointer',
                transition: `background ${theme.transitions.fast}`,
              }}
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
          <div style={{
            height: '180px',
            background: theme.colors.bgPanel,
            border: `1px solid ${theme.colors.borderGold}`,
            borderRadius: theme.radius.md,
            opacity: pulseOpacity,
            transition: `opacity ${theme.transitions.normal}`,
          }} />
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
