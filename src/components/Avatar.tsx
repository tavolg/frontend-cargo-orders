import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({ src, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0`}>
      {src ? (
        <img src={src} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <User className="text-zinc-400" />
      )}
    </div>
  );
};