import React from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  email,
  size = 'md',
  className = '',
}) => {
  const getInitials = () => {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email && email.length > 0) {
      return email.slice(0, 2).toUpperCase();
    }
    return '?';
  };

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-20 h-20 text-2xl',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden glass-card border border-white/20 shadow-md shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to text if image fails to load
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <span className="font-semibold text-slate-200 tracking-wider">
          {getInitials()}
        </span>
      )}
    </div>
  );
};
