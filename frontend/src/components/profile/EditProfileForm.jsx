import { useState } from 'react';
import { theme } from '../../styles/theme';
import AvatarPicker from './AvatarPicker';

function validate(nickname) {
  if (!nickname || nickname.trim().length < 3) return 'Nickname must be at least 3 characters.';
  if (nickname.trim().length > 30) return 'Nickname must be 30 characters or fewer.';
  return null;
}

export default function EditProfileForm({ profile, onSave, onCancel, isSaving }) {
  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  const [avatarId, setAvatarId] = useState(profile?.avatarId ?? '');
  const [nicknameError, setNicknameError] = useState(null);
  const [touched, setTouched] = useState(false);

  function handleNicknameChange(e) {
    setNickname(e.target.value);
    if (touched) setNicknameError(validate(e.target.value));
  }

  function handleBlur() {
    setTouched(true);
    setNicknameError(validate(nickname));
  }

  function handleSave() {
    setTouched(true);
    const err = validate(nickname);
    setNicknameError(err);
    if (err) return;
    onSave({ nickname: nickname.trim(), avatarId });
  }

  const inputStyle = {
    width: '100%',
    background: theme.colors.bgPanelDark,
    border: `1px solid ${theme.colors.borderBrown}`,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSizes.md,
    color: theme.colors.textPrimary,
    boxSizing: 'border-box',
    outline: 'none',
  };

  const btnBase = {
    flex: 1,
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    borderRadius: theme.radius.sm,
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
    cursor: 'pointer',
    border: 'none',
    transition: `background ${theme.transitions.fast}`,
  };

  return (
    <div style={{
      background: theme.colors.bgPanel,
      border: `1px solid ${theme.colors.borderGold}`,
      borderRadius: theme.radius.md,
      boxShadow: theme.shadows.panel,
      padding: theme.spacing.lg,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.md,
    }}>
      {/* Nickname */}
      <div>
        <label style={{
          display: 'block',
          fontFamily: theme.fonts.body,
          fontSize: theme.fontSizes.sm,
          color: theme.colors.textMuted,
          marginBottom: theme.spacing.xs,
        }}>
          Nickname
        </label>
        <input
          type="text"
          value={nickname}
          onChange={handleNicknameChange}
          onBlur={handleBlur}
          onFocus={(e) => { e.target.style.borderColor = theme.colors.borderGold; }}
          style={inputStyle}
          disabled={isSaving}
          maxLength={30}
        />
        {nicknameError && (
          <div style={{
            marginTop: theme.spacing.xs,
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes.xs,
            color: theme.colors.statusBleed,
          }}>
            {nicknameError}
          </div>
        )}
      </div>

      {/* Avatar picker */}
      <div>
        <div style={{
          fontFamily: theme.fonts.body,
          fontSize: theme.fontSizes.sm,
          color: theme.colors.textMuted,
          marginBottom: theme.spacing.sm,
        }}>
          Choose Avatar
        </div>
        <AvatarPicker selectedAvatarId={avatarId} onSelect={setAvatarId} />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: theme.spacing.md }}>
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            ...btnBase,
            background: isSaving ? theme.colors.bgPanelDark : theme.colors.borderGold,
            color: isSaving ? theme.colors.textMuted : theme.colors.bgPage,
            cursor: isSaving ? 'wait' : 'pointer',
          }}
          onMouseEnter={(e) => { if (!isSaving) e.currentTarget.style.background = theme.colors.actionHover; }}
          onMouseLeave={(e) => { if (!isSaving) e.currentTarget.style.background = theme.colors.borderGold; }}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving}
          style={{
            ...btnBase,
            background: 'transparent',
            border: `1px solid ${theme.colors.borderBrown}`,
            color: theme.colors.textPrimary,
            cursor: isSaving ? 'default' : 'pointer',
          }}
          onMouseEnter={(e) => { if (!isSaving) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
