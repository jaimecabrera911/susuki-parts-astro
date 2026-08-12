import React, { useState } from 'react';
import { getUserInitials } from '../utils/user';

interface UserAvatarProps {
  avatarUrl?: string | null;
  fullName?: string | null;
  className?: string;
  textClassName?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  fullName,
  className = 'w-8 h-8',
  textClassName = 'text-xs font-black'
}) => {
  const [imgError, setImgError] = useState(false);
  const initials = getUserInitials(fullName);

  // If avatarUrl is missing, empty, or placeholder that fails, show initials
  const isPlaceholderUrl = avatarUrl?.includes('/rest/v1/users/') || avatarUrl?.includes('avatar.jpg');
  const hasValidUrl = avatarUrl && avatarUrl.trim() !== '' && !isPlaceholderUrl && !imgError;

  if (hasValidUrl) {
    return (
      <div className={`relative rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-xs ${className}`}>
        <img
          src={avatarUrl!}
          alt={fullName || 'Avatar de usuario'}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full bg-gradient-to-br from-[#0A3088] via-[#0D41B4] to-[#E60012] text-white flex items-center justify-center font-black uppercase tracking-wider shrink-0 shadow-xs select-none ${className}`}
      title={fullName || 'Usuario'}
    >
      <span className={textClassName}>{initials}</span>
    </div>
  );
};
