/**
 * BadgeIcon.tsx
 *
 * Renders the appropriate icon for a badge based on its icon type.
 */

import { Compass, Sparkles, Sunrise, Users } from 'lucide-react';
import { FC, memo } from 'react';
import { getBadgeById } from '../../config/quests/questTiers';

interface BadgeIconProps {
  /** Badge ID */
  badgeId: string;
  /** Size class for the icon */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class name */
  className?: string;
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-6 w-6',
};

const BadgeIcon: FC<BadgeIconProps> = memo(function BadgeIcon({
  badgeId,
  size = 'md',
  className = '',
}) {
  const badge = getBadgeById(badgeId);
  const iconClass = `${sizeClasses[size]} ${className}`;

  if (!badge) {
    return <Sparkles className={iconClass} />;
  }

  switch (badge.icon) {
    case 'sunrise':
      return <Sunrise className={iconClass} />;
    case 'users':
      return <Users className={iconClass} />;
    case 'compass':
      return <Compass className={iconClass} />;
    default:
      return <Sparkles className={iconClass} />;
  }
});

export default BadgeIcon;
