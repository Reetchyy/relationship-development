import React from 'react';

interface InitialsAvatarProps {
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-32 h-32 text-3xl'
};

const colorCombinations = [
  'bg-gradient-to-br from-blue-500 to-blue-600',
  'bg-gradient-to-br from-green-500 to-green-600',
  'bg-gradient-to-br from-purple-500 to-purple-600',
  'bg-gradient-to-br from-red-500 to-red-600',
  'bg-gradient-to-br from-yellow-500 to-yellow-600',
  'bg-gradient-to-br from-pink-500 to-pink-600',
  'bg-gradient-to-br from-indigo-500 to-indigo-600',
  'bg-gradient-to-br from-teal-500 to-teal-600',
  'bg-gradient-to-br from-orange-500 to-orange-600',
  'bg-gradient-to-br from-primary-500 to-primary-600',
];

export default function InitialsAvatar({ 
  firstName, 
  lastName, 
  size = 'md', 
  className = '' 
}: InitialsAvatarProps) {
  // Get initials
  const getInitials = (first: string, last: string) => {
    const firstInitial = first?.charAt(0)?.toUpperCase() || '';
    const lastInitial = last?.charAt(0)?.toUpperCase() || '';
    return firstInitial + lastInitial;
  };

  // Generate consistent color based on name
  const getColorIndex = (first: string, last: string) => {
    const fullName = (first + last).toLowerCase();
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % colorCombinations.length;
  };

  const initials = getInitials(firstName, lastName);
  const colorClass = colorCombinations[getColorIndex(firstName, lastName)];
  const sizeClass = sizeClasses[size];

  return (
    <div 
      className={`
        ${sizeClass} 
        ${colorClass} 
        rounded-full 
        flex 
        items-center 
        justify-center 
        text-white 
        font-bold 
        shadow-lg 
        border-2 
        border-white/20
        ${className}
      `}
      title={`${firstName} ${lastName}`}
    >
      {initials}
    </div>
  );
}