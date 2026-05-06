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

  return (
    <div className="edit-profile-form">
      {/* Nickname */}
      <div>
        <label className="edit-profile-label">
          Nickname
        </label>
        <input
          type="text"
          value={nickname}
          onChange={handleNicknameChange}
          onBlur={handleBlur}
          onFocus={(e) => { e.target.style.borderColor = theme.colors.borderGold; }}
          className="edit-profile-input"
          disabled={isSaving}
          maxLength={30}
        />
        {nicknameError && (
          <div className="edit-profile-error">
            {nicknameError}
          </div>
        )}
      </div>

      {/* Avatar picker */}
      <div>
        <div className="edit-profile-avatar-title">
          Choose Avatar
        </div>
        <AvatarPicker selectedAvatarId={avatarId} onSelect={setAvatarId} />
      </div>

      {/* Buttons */}
      <div className="edit-profile-btn-row">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="edit-profile-save-btn"
          style={{
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
          className="edit-profile-cancel-btn"
          style={{ cursor: isSaving ? 'default' : 'pointer' }}
          onMouseEnter={(e) => { if (!isSaving) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
